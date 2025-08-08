import { Request, Response } from "express";
import OpenAI from "openai";
import { runManimCode } from "../services/manimEngine";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Prisma, PrismaClient, Sender } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth";
import { randomBytes } from "crypto";
import { fixOverlapsInManimCode } from "../services/fixCode";
import { exec } from 'child_process';
import { promisify } from 'util';
import { MediaFile } from "../types";

const execAsync = promisify(exec);

const prisma = new PrismaClient();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure AWS SDK
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

interface UploadedVideo {
  sceneName: string;
  url: string;
  key: string;
  order: number;
  duration:number
}

// Manim Templates and Guidelines
const MANIM_TEMPLATES = {
  arrayVisualization: `
# ARRAY VISUALIZATION TEMPLATE
array_values = [64, 34, 25, 12, 22]
array_boxes = []

for i, val in enumerate(array_values):
    box = Rectangle(width=1.2, height=1.2, color=BLUE, fill_opacity=0.3)
    number = Text(str(val), color=WHITE, font_size=24)
    box.add(number)
    array_boxes.append(box)

array_group = VGroup(*array_boxes).arrange(RIGHT, buff=0.2)
array_group.move_to(ORIGIN)`,

  sortingVisualization: `
# SORTING VISUALIZATION TEMPLATE
def highlight_comparison(box1, box2):
    self.play(
        box1.animate.set_fill(RED, opacity=0.5),
        box2.animate.set_fill(RED, opacity=0.5)
    )
    self.wait(1)
    self.play(
        box1.animate.set_fill(BLUE, opacity=0.3),
        box2.animate.set_fill(BLUE, opacity=0.3)
    )`,

  treeVisualization: `
# TREE VISUALIZATION TEMPLATE
root = Circle(radius=0.5, color=BLUE, fill_opacity=0.3)
root_text = Text("10", color=WHITE, font_size=20)
root.add(root_text)
root.move_to(ORIGIN + UP)

left_child = Circle(radius=0.5, color=GREEN, fill_opacity=0.3)
left_text = Text("5", color=WHITE, font_size=20)
left_child.add(left_text)
left_child.move_to(LEFT * 2 + DOWN)`,

  stepByStep: `
# STEP-BY-STEP TEMPLATE
steps = ["Step 1: Initialize", "Step 2: Compare", "Step 3: Swap"]
step_texts = []
for i, step in enumerate(steps):
    text = Text(step, font_size=24).to_edge(LEFT)
    text.shift(DOWN * (i + 1))
    step_texts.append(text)

for step_text in step_texts:
    self.play(Write(step_text))
    self.wait(1)`
};

const MANIM_GUIDELINES = `
STRICT MANIM GUIDELINES:

ALLOWED ONLY:
- Imports: from manim import *
- Mobjects: Circle, Square, Rectangle, Triangle, Line, Arrow, Dot, Text, MathTex, Axes, NumberLine, VGroup
- Animations: Create, Write, Transform, FadeIn, FadeOut, DrawBorderThenFill, ShowCreation, ReplacementTransform
- Directions: LEFT, RIGHT, UP, DOWN, ORIGIN, UL, UR, DL, DR
- Colors: RED, BLUE, GREEN, YELLOW, WHITE, BLACK, ORANGE, PURPLE, PINK

FORBIDDEN (WILL CAUSE ERRORS):
- BounceIn, BounceOut, SlideIn, SlideOut, ZoomIn, ZoomOut
- ThreeDScene, Surface, ParametricSurface
- Any custom or advanced animations

MANDATORY RULES:
1. Every scene must have exactly one construct(self) method
2. Always end with self.wait(2)
3. Use proper spacing: minimum 1 unit between objects
4. For arrays/data structures: ALWAYS add visible content inside shapes
5. Use VGroup for grouping and .arrange() for spacing
6. Test positions before animating

CONTENT VISIBILITY RULE:
When creating shapes to represent data:
box = Rectangle(width=1.2, height=1.2, color=BLUE, fill_opacity=0.3)
content = Text(str(value), color=WHITE, font_size=24)
box.add(content)  # This makes content visible inside the box
`;

// helper funciton for duration calculation

async function getVideoDurationWithFFprobe(videoPath: string): Promise<number> {
  try {
    console.log(`Getting duration for: ${videoPath}`);
    
    // Use ffprobe to get video duration
    const { stdout, stderr } = await execAsync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`
    );
    
    if (stderr) {
      console.warn(`FFprobe warning for ${videoPath}:`, stderr);
    }
    
    const duration = parseFloat(stdout.trim());
    
    if (isNaN(duration) || duration <= 0) {
      console.warn(`Invalid duration for ${videoPath}, using fallback`);
      return 10; // fallback duration
    }
    
    console.log(`Duration for ${videoPath}: ${duration} seconds`);
    return duration;
    
  } catch (error) {
    console.error(`Error getting video duration for ${videoPath}:`, error);
    return 10; // fallback duration in case of error
  }
}

export async function createScenes(req: AuthRequest, res: Response) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    console.log("user is (from the middleware)", req.user);
    
    // check if the user has not used the free project limit
    const projects  = await prisma.project.findMany({
      where:{
        userId:req.user
      }
    })
    // TODO : add this after testing
    // if(projects.length==1){
    //   return res.json({
    //     message : "Free plan used up",
    //     status:411
    //   })
    // }

    // Step 1: Analyze the prompt to determine visualization type
    const promptAnalysis = analyzePrompt(prompt);
    console.log("Prompt analysis:", promptAnalysis);

    // Step 2: Generate Layout Plan with specific templates
    console.log("Generating layout plan for prompt:", prompt);

    const layoutResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a visual layout expert for educational animations. Create structured layout plans for Manim animations.

${MANIM_GUIDELINES}

Based on the topic type, use appropriate visualization patterns:
- Arrays/Lists: Use horizontal arrangement with visible numbers
- Sorting: Show comparison and swapping phases
- Trees: Use hierarchical node arrangement
- Algorithms: Show step-by-step progression

Output structured JSON:
{
  "totalScenes": number,
  "visualizationType": "array|sorting|tree|algorithm|general",
  "scenes": [
    {
      "name": "SceneName",
      "purpose": "What this scene explains",
      "elements": [
        {
          "type": "array|shape|text|diagram",
          "content": "specific values or text",
          "position": "exact position",
          "spacing": "buffer distance"
        }
      ]
    }
  ]
}`,
        },
        {
          role: "user",
          content: `Create a detailed layout plan for: "${prompt}".
          
Focus on:
- Clear content visibility (no empty boxes)
- Proper spacing between elements
- Logical flow between scenes
- Appropriate visualization type for the topic`,
        },
      ],
      max_tokens: 1500,
    });

    const layoutContent = layoutResponse.choices[0].message.content || "";
    console.log("Layout plan generated:", layoutContent);

    // Extract and parse layout
    const layoutMatch = layoutContent.match(/```json\s*([\s\S]*?)```/i) || layoutContent.match(/\{[\s\S]*\}/);
    let layoutPlan;
    
    if (layoutMatch) {
      try {
        layoutPlan = JSON.parse(layoutMatch[1] || layoutMatch[0]);
      } catch (e) {
        console.warn("Layout parsing failed, using fallback");
        layoutPlan = { 
          totalScenes: 3, 
          visualizationType: promptAnalysis.type,
          rawLayout: layoutContent 
        };
      }
    } else {
      layoutPlan = { 
        totalScenes: 3, 
        visualizationType: promptAnalysis.type,
        rawLayout: layoutContent 
      };
    }

    // Step 3: Generate Manim Code with appropriate templates
    console.log("Generating Manim code with templates...");

    const relevantTemplate = getRelevantTemplate(layoutPlan.visualizationType || promptAnalysis.type);
    
    const codeResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Manim code generator. Generate working, clean animations following these guidelines:

${MANIM_GUIDELINES}

TEMPLATES TO USE:
${relevantTemplate}

CRITICAL REQUIREMENTS:
1. Always use the provided templates as your base
2. Ensure all shapes have visible content inside them
3. Use proper spacing with VGroup and .arrange()
4. Follow the exact animation classes listed above
5. Every scene must end with self.wait(2)
6. No comments in the final code

EXAMPLE FOR ARRAYS:
\`\`\`python
from manim import *

class ArrayScene(Scene):
    def construct(self):
        title = Text("Array Example").to_edge(UP)
        
        # Create array with visible content
        values = [5, 3, 8, 1, 9]
        boxes = []
        
        for val in values:
            box = Rectangle(width=1.2, height=1.2, color=BLUE, fill_opacity=0.3)
            number = Text(str(val), color=WHITE, font_size=24)
            box.add(number)
            boxes.append(box)
        
        array_group = VGroup(*boxes).arrange(RIGHT, buff=0.2)
        
        self.play(Write(title))
        self.play(Create(array_group))
        self.wait(2)
\`\`\`

Generate complete Python code following this exact pattern.`,
        },
        {
          role: "user",
          content: `Generate a complete Manim script for: "${prompt}"

Layout Plan:
${JSON.stringify(layoutPlan, null, 2)}

Requirements:
- Use the provided templates as your foundation
- Create ${layoutPlan.totalScenes || 3} scenes
- Ensure all data structures show actual values
- Use proper spacing and positioning
- Include proper imports and scene structure
- Make sure content is visible inside shapes

Focus on the visualization type: ${layoutPlan.visualizationType || promptAnalysis.type}`,
        },
      ],
      max_tokens: 2500,
    });

    const rawContent = codeResponse.choices[0].message.content || "";
    console.log("Raw AI response:", rawContent);

    // Extract Python code
    const match = rawContent.match(/```python\s*([\s\S]*?)```/i);
    if (!match || !match[1]) {
      throw new Error("No valid Python code block found in AI response.");
    }

    let manimCode = match[1].trim();
    console.log("Extracted Manim Code:\n", manimCode);

    // Step 4: Validate and clean the code
    console.log("Validating and cleaning Manim code...");
    manimCode = validateAndCleanManimCode(manimCode);
    console.log("Cleaned Manim Code:\n", manimCode);

    // Step 5: Render Manim Code
    console.log("Starting Manim rendering...");
    const renderResult = await runManimCode(manimCode);
    console.log(
      `Rendering completed. Animation ID: ${renderResult.animationId}, Videos: ${renderResult.videos.length}`
    );

    if (renderResult.videos.length === 0) {
      throw new Error("No videos were generated during rendering");
    }

    // Step 6: Upload videos to S3 (same as before)
    console.log("Starting S3 uploads with duration calculation...");
    const uploadPromises = renderResult.videos.map(async (video, index) => {
      try {
        console.log(`Processing video ${index + 1}/${renderResult.videos.length}: ${video.scene}`);

        if (!fs.existsSync(video.path)) {
          throw new Error(`Video file not found: ${video.path}`);
        }

        // Calculate actual video duration using ffprobe
        const videoDuration = await getVideoDurationWithFFprobe(video.path);
        console.log(`Video ${video.scene} duration: ${videoDuration} seconds`);

        const fileStream = fs.createReadStream(video.path);
        const fileName = `Anibot/${renderResult.animationId}/${video.scene}.mp4`;

        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: fileName,
          Body: fileStream,
          ContentType: "video/mp4",
          ACL: "public-read",
          Metadata: {
            "animation-id": renderResult.animationId,
            "scene-name": video.scene,
            "duration": videoDuration.toString(),
            "upload-timestamp": new Date().toISOString(),
          },
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        console.log(`Successfully uploaded: ${video.scene} -> ${uploadResult.Location}`);

        return {
          sceneName: video.scene,
          url: uploadResult.Location,
          key: uploadResult.Key,
          order: index + 1,
          duration: videoDuration, // Include actual duration
        } as UploadedVideo;
        
      } catch (uploadError) {
        console.error(`Failed to upload video ${video.scene}:`, uploadError);
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        throw new Error(`Upload failed for scene ${video.scene}: ${errorMessage}`);
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    console.log(`All ${uploadResults.length} videos uploaded successfully`);


    // Step 7: Clean up local filesx
    console.log("Cleaning up local files...");
    const cleanupPromises = renderResult.videos.map(async (video) => {
      try {
        await fs.promises.unlink(video.path);
        console.log(`Deleted local file: ${video.path}`);
      } catch (err) {
        console.warn(`Failed to delete local file ${video.path}:`, err);
      }
    });

    await Promise.allSettled(cleanupPromises);

    // Step 8: Transform videos to MediaFile format
let prevEnd = 0;
const transformedVideos = uploadResults.map((video, index) => {
  const videoDuration = video.duration; // Duration in seconds
  const startPosition = prevEnd; // Sequential positioning
  prevEnd = startPosition + videoDuration;
  
  return {
    id: `${renderResult.animationId}_${video.sceneName}`,
    fileName: `${video.sceneName}.mp4`,
    fileId: video.key,
    type: 'video',
    startTime: 0, // Start from beginning of source video
    src: video.url,
    endTime: videoDuration, // End of source video
    positionStart: startPosition, // Position in final merged video
    positionEnd: startPosition + videoDuration,
    includeInMerge: true,
    playbackSpeed: 1.0,
    volume: 100,
    zIndex: 0,
    // Optional visual settings - using defaults
    x: 0,
    y: 0,
    width: 1920, // Default HD width
    height: 1080, // Default HD height
    rotation: 0,
    opacity: 100,
    // No crop by default
    crop: {
      x: 0,
      y: 0,
      width: 960,
      height: 540,
    },
  };
});

// Step 9: Database operations - Create project with mediaFiles
const userId = req.user;
const project = await prisma.project.create({
  data: {
    id: renderResult.animationId,
    title: prompt,
    userId: userId,
    chatId: Math.random().toString(36).substring(2, 10),
    mediaFiles: transformedVideos, // Include the transformed videos
    duration: prevEnd, // Set total project duration
  },
});

const response_data = {
  success: true,
  message: "All scenes rendered and uploaded successfully",
  animationId: renderResult.animationId,
  videos: transformedVideos, // Now using MediaFile[] format
  totalVideos: transformedVideos.length,
  s3Path: `Anibot/${renderResult.animationId}/`,
  timestamp: new Date().toISOString(),
  layoutPlan: layoutPlan,
  generatedCode: manimCode,
  // Additional metadata for video editor compatibility
  totalDuration: transformedVideos.reduce((sum:any, video:any) => sum + (video.positionEnd - video.positionStart), 0),
  resolution: { width: 1920, height: 1080 },
  fps: 30
};

res.status(200).json(response_data);
  } catch (error) {
    console.error("Error during scene creation:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorResponse = {
      success: false,
      error: "Scene creation failed",
      details: errorMessage,
      timestamp: new Date().toISOString(),
    };

    if (errorMessage.includes("timeout")) {
      res.status(408).json({ ...errorResponse, error: "Rendering timeout" });
    } else if (errorMessage.includes("No Scene classes found")) {
      res.status(400).json({ ...errorResponse, error: "Invalid Manim code generated" });
    } else if (errorMessage.includes("Upload failed")) {
      res.status(502).json({ ...errorResponse, error: "S3 upload failed" });
    } else {
      res.status(500).json(errorResponse);
    }
  }
}

// Helper functions
function analyzePrompt(prompt: string): { type: string; keywords: string[] } {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('sort') || lowerPrompt.includes('bubble') || lowerPrompt.includes('merge') || lowerPrompt.includes('quick')) {
    return { type: 'sorting', keywords: ['sort', 'array', 'compare', 'swap'] };
  }
  
  if (lowerPrompt.includes('array') || lowerPrompt.includes('list')) {
    return { type: 'array', keywords: ['array', 'list', 'elements', 'index'] };
  }
  
  if (lowerPrompt.includes('tree') || lowerPrompt.includes('binary')) {
    return { type: 'tree', keywords: ['tree', 'node', 'binary', 'hierarchy'] };
  }
  
  if (lowerPrompt.includes('algorithm') || lowerPrompt.includes('step')) {
    return { type: 'algorithm', keywords: ['algorithm', 'step', 'process', 'method'] };
  }
  
  return { type: 'general', keywords: ['concept', 'explanation', 'visual'] };
}

function getRelevantTemplate(visualizationType: string): string {
  switch (visualizationType) {
    case 'sorting':
      return `${MANIM_TEMPLATES.arrayVisualization}\n${MANIM_TEMPLATES.sortingVisualization}`;
    case 'array':
      return MANIM_TEMPLATES.arrayVisualization;
    case 'tree':
      return MANIM_TEMPLATES.treeVisualization;
    case 'algorithm':
      return MANIM_TEMPLATES.stepByStep;
    default:
      return MANIM_TEMPLATES.arrayVisualization;
  }
}

function validateAndCleanManimCode(code: string): string {
  console.log("Validating Manim code...");
  
  // List of forbidden animations that cause NameError
  const forbiddenAnimations = [
    'BounceIn', 'BounceOut', 'SlideIn', 'SlideOut', 'ZoomIn', 'ZoomOut',
    'RotateIn', 'RotateOut', 'FlipIn', 'FlipOut', 'RollIn', 'RollOut',
    'Pulse', 'Flash', 'Shake', 'Wiggle', 'Wobble'
  ];
  
  // Replace forbidden animations with safe alternatives
  let cleanedCode = code;
  
  forbiddenAnimations.forEach(forbidden => {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'g');
    cleanedCode = cleanedCode.replace(regex, 'FadeIn');
  });
  
  // Ensure proper imports
  if (!cleanedCode.includes('from manim import *')) {
    cleanedCode = 'from manim import *\n\n' + cleanedCode;
  }
  
  // Validate scene classes
  const sceneClasses = cleanedCode.match(/class\s+\w+\(Scene\):/g);
  if (!sceneClasses || sceneClasses.length === 0) {
    throw new Error("No valid Scene classes found in generated code");
  }
  
  // Ensure all scenes have construct method
  const constructMethods = cleanedCode.match(/def construct\(self\):/g);
  if (!constructMethods || constructMethods.length !== sceneClasses.length) {
    console.warn("Mismatch between scene classes and construct methods");
  }
  
  // Ensure all scenes end with wait
  if (!cleanedCode.includes('self.wait(')) {
    console.warn("Some scenes may not have proper wait statements");
  }
  
  console.log(`Validated ${sceneClasses.length} scene classes`);
  return cleanedCode;
}