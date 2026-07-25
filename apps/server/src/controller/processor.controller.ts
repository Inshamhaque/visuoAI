import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { VideoProcessor } from "../services/ffmpegEngine";
import fs from "fs";
import { storeFile, usesAwsStorage } from "../services/storage";

export async function processor(req: AuthRequest, res: Response) {
  const payload = req.body.payload ?? req.body;

  try {
    if (!payload.id) {
      return res.status(400).json({ success: false, message: "Project id is required for export" });
    }

    const processor = new VideoProcessor();
    const result = await processor.processVideo(payload);

    if (!fs.existsSync(result)) {
      throw new Error("Rendered video file not found");
    }

    const s3Key = `Anibot/${payload.id}/final.mp4`;
    const requestBaseUrl = `${req.protocol}://${req.get("host")}`;
    const storedFile = await storeFile(result, s3Key, "video/mp4", requestBaseUrl);

    res.status(200).json({
      success: true,
      message: `Video processed and stored successfully (${usesAwsStorage() ? "S3" : "local"})`,
      s3Url: storedFile.url,
      url: storedFile.url,
      key: storedFile.key,
    });
  } catch (e) {
    console.error("Error in processor:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred during video processing",
    });
  }
}
