import User from "../models/User.js";
import Interview from "../models/Interview.js";
import mongoose from "mongoose";

import { generateQuestionAI } from "../services/ai.service.js";

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

export const getAllInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch interviews",
    });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
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

    // security check
    if (interview.userId.toString() !== req.user.userId) {
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

export const startInterview = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    //  Find interview first
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Ownership check
    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    //  Prevent restarting already started interview
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

    // Update interview
    interview.status = "in-progress";
    interview.startTime = new Date();

    await interview.save();

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to start interview",
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    res.status(200).json({
      success: true,
      message: "Answer submitted",
      interviewId: id,
      answer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { id } = req.params;

    //  Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    //  Find interview
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    //  Ownership check
    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Prevent ending if already completed
    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Interview already completed",
      });
    }

    // ensure it was started first
    if (interview.status !== "in-progress") {
      return res.status(400).json({
        success: false,
        message: "Interview is not in progress",
      });
    }

    // Update interview
    interview.status = "completed";
    interview.endTime = new Date();

    await interview.save();

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to end interview",
    });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    //  Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview ID",
      });
    }

    // Find interview
    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // Ownership check 
    if (interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    //  Generate AI question
    const aiResponse = await generateQuestionAI({
      role: interview.role,
      experience: interview.experience,
      difficulty: interview.difficulty,
    });

    return res.status(200).json({
      success: true,
      question: aiResponse.question,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate question",
    });
  }
};

