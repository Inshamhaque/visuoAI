import { Request, Response } from "express";
import OpenAI from "openai";
import { runManimCode } from "../services/manimEngine";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createScenes(req: Request, res: Response) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
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
          content: `Generate Manim code for the following prompt: "${prompt}". Output a full class-based Manim script for a simple animation without any comments.`,
        },
      ],
      max_tokens: 1500,
    });

    const rawContent = response.choices[0].message.content || "";
    const manimCode = rawContent
      .replace(/^\s*```(?:python)?\s*/, "") // Remove ``` or ```python + possible spaces/newlines at start
      .replace(/\s*```[\s\r\n]*$/, "") // Remove ``` + possible trailing spaces/newlines at end
      .trim();

    console.log("Generated Manim Code:", manimCode);

    const renderResult = await runManimCode(manimCode!);

    res.status(200).json({ message: "Rendered", output: renderResult });
  } catch (error) {
    console.error("Error during scene creation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
