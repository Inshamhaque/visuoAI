import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { VideoProcessor } from "../services/ffmpegEngine";
import AWS from "aws-sdk";
import fs from "fs";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export async function processor(req: AuthRequest, res: Response) {
  const payload = req.body;

  try {
    const processor = new VideoProcessor();
    const result = await processor.processVideo(payload);

    if (!fs.existsSync(result)) {
      throw new Error("Rendered video file not found");
    }

    const fileStream = fs.createReadStream(result);
    const s3Key = `Anibot/${payload.id}/final.mp4`;

    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME as string,
      Key: s3Key,
      Body: fileStream,
      ContentType: "video/mp4",
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(uploadParams).promise();

    res.status(200).json({
      success: true,
      message: "Video processed and uploaded to S3 successfully",
      s3Url: uploadResult.Location,
      key: s3Key,
    });
  } catch (e) {
    console.error("Error in processor:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred during video processing",
    });
  }
}
