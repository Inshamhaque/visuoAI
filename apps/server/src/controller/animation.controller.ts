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
    // Step 1: Generate Manim Code from OpenAI
    console.log("Generating Manim code for prompt:", prompt);

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates Manim code. First explain your approach in 3-5 seconds and then, Follow these rules strictly:
    1. Only use basic Manim classes: Scene, Circle, Square, Triangle, Rectangle, Text, Axes, Line, Arrow, Dot
    2. Only use these animations: Create, Write, Transform, FadeIn, FadeOut, DrawBorderThenFill, ShowCreation
    3. Always use 'from manim import *' as the second line
    4. Each scene should have exactly one construct(self) method
    5. Always end each scene with self.wait(2)
    6. Do not use: ParametricSurface, ThreeDScene, MovingCameraScene, or any 3D objects
    7. Keep animations simple and working
    8. Generate exactly 5-6 scene classes
    9. NEVER use GrowFromCenter or GrowFromPoint - use Create or FadeIn instead
    10. NEVER use ShowIncreasingSubsets - use Create instead`,
        },
        {
          role: "user",
          content: `Generate a modular Manim script for the following prompt: "${prompt}".
Create exactly 3-5 scene classes, each with a descriptive name and simple animations illustrating different parts of the topic.
Do not include any comments. Output the full Python script with import statements and multiple scene classes. 
Each scene should be at least 10 seconds long and include at least 2-3 different animations.
Make sure each class name is unique and descriptive.`,
        },
      ],
      max_tokens: 2000,
    });

    const rawContent = response.choices[0].message.content || "";
    console.log("Raw Manim code generated:", rawContent);

    // store the project data in the database
    // if the project id exists, then signify that this is an update else create a new project

    const manimCode = rawContent
      .replace(/^\s*```(?:python)?\s*/, "")
      .replace(/\s*```[\s\r\n]*$/, "")
      .trim();

    console.log("Generated Manim Code:", manimCode);

    // Step 2: Render Manim Code
    console.log("Starting Manim rendering...");
    const renderResult = await runManimCode(manimCode);
    console.log(
      `Rendering completed. Animation ID: ${renderResult.animationId}, Videos: ${renderResult.videos.length}`
    );

    if (renderResult.videos.length === 0) {
      throw new Error("No videos were generated during rendering");
    }

    // Step 3: Upload all videos to S3 with organized structure
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

    // Step 4: Clean up local video files
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

    // Step 5: Return success response
    const response_data = {
      success: true,
      message: "All scenes rendered and uploaded successfully",
      animationId: renderResult.animationId,
      videos: uploadResults.sort((a, b) => a.order - b.order),
      totalVideos: uploadResults.length,
      s3Path: `Anibot/${renderResult.animationId}/`,
      timestamp: new Date().toISOString(),
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
