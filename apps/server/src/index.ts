import express from "express";
const app = express();
import { userRouter } from "./routes/user.routes";
import cors from "cors";
import cookieParser from "cookie-parser"
import { animationRouter } from "./routes/animation.routes";
import { messagesRouter } from "./routes/messages.routes";
import { authMiddleware } from "./middlewares/auth";
import { processorRoutes } from "./routes/processor.routes";
import { projectRoutes } from "./routes/project.routes"
import cron from "node-cron"
import { PrismaClient } from "@prisma/client";
// health check endpoint
// endpoints -> user,
/* 
  scenes -> create, update, delete, get
  while exporting the animations/project send the trnasformations as : -
  {
    projectId: string,
    transformations: {
    ...}
  }
*/
const prisma = new PrismaClient()
// cron job for pinging db at 12:15 am
cron.schedule("18 0 * * *", async () => {
  try {
    const users = await prisma.user.findMany();
    console.log("✅ Daily DB ping successful",users);
  } catch (error) {
    console.error("❌ Daily DB ping failed", error);
  }
});
app.use(cookieParser());
app.use(cors({
  origin:'http://localhost:3000',
  credentials:true
}));
app.use(express.json());
app.use("/user", userRouter);
app.use("/animation", animationRouter);
app.use("/messages", messagesRouter);
app.use("/processor",processorRoutes);
app.use("/userProjects",projectRoutes)
app.get("/health",  (req, res) => {
  res.status(200).send("OK");
});
app.listen(3001,'0.0.0.0', () => {
  console.log("Server is running on port 3001");
});
