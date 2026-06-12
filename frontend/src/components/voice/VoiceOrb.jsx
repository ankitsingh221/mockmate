// Animated orb that reacts to call state
// idle → grey | connecting → slow pulse
// -> AI speaking → red breathe  
// -> user speaking → green rings

export default function VoiceOrb({ status, isSpeaking, isMuted }) {
 
  const isConnecting   = status === "connecting";
  const isActive       = status === "active";
  const isEnding       = status === "ending" || status === "ended";
  const aiSpeaking     = isActive && isSpeaking;
  const userSpeaking   = isActive && !isSpeaking && !isMuted;

  return (
    <div className="flex flex-col items-center justify-center gap-6 select-none">

      {/* Orb  */}
      <div className="relative flex items-center justify-center w-48 h-48">

        {/* Outermost ripple — only when AI is speaking */}
        {aiSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: "1.8s" }} />
            <div className="absolute inset-4 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: "1.4s", animationDelay: "0.3s" }} />
          </>
        )}

        {/* User speaking ripples — green */}
        {userSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: "1.6s" }} />
            <div className="absolute inset-6 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.2s" }} />
          </>
        )}

        {/* Connecting pulse */}
        {isConnecting && (
          <div className="absolute inset-0 rounded-full bg-white/5 animate-pulse" />
        )}

        {/* Main orb */}
        <div
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500
            ${isConnecting ? "bg-white/5 border border-white/10 scale-95" : ""}
            ${aiSpeaking   ? "bg-gradient-to-br from-red-900/60 to-red-700/40 border-2 border-red-500/60 scale-110 shadow-[0_0_60px_rgba(239,68,68,0.35)]" : ""}
            ${userSpeaking ? "bg-gradient-to-br from-emerald-900/50 to-emerald-700/30 border-2 border-emerald-500/50 scale-105 shadow-[0_0_40px_rgba(16,185,129,0.25)]" : ""}
            ${isActive && !aiSpeaking && !userSpeaking ? "bg-white/[0.04] border border-white/10 scale-100" : ""}
            ${isEnding     ? "bg-white/[0.02] border border-white/5 scale-90 opacity-50" : ""}
            ${status === "idle" ? "bg-white/[0.03] border border-white/[0.07]" : ""}
          `}
        >
          {/* Inner glow */}
          <div
            className={`w-20 h-20 rounded-full transition-all duration-500
              ${aiSpeaking   ? "bg-red-500/20 shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]" : ""}
              ${userSpeaking ? "bg-emerald-500/15 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]" : ""}
              ${!aiSpeaking && !userSpeaking ? "bg-white/[0.04]" : ""}
            `}
          >
            {/* Sound bars — visible when AI speaking */}
            {aiSpeaking && (
              <div className="w-full h-full flex items-center justify-center gap-1">
                {[0, 0.15, 0.05, 0.2, 0.1].map((delay, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-red-400/80 rounded-full animate-bounce"
                    style={{
                      animationDelay:    `${delay}s`,
                      animationDuration: "0.6s",
                      height:            `${20 + (i % 3) * 14}px`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Mic icon — user's turn */}
            {userSpeaking && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex gap-1 items-end">
                  {[0, 0.1, 0.2, 0.1, 0].map((delay, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-emerald-400/70 rounded-full animate-bounce"
                      style={{
                        animationDelay:    `${delay}s`,
                        animationDuration: "0.8s",
                        height:            `${14 + (i % 3) * 10}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Connecting spinner */}
            {isConnecting && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status label ────────────────────────────────────────────────────── */}
      <div className="text-center space-y-1">
        {status === "idle" && (
          <p className="text-sm text-white/30">Ready to start</p>
        )}
        {isConnecting && (
          <p className="text-sm text-white/50 animate-pulse">Connecting to interviewer…</p>
        )}
        {aiSpeaking && (
          <p className="text-sm text-red-400/80">AI Interviewer is speaking…</p>
        )}
        {userSpeaking && (
          <p className="text-sm text-emerald-400/80">Your turn — speak now</p>
        )}
        {isActive && !aiSpeaking && !userSpeaking && isMuted && (
          <p className="text-sm text-amber-400/70">You are muted</p>
        )}
        {isActive && !aiSpeaking && !userSpeaking && !isMuted && (
          <p className="text-sm text-white/30">Listening…</p>
        )}
        {status === "ending" && (
          <p className="text-sm text-white/30 animate-pulse">Ending call…</p>
        )}
        {status === "ended" && (
          <p className="text-sm text-white/40">Interview complete</p>
        )}
      </div>

      {/* ── Muted badge ─────────────────────────────────────────────────────── */}
      {isMuted && isActive && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Microphone muted
        </div>
      )}
    </div>
  );
}