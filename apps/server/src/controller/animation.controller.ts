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
}

export async function createScenes(req: AuthRequest, res: Response) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    console.log("user is (from the middleware)", req.user);
    if (!req.user) {
      return res.status(411).json({
        message: "User not authenticated correctly. Try again later",
      });
    }

    // Step 1: Generate Layout Plan from OpenAI
    console.log("Generating layout plan for prompt:", prompt);

    const layoutResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a visual layout expert for educational animations. Your job is to create a clear, structured layout plan for Manim animations.

Analyze the given topic and create a detailed layout plan that includes:
1. Number of scenes (3-5 scenes)
2. Scene names and purposes
3. Visual elements for each scene
4. Object positioning and flow
5. Animation sequence and timing

Focus on:
- Clear visual hierarchy
- Logical flow between scenes
- Avoiding overlapping elements
- Using appropriate spacing and positioning
- Creating engaging visual storytelling

Output your response as a structured JSON with this format:
{
  "totalScenes": number,
  "scenes": [
    {
      "name": "SceneName",
      "purpose": "What this scene explains",
      "duration": "seconds",
      "elements": [
        {
          "type": "text/shape/diagram",
          "content": "what to show",
          "position": "where to place it",
          "animation": "how to animate it"
        }
      ],
      "layout": "overall layout description"
    }
  ],
  "overallFlow": "how scenes connect together"
}`,
        },
        {
          role: "user",
          content: `Create a detailed layout plan for animating this topic: "${prompt}".
Make sure each scene has a clear purpose and the visual elements are well-organized without overlapping.`,
        },
      ],
      max_tokens: 1500,
    });

    const layoutContent = layoutResponse.choices[0].message.content || "";
    console.log("Layout plan generated:", layoutContent);

    // Extract JSON from the layout response
    const layoutMatch = layoutContent.match(/```json\s*([\s\S]*?)```/i) || layoutContent.match(/\{[\s\S]*\}/);
    let layoutPlan;
    
    if (layoutMatch) {
      try {
        layoutPlan = JSON.parse(layoutMatch[1] || layoutMatch[0]);
      } catch (e) {
        // If JSON parsing fails, use the raw content as context
        layoutPlan = { rawLayout: layoutContent };
      }
    } else {
      layoutPlan = { rawLayout: layoutContent };
    }

    // Step 2: Generate Manim Code based on Layout
    console.log("Generating Manim code based on layout plan...");

    const codeResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Manim code generator that creates clean, organized animations based on layout plans.

Follow these strict rules:
1. Only use basic Manim classes: Scene, Circle, Square, Triangle, Rectangle, Text, Axes, Line, Arrow, Dot
2. Only use animations: Create, Write, Transform, FadeIn, FadeOut, DrawBorderThenFill
3. Always use 'from manim import *' as the second line
4. Each scene must have one construct(self) method and end with self.wait(2)
5. DO NOT use overlapping positions — use .to_edge(), .shift(), .next_to() smartly to arrange objects clearly
6. For multiple objects, align them horizontally or vertically using VGroup/HGroup and use .arrange(DIR)
7. Space out items with buff or .shift() so they don't collide
8. Limit on-screen text to 3–4 lines max at once
9. NEVER use 3D scenes or advanced features — keep it 2D and simple and always use basic function that are easy to render
10. Every scene must be visually distinct and organized
11. Follow the provided layout plan exactly for positioning and flow
12. Use proper spacing (buff=0.5 or more) between elements
13. Position elements using the layout guidance provided
14. In case of Data Structures, always ensure that the numerical value is present there. For example, while writing an array display value inside it and not just array containers. 

Generate complete, runnable Python code that implements the layout plan precisely.`,
        },
        {
          role: "user",
          content: `Generate a modular Manim script for the topic: "${prompt}".

Use this layout plan to guide your code generation:
${JSON.stringify(layoutPlan, null, 2)}

Create exactly the number of scenes specified in the layout plan, with the exact names and purposes described.
Follow the element positioning and animation sequences from the layout plan.
Do not include any comments. Output the full Python script with import statements and multiple scene classes.
Each scene should implement the layout and elements specified in the plan.
Make sure each class name matches the scene names from the layout plan.`,
        },
      ],
      max_tokens: 2000,
    });

    const rawContent = codeResponse.choices[0].message.content || "";

    // Extract only the Python code inside the ```python block
    const match = rawContent.match(/```python\s*([\s\S]*?)```/i);
    if (!match || !match[1]) {
      throw new Error("No valid Python code block found in AI response.");
    }

    const manimCode = match[1].trim();
    console.log("Extracted Manim Code:\n", manimCode);

    // Step 3: Render Manim Code
    console.log("Starting Manim rendering...");
    const cleanedCode = fixOverlapsInManimCode(manimCode);
    const renderResult = await runManimCode(cleanedCode);
    console.log(
      `Rendering completed. Animation ID: ${renderResult.animationId}, Videos: ${renderResult.videos.length}`
    );

    if (renderResult.videos.length === 0) {
      throw new Error("No videos were generated during rendering");
    }

    // Step 4: Upload all videos to S3 with organized structure
    console.log("Starting S3 uploads...");
    const uploadPromises = renderResult.videos.map(async (video, index) => {
      try {
        console.log(
          `Uploading video ${index + 1}/${renderResult.videos.length}: ${video.scene}`
        );

        // Verify file exists before upload
        if (!fs.existsSync(video.path)) {
          throw new Error(`Video file not found: ${video.path}`);
        }

        const fileStats = fs.statSync(video.path);
        console.log(`File size: ${fileStats.size} bytes`);

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
            "upload-timestamp": new Date().toISOString(),
          },
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        console.log(
          `Successfully uploaded: ${video.scene} -> ${uploadResult.Location}`
        );

        return {
          sceneName: video.scene,
          url: uploadResult.Location,
          key: uploadResult.Key,
          order: index + 1,
        } as UploadedVideo;
      } catch (uploadError) {
        console.error(`Failed to upload video ${video.scene}:`, uploadError);
        const errorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError);
        throw new Error(
          `Upload failed for scene ${video.scene}: ${errorMessage}`
        );
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    console.log(`All ${uploadResults.length} videos uploaded successfully`);

    // Step 5: Clean up local video files
    console.log("Cleaning up local files...");
    const cleanupPromises = renderResult.videos.map(async (video) => {
      try {
        await fs.promises.unlink(video.path);
        console.log(`Deleted local file: ${video.path}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(
          `Failed to delete local file ${video.path}:`,
          errorMessage
        );
      }
    });

    await Promise.allSettled(cleanupPromises); // Use allSettled to not fail if some deletions fail

    // Step 6: Return success response
    const response_data = {
      success: true,
      message: "All scenes rendered and uploaded successfully",
      animationId: renderResult.animationId,
      videos: uploadResults.sort((a, b) => a.order - b.order),
      totalVideos: uploadResults.length,
      s3Path: `Anibot/${renderResult.animationId}/`,
      timestamp: new Date().toISOString(),
      layoutPlan: layoutPlan, // Include layout plan in response for debugging
    };

    // DB actions
    //create the project
    const userId = req.user;
    const project = await prisma.project.create({
      data: {
        id: renderResult.animationId,
        title: prompt,
        userId: userId,
        urls: JSON.parse(JSON.stringify(uploadResults)),
        chatId: String(randomBytes(256)),
      },
    });

    const message1 = await prisma.message.create({
      data: {
        sender: Sender.user,
        content: prompt,
        projectId: renderResult.animationId,
      },
    });
    const message2 = await prisma.message.create({
      data: {
        sender: Sender.ai,
        content: `Generating scenes for your prompt: "${prompt}"`,
        projectId: renderResult.animationId,
      },
    });

    res.status(200).json(response_data);
  } catch (error) {
    console.error("Error during scene creation:", error);

    // Return detailed error information
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
      res
        .status(400)
        .json({ ...errorResponse, error: "Invalid Manim code generated" });
    } else if (errorMessage.includes("Upload failed")) {
      res.status(502).json({ ...errorResponse, error: "S3 upload failed" });
    } else {
      res.status(500).json(errorResponse);
    }
  }
}