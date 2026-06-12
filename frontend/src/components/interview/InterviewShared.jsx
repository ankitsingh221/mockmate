// src/components/interview/TimerRing.jsx
import { useEffect } from "react";
import { toast } from "sonner";
import { formatTimer } from "../../utils/timeFormat";

export function TimerRing({ timeLeft, pct, colour, ringColour }) {
  useEffect(() => {
    if (timeLeft === 30) toast.warning("30 seconds remaining!", { icon: "⏱️", duration: 3000 });
    if (timeLeft === 10) toast.warning("10 seconds left!",      { icon: "⚠️", duration: 3000 });
  }, [timeLeft]);

  const r       = 18;
  const circ    = 2 * Math.PI * r;
  const dashOff = circ * (1 - pct / 100);

  return (
    <div className={`flex items-center gap-2 ${colour}`}>
      <div className="relative w-11 h-11">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22" cy="22" r={r}
            fill="none" stroke="currentColor" strokeWidth="2.5"
            className="text-white/[0.06]"
          />
          <circle
            cx="22" cy="22" r={r}
            fill="none" strokeWidth="2.5"
            strokeDasharray={circ}
            strokeDashoffset={dashOff}
            strokeLinecap="round"
            className={`transition-all duration-1000 ${ringColour}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">
          {formatTimer(timeLeft)}
        </span>
      </div>
    </div>
  );
}

// src/components/interview/Spinner.jsx
export function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center gap-3 text-white/30">
      <svg className="w-8 h-8 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  );
}