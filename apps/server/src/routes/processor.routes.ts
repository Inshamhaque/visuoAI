import express from "express";
import { processor } from "../controller/processor.controller";
// import { fetchMessages } from "../controller/messages.controller";
const router = express.Router();
router.post("/export", async (req, res) => {
    processor(req,res);
});
export const processorRoutes = router;
