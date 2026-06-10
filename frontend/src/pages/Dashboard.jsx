import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/axios";
import Loader from "../components/shared/Loader";
import ScoreBadge from "../components/shared/ScoreBadge";
import {
  Plus,
  CalendarDays,
  Briefcase,
  BarChart2,
  Clock,
  ChevronRight,
  Layers,
} from "lucide-react";
import { formatDate } from "../utils/timeFormat";

const STATUS_MAP = {
  scheduled: { label: "Scheduled", colour: "bg-white/[0.06] text-white/40 border border-white/[0.08]" },
  "in-progress": { label: "In Progress", colour: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  completed: { label: "Completed", colour: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

const DIFFICULTY_COLOUR = {
  easy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  hard: "bg-red-500/15 text-red-400 border border-red-500/20",
};

// Local storage utility
const storage = {
  getDeleted: () => {
    try {
      return JSON.parse(localStorage.getItem('deletedInterviews') || '[]');
    } catch {
      return [];
    }
  },
  addDeleted: (id) => {
    try {
      const deleted = storage.getDeleted();
      if (!deleted.includes(id)) {
        deleted.push(id);
        // Keep only last 50 to prevent unlimited growth
        if (deleted.length > 50) deleted.shift();
        localStorage.setItem('deletedInterviews', JSON.stringify(deleted));
      }
    } catch (e) {
      console.error('Failed to update deleted cache:', e);
    }
  },
  clearDeleted: () => {
    try {
      localStorage.removeItem('deletedInterviews');
    } catch (e) {
      console.error('Failed to clear deleted cache:', e);
    }
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchInterviews = useCallback(async () => {
    try {
      const { data } = await api.get("/interviews/my");
      let interviewList = Array.isArray(data) ? data : data.interviews ?? [];
      
      // Filter out locally deleted interviews
      const deletedInterviews = storage.getDeleted();
      interviewList = interviewList.filter(interview => !deletedInterviews.includes(interview._id));
      
      setInterviews(interviewList);
    } catch (err) {
      const errorMsg = err.response?.data?.message ?? "Failed to load interviews.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const handleDelete = useCallback(async (interviewId, interviewTitle, isTemplate) => {
    toast.custom((t) => {
      const isMarketplaceItem = isTemplate;
      const deleteMessage = isMarketplaceItem 
        ? "This interview will be removed from your dashboard. The original interview will remain available in the marketplace."
        : "You're about to permanently delete this interview and all associated reports, scores, and feedback. This action cannot be undone.";

      return (
        <div className="bg-[#1a1a1a] border border-red-500/20 rounded-lg p-4 shadow-xl max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">
                {isMarketplaceItem ? "Remove from dashboard?" : "Delete interview?"}
              </p>
              <p className="text-xs text-white/50 mb-2">
                Are you sure you want to {isMarketplaceItem ? "remove" : "delete"} "{interviewTitle}"?
              </p>
              <p className="text-xs text-white/30 mb-3">
                {deleteMessage}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => toast.dismiss(t)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/15 text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    toast.dismiss(t);
                    setDeletingId(interviewId);
                    
                    // Optimistic update
                    setInterviews(prev => prev.filter(i => i._id !== interviewId));
                    
                    try {
                      const response = await api.delete(`/interviews/${interviewId}`);
                      
                      // Cache the deletion
                      storage.addDeleted(interviewId);
                      
                      if (response.data?.deletedFromDB === false) {
                        toast.success("Removed from your dashboard", {
                          description: "The interview remains available in the marketplace",
                          icon: "👋",
                        });
                      } else {
                        toast.success("Interview deleted successfully");
                      }
                    } catch (err) {
                      // Rollback on error
                      await fetchInterviews();
                      toast.error(err.response?.data?.message || "Failed to delete interview");
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId === interviewId}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === interviewId ? "Processing..." : (isMarketplaceItem ? "Remove" : "Delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }, { duration: 5000 });
  }, [deletingId, fetchInterviews]);

  const completed = interviews.filter((i) => i.status === "completed");
  const inProgress = interviews.filter((i) => i.status === "in-progress");
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, i) => s + (i.overallScore ?? 0), 0) / completed.length)
    : null;

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-red-900/10 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="font-semibold tracking-tight text-white/90">My Interviews</span>
          </div>
          <button
            onClick={() => navigate("/interview/create")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-900/80 hover:bg-rose-800/80 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/30"
          >
            <Plus className="w-4 h-4" />
            New Interview
          </button>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/40 text-red-300 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <BarChart2 className="w-4 h-4 text-red-400" />, label: "Total", value: interviews.length },
            { icon: <Clock className="w-4 h-4 text-amber-400" />, label: "In Progress", value: inProgress.length },
            { icon: <Briefcase className="w-4 h-4 text-white/60" />, label: "Completed", value: completed.length },
            { icon: <BarChart2 className="w-4 h-4 text-red-400" />, label: "Avg. Score", value: avgScore !== null ? `${avgScore}%` : "—" },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md p-4 flex items-center gap-3 hover:border-red-500/30 transition-all cursor-pointer"
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

        {/* Section label */}
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-white/30 font-medium">All Sessions</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-xs text-white/25">{interviews.length} total</span>
        </div>

        {/* List */}
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
                onDelete={() => handleDelete(interview._id, interview.role || "Untitled", interview.type === "template")}
                isDeleting={deletingId === interview._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InterviewCard({ interview, onOpen, onResume, onDelete, isDeleting }) {
  const { label: statusLabel, colour: statusColour } =
    STATUS_MAP[interview.status] ?? { label: interview.status, colour: "bg-white/[0.06] text-white/40 border border-white/[0.08]" };

  const diffClass =
    DIFFICULTY_COLOUR[interview.difficulty?.toLowerCase()] ??
    "bg-white/[0.06] text-white/50 border border-white/10";

  const isResumable = interview.status === "in-progress";
  const isCompleted = interview.status === "completed";
  const isMarketplaceTemplate = interview.type === "template";

  const handleShare = async () => {
    try {
      if (interview.isPublic) {
        toast.info("Already in marketplace");
        return;
      }
      
      await api.post(`/interviews/${interview._id}/publish`);
      toast.success("Shared to marketplace!", {
        icon: "🌍",
        description: "Your interview is now available to the community",
      });
    } catch (err) {
      toast.error("Failed to share", {
        description: err.response?.data?.message || "Please try again",
      });
    }
  };

  return (
    <div className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md overflow-hidden hover:border-red-500/30 hover:bg-white/[0.05] transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 pb-3 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1 text-white/90">
          {interview.role ?? "Untitled Role"}
        </h3>
        <div className="flex items-center gap-1.5">
          {!isResumable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isMarketplaceTemplate ? "Remove from dashboard" : "Delete interview"}
            >
              {isDeleting ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColour}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3.5">
        <div className="flex flex-wrap gap-1.5 text-xs">
          {interview.difficulty && (
            <span className={`px-2 py-0.5 rounded-full font-medium capitalize ${diffClass}`}>
              {interview.difficulty}
            </span>
          )}
          {interview.experience && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] capitalize">
              {interview.experience}
            </span>
          )}
          {interview.duration && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {interview.duration} min
            </span>
          )}
        </div>

        {isCompleted && interview.overallScore != null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScoreBadge score={interview.overallScore} />
              <span className="text-xs text-white/35">overall score</span>
            </div>
          </div>
        )}

        <div className="h-px bg-white/[0.05]" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <CalendarDays className="w-3 h-3" />
            {formatDate(interview.createdAt)}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && !isMarketplaceTemplate && (
              <button
                onClick={handleShare}
                className="text-white/40 hover:text-emerald-400 transition-colors"
                title="Share to marketplace"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            
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
                {isCompleted ? "Report" : "View"} <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-5">
        <Briefcase className="w-7 h-7 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">No interviews yet</h2>
      <p className="text-sm text-white/35 mb-7 max-w-xs leading-relaxed">
        Create your first AI interview — pick a role, set the difficulty, and start practising in minutes.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-900/80 hover:bg-rose-800/80 text-whitetext-sm font-medium transition-colors shadow-lg shadow-red-900/30"
      >
        <Plus className="w-4 h-4" />
        Create your first interview
      </button>
    </div>
  );
}