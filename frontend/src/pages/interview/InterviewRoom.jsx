import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useInterview } from "../../hooks/useInterview";
import { useTimer } from "../../hooks/useTimer";
import { formatTimer } from "../../utils/timeFormat";
import { Clock, Send, ChevronRight, AlertTriangle, Flag } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_Q_SECONDS = 120;

export default function InterviewRoom() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { state, loadQuestion, submitAnswer, endInterview, advanceToNext, markDone } =
    useInterview(id);

  const [answer,        setAnswer]        = useState("");
  const [charCount,     setCharCount]     = useState(0);
  const [feedbackTimer, setFeedbackTimer] = useState(null);
  const [endModal,      setEndModal]      = useState(false);
  const [ending,        setEnding]        = useState(false);
  const textareaRef = useRef(null);

  // keep answer in a ref so callbacks never go stale
  const answerRef = useRef("");
  useEffect(() => { answerRef.current = answer; }, [answer]);

  //  Load interview on mount 
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);

        const interview = data.data?.interview ?? data.interview ?? data.data ?? data;

        if (!interview) {
          toast.error("Interview not found", { description: "Redirecting to dashboard…" });
          navigate("/dashboard");
          return;
        }

        if (interview.status === "completed") {
          toast.info("Interview already completed");
          navigate(`/interview/${id}/report`, { replace: true });
          return;
        }

        if (interview.status !== "in-progress") {
          toast.warning("Interview not active", { description: "Please start a new interview" });
          navigate("/dashboard");
          return;
        }

        if (!interview.currentQuestion) {
          toast.error("No questions found");
          navigate("/dashboard");
          return;
        }

        loadQuestion({
          question:    interview.currentQuestion,
          roundNumber: (interview.currentRound ?? 0) + 1,
          totalRounds: interview.maxRounds ?? 5,
          timeLimit:   DEFAULT_Q_SECONDS,
        });

        toast.success("Interview ready!", {
          description: `Question ${(interview.currentRound ?? 0) + 1} of ${interview.maxRounds ?? 5}`,
          duration: 3000,
          icon: "🎯",
        });
      } catch (err) {
        toast.error("Failed to load interview", {
          description: err.response?.data?.message ?? "Please try again",
        });
        navigate("/dashboard");
      }
    })();
  }, [id]); 

  // Timer
  const questionSeconds = state.question?.timeLimit ?? DEFAULT_Q_SECONDS;

  // use ref so callback is never stale
  const handleTimerExpire = useCallback(() => {
    toast.warning("Time's up!", { description: "Submitting your answer…", icon: "⏰" });
    handleSubmitRef.current(true);
  }, []);

  const { timeLeft, pct: timerPct, start: startTimer, reset: resetTimer } =
    useTimer(questionSeconds, handleTimerExpire);

  useEffect(() => {
    if (state.phase === "question") {
      setAnswer("");
      answerRef.current = "";
      setCharCount(0);
      resetTimer(questionSeconds);
      startTimer();
      setTimeout(() => textareaRef.current?.focus(), 100);

      if (state.roundNumber === 1) {
        toast.info("Pro tip 💡", {
          description: "Use Ctrl+Enter to submit quickly",
          duration: 5000,
        });
      }
    }
  }, [state.phase, state.roundNumber]);

  // Answer change 
  const handleAnswerChange = (e) => {
    const val = e.target.value;
    setAnswer(val);
    setCharCount(val.length);
    if (val.length === 1900) {
      toast.warning("Approaching limit", { description: "100 characters remaining", icon: "⚠️" });
    }
  };

  // use a ref so timer expire callback always calls latest version
  const handleSubmitRef = useRef(null);

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (state.phase !== "question" && !timedOut) return;

    const text = answerRef.current.trim() || "(No answer provided)";

    if (!timedOut && text === "(No answer provided)") {
      toast.warning("Please write an answer before submitting.");
      return;
    }

    const toastId = toast.loading("Evaluating your answer…");

    try {
      const result = await submitAnswer(text);

      toast.success("Answer submitted!", { id: toastId, duration: 2000 });

      let countdown = 4;
      setFeedbackTimer(countdown);

      const iv = setInterval(() => {
        countdown -= 1;
        setFeedbackTimer(countdown);

        if (countdown <= 0) {
          clearInterval(iv);
          setFeedbackTimer(null);

          if (result.isCompleted) {
            toast.success("Interview complete! 🎉", {
              description: "Generating your report…",
              duration: 4000,
            });
            markDone();
            setTimeout(() => navigate(`/interview/${id}/report`), 600);
          } else if (result.nextQuestion) {
            advanceToNext({
              question:    result.nextQuestion,
              roundNumber: (result.currentRound ?? state.roundNumber),
              totalRounds: result.maxRounds ?? state.totalRounds,
              timeLimit:   DEFAULT_Q_SECONDS,
            });
          }
        }
      }, 1000);
    } catch (err) {
      toast.error("Submission failed", {
        id: toastId,
        description: err.response?.data?.message ?? "Please try again",
      });
    }
  }, [state.phase, state.roundNumber, state.totalRounds, id, navigate, submitAnswer, advanceToNext, markDone]);

  // keep ref in sync
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  //  End early
  const handleOpenEndModal = () => {
    if (state.roundNumber <= 1 && !state.evaluation) {
      toast.warning("Answer at least one question before ending.", { duration: 3000 });
      return;
    }
    setEndModal(true);
  };

  const handleEndEarly = async () => {
    setEnding(true);
    const toastId = toast.loading("Ending interview…");
    try {
      await endInterview();
      toast.success("Interview ended", { id: toastId, description: "Report is ready", icon: "📊" });
      navigate(`/interview/${id}/report`);
    } catch (err) {
      toast.error("Failed to end", {
        id: toastId,
        description: err?.response?.data?.message ?? "Please try again",
      });
      setEnding(false);
      setEndModal(false);
    }
  };

  // Keyboard shortcut
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (state.phase === "question" && answer.trim().length > 0) {
        handleSubmit();
      }
    }
  };

  // Leave warning 
  useEffect(() => {
    const handler = (e) => {
      if (state.phase === "question" && answer.trim().length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.phase, answer]);

  // ── Timer colours ─────────────────────────────────────────────────────────
  const timerColour  = timerPct > 50 ? "text-white/70" : timerPct > 25 ? "text-amber-400" : "text-red-400";
  const ringColour   = timerPct > 50 ? "stroke-white/20" : timerPct > 25 ? "stroke-amber-500/60" : "stroke-red-500/80";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/8 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/6 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 sticky top-0 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: state.totalRounds || 5 }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                  i < state.roundNumber - 1 ? "w-6 bg-red-500"
                  : i === state.roundNumber - 1 ? "w-6 bg-red-400 animate-pulse"
                  : "w-6 bg-white/10"
                }`} />
              ))}
            </div>
            <span className="text-xs text-white/40">
              <span className="text-white/70 font-medium">Q{state.roundNumber}</span>
              {state.totalRounds ? ` of ${state.totalRounds}` : ""}
            </span>
          </div>

          {state.phase === "question" && (
            <TimerRing timeLeft={timeLeft} pct={timerPct} colour={timerColour} ringColour={ringColour} />
          )}

          <button
            onClick={handleOpenEndModal}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End interview</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {state.phase === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner label="Loading your interview…" />
          </div>
        )}

        {state.phase === "error" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-white/50 text-sm">{state.error}</p>
              <button onClick={() => navigate("/dashboard")} className="text-sm text-red-400 underline">
                Back to dashboard
              </button>
            </div>
          </div>
        )}

        {state.phase === "done" && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner label="Generating your report…" />
          </div>
        )}

        {(state.phase === "question" || state.phase === "evaluating" || state.phase === "feedback") && (
          <>
            {/* Question card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] uppercase tracking-widest text-red-400/70 font-medium">
                  Question {state.roundNumber}
                </span>
                <span className="text-[10px] text-white/25 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTimer(DEFAULT_Q_SECONDS)} limit
                </span>
              </div>
              <p className="text-white text-lg sm:text-xl leading-relaxed font-medium">
                {typeof state.question === "string"
                  ? state.question
                  : state.question?.question ?? state.question?.text ?? ""}
              </p>
            </div>

            {/* Answer */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/35 uppercase tracking-wider">Your answer</label>
                <span className={`text-xs ${charCount > 1800 ? "text-red-400" : "text-white/25"}`}>
                  {charCount} / 2000
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={answer}
                onChange={handleAnswerChange}
                onKeyDown={handleKeyDown}
                disabled={state.phase !== "question"}
                placeholder="Type your answer here… (Ctrl + Enter to submit)"
                maxLength={2000}
                rows={8}
                className={`w-full min-h-[200px] resize-none rounded-xl border bg-white/[0.03] backdrop-blur-sm text-white text-sm leading-relaxed placeholder-white/20 px-4 py-3.5 focus:outline-none transition-all
                  ${state.phase === "question"
                    ? "border-white/[0.09] focus:border-red-500/40 focus:bg-white/[0.05]"
                    : "border-white/[0.04] opacity-50 cursor-not-allowed"
                  }`}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-white/20 hidden sm:block">Ctrl + Enter to submit</p>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={state.phase !== "question" || answer.trim().length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97] ml-auto"
                >
                  {state.phase === "evaluating" ? (
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

            {/* Feedback */}
            {state.phase === "feedback" && state.evaluation && (
              <FeedbackPanel
                evaluation={state.evaluation}
                feedbackTimer={feedbackTimer}
                roundNumber={state.roundNumber}
                totalRounds={state.totalRounds}
              />
            )}
          </>
        )}
      </main>

      {/* End modal */}
      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEndModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#111] backdrop-blur-xl p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-base font-semibold mb-1">End interview early?</h2>
            <p className="text-sm text-white/40 mb-6">
              Your progress will be saved and a partial report will be generated.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEndModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.09] text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={handleEndEarly}
                disabled={ending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {ending ? "Ending…" : "End now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  Timer ring
function TimerRing({ timeLeft, pct, colour, ringColour }) {
  useEffect(() => {
    if (timeLeft === 30) toast.warning("30 seconds remaining!", { icon: "⏱️", duration: 3000 });
    if (timeLeft === 10) toast.warning("10 seconds left!", { icon: "⚠️", duration: 3000 });
  }, [timeLeft]);

  const r       = 18;
  const circ    = 2 * Math.PI * r;
  const dashOff = circ * (1 - pct / 100);

  return (
    <div className={`flex items-center gap-2 ${colour}`}>
      <div className="relative w-11 h-11">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/[0.06]" />
          <circle
            cx="22" cy="22" r={r} fill="none"
            strokeWidth="2.5"
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

// Feedback panel
function FeedbackPanel({ evaluation, feedbackTimer, roundNumber, totalRounds }) {
  const score  = evaluation?.overallScore ?? evaluation?.score ?? null;
  const isLast = roundNumber >= totalRounds;

  const scoreColour = score >= 8 ? "text-emerald-400" : score >= 5 ? "text-amber-400" : "text-red-400";
  const scoreBg     = score >= 8 ? "bg-emerald-500/10 border-emerald-500/20"
                    : score >= 5 ? "bg-amber-500/10   border-amber-500/20"
                    : "bg-red-500/10 border-red-500/20";

  //  score toast only fires once per evaluation
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
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <span className="text-xs uppercase tracking-widest text-white/35 font-medium">Evaluation</span>
        {score !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${scoreBg} ${scoreColour}`}>
            {score}<span className="text-xs font-normal opacity-60">/10</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {evaluation.feedback && (
          <p className="text-sm text-white/70 leading-relaxed">{evaluation.feedback}</p>
        )}

        {[
          { label: "Technical",     value: evaluation.technicalScore },
          { label: "Communication", value: evaluation.communicationScore },
          { label: "Correctness",   value: evaluation.correctnessScore },
        ].filter((s) => s.value != null).map(({ label, value }) => (
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

      <div className="px-5 py-3.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-xs text-white/30">
          {isLast ? "Generating your report…" : "Next question loading"}
        </span>
        {feedbackTimer !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[3, 2, 1, 0].map((v) => (
                <div key={v} className={`w-1.5 h-1.5 rounded-full transition-all ${feedbackTimer > v ? "bg-red-500" : "bg-white/10"}`} />
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

function Spinner({ label }) {
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