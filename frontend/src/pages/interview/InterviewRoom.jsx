
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flag, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import api from "../../api/axios";
import { useInterview } from "../../hooks/useInterview";
import { useTimer } from "../../hooks/useTimer";

import { QuestionCard } from "../../components/interview/QuestionCard";
import { FeedbackPanel } from "../../components/interview/FeedbackPanel";
import { TimerRing, Spinner } from "../../components/interview/InterviewShared";

const DEFAULT_Q_SECONDS = 120;

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    state,
    loadQuestion,
    submitAnswer,
    endInterview,
    advanceToNext,
    markDone,
  } = useInterview(id);

  const [answer, setAnswer] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [feedbackTimer, setFeedbackTimer] = useState(null);
  const [endModal, setEndModal] = useState(false);
  const [ending, setEnding] = useState(false);

  const textareaRef = useRef(null);
  const answerRef = useRef("");
  const handleSubmitRef = useRef(null);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Load interview
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        const interview =
          data.data?.interview ?? data.interview ?? data.data ?? data;

        if (!interview) {
          toast.error("Interview not found");
          navigate("/dashboard");
          return;
        }
        if (interview.status === "completed") {
          toast.info("Already completed");
          navigate(`/interview/${id}/report`, { replace: true });
          return;
        }
        if (interview.status !== "in-progress") {
          toast.warning("Interview not active");
          navigate("/dashboard");
          return;
        }
        if (!interview.currentQuestion) {
          toast.error("No questions found");
          navigate("/dashboard");
          return;
        }

        loadQuestion({
          question: interview.currentQuestion,
          roundNumber: (interview.currentRound ?? 0) + 1,
          totalRounds: interview.maxRounds ?? 5,
          timeLimit: DEFAULT_Q_SECONDS,
        });

        toast.success("Interview ready!", {
          description: `Question ${(interview.currentRound ?? 0) + 1} of ${interview.maxRounds ?? 5}`,
          duration: 3000,
          icon: "🎯",
        });
      } catch (err) {
        toast.error("Failed to load", {
          description: err.response?.data?.message ?? "Please try again",
        });
        navigate("/dashboard");
      }
    })();
  }, [id]); // eslint-disable-line

  // Timer
  const questionSeconds = state.question?.timeLimit ?? DEFAULT_Q_SECONDS;
  const handleTimerExpire = useCallback(() => {
    toast.warning("Time's up!", {
      description: "Submitting your answer…",
      icon: "⏰",
    });
    handleSubmitRef.current?.(true);
  }, []);

  const {
    timeLeft,
    pct: timerPct,
    start: startTimer,
    reset: resetTimer,
  } = useTimer(questionSeconds, handleTimerExpire);

  useEffect(() => {
    if (state.phase === "question") {
      setAnswer("");   //eslint-disable-line
      answerRef.current = "";
      setCharCount(0);
      resetTimer(questionSeconds);
      startTimer();
      setTimeout(() => textareaRef.current?.focus(), 100);
      if (state.roundNumber === 1)
        toast.info("Pro tip 💡", {
          description: "Use Ctrl+Enter to submit quickly",
          duration: 5000,
        });
    }
  }, [state.phase, state.roundNumber]); // eslint-disable-line

  const handleAnswerChange = (e) => {
    const val = e.target.value;
    setAnswer(val);
    setCharCount(val.length);
    if (val.length === 1900)
      toast.warning("Approaching limit", {
        description: "100 characters remaining",
        icon: "⚠️",
      });
  };

  const handleSubmit = useCallback(
    async (timedOut = false) => {
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
                question: result.nextQuestion,
                roundNumber: result.currentRound ?? state.roundNumber,
                totalRounds: result.maxRounds ?? state.totalRounds,
                timeLimit: DEFAULT_Q_SECONDS,
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
    },
    [
      state.phase,
      state.roundNumber,
      state.totalRounds,
      id,
      navigate,
      submitAnswer,
      advanceToNext,
      markDone,
    ],
  );

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const handleOpenEndModal = () => {
    if (state.roundNumber <= 1 && !state.evaluation) {
      toast.warning("Answer at least one question before ending.");
      return;
    }
    setEndModal(true);
  };

  const handleEndEarly = async () => {
    setEnding(true);
    const toastId = toast.loading("Ending interview…");
    try {
      await endInterview();
      toast.success("Interview ended", {
        id: toastId,
        description: "Report is ready",
        icon: "📊",
      });
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (state.phase === "question" && answer.trim().length > 0)
        handleSubmit();
    }
  };

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

  const timerColour =
    timerPct > 50
      ? "text-white/70"
      : timerPct > 25
        ? "text-amber-400"
        : "text-red-400";
  const ringColour =
    timerPct > 50
      ? "stroke-white/20"
      : timerPct > 25
        ? "stroke-amber-500/60"
        : "stroke-red-500/80";

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/8 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/6 blur-[100px]" />
      </div>

      <header className="relative z-20 sticky top-0 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: state.totalRounds || 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i < state.roundNumber - 1 ? "w-6 bg-red-500" : i === state.roundNumber - 1 ? "w-6 bg-red-400 animate-pulse" : "w-6 bg-white/10"}`}
                />
              ))}
            </div>
            <span className="text-xs text-white/40">
              <span className="text-white/70 font-medium">
                Q{state.roundNumber}
              </span>
              {state.totalRounds ? ` of ${state.totalRounds}` : ""}
            </span>
          </div>
          {state.phase === "question" && (
            <TimerRing
              timeLeft={timeLeft}
              pct={timerPct}
              colour={timerColour}
              ringColour={ringColour}
            />
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
              <button
                onClick={() => navigate("/dashboard")}
                className="text-sm text-red-400 underline"
              >
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

        {(state.phase === "question" ||
          state.phase === "evaluating" ||
          state.phase === "feedback") && (
          <>
            <QuestionCard
              question={state.question}
              roundNumber={state.roundNumber}
              phase={state.phase}
              answer={answer}
              charCount={charCount}
              onAnswerChange={handleAnswerChange}
              onKeyDown={handleKeyDown}
              onSubmit={() => handleSubmit(false)}
              textareaRef={textareaRef}
            />
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

      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEndModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#111] backdrop-blur-xl p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-base font-semibold mb-1">
              End interview early?
            </h2>
            <p className="text-sm text-white/40 mb-6">
              Your progress will be saved and a partial report will be
              generated.
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
