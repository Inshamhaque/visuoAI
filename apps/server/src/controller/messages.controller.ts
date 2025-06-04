import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function fetchMessages(req: Request, res: Response) {
  const { projectId } = req.body();
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }
  try {
    const response = await prisma.message.findMany({
      where: { projectId },
      orderBy: { id: "asc" },
    });
    return res.status(200).json(response);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}
