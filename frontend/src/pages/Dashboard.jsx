import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Loader from "../components/shared/Loader";
import ErrorMessage from "../components/shared/ErrorMessage";
import ScoreBadge from "../components/shared/ScoreBadge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import {
  Plus,
  CalendarDays,
  Briefcase,
  BarChart2,
  Clock,
  ChevronRight,
  Layers,
} from "lucide-react";
import { formatScore } from "../utils/formatScore";
import { formatDate } from "../utils/timeFormat";

// ─── Status map ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:    { label: "Pending",     variant: "secondary"  },
  ongoing:    { label: "In Progress", variant: "warning"    },
  completed:  { label: "Completed",   variant: "success"    },
  terminated: { label: "Terminated",  variant: "destructive"},
};

// ─── Difficulty colours ───────────────────────────────────────────────────────
const DIFFICULTY_COLOUR = {
  easy:   "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  medium: "bg-amber-500/15   text-amber-400   border border-amber-500/20",
  hard:   "bg-red-500/15     text-red-400     border border-red-500/20",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/interviews/my");
        setInterviews(Array.isArray(data) ? data : data.interviews ?? []);
      } catch (err) {
        setError(err.response?.data?.message ?? "Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completed = interviews.filter((i) => i.status === "completed");
  const avgScore  = completed.length
    ? Math.round(completed.reduce((sum, i) => sum + (i.overallScore ?? 0), 0) / completed.length)
    : null;

  if (loading) return <Loader />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* Ambient red glow top-left */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px]" />
      </div>

      {/* ── Sticky navbar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] backdrop-blur-xl bg-black/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="font-semibold tracking-tight text-white/90">My Interviews</span>
          </div>

          <button
            onClick={() => navigate("/interview/create")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/30"
          >
            <Plus className="w-4 h-4" />
            New Interview
          </button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <BarChart2 className="w-4 h-4 text-red-400" />,     label: "Total",       value: interviews.length,                                          glow: "shadow-red-900/20"    },
            { icon: <Clock     className="w-4 h-4 text-amber-400" />,   label: "In Progress", value: interviews.filter((i) => i.status === "ongoing").length,   glow: "shadow-amber-900/20"  },
            { icon: <Briefcase className="w-4 h-4 text-white/60" />,    label: "Completed",   value: completed.length,                                           glow: "shadow-white/5"       },
            { icon: <BarChart2 className="w-4 h-4 text-red-400" />,     label: "Avg. Score",  value: avgScore !== null ? `${avgScore}%` : "—",                   glow: "shadow-red-900/20"    },
          ].map(({ icon, label, value, glow }) => (
            <div
              key={label}
              className={`rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md p-4 flex items-center gap-3 shadow-lg ${glow}`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-white/30 font-medium">All Sessions</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-white/25">{interviews.length} total</span>
        </div>

        {/* ── Interview list ─────────────────────────────────────────────────── */}
        {interviews.length === 0 ? (
          <EmptyState onNew={() => navigate("/interview/create")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                onOpen={() => navigate(`/interview/${interview._id}/report`)}
                onResume={() => navigate(`/interview/${interview._id}/room`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interview card ───────────────────────────────────────────────────────────
function InterviewCard({ interview, onOpen, onResume }) {
  const { label: statusLabel, variant: statusVariant } =
    STATUS_MAP[interview.status] ?? { label: interview.status, variant: "secondary" };

  const diffClass =
    DIFFICULTY_COLOUR[interview.difficulty?.toLowerCase()] ??
    "bg-white/[0.06] text-white/50 border border-white/10";

  const isResumable = interview.status === "ongoing";
  const isCompleted = interview.status === "completed";

  return (
    <div className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md overflow-hidden hover:border-red-500/30 hover:bg-white/[0.05] transition-all duration-300 shadow-xl shadow-black/40">

      {/* Top red accent line on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Card header */}
      <div className="p-5 pb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1 text-white/90">
          {interview.jobRole ?? "Untitled Role"}
        </h3>
        <StatusPill label={statusLabel} variant={statusVariant} />
      </div>

      {/* Card body */}
      <div className="px-5 pb-5 space-y-3.5">

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {interview.difficulty && (
            <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${diffClass}`}>
              {interview.difficulty}
            </span>
          )}
          {interview.experienceLevel && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] capitalize">
              {interview.experienceLevel}
            </span>
          )}
          {interview.duration && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {interview.duration} min
            </span>
          )}
        </div>

        {/* Score */}
        {isCompleted && interview.overallScore != null && (
          <div className="flex items-center gap-2">
            <ScoreBadge score={interview.overallScore} />
            <span className="text-xs text-white/35">overall score</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/[0.05]" />

        {/* Date + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <CalendarDays className="w-3 h-3" />
            {formatDate(interview.createdAt)}
          </div>

          {isResumable ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 transition-colors"
            >
              Resume <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onOpen}
              disabled={!isCompleted}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-white/50 hover:text-white/80 border border-white/[0.08] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Report <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ label, variant }) {
  const colours = {
    secondary:   "bg-white/[0.06]  text-white/40  border border-white/[0.08]",
    warning:     "bg-amber-500/10  text-amber-400 border border-amber-500/20",
    success:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    destructive: "bg-red-500/10    text-red-400   border border-red-500/20",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${colours[variant] ?? colours.secondary}`}>
      {label}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-5 shadow-lg shadow-red-900/20">
        <Briefcase className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">No interviews yet</h2>
      <p className="text-sm text-white/35 mb-7 max-w-xs leading-relaxed">
        Create your first AI interview — pick a role, set the difficulty, and
        start practising in minutes.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/30"
      >
        <Plus className="w-4 h-4" />
        Create your first interview
      </button>
    </div>
  );
}