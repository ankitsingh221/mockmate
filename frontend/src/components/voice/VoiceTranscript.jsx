import { useEffect, useRef, useState } from "react";
import { Bot, User } from "lucide-react";

export default function VoiceTranscript({ transcript, status }) {
  const bottomRef = useRef(null);
  const [displayMessages, setDisplayMessages] = useState([]);

  // Process transcript to group continuous speech from same speaker
  useEffect(() => {
    if (!transcript || transcript.length === 0) {
      setDisplayMessages([]);
      return;
    }

    const groupedMessages = [];
    let currentGroup = null;

    transcript.forEach((msg) => {
      // Skip empty messages
      if (!msg.text || msg.text.trim() === "") return;

      // If no current group or different role, create new group
      if (!currentGroup || currentGroup.role !== msg.role) {
        // Push previous group if exists
        if (currentGroup) {
          groupedMessages.push(currentGroup);
        }
        
        // Start new group
        currentGroup = {
          id: msg.id || `msg-${Date.now()}-${msg.role}`,
          role: msg.role,
          text: msg.text,
          isStreaming: msg.partial === true,
          timestamp: msg.timestamp || Date.now(),
        };
      } else {
        // Same role -> combine messages
        // If current is streaming and new is partial, update text
        // If both are final, combine text
        if (currentGroup.isStreaming || msg.partial) {
          // Update existing streaming message
          currentGroup.text = msg.text;
          currentGroup.isStreaming = msg.partial === true;
          currentGroup.id = msg.id || currentGroup.id;
        } else {
          // Combine final messages
          currentGroup.text = currentGroup.text + " " + msg.text;
        }
      }
    });

    // Push the last group
    if (currentGroup) {
      groupedMessages.push(currentGroup);
    }

    setDisplayMessages(groupedMessages);
  }, [transcript]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const isEmpty = displayMessages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.05] bg-black/30 backdrop-blur-sm sticky top-0 z-10">
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
        {/* Empty state - idle */}
        {isEmpty && status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-white/20" />
            </div>
            <p className="text-sm text-white/25">Conversation will appear here</p>
            <p className="text-xs text-white/15 mt-1">Click Start Interview to begin</p>
          </div>
        )}

        {/* Empty state - connecting */}
        {isEmpty && status === "connecting" && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-white/30 animate-pulse">Connecting to your interviewer…</p>
          </div>
        )}

        {/* Display grouped messages */}
        {displayMessages.map((msg, idx) => {
          const isAI = msg.role === "assistant";
          const isStreaming = msg.isStreaming;
          const isLast = idx === displayMessages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                isAI
                  ? "bg-red-600/20 border-red-500/30"
                  : "bg-emerald-600/20 border-emerald-500/30"
              }`}>
                {isAI
                  ? <Bot className="w-3.5 h-3.5 text-red-400" />
                  : <User className="w-3.5 h-3.5 text-emerald-400" />
                }
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                isAI
                  ? "bg-white/[0.04] border border-white/[0.07] rounded-tl-sm"
                  : "bg-emerald-900/20 border border-emerald-500/15 rounded-tr-sm"
              }`}>
                {/* Header with speaker name and status */}
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[10px] uppercase tracking-wider ${
                    isAI ? "text-red-400/50" : "text-emerald-400/50"
                  }`}>
                    {isAI ? "AI Interviewer" : "You"}
                  </p>
                  
                  {/* Streaming/Speaking indicator */}
                  {isStreaming && (
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-amber-400 animate-pulse font-mono">
                        ● Speaking
                      </span>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Message text with cursor for streaming */}
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                  {msg.text}
                  {isStreaming && isLast && (
                    <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {/* Thinking indicator -> shows when AI is processing but not speaking yet */}
        {status === "active" && 
         displayMessages.length > 0 && 
         displayMessages[displayMessages.length - 1]?.role === "user" &&
         !displayMessages[displayMessages.length - 1]?.isStreaming &&
         !transcript.some(msg => msg.role === "assistant" && (msg.partial === true || msg.text)) && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border bg-red-600/20 border-red-500/30">
              <Bot className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-[10px] mb-1 uppercase tracking-wider text-red-400/50">
                AI is thinking...
              </p>
              <div className="flex gap-1.5 items-center">
                <div 
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" 
                  style={{ animationDelay: '0ms', animationDuration: '1s' }}
                />
                <div 
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" 
                  style={{ animationDelay: '150ms', animationDuration: '1s' }}
                />
                <div 
                  className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" 
                  style={{ animationDelay: '300ms', animationDuration: '1s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}