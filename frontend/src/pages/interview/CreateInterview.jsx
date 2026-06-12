import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { toast } from "sonner";
import {
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Zap,
  Mic,
  Keyboard,
} from "lucide-react";

import {
  EXPERIENCE_OPTIONS,
  DIFFICULTY_OPTIONS,
  PERSONALITY_OPTIONS,
  getSteps,
  getTotalSteps,
  getDurationOptions,
  getDurationDisplay,
} from "../../constants/interviewOptions";

export default function CreateInterview() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    jobRole: "",
    experienceLevel: "",
    difficulty: "",
    mode: "text",
    duration: "",
    personality: "",
  });

  // Get current steps based on mode
  const currentSteps = getSteps(form.mode);
  const totalSteps = currentSteps.length;

  // Adjust step if it exceeds total steps when mode changes
  useEffect(() => {
    if (step > totalSteps) {
      setStep(totalSteps);
    }
  }, [form.mode, totalSteps, step]);

  // Get current duration options based on selected mode
  const currentDurationOptions = getDurationOptions(form.mode);

  // Reset duration and personality when mode changes
  const handleModeChange = (mode) => {
    const updates = { mode: mode, duration: "" };
    // Reset personality if switching to text mode
    if (mode === "text") {
      updates.personality = "";
    }
    setForm((f) => ({ ...f, ...updates }));
    // Adjust step if needed
    if (step > getTotalSteps(mode)) {
      setStep(getTotalSteps(mode));
    }
  };

  // Helpers
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 1) return form.jobRole.trim().length >= 2;
    if (step === 2) return !!form.experienceLevel;
    if (step === 3) return !!form.difficulty;
    if (step === 4) return !!form.mode;
    if (step === 5) return !!form.duration;
    if (step === 6 && form.mode === "voice") return !!form.personality;
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((s) => s + 1);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    // Prepare data based on mode
    const interviewData = {
      role: form.jobRole.trim(),
      experience: form.experienceLevel,
      difficulty: form.difficulty,
      duration: Number(form.duration),
      mode: form.mode,
    };

    // Only include personality for voice mode
    if (form.mode === "voice") {
      interviewData.personality = form.personality;
    }

    // Log the data being sent for debugging
    console.log("Sending interview data:", interviewData);

    try {
      // 1. Create interview
      const { data: created } = await api.post("/interviews", interviewData);
      
      console.log("Server response:", created);

      const interviewId = created.interview?._id || created._id;

      if (!interviewId) {
        throw new Error("No interview ID returned from server");
      }

      // 2. Start the interview
      await api.post(`/interviews/${interviewId}/start`);

      // 3. Show success toast
      toast.success("Interview created! Starting...");

      // 4. Navigate based on mode
      if (form.mode === "voice") {
        navigate(`/interview/${interviewId}/voice`);
      } else {
        navigate(`/interview/${interviewId}/room`);
      }
    } catch (err) {
      console.error("Create interview error:", err);
      
      // Log more details about the error
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
      } else if (err.request) {
        console.error("Error request:", err.request);
      }

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to create interview. Try again.";

      setError(errorMessage);
      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-900/8 blur-[100px]" />
      </div>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 border-b border-white/[0.06] backdrop-blur-xl bg-black/40 sticky top-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() =>
              step > 1 ? setStep((s) => s - 1) : navigate("/dashboard")
            }
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Dashboard"}
          </button>
          <span className="text-sm font-medium text-white/50">
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Step indicator pills ──────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {currentSteps.map((s) => {
            const IconComponent = s.icon;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  s.id === step
                    ? "bg-red-600/20 border-red-500/40 text-red-400"
                    : s.id < step
                    ? "bg-white/[0.06] border-white/[0.1] text-white/50"
                    : "bg-transparent border-white/[0.05] text-white/20"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form area*/}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Step 1: Role */}
        {step === 1 && (
          <StepShell
            title="What role are you interviewing for?"
            sub="Be specific — e.g. 'Senior React Developer' or 'ML Engineer (NLP)'"
          >
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={form.jobRole}
                onChange={(e) => set("jobRole", e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && canNext() && handleNext()
                }
                placeholder="e.g. Backend Engineer"
                maxLength={80}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white placeholder-white/25 text-sm focus:outline-none focus:border-red-500/50 focus:bg-white/[0.06] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/20">
                {form.jobRole.length}/80
              </span>
            </div>

            {/* Suggested roles */}
            <div className="mt-4">
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">
                Popular roles
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Frontend Developer",
                  "Backend Engineer",
                  "Full Stack Developer",
                  "DevOps Engineer",
                  "Data Scientist",
                  "Product Manager",
                  "ML Engineer",
                  "iOS Developer",
                ].map((r) => (
                  <button
                    key={r}
                    onClick={() => set("jobRole", r)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      form.jobRole === r
                        ? "bg-red-600/20 border-red-500/40 text-red-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:text-white/70 hover:border-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </StepShell>
        )}

        {/* Step 2: Experience */}
        {step === 2 && (
          <StepShell
            title="Experience level?"
            sub="This shapes question depth and the kind of feedback you'll get"
          >
            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("experienceLevel", opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                    form.experienceLevel === opt.value
                      ? "bg-red-600/15 border-red-500/50 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:border-white/15 hover:text-white/80"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{opt.sub}</p>
                  </div>
                  {form.experienceLevel === opt.value && (
                    <div className="w-5 h-5 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* Step 3: Difficulty */}
        {step === 3 && (
          <StepShell
            title="How challenging should it be?"
            sub="Sets the complexity of questions and the rigour of evaluation"
          >
            <div className="space-y-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => set("difficulty", opt.value)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                      form.difficulty === opt.value
                        ? opt.activeClass
                        : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form.difficulty === opt.value
                          ? "bg-white/10"
                          : "bg-white/[0.05]"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{opt.sub}</p>
                    </div>
                    {form.difficulty === opt.value && (
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dotClass}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </StepShell>
        )}

        {/* Step 4: Mode */}
        {step === 4 && (
          <StepShell
            title="How do you want to answer?"
            sub="Choose text to type your answers, or voice for a real spoken interview"
          >
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleModeChange("text")}
                className={`flex flex-col items-center gap-3 py-8 rounded-xl border transition-all ${
                  form.mode === "text"
                    ? "bg-red-600/15 border-red-500/50 text-white"
                    : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.05] hover:border-white/15"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    form.mode === "text" ? "bg-red-600/20" : "bg-white/[0.05]"
                  }`}
                >
                  <Keyboard className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Text</p>
                  <p className="text-xs opacity-50 mt-0.5">Type your answers</p>
                  {form.mode === "text" && (
                    <p className="text-[10px] text-red-400/60 mt-1">
                      No personality selection needed
                    </p>
                  )}
                </div>
                {form.mode === "text" && (
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                )}
              </button>

              <button
                onClick={() => handleModeChange("voice")}
                className={`flex flex-col items-center gap-3 py-8 rounded-xl border transition-all ${
                  form.mode === "voice"
                    ? "bg-red-600/15 border-red-500/50 text-white"
                    : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.05] hover:border-white/15"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    form.mode === "voice" ? "bg-red-600/20" : "bg-white/[0.05]"
                  }`}
                >
                  <Mic className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">Voice</p>
                  <p className="text-xs opacity-50 mt-0.5">Talk to the AI</p>
                  {form.mode === "voice" && (
                    <p className="text-[10px] text-red-400/60 mt-1">
                      Personality selection required
                    </p>
                  )}
                </div>
                {form.mode === "voice" && (
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                )}
              </button>
            </div>

            {form.mode === "voice" && (
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <p className="text-xs text-white/40 leading-relaxed">
                  🎙️ Voice mode uses AI to conduct a real spoken interview. The
                  AI will ask questions, listen to your answers, and adapt its
                  personality based on your selection.
                </p>
              </div>
            )}

            {form.mode === "text" && (
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <p className="text-xs text-white/40 leading-relaxed">
                  ⌨️ Text mode allows you to type your answers. The AI will
                  evaluate your responses and provide feedback.
                </p>
              </div>
            )}
          </StepShell>
        )}

        {/* Step 5: Duration */}
        {step === 5 && (
          <StepShell
            title="How long do you have?"
            sub={
              form.mode === "text"
                ? "Affects the number of questions — you can end early at any time"
                : "Set the total interview duration — AI will ask as many questions as fit naturally"
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentDurationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("duration", opt.value)}
                  className={`flex flex-col items-center justify-center py-5 rounded-xl border transition-all ${
                    form.duration === opt.value
                      ? "bg-red-600/15 border-red-500/50 text-white"
                      : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.05] hover:border-white/15 hover:text-white/70"
                  }`}
                >
                  <span className="text-xl font-bold">{opt.label}</span>
                  {opt.sub && (
                    <span className="text-xs mt-1 opacity-50">{opt.sub}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Info message for voice mode */}
            {form.mode === "voice" && (
              <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <p className="text-xs text-white/40 leading-relaxed">
                  🎤 In voice mode, the AI will adapt the number of questions
                  based on your response length and conversation flow within the
                  selected time limit.
                </p>
              </div>
            )}

            {/* Summary card */}
            {form.duration && (
              <div className="mt-6 p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md space-y-2">
                <p className="text-xs text-white/35 uppercase tracking-wider mb-3">
                  Interview summary
                </p>
                {[
                  { label: "Role", value: form.jobRole },
                  { label: "Experience", value: form.experienceLevel },
                  { label: "Difficulty", value: form.difficulty },
                  { label: "Mode", value: form.mode === "text" ? "Text" : "Voice" },
                  { 
                    label: "Duration", 
                    value: getDurationDisplay(form.duration, form.mode) 
                  },
                  ...(form.mode === "voice" && form.personality
                    ? [{ label: "Personality", value: PERSONALITY_OPTIONS.find(p => p.value === form.personality)?.label || form.personality }]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-white/35">{label}</span>
                    <span className="text-xs font-medium text-white/80 capitalize">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </StepShell>
        )}

        {/* Step 6: Personality (Only for voice mode) */}
        {step === 6 && form.mode === "voice" && (
          <StepShell
            title="Choose your interviewer style"
            sub="This changes how the AI speaks, its tone, and how it reacts to your answers"
          >
            <div className="space-y-2">
              {PERSONALITY_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => set("personality", opt.value)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      form.personality === opt.value
                        ? opt.activeClass
                        : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        form.personality === opt.value
                          ? "bg-white/10"
                          : "bg-white/[0.05]"
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{opt.sub}</p>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/30 flex-shrink-0">
                      {opt.voice}
                    </span>

                    {form.personality === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-current flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {form.personality &&
              (() => {
                const selected = PERSONALITY_OPTIONS.find(
                  (o) => o.value === form.personality
                );
                const previews = {
                  friendly: `"That's a great answer! I really liked how you explained that. Let's move on to the next question."`,
                  aggressive: `"That's not good enough. Go deeper. I need specifics, not generalities."`,
                  formal: `"I see. Please elaborate on that point. What specific methodology did you employ?"`,
                  mentor: `"Good thinking — and just to build on that, in real systems you'd also consider..."`,
                  rapid: `"Got it. Next. What's the time complexity of a binary search? Go."`,
                  tough_but_fair: `"That's partially correct. What's missing from your answer? Think carefully."`,
                };
                return (
                  <div className="mt-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.03]">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                      Preview — {selected?.label} interviewer sounds like:
                    </p>
                    <p className="text-sm text-white/60 italic leading-relaxed">
                      {previews[form.personality]}
                    </p>
                    <p className="text-[10px] text-white/25 mt-2">
                      Voice:{" "}
                      <span className="text-white/40">{selected?.voice}</span>
                    </p>
                  </div>
                );
              })()}
          </StepShell>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        {/* Next / Start button */}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={!canNext() || submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
              bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white
              disabled:opacity-30 disabled:cursor-not-allowed
              shadow-lg shadow-red-900/30
              active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Starting interview…
              </>
            ) : step < totalSteps ? (
              <>
                Continue <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Start Interview <Zap className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepShell({ title, sub, children }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white leading-snug">{title}</h1>
        <p className="text-sm text-white/40 mt-1.5">{sub}</p>
      </div>
      {children}
    </div>
  );
}