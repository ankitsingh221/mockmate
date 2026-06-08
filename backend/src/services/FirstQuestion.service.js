import { getAIJsonResponse } from "../lib/grok.js";
import { firstQuestionPrompt } from "../prompts/firstQuestion.prompt.js";

export const generateFirstQuestionAI = async (data) => {
  try {
    const { role, experience, difficulty, maxRounds } = data;

    if (!role || !experience || !difficulty) {
      throw new Error("role, experience, and difficulty are required");
    }

    const prompt = firstQuestionPrompt({ role, experience, difficulty, maxRounds });

    const response = await getAIJsonResponse(prompt);

    if (!response?.question) {
      throw new Error("Invalid first question response from AI");
    }

    return {
      question: response.question,
      focusArea: response.focusArea || "general",
    };
  } catch (error) {
    console.error("error generating first question:", error.message);
    throw new Error("Failed to generate first question");
  }
};