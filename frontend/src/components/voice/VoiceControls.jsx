// src/components/voice/VoiceControls.jsx
import { Mic, MicOff, PhoneOff, Phone, Loader2 } from "lucide-react";

/**
 * Props:
 *  status   — "idle" | "connecting" | "active" | "ending" | "ended"
 *  isMuted  — boolean
 *  saving   — boolean
 *  onStart  — () => void
 *  onEnd    — () => void   (opens modal, not direct end)
 *  onMute   — () => void
 */
export function VoiceControls({ status, isMuted, saving, onStart, onEnd, onMute }) {
  const isActive     = status === "active";
  const isConnecting = status === "connecting";
  const isBusy       = status === "ended" || status === "ending" || saving;

  return (
    <div className="w-full space-y-3">

      {/* ── Idle: Start button ──────────────────────────────────────────── */}
      {status === "idle" && !saving && (
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold
            flex items-center justify-center gap-2.5 transition-all
            shadow-lg shadow-red-900/40 active:scale-[0.98] text-base"
        >
          <Phone className="w-5 h-5" /> Start Voice Interview
        </button>
      )}

      {/* ── Connecting ──────────────────────────────────────────────────── */}
      {isConnecting && (
        <div className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]
          flex items-center justify-center gap-2.5 text-white/40 text-sm"
        >
          <Loader2 className="w-5 h-5 animate-spin" /> Connecting…
        </div>
      )}

      {/* ── Active: Mute + End ───────────────────────────────────────────── */}
      {isActive && (
        <div className="flex gap-3">
          <button
            onClick={onMute}
            className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2
              text-sm font-medium border transition-all ${
                isMuted
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : "bg-white/[0.05] border-white/[0.09] text-white/60 hover:bg-white/[0.09]"
              }`}
          >
            {isMuted
              ? <><MicOff className="w-4 h-4" /> Unmute</>
              : <><Mic    className="w-4 h-4" /> Mute</>
            }
          </button>

          <button
            onClick={onEnd}
            className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2
              text-sm font-medium bg-red-600/20 hover:bg-red-600/30
              border border-red-500/30 text-red-400 transition-all"
          >
            <PhoneOff className="w-4 h-4" /> End Call
          </button>
        </div>
      )}

      {/* ── Saving / generating report ───────────────────────────────────── */}
      {isBusy && (
        <div className="w-full py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]
          flex items-center justify-center gap-2 text-white/30 text-sm"
        >
          <Loader2 className="w-4 h-4 animate-spin" /> Generating your report…
        </div>
      )}

      {/* ── Hints ───────────────────────────────────────────────────────── */}
      {isActive && (
        <p className="text-[11px] text-white/20 text-center leading-relaxed">
          🎙️ Speak naturally — your words appear in real-time within the message bubble
        </p>
      )}

      {status === "idle" && !saving && (
        <p className="text-[11px] text-white/20 text-center leading-relaxed">
          ⚠️ Voice interviews require{" "}
          <span className="text-white/40">Google Chrome</span> for best results.
          Other browsers may have limited microphone support.
        </p>
      )}
    </div>
  );
}