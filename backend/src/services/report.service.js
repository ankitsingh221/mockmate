import { getAIJsonResponse } from "../lib/grok.js";
import { finalReportPrompt } from "../prompts/report.prompt.js";

const validateStringArray = (arr, minLength = 2) => {
  return (
    Array.isArray(arr) &&
    arr.length >= minLength &&
    arr.every((item) => typeof item === "string" && item.trim().length > 0)
  );
};

const sanitizeArray = (arr, fallback) => {
  if (Array.isArray(arr) && arr.length > 0) {
    const clean = arr
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());
    if (clean.length >= 2) return clean;
  }
  return fallback;
};

export const generateFinalReportAI = async (data) => {
  const { role, experience, transcript } = data;

 
  if (!Array.isArray(transcript) || transcript.length === 0) {
    throw new Error("Cannot generate report: transcript is empty");
  }

  if (!role?.trim()) {
    throw new Error("role is required to generate final report");
  }

  let response;
  try {
    const prompt = finalReportPrompt({ role, experience, transcript });
    response = await getAIJsonResponse(prompt);
    
  } catch (aiError) {
    console.error("[report] AI call failed:", aiError);
    throw new Error(`AI call failed: ${aiError.message}`);
  }

  if (!response || typeof response !== "object") {
    throw new Error(
      `AI returned invalid response: ${JSON.stringify(response)}`,
    );
  }

  const { overallScore, strengths, weaknesses, suggestions, summary } =
    response;

  // ── Validate + sanitize each field instead of hard-throwing ────────────
  // overallScore
  let score = overallScore;
  if (typeof score !== "number" || isNaN(score)) {
    console.warn(
      "[report] overallScore invalid, defaulting to 50. Got:",
      overallScore,
    );
    score = 50;
  }
  score = Math.min(100, Math.max(0, Math.round(score)));

  const cleanStrengths = sanitizeArray(strengths, [
    "Attempted to answer questions",
    "Showed willingness to engage",
  ]);
  const cleanWeaknesses = sanitizeArray(weaknesses, [
    "Limited technical depth shown",
    "Answers lacked specificity",
  ]);
  const cleanSuggestions = sanitizeArray(suggestions, [
    "Review core concepts for the role",
    "Practice structured answer delivery",
  ]);

 
  const cleanSummary =
    typeof summary === "string" && summary.trim()
      ? summary.trim()
      : `The candidate completed a ${transcript.length}-round interview for the ${role} role.`;

  // Log if we had to fall back on anything
  if (!validateStringArray(strengths))
    console.warn("[report] strengths were invalid, used fallback");
  if (!validateStringArray(weaknesses))
    console.warn("[report] weaknesses were invalid, used fallback");
  if (!validateStringArray(suggestions))
    console.warn("[report] suggestions were invalid, used fallback");

  return {
    overallScore: score,
    strengths: cleanStrengths,
    weaknesses: cleanWeaknesses,
    suggestions: cleanSuggestions,
    summary: cleanSummary,
  };
};
