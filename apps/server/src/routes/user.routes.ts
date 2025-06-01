import express from "express";
import { signin, signup } from "../controller/user.controller";
const router = express.Router();
router.post("/signup", (req, res) => {
  signup(req, res);
});
router.get("/signin", (req, res) => {
  signin(req, res);
});
export const userRouter = router;
