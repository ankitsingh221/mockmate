// src/components/voice/EndCallModal.jsx
import { PhoneOff } from "lucide-react";

/**
 * Props:
 *  open      — boolean
 *  onClose   — () => void
 *  onConfirm — () => void
 */
export function EndCallModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#111]/95 backdrop-blur-xl p-6 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <PhoneOff className="w-5 h-5 text-red-400" />
        </div>

        <h2 className="text-base font-semibold mb-1">End interview?</h2>
        <p className="text-sm text-white/40 mb-2 leading-relaxed">
          The call will end and your report will be generated from the conversation so far.
        </p>

        <p className="text-xs text-emerald-400/70 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          ✓ You'll get a full report even if you didn't finish all questions.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.09] text-sm text-white/50
              hover:text-white hover:border-white/20 transition-colors"
          >
            Keep going
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            End & get report
          </button>
        </div>
      </div>
    </div>
  );
}