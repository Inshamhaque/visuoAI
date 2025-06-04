import express from "express";
const router = express.Router();
import { authMiddleware } from "../middlewares/auth";
import { createScenes } from "../controller/animation.controller";
router.post("/create", (req, res) => {
  createScenes(req, res);
});
export const animationRouter = router;
