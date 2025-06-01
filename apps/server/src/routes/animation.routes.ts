import express from "express";
const router = express.Router();
import { createScenes } from "../controller/animation.controller";
router.post("/create", (req, res) => {
  createScenes(req, res);
});
export const animationRouter = router;
