import express from "express";
import { getProjects, signin, signup } from "../controller/user.controller";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
const router = express.Router();
router.post("/signup", (req, res) => {
  signup(req, res);
});
router.post("/signin", (req, res) => {
  signin(req, res);
});
router.get("/projects",authMiddleware,(req:AuthRequest,res)=>{
  getProjects(req,res);
})
export const userRouter = router;
