import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["template", "instance"],
      default: "instance",
    },

    mode: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },

    personality: {
      type: String,
      enum: ["friendly", "aggressive", "formal", "Rapid Fire","Tough but Fair", "Mentor"],
      default: "friendly",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      default: null,
    },

    role: { type: String, required: true },
    experience: { type: String, required: true },
    difficulty: { type: String, required: true },
    duration: { type: Number, required: true },

    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed"],
      default: "scheduled",
    },

    startTime: Date,
    endTime: Date,

    currentRound: { type: Number, default: 0 },
    maxRounds: { type: Number, default: 10 },
    currentQuestion: { type: String, default: "" },

    overallScore: { type: Number, default: 0 },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    summary: { type: String, default: "" },

    transcript: [
      {
        questionNumber: Number,
        question: String,
        answer: String,
        evaluation: {
          technicalScore: Number,
          communicationScore: Number,
          correctnessScore: Number,
          overallScore: Number,
          feedback: String,
        },
        askedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

const Interview = mongoose.model("Interview", interviewSchema);
export default Interview;
