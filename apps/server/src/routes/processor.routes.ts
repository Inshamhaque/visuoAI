import express from "express";
import { processor } from "../controller/processor.controller";
import { authMiddleware } from "../middlewares/auth";
// import { fetchMessages } from "../controller/messages.controller";
const router = express.Router();
router.post("/export", authMiddleware, async (req, res) => {
    processor(req,res);
});
export const processorRoutes = router;
