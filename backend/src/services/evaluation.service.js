import { getAIJsonResponse } from "../lib/grok.js";
import { evaluationPrompt } from "../prompts/evaluation.prompt.js";
 
// Clamps a value to [min, max] and ensures it's an integer
const clampScore = (value, min = 0, max = 10) => {
  if (typeof value !== "number" || isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};
 
export const evaluateAnswerAI = async (data) => {
  try {
    const { role, question, answer } = data;
 
    // Guard: don't call AI with empty data
    if (!role?.trim() || !question?.trim() || !answer?.trim()) {
      throw new Error("role, question, and answer are required for evaluation");
    }
 
    const prompt = evaluationPrompt({ role, question, answer });
    const evaluation = await getAIJsonResponse(prompt);
 
    if (!evaluation || typeof evaluation !== "object") {
      throw new Error("AI returned empty or non-object evaluation");
    }
 
    const { technicalScore, communicationScore, correctnessScore, overallScore, feedback } =
      evaluation;
 
    // Validate feedback separately — empty string is not useful
    if (!feedback || typeof feedback !== "string" || !feedback.trim()) {
      throw new Error("AI returned empty feedback");
    }
 
    // Clamp all scores into valid range instead of throwing — keeps interview alive
    return {
      technicalScore:    clampScore(technicalScore),
      communicationScore: clampScore(communicationScore),
      correctnessScore:  clampScore(correctnessScore),
      overallScore:      clampScore(overallScore),
      feedback:          feedback.trim(),
    };
  } catch (error) {
    console.error("answer evaluation error:", error.message);
    throw new Error("Failed to evaluate answer");
  }
};