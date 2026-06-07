import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateQuestionAI = async ({ role, experience, difficulty }) => {
  try {
    const prompt = `
You are a strict interview question generator.

Rules:
- Return ONLY valid JSON
- No explanation
- No markdown
- No extra text

Schema:
{
  "question": "string"
}

Role: ${role}
Experience: ${experience}
Difficulty: ${difficulty}
`;

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;


    if (!content) {
      throw new Error("Empty response from Groq");
    }

    // remove markdown if any
    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // extract JSON safely
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(match[0]);

    if (!parsed.question) {
      throw new Error("Question missing in AI response");
    }

    return parsed;
  } catch (error) {
    console.error("❌ GROQ AI ERROR:", error.message);
    throw new Error("Failed to generate question");
  }
};
