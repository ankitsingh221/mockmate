export const finalReportPrompt = (data) => {
  const { role, experience, transcript } = data;
 
  const totalRounds = transcript.length;
  const avgOverall =
    totalRounds > 0
      ? (
          transcript.reduce((sum, t) => sum + (t.evaluation?.overallScore ?? 0), 0) /
          totalRounds
        ).toFixed(1)
      : 0;
 
  const transcriptSummary = transcript
    .map(
      (t, i) => `
Round ${i + 1}:
  Question: ${t.question}
  Answer: ${t.answer}
  Technical: ${t.evaluation?.technicalScore}/10
  Communication: ${t.evaluation?.communicationScore}/10
  Correctness: ${t.evaluation?.correctnessScore}/10
  Overall: ${t.evaluation?.overallScore}/10
  Feedback: ${t.evaluation?.feedback || "N/A"}
`
    )
    .join("\n");
 
  return `
You are a senior engineering hiring manager at a top tech company.
 
You have just completed a ${totalRounds}-round technical interview with a candidate for the role of ${role} (${experience} level).
Their average per-round score was ${avgOverall}/10.
 
Your task is to generate a comprehensive, honest final evaluation report.
 
---
FULL INTERVIEW TRANSCRIPT WITH SCORES:
${transcriptSummary}
---
 
REPORT GUIDELINES:
 
1. overallScore (0–100)
   - Not just a scaled average — factor in improvement/decline trends and consistency
   - 85–100: Exceptional, strong hire
   - 70–84: Good candidate, recommend hire
   - 50–69: Mixed performance, needs development
   - Below 50: Significant gaps, not ready
 
2. strengths (array of strings)
   - Specific skills or behaviors the candidate demonstrated well
   - Reference actual answers where possible
   - At least 2, maximum 5 items
 
3. weaknesses (array of strings)
   - Honest gaps in knowledge, depth, or communication
   - Be specific — avoid vague feedback like "needs improvement"
   - At least 2, maximum 5 items
 
4. suggestions (array of strings)
   - Actionable, specific recommendations for improvement
   - E.g. "Study system design fundamentals — specifically CAP theorem and database sharding"
   - At least 2, maximum 5 items
 
5. summary (string)
   - 3–5 sentences overall narrative of the candidate's performance
   - Mention the role fit, key standouts (positive and negative), and hiring recommendation
   - Write as if addressing the hiring committee
 
STRICT RULES:
- Return ONLY valid JSON. No markdown, no backticks, no text outside JSON.
- All arrays must have at least 2 items.
- summary must be a non-empty string.
 
OUTPUT FORMAT:
{
  "overallScore": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "summary": "string"
}
`;
};