import express from "express";
const router = express.Router();
import { authMiddleware } from "../middlewares/auth";
import { createScenes } from "../controller/animation.controller";
router.use(authMiddleware);
router.post("/create", authMiddleware, (req, res) => {
  createScenes(req, res);
});
export const animationRouter = router;
