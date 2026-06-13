import User from "../models/User.js";
import Interview from "../models/Interview.js";
import mongoose from "mongoose";

import { evaluateAnswerAI } from "../services/evaluation.service.js";
import { generateNextQuestionAI } from "../services/nextQuestion.service.js";
import { generateFinalReportAI } from "../services/report.service.js";
import { generateFirstQuestionAI } from "../services/FirstQuestion.service.js";
import { checkOwnership } from "../lib/checkOwnerShip.js";

export const createInterview = async (req, res) => {
  try {
    const { role, experience, difficulty, duration, mode, personality } =
      req.body;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!role || !experience || !difficulty || !duration) {
      return res.status(400).json({
        success: false,
        message: "role, experience, difficulty and duration are required",
      });
    }

    const interview = await Interview.create({
      userId: req.user.userId,
      role,
      experience,
      difficulty,
      duration,
      mode: mode ?? "text",
      type: "instance",

      // only used for voice interviews
      personality: personality ?? "professional",
    });

    return res.status(201).json({
      success: true,
      interview,
      message: "Interview created successfully",
    });
  } catch (error) {
    return res.status(500).json({
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
      return res.status(200).json({
        success: true,
        message: "Interview already in progress",
        data: {
          interviewId: interview._id,
          currentRound: interview.currentRound,
          maxRounds: interview.maxRounds,
          question: interview.currentQuestion,
          personality: interview.personality,
        },
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed",
      });
    }

    // VOICE INTERVIEW
    if (interview.mode === "voice") {
      interview.status = "in-progress";
      interview.startTime = new Date();

      await interview.save();

      return res.status(200).json({
        success: true,
        message: "Voice interview started successfully",
        data: {
          interviewId: interview._id,
          currentRound: interview.currentRound,
          maxRounds: interview.maxRounds,
          question: null,
          mode: "voice",
          personality: interview.personality,
        },
      });
    }

    // TEXT INTERVIEW
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
        focusArea: firstQ.focusArea ?? null,
        mode: "text",
      },
    });
  } catch (error) {
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

    // Validation
    if (!answer?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Answer is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid interview ID" });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (interview.status !== "in-progress") {
      return res
        .status(400)
        .json({ success: false, message: "Interview is not active" });
    }

    if (!interview.currentQuestion) {
      return res
        .status(400)
        .json({ success: false, message: "No active question found" });
    }

    //  Evaluate answer
    const evaluation = await evaluateAnswerAI({
      role: interview.role,
      question: interview.currentQuestion,
      answer: answer.trim(),
    });

    // Save to transcript
    interview.transcript.push({
      questionNumber: interview.currentRound + 1,
      question: interview.currentQuestion,
      answer: answer.trim(),
      evaluation,
    });

    interview.currentRound += 1;

    let nextQuestion = null;
    let report = null;
    const isLastRound = interview.currentRound >= interview.maxRounds;

    if (!isLastRound) {
      //Generate next question
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
      //  All rounds done → generate final report before saving
      try {
        report = await generateFinalReportAI({
          role: interview.role,
          experience: interview.experience,
          transcript: interview.transcript,
        });

        interview.overallScore = report.overallScore ?? 0;
        interview.strengths = report.strengths ?? [];
        interview.weaknesses = report.weaknesses ?? [];
        interview.suggestions = report.suggestions ?? [];
        interview.summary = report.summary ?? "";
      } catch (reportErr) {
        interview.overallScore = 0;
        interview.summary = "Report could not be generated. Please try again.";
      }

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

        // include report fields in response so frontend can use them
        ...(isLastRound && {
          overallScore: interview.overallScore,
          strengths: interview.strengths,
          weaknesses: interview.weaknesses,
          suggestions: interview.suggestions,
          summary: interview.summary,
        }),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to submit answer" });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid interview ID" });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    //  already completed → just return the existing report
    if (interview.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Interview already completed",
        data: {
          interviewId: interview._id,
          overallScore: interview.overallScore,
          strengths: interview.strengths,
          weaknesses: interview.weaknesses,
          suggestions: interview.suggestions,
          summary: interview.summary,
        },
      });
    }

    if (interview.status !== "in-progress") {
      return res
        .status(400)
        .json({ success: false, message: "Interview is not in progress" });
    }

    //  Handle voice transcript sent from VAPI frontend
    const { voiceTranscript, endedBy } = req.body ?? {};

    if (
      endedBy === "voice" &&
      Array.isArray(voiceTranscript) &&
      voiceTranscript.length > 0
    ) {
      // Pair interviewer messages with candidate answers
      const pairs = [];
      let currentQuestion = null;
      let questionNumber = 0;

      for (const turn of voiceTranscript) {
        if (turn.role === "assistant") {
          currentQuestion = turn.text;
        } else if (turn.role === "user" && currentQuestion) {
          questionNumber += 1;
          pairs.push({
            questionNumber,
            question: currentQuestion,
            answer: turn.text,
            askedAt: new Date(),
          });
          currentQuestion = null;
        }
      }

      if (pairs.length > 0) {
        interview.transcript = pairs;
        interview.currentRound = pairs.length;
      }
    }

    //  no transcript check — allow ending with 0 answers (voice interviews
    // may have mic issues etc). Generate report only if there's something to evaluate
    if (!interview.transcript || interview.transcript.length === 0) {
      // End gracefully with empty report instead of blocking with 400
      interview.status = "completed";
      interview.endTime = new Date();
      interview.summary = "Interview ended before any questions were answered.";
      interview.overallScore = 0;
      interview.strengths = [];
      interview.weaknesses = [];
      interview.suggestions = [];
      await interview.save();

      return res.status(200).json({
        success: true,
        message: "Interview ended",
        data: {
          interviewId: interview._id,
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          suggestions: [],
          summary: "Interview ended before any questions were answered.",
        },
      });
    }

    // Generate final AI report
    const report = await generateFinalReportAI({
      role: interview.role,
      experience: interview.experience,
      transcript: interview.transcript,
    });

    interview.overallScore = report.overallScore ?? 0;
    interview.strengths = report.strengths ?? [];
    interview.weaknesses = report.weaknesses ?? [];
    interview.suggestions = report.suggestions ?? [];
    interview.summary = report.summary ?? "";
    interview.status = "completed";
    interview.endTime = new Date();

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview completed successfully",
      data: {
        interviewId: interview._id,
        overallScore: report.overallScore,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        suggestions: report.suggestions,
        summary: report.summary,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid interview ID" });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });
    }

    if (!checkOwnership(interview, req.user.userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (interview.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed interviews can be published",
      });
    }

    interview.isPublic = true;
    interview.type = "template";
    if (!interview.userId) {
      interview.userId = req.user.userId;
    }

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview published to marketplace",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to publish interview" });
  }
};

export const getPublicInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ isPublic: true, type: "template" })
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .lean();

    if (!interviews.length) {
      return res.status(200).json({ success: true, interviews: [] });
    }

    const result = interviews.map((iv) => {
      const user = iv.userId;

      // user is populated object OR still an ObjectId if populate failed
      const isPopulated = user && typeof user === "object" && user.name !== undefined;

      const displayName = isPopulated
        ? (user.name?.trim() || user.email?.split("@")[0] || "Community")
        : "Community";

      return {
        ...iv,
        userId:          isPopulated ? user._id : iv.userId,
        createdBy:       { name: displayName },
        experienceLevel: iv.experience,
      };
    });

    return res.status(200).json({ success: true, interviews: result });
  } catch (error) {
    console.error("getPublicInterviews error:", error);
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
      userId: req.user.userId,
      type: "instance",
      templateId: template._id,
      role: template.role,
      experience: template.experience,
      difficulty: template.difficulty,
      duration: template.duration,
      status: "scheduled",
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

export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    // Check authentication
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.userId;

    // Find the interview
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Check ownership
    if (interview.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this interview",
      });
    }

    if (interview.status === "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete an interview that is in progress",
      });
    }

    let message = "";
    let deletedFromDB = false;

    // If it's a template (marketplace interview), just return success without deleting from DB
    if (interview.type === "template") {
      message =
        "Interview removed from your dashboard (marketplace interview preserved)";
      deletedFromDB = false;
      // Don't delete from database - just return success
    } else {
      // Delete instance interviews from database
      await Interview.findByIdAndDelete(id);
      message = "Interview deleted successfully";
      deletedFromDB = true;
    }

    res.status(200).json({
      success: true,
      message,
      deletedFromDB,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error while deleting interview",
    });
  }
};
