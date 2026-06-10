import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import Loader from "../../components/shared/Loader";
import {
  ArrowLeft,
  Globe,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  FileText,
  Calendar,
  Clock,
  Layers,
  Award,
  Copy,
} from "lucide-react";
import { formatDate } from "../../utils/timeFormat";

// Score helpers
function scoreLabel(s) {
  if (s >= 85) return "Excellent";
  if (s >= 70) return "Good";
  if (s >= 50) return "Average";
  return "Needs work";
}

function scoreAccent(s) {
  if (s >= 85) return { text: "text-emerald-400", ring: "#10b981", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (s >= 70) return { text: "text-sky-400",     ring: "#38bdf8", bg: "bg-sky-500/10     border-sky-500/20"     };
  if (s >= 50) return { text: "text-amber-400",   ring: "#f59e0b", bg: "bg-amber-500/10   border-amber-500/20"   };
  return              { text: "text-red-400",      ring: "#ef4444", bg: "bg-red-500/10     border-red-500/20"     };
}

// Normalise raw interview from backend 
function normalise(raw) {
  if (!raw) return null;

  const score = raw.overallScore ?? 0;

  const questions = (raw.transcript ?? []).map((t, i) => ({
    id:           t._id ?? i,
    text:         t.question          ?? "",
    answer:       t.answer            ?? "",
    score:        t.evaluation?.overallScore ?? null,
    feedback:     t.evaluation?.feedback     ?? "",
    technicalScore:     t.evaluation?.technicalScore     ?? null,
    communicationScore: t.evaluation?.communicationScore ?? null,
    correctnessScore:   t.evaluation?.correctnessScore   ?? null,
  }));

  return {
    id:           raw._id,
    role:         raw.role       ?? "Interview",
    experience:   raw.experience ?? "",
    difficulty:   raw.difficulty ?? "",
    duration:     raw.duration   ?? null,
    status:       raw.status     ?? "completed",
    createdAt:    raw.createdAt  ?? null,
    overallScore: score,
    summary:      raw.summary    ?? "",
    strengths:    Array.isArray(raw.strengths)   ? raw.strengths   : [],
    weaknesses:   Array.isArray(raw.weaknesses)  ? raw.weaknesses  : [],
    suggestions:  Array.isArray(raw.suggestions) ? raw.suggestions : [],
    isPublic:     raw.isPublic   ?? false,
    questions,
  };
}

export default function InterviewReport() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [interview,  setInterview]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [published,  setPublished]  = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pubError,   setPubError]   = useState(null);

  const [animScore, setAnimScore] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        const norm = normalise(data.interview);

        if (!norm) throw new Error("Report not found");

        setInterview(norm);
        setPublished(norm.isPublic);

        // Animate score ring
        let current = 0;
        const target = norm.overallScore;
        const step   = Math.max(target / 60, 0.5);
        animRef.current = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(animRef.current);
          }
          setAnimScore(Math.round(current));
        }, 16);
      } catch (err) {
        const errorMsg = err.response?.data?.message ?? "Could not load report.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
    return () => clearInterval(animRef.current);
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    setPubError(null);
    
    const publishToast = toast.loading("Sharing to marketplace...");

    try {
      await api.post(`/interviews/${id}/publish`);
      setPublished(true);
      
      toast.success("Interview published to marketplace!", {
        id: publishToast,
        duration: 3000,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message ?? "Could not publish.";
      setPubError(errorMsg);
      toast.error(errorMsg, {
        id: publishToast,
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyAnswer = (answer) => {
    if (answer) {
      navigator.clipboard.writeText(answer);
      toast.success("Copied!", { duration: 1000 });
    }
  };

  if (loading) return <Loader message="Building your report…" />;
  
  if (error || !interview) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white/40">{error ?? "Report not found."}</p>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-sm text-red-400 underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const accent = scoreAccent(interview.overallScore);
  const label  = scoreLabel(interview.overallScore);

  const R    = 54;
  const circ = 2 * Math.PI * R;
  const dash = circ * (animScore / 100);

  const hasInsights =
    interview.strengths.length > 0 ||
    interview.weaknesses.length > 0 ||
    interview.suggestions.length > 0;

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full bg-red-600/8 blur-[150px]" />
        <div className="absolute bottom-0 right-0   w-[500px] h-[500px] rounded-full bg-red-900/6 blur-[120px]" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>

          <div className="flex items-center gap-2">
            {interview.status !== "completed" && (
              <span className="text-xs text-amber-400/70 border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 rounded-full">
                Partial Report
              </span>
            )}
            
            {!published ? (
              <button
                onClick={handlePublish}
                disabled={publishing || interview.status !== "completed"}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] text-white/50 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Globe className="w-3.5 h-3.5" />
                {publishing ? "Publishing…" : "Share to Marketplace"}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Published
              </div>
            )}
          </div>
        </div>
        {pubError && (
          <p className="text-center text-xs text-red-400 pb-2">{pubError}</p>
        )}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Hero: score + meta */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">

            {/* Score ring */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r={R} fill="none" stroke="white" strokeOpacity="0.05" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r={R}
                    fill="none"
                    stroke={accent.ring}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ filter: `drop-shadow(0 0 8px ${accent.ring}60)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold tabular-nums ${accent.text}`}>{animScore}</span>
                  <span className="text-xs text-white/30 mt-0.5">/ 100</span>
                </div>
              </div>
              <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${accent.bg} ${accent.text}`}>
                {label}
              </div>
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Interview Report</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4 truncate">
                {interview.role}
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-5">
                {interview.experience && (
                  <Chip icon={<Layers   className="w-3 h-3" />} label={interview.experience} />
                )}
                {interview.difficulty && (
                  <Chip icon={<Award    className="w-3 h-3" />} label={interview.difficulty} />
                )}
                {interview.duration && (
                  <Chip icon={<Clock    className="w-3 h-3" />} label={`${interview.duration} min`} />
                )}
                {interview.createdAt && (
                  <Chip icon={<Calendar className="w-3 h-3" />} label={formatDate(interview.createdAt)} />
                )}
                {interview.questions.length > 0 && (
                  <Chip icon={<FileText className="w-3 h-3" />} label={`${interview.questions.length} questions`} />
                )}
              </div>

              {interview.summary ? (
                <p className="text-sm text-white/55 leading-relaxed max-w-xl">{interview.summary}</p>
              ) : interview.status !== "completed" ? (
                <p className="text-sm text-amber-400/60 leading-relaxed">
                  Complete the interview to get your full AI summary and insights.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/*  Strengths / Weaknesses / Suggestions */}
        {hasInsights ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {interview.strengths.length > 0 && (
              <InsightCard
                icon={<TrendingUp className="w-4 h-4" />}
                label="Strengths"
                items={interview.strengths}
                iconClass="text-emerald-400"
                borderClass="border-emerald-500/15"
                bgClass="bg-emerald-500/5"
                dotClass="bg-emerald-400"
              />
            )}
            {interview.weaknesses.length > 0 && (
              <InsightCard
                icon={<TrendingDown className="w-4 h-4" />}
                label="Needs work"
                items={interview.weaknesses}
                iconClass="text-red-400"
                borderClass="border-red-500/15"
                bgClass="bg-red-500/5"
                dotClass="bg-red-400"
              />
            )}
            {interview.suggestions.length > 0 && (
              <InsightCard
                icon={<Lightbulb className="w-4 h-4" />}
                label="Suggestions"
                items={interview.suggestions}
                iconClass="text-amber-400"
                borderClass="border-amber-500/15"
                bgClass="bg-amber-500/5"
                dotClass="bg-amber-400"
              />
            )}
          </div>
        ) : interview.status === "completed" ? (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 text-center">
            <p className="text-sm text-white/30">
              AI insights not available for this session.
            </p>
          </div>
        ) : null}

        {/* Per-question transcript breakdown  */}
        {interview.questions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-white/30 font-medium">
                Question breakdown
              </span>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-xs text-white/20">{interview.questions.length} answered</span>
            </div>

            {interview.questions.map((q, idx) => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                index={idx} 
                onCopyAnswer={handleCopyAnswer}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 py-3 rounded-xl border border-white/[0.08] text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            Back to dashboard
          </button>
          <button
            onClick={() => navigate("/interview/create")}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-900/30"
          >
            Start another interview
          </button>
        </div>
      </div>
    </div>
  );
}

// Insight card
function InsightCard({ icon, label, items, iconClass, borderClass, bgClass, dotClass }) {
  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} backdrop-blur-sm p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${iconClass}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-xs text-white/55 leading-relaxed">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Per-question accordition
function QuestionCard({ question, index, onCopyAnswer }) {
  const [open, setOpen] = useState(false);

  const qScore  = question.score;
  const qAccent = qScore !== null ? scoreAccent(qScore * 10) : null;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm overflow-hidden">

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs text-white/20 font-mono mt-0.5 w-5 flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className={`flex-1 text-sm text-white/75 leading-snug ${!open && "line-clamp-2"}`}>
          {question.text}
        </p>
        {qScore !== null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${qAccent.bg} ${qAccent.text}`}>
            {qScore}/10
          </span>
        )}
        <span className="text-white/20 flex-shrink-0 mt-0.5">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-white/[0.05]">

          {question.answer && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-white/25">Your answer</p>
                <button
                  onClick={() => onCopyAnswer(question.answer)}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap bg-white/[0.02] rounded-lg px-3 py-2.5 border border-white/[0.05]">
                {question.answer}
              </p>
            </div>
          )}

          {question.feedback && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Feedback</p>
              <p className="text-sm text-white/60 leading-relaxed">{question.feedback}</p>
            </div>
          )}

          {/* Score breakdown bars */}
          {[
            { label: "Technical",     value: question.technicalScore },
            { label: "Communication", value: question.communicationScore },
            { label: "Correctness",   value: question.correctnessScore },
          ].filter(s => s.value != null).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Score breakdown</p>
              {[
                { label: "Technical",     value: question.technicalScore },
                { label: "Communication", value: question.communicationScore },
                { label: "Correctness",   value: question.correctnessScore },
              ].filter(s => s.value != null).map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-24">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500/70 transition-all duration-700"
                      style={{ width: `${(value / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-6 text-right">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function Chip({ icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/45 capitalize">
      {icon}{label}
    </span>
  );
}