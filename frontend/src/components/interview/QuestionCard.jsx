
import { Clock, Send } from "lucide-react";
import { formatTimer } from "../../utils/timeFormat";

const DEFAULT_Q_SECONDS = 120;


export function QuestionCard({
  question,
  roundNumber,
  phase,
  answer,
  charCount,
  onAnswerChange,
  onKeyDown,
  onSubmit,
  textareaRef,
}) {
  const displayQuestion =
    typeof question === "string"
      ? question
      : question?.question ?? question?.text ?? "";

  return (
    <>
      {/* Question card*/}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] uppercase tracking-widest text-red-400/70 font-medium">
            Question {roundNumber}
          </span>
          <span className="text-[10px] text-white/25 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTimer(DEFAULT_Q_SECONDS)} limit
          </span>
        </div>

        <p className="text-white text-lg sm:text-xl leading-relaxed font-medium">
          {displayQuestion}
        </p>
      </div>

      {/*  Answer area */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/35 uppercase tracking-wider">
            Your answer
          </label>
          <span className={`text-xs ${charCount > 1800 ? "text-red-400" : "text-white/25"}`}>
            {charCount} / 2000
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={answer}
          onChange={onAnswerChange}
          onKeyDown={onKeyDown}
          disabled={phase !== "question"}
          placeholder="Type your answer here… (Ctrl + Enter to submit)"
          maxLength={2000}
          rows={8}
          className={`w-full min-h-[200px] resize-none rounded-xl border bg-white/[0.03] backdrop-blur-sm
            text-white text-sm leading-relaxed placeholder-white/20 px-4 py-3.5
            focus:outline-none transition-all
            ${phase === "question"
              ? "border-white/[0.09] focus:border-red-500/40 focus:bg-white/[0.05]"
              : "border-white/[0.04] opacity-50 cursor-not-allowed"
            }`}
        />

        {/* Submit row  */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-white/20 hidden sm:block">Ctrl + Enter to submit</p>
          <button
            onClick={onSubmit}
            disabled={phase !== "question" || answer.trim().length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500
              text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30
              disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] ml-auto"
          >
            {phase === "evaluating" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Evaluating…
              </>
            ) : (
              <>Submit answer <Send className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      </div>
    </>
  );
}