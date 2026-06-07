import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "in-progress",
        "completed",
      ],
      default: "scheduled",
    },

    startTime: Date,

    endTime: Date,

    overallScore: {
      type: Number,
      default: 0,
    },

    strengths: [String],

    weaknesses: [String],

    suggestions: [String],

    transcript: [
      {
        questionNumber: Number,

        question: String,

        answer: String,

        technicalScore: Number,

        communicationScore: Number,

        correctnessScore: Number,

        feedback: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
