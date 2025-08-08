import express from "express";
import { getProjects } from "../controller/user.controller";
import { authMiddleware } from "../middlewares/auth";
const router = express.Router();
router.get("/projects",authMiddleware, async (req, res) => {
  getProjects(req,res)
});
export const projectRoutes = router;
