import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export default function VoiceTranscript({ transcript, status }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const isEmpty = transcript.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Live Conversation
          </h2>
          {status === "active" && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/70">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {isEmpty && status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-sm text-white/25">Conversation will appear here</p>
            <p className="text-xs text-white/15 mt-1">Click Start Interview to begin</p>
          </div>
        )}

        {isEmpty && status === "connecting" && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-white/30 animate-pulse">Connecting to your interviewer…</p>
          </div>
        )}

        {transcript.map((msg, idx) => {
          const isAI   = msg.role === "assistant";
          const isLast = idx === transcript.length - 1;

          return (
            <div
              key={msg.id ?? idx}
              className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                isAI
                  ? "bg-red-600/20 border-red-500/30"
                  : "bg-emerald-600/20 border-emerald-500/30"
              }`}>
                {isAI
                  ? <Bot  className="w-3.5 h-3.5 text-red-400" />
                  : <User className="w-3.5 h-3.5 text-emerald-400" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                isAI
                  ? "bg-white/[0.04] border border-white/[0.07] rounded-tl-sm"
                  : "bg-emerald-900/20 border border-emerald-500/15 rounded-tr-sm"
              }`}>
                <p className={`text-[10px] mb-1 uppercase tracking-wider ${
                  isAI ? "text-red-400/50" : "text-emerald-400/50"
                }`}>
                  {isAI ? "AI Interviewer" : "You"}
                </p>
                <p className="text-sm text-white/80 leading-relaxed">
                  {msg.text}
                  {/* blinking cursor on last partial message */}
                  {msg.partial && isLast && (
                    <span className="inline-block w-0.5 h-3.5 bg-white/40 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}