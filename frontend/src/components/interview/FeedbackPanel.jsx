// src/components/interview/FeedbackPanel.jsx
import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

/**
 * Props:
 *  evaluation   — { overallScore, feedback, technicalScore, communicationScore, correctnessScore }
 *  feedbackTimer — number | null  (countdown seconds)
 *  roundNumber  — number
 *  totalRounds  — number
 */
export function FeedbackPanel({ evaluation, feedbackTimer, roundNumber, totalRounds }) {
  const score  = evaluation?.overallScore ?? evaluation?.score ?? null;
  const isLast = roundNumber >= totalRounds;

  const scoreColour =
    score >= 8 ? "text-emerald-400"
    : score >= 5 ? "text-amber-400"
    : "text-red-400";

  const scoreBg =
    score >= 8 ? "bg-emerald-500/10 border-emerald-500/20"
    : score >= 5 ? "bg-amber-500/10  border-amber-500/20"
    : "bg-red-500/10 border-red-500/20";

  // Fire score toast once per evaluation
  const firedRef = useRef(false);
  useEffect(() => {
    if (score !== null && !firedRef.current) {
      firedRef.current = true;
      if      (score >= 9) toast.success(`Excellent! 🌟 ${score}/10`);
      else if (score >= 7) toast.success(`Great answer 👍 ${score}/10`);
      else if (score >= 5) toast.info(`Good attempt 💪 ${score}/10`);
      else                 toast.warning(`Review the feedback 📚 ${score}/10`);
    }
  }, [score]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <span className="text-xs uppercase tracking-widest text-white/35 font-medium">
          Evaluation
        </span>
        {score !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${scoreBg} ${scoreColour}`}>
            {score}
            <span className="text-xs font-normal opacity-60">/10</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {evaluation.feedback && (
          <p className="text-sm text-white/70 leading-relaxed">
            {evaluation.feedback}
          </p>
        )}

        {/* Score bars */}
        {[
          { label: "Technical",     value: evaluation.technicalScore },
          { label: "Communication", value: evaluation.communicationScore },
          { label: "Correctness",   value: evaluation.correctnessScore },
        ]
          .filter((s) => s.value != null)
          .map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-white/35">{label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-500/70 transition-all duration-700"
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white/50 w-6 text-right">{value}</span>
              </div>
            </div>
          ))}
      </div>

      {/* Footer countdown */}
      <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-white/30">
          {isLast ? "Generating your report…" : "Next question loading"}
        </span>

        {feedbackTimer !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[3, 2, 1, 0].map((v) => (
                <div
                  key={v}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    feedbackTimer > v ? "bg-red-500" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white/30">{feedbackTimer}s</span>
          </div>
        )}

        {feedbackTimer === 0 && !isLast && (
          <ChevronRight className="w-4 h-4 text-white/20 animate-pulse" />
        )}
      </div>
    </div>
  );
}