import { getAIJsonResponse } from "../lib/grok.js";
import { finalReportPrompt } from "../prompts/report.prompt.js";
 
// Validates that an array exists, has only non-empty strings, and meets minimum length
const validateStringArray = (arr, minLength = 2) => {
  return (
    Array.isArray(arr) &&
    arr.length >= minLength &&
    arr.every((item) => typeof item === "string" && item.trim().length > 0)
  );
};
 
export const generateFinalReportAI = async (data) => {
  try {
    const { role, experience, transcript } = data;
 
    // Guard: need at least one transcript entry to generate a meaningful report
    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new Error("Cannot generate report: transcript is empty");
    }
 
    if (!role?.trim()) {
      throw new Error("role is required to generate final report");
    }
 
    const prompt = finalReportPrompt({ role, experience, transcript });
    const response = await getAIJsonResponse(prompt);
 
    if (!response || typeof response !== "object") {
      throw new Error("AI returned empty or non-object report");
    }
 
    const { overallScore, strengths, weaknesses, suggestions, summary } = response;
 
    // overallScore is 0–100 for the final report
    if (typeof overallScore !== "number" || isNaN(overallScore)) {
      throw new Error("Invalid overallScore in AI report");
    }
 
    if (!validateStringArray(strengths)) {
      throw new Error("strengths must be an array of at least 2 non-empty strings");
    }
 
    if (!validateStringArray(weaknesses)) {
      throw new Error("weaknesses must be an array of at least 2 non-empty strings");
    }
 
    if (!validateStringArray(suggestions)) {
      throw new Error("suggestions must be an array of at least 2 non-empty strings");
    }
 
    if (!summary || typeof summary !== "string" || !summary.trim()) {
      throw new Error("AI returned empty summary");
    }
 
    return {
      overallScore: Math.min(100, Math.max(0, Math.round(overallScore))),
      strengths:   strengths.map((s) => s.trim()),
      weaknesses:  weaknesses.map((s) => s.trim()),
      suggestions: suggestions.map((s) => s.trim()),
      summary:     summary.trim(),
    };
  } catch (error) {
    console.error("error generating final report:", error.message);
    throw new Error("Failed to generate final report");
  }
};