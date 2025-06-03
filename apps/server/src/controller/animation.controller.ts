import { Request, Response } from "express";
import OpenAI from "openai";
import { runManimCode } from "../services/manimEngine";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure AWS SDK
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function createScenes(req: Request, res: Response) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    // Step 1: Generate Manim Code from OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates modular Manim code scenes.",
        },
        {
          role: "user",
          content: `Generate a modular Manim script for the following prompt: "${prompt}". 
Output multiple class-based scene definitions, each with a descriptive name and simple animations illustrating parts of the topic. 
Do not include any comments. Output the full Python script with import statements and multiple scene classes. Each scene should be 
at least of 15 seconds long and include at least 3 different animations.`,
        },
      ],
      max_tokens: 1500,
    });

    const rawContent = response.choices[0].message.content || "";
    const manimCode = rawContent
      .replace(/^\s*```(?:python)?\s*/, "")
      .replace(/\s*```[\s\r\n]*$/, "")
      .trim();

    console.log("Generated Manim Code:", manimCode);

    // Step 2: Render Manim Code (Assumed to return path of output .mp4)
    // const renderResult = await runManimCode(manimCode);~

    const videoPath = await runManimCode(manimCode);

    // Upload to S3
    const fileStream = fs.createReadStream(videoPath);
    const fileName = `Anibot/manim-video-${uuidv4()}.mp4`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: fileStream,
      ContentType: "video/mp4",
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    res.status(200).json({ message: "Rendered", url: uploadResult.Location });
  } catch (error) {
    console.error("Error during scene creation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
