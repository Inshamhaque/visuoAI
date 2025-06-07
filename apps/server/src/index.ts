import express from "express";
const app = express();
import { userRouter } from "./routes/user.routes";
import cors from "cors";
import { animationRouter } from "./routes/animation.routes";
import { messagesRouter } from "./routes/messages.routes";
import { authMiddleware } from "./middlewares/auth";
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
app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/animation", animationRouter);
app.use("/messages", messagesRouter);
app.get("/health", authMiddleware, (req, res) => {
  res.status(200).send("OK");
});
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
