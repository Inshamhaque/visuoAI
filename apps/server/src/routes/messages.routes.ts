import express from "express";
import { fetchMessages } from "../controller/messages.controller";
const router = express.Router();
router.get("/fetch", async (req, res) => {
  fetchMessages(req, res);
});
export const messagesRouter = router;
