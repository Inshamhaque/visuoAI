import express from "express";
const app = express();
import { userRouter } from "./routes/user.routes";
import { animationRouter } from "./routes/animation.routes";
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
app.use(express.json());
app.use("/user", userRouter);
app.use("/animation", animationRouter);
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
