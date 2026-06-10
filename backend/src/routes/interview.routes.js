import express from "express";

import {
  createInterview,
  startInterview,
  submitAnswer,
  endInterview,
  getInterviewById,
  getMyInterviews,
  getPublicInterviews,
  takeInterview,
  makeInterviewPublic,
  deleteInterview,
} from "../controllers/interview.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);



router.post("/", createInterview);

router.get("/my", getMyInterviews);

router.get("/:id", getInterviewById);

//interview flow
router.post("/:id/start", startInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/end", endInterview);



// Make interview public 
router.post("/:id/publish", makeInterviewPublic);
// Get all public interviews
router.get("/public/list", getPublicInterviews);

// Take a public interview 
router.post("/:id/take", takeInterview);

router.delete("/:id",  deleteInterview);
export default router;