import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import {
  Briefcase,
  BarChart2,
  Clock,
  Zap,
  ChevronRight,
  ArrowLeft,
  Flame,
  Layers,
  Star,
} from "lucide-react";


const EXPERIENCE_OPTIONS = [
  { value: "intern",       label: "Intern",       sub: "0–1 year"  },
  { value: "junior",       label: "Junior",       sub: "1–3 years" },
  { value: "mid-level",    label: "Mid-level",    sub: "3–5 years" },
  { value: "senior",       label: "Senior",       sub: "5–8 years" },
  { value: "lead",         label: "Lead",         sub: "8+ years"  },
];

const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    sub: "Conceptual, broad questions",
    icon: <Star className="w-4 h-4" />,
    activeClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  {
    value: "medium",
    label: "Medium",
    sub: "Mix of theory and application",
    icon: <BarChart2 className="w-4 h-4" />,
    activeClass: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    value: "hard",
    label: "Hard",
    sub: "Deep dives, edge cases, systems",
    icon: <Flame className="w-4 h-4" />,
    activeClass: "border-red-500/50 bg-red-500/10 text-red-400",
    dotClass: "bg-red-400",
  },
];

const DURATION_OPTIONS = [
  { value: 10,  label: "10 min", sub: "~2 questions"  },
  { value: 20,  label: "20 min", sub: "~4 questions"  },
  { value: 30,  label: "30 min", sub: "~6 questions"  },
  { value: 45,  label: "45 min", sub: "~8 questions"  },
  { value: 60,  label: "60 min", sub: "~10 questions" },
];


const STEPS = [
  { id: 1, label: "Role",        icon: <Briefcase className="w-4 h-4" /> },
  { id: 2, label: "Experience",  icon: <Layers    className="w-4 h-4" /> },
  { id: 3, label: "Difficulty",  icon: <Zap       className="w-4 h-4" /> },
  { id: 4, label: "Duration",    icon: <Clock     className="w-4 h-4" /> },
];

export default function CreateInterview() {
  const navigate = useNavigate();

  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState(null);

 const [form, setForm] = useState({
  jobRole: "",
  experienceLevel: "",
  difficulty: "",
  duration: "",
});

  // Helpers 
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 1) return form.jobRole.trim().length >= 2;
    if (step === 2) return !!form.experienceLevel;
    if (step === 3) return !!form.difficulty;
    if (step === 4) return !!form.duration;
    return false;
  };

  const handleNext = () => {
    if (step < 4) { setStep((s) => s + 1); return; }
    handleSubmit();
  };

 const handleSubmit = async () => {
  setSubmitting(true);
  setError(null);

  try {
    const { data: created } = await api.post("/interviews", {
      role: form.jobRole.trim(),
      experience: form.experienceLevel,
      difficulty: form.difficulty,
      duration: Number(form.duration),
    });

    const id = created.interview._id;

    await api.post(`/interviews/${id}/start`);

    navigate(`/interview/${id}/room`);
  } catch (err) {
    console.error(err);

    setError(
      err.response?.data?.message ||
      "Failed to create interview. Try again."
    );

    setSubmitting(false);
  }
};

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

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
            onClick={() => step > 1 ? setStep((s) => s - 1) : navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Dashboard"}
          </button>
          <span className="text-sm font-medium text-white/50">
            Step {step} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${progress + 25}%` }}
          />
        </div>
      </div>

      {/* ── Step indicator pills ──────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((s) => (
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
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form area*/}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">

        {/*  1 Role */}
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
                onKeyDown={(e) => e.key === "Enter" && canNext() && handleNext()}
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
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Popular roles</p>
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

        {/* 2 Experience */}
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

        {/* 3 Difficulty*/}
        {step === 3 && (
          <StepShell
            title="How challenging should it be?"
            sub="Sets the complexity of questions and the rigour of evaluation"
          >
            <div className="space-y-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set("difficulty", opt.value)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                    form.difficulty === opt.value
                      ? opt.activeClass
                      : "bg-white/[0.03] border-white/[0.07] text-white/60 hover:bg-white/[0.05] hover:border-white/15 hover:text-white/80"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    form.difficulty === opt.value ? "bg-white/10" : "bg-white/[0.05]"
                  }`}>
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs opacity-60 mt-0.5">{opt.sub}</p>
                  </div>
                  {form.difficulty === opt.value && (
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.dotClass}`} />
                  )}
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {/* 4 Duration */}
        {step === 4 && (
          <StepShell
            title="How long do you have?"
            sub="Affects the number of questions — you can end early at any time"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((opt) => (
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
                  <span className="text-xs mt-1 opacity-50">{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Summary card */}
            {form.duration && (
              <div className="mt-6 p-4 rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md space-y-2">
                <p className="text-xs text-white/35 uppercase tracking-wider mb-3">Interview summary</p>
                {[
                  { label: "Role",        value: form.jobRole        },
                  { label: "Experience",  value: form.experienceLevel },
                  { label: "Difficulty",  value: form.difficulty      },
                  { label: "Duration",    value: `${form.duration} min`},
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-white/35">{label}</span>
                    <span className="text-xs font-medium text-white/80 capitalize">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </StepShell>
        )}

        {/*  Error*/}
        {error && (
          <p className="mt-4 text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}

        {/* Next / Start button*/}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={!canNext() || submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
              bg-rose-900/80 hover:bg-rose-800/80 text-white
              disabled:opacity-30 disabled:cursor-not-allowed
              shadow-lg shadow-red-900/30
              active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Starting interview…
              </>
            ) : step < 4 ? (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Start Interview <Zap className="w-4 h-4" /></>
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