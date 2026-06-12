import { useEffect, useRef, useState, useCallback } from "react";
import VapiSDK from "@vapi-ai/web";
const Vapi = VapiSDK?.default ?? VapiSDK;

// Personality configs
const PERSONALITY_PROMPTS = {
  friendly: {
    label: "Friendly",
    voiceId: "Rohan",
    temperature: 0.8,
    prompt: `
Your personality:
- Be warm, encouraging and supportive throughout
- Celebrate good answers: "That's a great point!", "Excellent!", "I really like that answer"
- If they struggle, offer gentle hints: "Think about it from a different angle" or "You're on the right track"
- Use lots of natural fillers: "Hmm", "I see", "Right", "Interesting", "Go on", "Tell me more"
- Make the candidate feel comfortable and at ease
- Smile through your voice — be genuinely interested in their answers
- When done: "That was a wonderful interview! You did great. Goodbye!"`,
  },

  aggressive: {
    label: "Aggressive",
    voiceId: "Cole",
    temperature: 0.9,
    prompt: `
Your personality:
- Be direct, challenging and intimidating
- Push back HARD on vague or shallow answers: "That's not good enough, go deeper", "You're wasting my time, be specific"
- Interrupt often if they ramble: "Stop. Get to the point.", "I've heard enough of that"
- Show skepticism: "I'm not convinced", "Really? That seems too simple", "Any competent engineer would know this"
- Use short, sharp fillers: "Mmhm.", "And?", "So?", "Continue.", "Next."
- Never reassure or compliment — stay cold and demanding
- Only acknowledge truly exceptional answers with a brief "Fine."
- When done: "That concludes the interview. We'll be in touch." (no warmth)`,
  },

  formal: {
    label: "Formal",
    voiceId: "Elliot",
    temperature: 0.5,
    prompt: `
Your personality:
- Be strictly professional and formal at all times
- Use precise, structured language — no slang or casual expressions
- Acknowledge answers neutrally: "I see", "Understood", "Noted", "Please elaborate"
- Follow a structured format: ask the question, listen, ask ONE follow-up, move on
- No small talk, no jokes, no personal comments about the answers
- Maintain a measured, even tone throughout
- Address any digression immediately: "Please focus on the question asked"
- When done: "Thank you for your time. This concludes our interview session. Goodbye."`,
  },

  mentor: {
    label: "Mentor",
    voiceId: "Lily",
    temperature: 0.8,
    prompt: `
Your personality:
- Act like a senior engineer mentoring a junior — supportive but educational
- After each answer, add brief teaching moments: "Good — and just to add to that..."
- If they get something wrong, correct gently: "Not quite — let me explain the nuance here"
- Share occasional insight: "In practice, most teams handle this by..."
- Use fillers: "Hmm", "That's interesting", "Let me build on that", "Good thinking"
- Encourage deeper thinking: "What would happen if the scale was 10x?", "Have you considered edge cases?"
- Make them feel they're learning even while being evaluated
- When done: "Really enjoyed this conversation. Keep building on these concepts. Goodbye!"`,
  },

  rapid: {
    label: "Rapid Fire",
    voiceId: "Hana",
    temperature: 0.9,
    prompt: `
Your personality:
- Keep the pace FAST — this is a rapid fire round
- After each answer say "Next." or "Moving on." immediately
- Keep YOUR responses under 2 sentences maximum
- No extended follow-ups — maximum ONE quick follow-up then move on
- Use super short fillers: "Got it.", "Ok.", "Next question.", "And?", "Quick — "
- Create urgency: speak quickly, transition fast
- If they take too long: "Time — let's move to the next one"
- The goal is to test breadth not depth — cover as many topics as possible
- When done: "That's a wrap. Fast and focused. Goodbye!"`,
  },

  tough_but_fair: {
    label: "Tough but Fair",
    voiceId: "Sarah",
    temperature: 0.7,
    prompt: `
Your personality:
- Be rigorous and demanding but always respectful
- Hold candidates to a high standard: "That's partially correct — what's missing?"
- Push for depth without being rude: "Interesting — can you take that further?"
- Acknowledge good answers honestly: "That's solid", "Good answer"
- Challenge weak answers firmly but constructively: "I'd expect more detail on this"
- Use fillers: "Hmm", "Right", "I see", "Let's dig deeper", "Fair point, but..."
- Balance challenge with fairness — never personal, always about the answer
- When done: "Good effort today. Some strong answers, some room to grow. Goodbye!"`,
  },
};

// Build system prompt
function buildSystemPrompt({
  role,
  experience,
  difficulty,
  maxRounds,
  personality = "friendly",
}) {
  const config =
    PERSONALITY_PROMPTS[personality] ?? PERSONALITY_PROMPTS.friendly;

  return `You are a professional technical interviewer conducting a real job interview for a ${role} position.

Candidate details:
- Experience level: ${experience}
- Interview difficulty: ${difficulty}
- Total questions to ask: ${maxRounds}

Core rules (always follow these regardless of personality):
- Ask exactly ${maxRounds} questions total — track this internally
- NEVER repeat a question already asked
- This is a VOICE conversation — keep sentences short and natural
- Always wait for the candidate to finish before responding
- When all ${maxRounds} questions are done, end the call with your closing line

${config.prompt}

Start immediately with your greeting and first question. Keep the intro to 1 sentence.`;
}

// Hook
export function useVapi() {
  const vapiRef = useRef(null);
  const messageIdCounter = useRef(0);

  const [status, setStatus] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);

  // Generate unique message IDs
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `msg-${Date.now()}-${messageIdCounter.current}`;
  };

  // Init VAPI once
  useEffect(() => {
    const key = import.meta.env.VITE_VAPI_PUBLIC_KEY;

    if (!key) {
      setError(
        "VAPI public key not found. Add VITE_VAPI_PUBLIC_KEY to your .env file.",
      );
      return;
    }
    if (!Vapi) {
      setError("VAPI SDK failed to load. Run: npm install @vapi-ai/web");
      return;
    }

    try {
      vapiRef.current = new Vapi(key);
    } catch (e) {
      setError("Failed to initialise VAPI: " + e.message);
      return;
    }

    const vapi = vapiRef.current;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);
      setTranscript([]);
      messageIdCounter.current = 0;
    });

    vapi.on("call-end", () => {
      setStatus("ended");
      setIsSpeaking(false);
      setIsMuted(false);
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("message", (msg) => {
      if (msg.type === "transcript") {
        const { role, transcript: text, transcriptType } = msg;
        if (!text?.trim()) return;

        if (transcriptType === "partial") {
          // Handle partial/streaming messages
          setTranscript((prev) => {
            // Check if we already have a partial message from this role
            const existingPartialIndex = prev.findIndex(
              (item) => item.role === role && item.partial === true,
            );

            if (existingPartialIndex !== -1) {
              // Update existing partial message
              const updated = [...prev];
              updated[existingPartialIndex] = {
                ...updated[existingPartialIndex],
                text: text,
                timestamp: Date.now(),
              };
              return updated;
            } else {
              // Create new partial message
              return [
                ...prev,
                {
                  id: generateMessageId(),
                  role: role,
                  text: text,
                  partial: true,
                  timestamp: Date.now(),
                },
              ];
            }
          });
        } else if (transcriptType === "final") {
          // Handle final/complete messages
          setTranscript((prev) => {
            // Check if we have a partial message from this role
            const existingPartialIndex = prev.findIndex(
              (item) => item.role === role && item.partial === true,
            );

            if (existingPartialIndex !== -1) {
              // Replace partial with final message
              const updated = [...prev];
              updated[existingPartialIndex] = {
                id: generateMessageId(),
                role: role,
                text: text,
                partial: false,
                timestamp: Date.now(),
              };
              return updated;
            } else {
              // Check if last message is from same role (to combine)
              const lastMessage = prev[prev.length - 1];
              if (
                lastMessage &&
                lastMessage.role === role &&
                !lastMessage.partial
              ) {
                // Append to last message
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...lastMessage,
                  text: lastMessage.text + " " + text,
                  timestamp: Date.now(),
                };
                return updated;
              }
              // Create new final message
              return [
                ...prev,
                {
                  id: generateMessageId(),
                  role: role,
                  text: text,
                  partial: false,
                  timestamp: Date.now(),
                },
              ];
            }
          });
        }
      }
    });

    vapi.on("error", (err) => {
      console.error("VAPI error:", err);
      setError(err?.error?.message?.msg ?? err?.message ?? "Voice call error.");
      setStatus("idle");
    });

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  // Start call
  const startCall = useCallback(
    ({
      role,
      experience,
      difficulty,
      maxRounds = 5,
      personality = "friendly",
    }) => {
      if (!vapiRef.current) {
        setError("VAPI not initialised.");
        return;
      }

      setStatus("connecting");
      setTranscript([]);
      setError(null);
      messageIdCounter.current = 0;

      const config =
        PERSONALITY_PROMPTS[personality] ?? PERSONALITY_PROMPTS.friendly;

      const assistantConfig = {
        model: {
          provider: "openai",
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: buildSystemPrompt({
                role,
                experience,
                difficulty,
                maxRounds,
                personality,
              }),
            },
          ],
          temperature: config.temperature,
        },

        voice: {
          provider: "vapi",
          voiceId: config.voiceId,
        },

        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },

        firstMessage: getFirstMessage(role, personality),

        endCallMessage: "Goodbye!",

        endCallPhrases: [
          "goodbye",
          "that concludes",
          "that's a wrap",
          "we'll be in touch",
          "hear back from us",
        ],

        silenceTimeoutSeconds: 20,
        maxDurationSeconds: 3600,
        backgroundSound: "off",
      };

      try {
        vapiRef.current.start(assistantConfig);
      } catch (err) {
        setError(err?.message ?? "Failed to start call.");
        setStatus("idle");
      }
    },
    [],
  );

  // End call
  const endCall = useCallback(() => {
    setStatus("ending");
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  }, []);

  // Mute
  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  return {
    status,
    isSpeaking,
    isMuted,
    transcript,
    error,
    startCall,
    endCall,
    toggleMute,
  };
}

// First message per personality
function getFirstMessage(role, personality) {
  const messages = {
    friendly: `Hi there! Welcome — I'm really excited to chat with you today about the ${role} role. Ready to get started?`,
    aggressive: `Let's begin. ${role} position. I'll be direct — impress me.`,
    formal: `Good day. We will now commence the interview for the ${role} position. Please confirm you are ready to proceed.`,
    mentor: `Hello! Great to meet you. Today we'll explore your knowledge for the ${role} role — think of this as a learning conversation. Ready?`,
    rapid: `Okay — ${role} interview, rapid fire format. Fast questions, fast answers. Let's go. First question:`,
    tough_but_fair: `Hello. We're here for the ${role} interview. I'll be straightforward — I expect thorough answers. Let's begin.`,
  };
  return messages[personality] ?? messages.friendly;
}

// Export personality configs for UI use
export { PERSONALITY_PROMPTS };
