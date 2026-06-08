import { getAIJsonResponse } from "../lib/grok.js";
import { nextQuestionPrompt } from "../prompts/nextQuestion.prompt.js";
 
export const generateNextQuestionAI = async (data) => {
  try {
    const { role, experience, difficulty, currentRound, maxRounds, transcript } = data;
 
    // Guard: transcript must exist and have at least one entry to generate a follow-up
    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new Error("Transcript must have at least one entry for next question generation");
    }
 
    if (!role?.trim()) {
      throw new Error("role is required to generate next question");
    }
 
    const prompt = nextQuestionPrompt({ role, experience, difficulty, currentRound, maxRounds, transcript });
    const response = await getAIJsonResponse(prompt);
 
    if (!response || typeof response !== "object") {
      throw new Error("AI returned empty or non-object response");
    }
 
    const { question, focusArea } = response;
 
    // Validate question
    if (!question || typeof question !== "string" || !question.trim()) {
      throw new Error("AI returned empty or invalid question");
    }
 
    // Validate focusArea — fall back to "general" if missing/invalid
    const validatedFocusArea =
      focusArea && typeof focusArea === "string" && focusArea.trim()
        ? focusArea.trim()
        : "general";
 
    return {
      question: question.trim(),
      focusArea: validatedFocusArea,
    };
  } catch (error) {
    console.error("error generating next question:", error.message);
    throw new Error("Failed to generate next question");
  }
};