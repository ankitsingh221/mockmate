import User from "../models/User.js";
import Interview from "../models/Interview.js";
import mongoose from "mongoose";

import { evaluateAnswerAI } from "../services/evaluation.service.js";
import { generateNextQuestionAI } from "../services/nextQuestion.service.js";
import { generateFinalReportAI } from "../services/report.service.js";
import { generateFirstQuestionAI } from "../services/firstQuestion.service.js";
import { checkOwnership } from "../lib/checkOwnerShip.js";


export const createInterview = async (req, res) => {
  try {
    const { role, experience, difficulty, duration } = req.body;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const interview = await Interview.create({
      userId: req.user.userId,
      role,
      experience,
      difficulty,
      duration,
      type: "instance", // setting tyep  so getMyInterviews query works
    });

    res.status(201).json({
      success: true,
      interview,
      message: "Interview created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const startInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (interview.status === "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview already in progress",
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed",
      });
    }

    // Generate the first question using role/experience/difficulty
    const firstQ = await generateFirstQuestionAI({
      role: interview.role,
      experience: interview.experience,
      difficulty: interview.difficulty,
      maxRounds: interview.maxRounds,
    });

    interview.currentQuestion = firstQ.question;
    interview.status = "in-progress";
    interview.startTime = new Date();

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview started successfully",
      data: {
        interviewId: interview._id,
        currentRound: interview.currentRound,
        maxRounds: interview.maxRounds,
        question: firstQ.question,
        focusArea: firstQ.focusArea,
      },
    });
  } catch (error) {
    console.error("start interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to start interview",
    });
  }
};


export const submitAnswer = async (req, res) => {
  try {
    const { answer } = req.body;
    const { id } = req.params;

    if (!answer?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Answer is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    //  ownership check
    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not active",
      });
    }

    if (!interview.currentQuestion) {
      return res.status(400).json({
        success: false,
        message: "No active question found",
      });
    }

    // AI Evaluation
    const evaluation = await evaluateAnswerAI({
      role: interview.role,
      question: interview.currentQuestion,
      answer,
    });

    // Save to transcript
    interview.transcript.push({
      questionNumber: interview.currentRound + 1,
      question: interview.currentQuestion,
      answer,
      evaluation,
    });

    interview.currentRound += 1;

    let nextQuestion = null;

    if (interview.currentRound < interview.maxRounds) {
      const nextQ = await generateNextQuestionAI({
        role: interview.role,
        experience: interview.experience,
        difficulty: interview.difficulty,
        transcript: interview.transcript,
        currentRound: interview.currentRound,
        maxRounds: interview.maxRounds,
      });

      nextQuestion = nextQ.question;
      interview.currentQuestion = nextQuestion;
    } else {
      // All rounds done — mark completed
      interview.status = "completed";
      interview.endTime = new Date();
      interview.currentQuestion = "";
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Answer evaluated successfully",
      data: {
        evaluation,
        currentRound: interview.currentRound,
        maxRounds: interview.maxRounds,
        nextQuestion,
        isCompleted: interview.status === "completed",
      },
    });
  } catch (error) {
    console.error("submit answer error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit answer",
    });
  }
};


export const endInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed",
      });
    }

    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    // Generate final AI report
    const report = await generateFinalReportAI({
      role: interview.role,
      experience: interview.experience,
      transcript: interview.transcript,
    });

    // Persist all report fields
    interview.overallScore = report.overallScore;
    interview.strengths    = report.strengths;
    interview.weaknesses   = report.weaknesses;
    interview.suggestions  = report.suggestions;
    interview.summary      = report.summary;

    interview.status  = "completed";
    interview.endTime = new Date();

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview completed successfully",
      data: {
        interviewId:  interview._id,
        overallScore: report.overallScore,
        strengths:    report.strengths,
        weaknesses:   report.weaknesses,
        suggestions:  report.suggestions,
        summary:      report.summary,
      },
    });
  } catch (error) {
    console.error("end interview error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to end interview",
    });
  }
};


export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getMyInterviews = async (req, res) => {
  try {
  
    const interviews = await Interview.find({
      userId: req.user.userId,
      type: "instance",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};


export const makeInterviewPublic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only allow completed interviews to be published
    if (interview.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed interviews can be published",
      });
    }

    interview.isPublic = true;
    interview.type = "template";

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview published to marketplace",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to publish interview",
    });
  }
};


export const getPublicInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({
      isPublic: true,
      type: "template",
    })
      .select("role experience difficulty duration createdAt userId")
      .populate("userId", "name");

    return res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public interviews",
    });
  }
};


export const takeInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    const template = await Interview.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!template.isPublic || template.type !== "template") {
      return res.status(400).json({
        success: false,
        message: "Not a public interview",
      });
    }

    const newInterview = await Interview.create({
      userId:     req.user.userId,
      type:       "instance",
      templateId: template._id,
      role:       template.role,
      experience: template.experience,
      difficulty: template.difficulty,
      duration:   template.duration,
      status:     "scheduled",
    });

    return res.status(201).json({
      success: true,
      message: "Interview cloned successfully. Call /start to begin.",
      interview: newInterview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to take interview",
    });
  }
};