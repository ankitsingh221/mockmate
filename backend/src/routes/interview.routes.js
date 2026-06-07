import express from "express";
import {
  createInterview,
  endInterview,
  getAllInterviews,
  getInterviewById,
  startInterview,
  submitAnswer,
} from "../controllers/interview.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.post("/", createInterview);

router.get("/", getAllInterviews);

router.get("/:id", getInterviewById);

router.post("/:id/start", startInterview);

router.post("/:id/answer", submitAnswer);

router.post("/:id/end", endInterview);

export default router;
