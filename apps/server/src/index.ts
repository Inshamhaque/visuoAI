import express from "express";
const app = express();
import { userRouter } from "./routes/user.routes";
import cors from "cors";
import cookieParser from "cookie-parser"
import { animationRouter } from "./routes/animation.routes";
import { messagesRouter } from "./routes/messages.routes";
import { authMiddleware } from "./middlewares/auth";
import { processorRoutes } from "./routes/processor.routes";
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
app.use(cookieParser());
app.use(cors({
  origin:'http://localhost:3000',
  credentials:true
}));
app.use(express.json());
app.use("/user", userRouter);
app.use("/animation", animationRouter);
app.use("/messages", messagesRouter);
app.use("/processor",processorRoutes)
app.get("/health",  (req, res) => {
  res.status(200).send("OK");
});
app.listen(3001,'0.0.0.0', () => {
  console.log("Server is running on port 3001");
});
