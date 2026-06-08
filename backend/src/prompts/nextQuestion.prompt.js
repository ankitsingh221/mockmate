export const nextQuestionPrompt = (data) => {
  const {
    role,
    experience,
    difficulty,
    currentRound,
    maxRounds,
    transcript,
  } = data;
 
  // Build a compact summary of previous Q&A + scores for the AI
  const transcriptSummary = transcript
    .map(
      (t, i) => `
Round ${i + 1}:
  Question: ${t.question}
  Focus Area: ${t.evaluation?.focusArea || "general"}
  Scores → Technical: ${t.evaluation?.technicalScore}/10 | Correctness: ${t.evaluation?.correctnessScore}/10 | Overall: ${t.evaluation?.overallScore}/10
  Feedback: ${t.evaluation?.feedback || "N/A"}
`
    )
    .join("\n");
 
  // Derive candidate trend to guide difficulty adaptation
  const scores = transcript.map((t) => t.evaluation?.overallScore ?? 5);
  const avgScore = scores.length
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 5;
 
  const trend =
    avgScore >= 7.5
      ? "performing well — increase challenge"
      : avgScore >= 5
      ? "performing adequately — maintain difficulty"
      : "struggling — reduce difficulty slightly and focus on fundamentals";
 
  return `
You are a world-class technical interviewer at a FAANG-level company conducting a live interview.
 
Your task is to generate the NEXT interview question based on the candidate's performance so far.
 
---
INTERVIEW CONTEXT:
Role: ${role}
Experience Level: ${experience}
Base Difficulty: ${difficulty}
Round: ${currentRound} of ${maxRounds}
Candidate Average Score: ${avgScore}/10 → ${trend}
 
PREVIOUS QUESTIONS & PERFORMANCE:
${transcriptSummary}
---
 
RULES:
- NEVER repeat or paraphrase a previously asked question
- Adapt difficulty based on the candidate's trend described above
- Focus on weak areas (low scores or poor feedback) from the transcript
- If the candidate excelled, explore a related but more advanced concept
- Keep the question targeted, realistic, and relevant to the role
- For the final rounds, prefer questions that reveal depth over breadth
- Do NOT ask hypothetical trivia — ask questions a real interviewer would ask
- Return ONLY valid JSON. No markdown, no explanation outside JSON.
 
OUTPUT FORMAT:
{
  "question": "string",
  "focusArea": "string"
}
`;
};