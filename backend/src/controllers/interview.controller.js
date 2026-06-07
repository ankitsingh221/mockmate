import User from "../models/User.js";
import Interview from "../models/Interview.js";

export const createInterview = async (req, res) => {
  try {
    const { role, experience, difficulty, duration } = req.body;

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
      message: "Create Interview endpoint working",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllInterviews = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Get All Interviews endpoint working",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: `Get Interview By ID endpoint working`,
      id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startInterview = async (req, res) => {
  try {
    const { id } = req.params;

    res.status(200).json({
      success: true,
      message: `Interview ${id} started`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    res.status(200).json({
      success: true,
      message: `Interview ${id} ended`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
