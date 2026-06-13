import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Mic,
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  ChevronRight,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

// ── Process steps ───────────────────────────────────────────────
const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Set your interview",
    desc: "Choose your target role, experience level, difficulty, and how many rounds you want. Takes 30 seconds.",
  },
  {
    number: "02",
    icon: BrainCircuit,
    title: "AI generates questions",
    desc: "Our AI builds a question set tailored to your role and seniority — just like a real FAANG screener would.",
  },
  {
    number: "03",
    icon: MessageSquareText,
    title: "Answer & get feedback",
    desc: "Type your answers. After each one, the AI scores your technical depth, correctness, and communication in real time.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Review your report",
    desc: "Get a full breakdown — overall score, strengths, weak areas, and concrete suggestions to act on before your real interview.",
  },
];

// ── Feature pills ────────────────────────────────────────────────
const FEATURES = [
  { icon: Zap, label: "Instant feedback" },
  { icon: Shield, label: "FAANG-level questions" },
  { icon: Sparkles, label: "Adaptive difficulty" },
  { icon: BrainCircuit, label: "Role-specific AI" },
];

// ── Stat strip ───────────────────────────────────────────────────
const STATS = [
  { value: "50+", label: "Roles covered" },
  { value: "4", label: "Feedback dimensions" },
  { value: "∞", label: "Practice rounds" },
  { value: "100%", label: "AI-powered" },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleGetStarted = () => {
    navigate(isAuthenticated ? "/dashboard" : "/signup");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* Ambient background*/}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-50 -left-25 w-150 h-150 rounded-full bg-red-800/12 blur-[140px]" />
        <div className="absolute top-[30%] -right-37.5 w-125 h-125 rounded-full bg-red-700/10 blur-[120px]" />
        <div className="absolute -bottom-25 left-[30%] w-100 h-100 rounded-full bg-red-900/12 blur-[120px]" />
      </div>

      {/* Navbar*/}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">MockMate</span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/30"
            >
              Dashboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="text-sm font-medium text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/30"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/*  Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28">

        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-red-950/50 border border-red-800/40 text-red-300 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          AI-powered interview practice — free to start
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-4xl">
          Practice interviews that{" "}
          <span className="relative inline-block">
            <span className="text-red-500">feel real.</span>
            {/* underline accent */}
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-red-600/0 via-red-500 to-red-600/0 rounded-full" />
          </span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed">
          Mockmate puts you in front of an AI interviewer that asks the right questions for your role,
          scores every answer, and tells you exactly what to improve.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-white/4 border border-white/8 text-zinc-400 text-xs px-3 py-1.5 rounded-full"
            >
              <Icon className="w-3 h-3 text-red-400" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-10">
          <button
            onClick={handleGetStarted}
            className="group flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-7 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-red-900/40 hover:shadow-red-700/40"
          >
            Get started — it's free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {!isAuthenticated && (
            <Link
              to="/signin"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-3.5"
            >
              Already have an account? Sign in
            </Link>
          )}
        </div>
      </section>

      {/*  Stats strip*/}
      <section className="relative z-10 border-y border-white/5 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">{value}</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/*  How it works */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-16">
            <p className="text-xs font-medium text-red-400 uppercase tracking-[0.2em] mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From setup to feedback in minutes
            </h2>
            <p className="text-zinc-400 mt-3 max-w-md mx-auto text-sm leading-relaxed">
              No scheduling, no awkward silences. Just you, a question, and an honest score.
            </p>
          </div>

          {/* Steps — connected timeline on md+ */}
          <div className="relative">

            {/* Connector line for desktop only */}
            <div className="hidden md:block absolute top-9 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gradient-to-r from-red-900/0 via-red-800/40 to-red-900/0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
              {STEPS.map(({ number, icon: Icon, title, desc }) => (
                <div key={number} className="relative flex flex-col items-center text-center group">

                  {/* Step bubble */}
                  <div
                    className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-105"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <Icon className="w-7 h-7 text-red-400" />
                    {/* Step number badge */}
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {number.replace("0", "")}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-2 leading-snug">{title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/*  What you get section*/}
      <section className="relative z-10 px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-xs font-medium text-red-400 uppercase tracking-[0.2em] mb-3">
              What you get
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Every session, a full picture
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Card 1 */}
            <div
              className="rounded-2xl p-6 border border-white/8 flex flex-col gap-3 group hover:border-red-800/40 transition-colors duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">Per-answer scoring</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Technical depth, correctness, and communication scored 0–10 after every answer. No waiting until the end.
              </p>
            </div>

            {/* Card 2 — highlighted */}
            <div
              className="rounded-2xl p-6 border border-red-800/30 flex flex-col gap-3 relative overflow-hidden"
              style={{
                background: "rgba(185,28,28,0.08)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 0 48px rgba(185,28,28,0.08)",
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-red-900/50 border border-red-700/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-red-300" />
              </div>
              <h3 className="font-semibold text-white text-sm">Adaptive questions</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Questions get harder when you're doing well, easier when you're struggling. Just like a real interviewer reading the room.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="rounded-2xl p-6 border border-white/8 flex flex-col gap-3 group hover:border-red-800/40 transition-colors duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-900/40 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">Final report</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                A hiring-manager-style summary with strengths, weak spots, and specific suggestions — shareable to the marketplace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 pb-28">
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl border border-white/8 p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Glow behind card */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none rounded-3xl" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/50">
                <Mic className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                Ready to stop guessing?
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your next interview is closer than you think. Start a practice session now and know exactly where you stand.
              </p>

              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-red-900/40 hover:shadow-red-700/40"
              >
                {isAuthenticated ? "Go to dashboard" : "Start practising — free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/*  Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
              <Mic className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-zinc-500">Mockmate</span>
          </div>
          <p className="text-xs text-zinc-700">
            © {new Date().getFullYear()} Mockmate. Built to make you interview-ready.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Sign in</Link>
            <Link to="/signup" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}