import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../api/axios";
import Loader from "../components/shared/Loader";
import {
  Search,
  Layers,
  Clock,
  Award,
  User,
  Play,
  Globe,
  Filter,
  X,
  Zap,
  Star,
  Flame,
  Mic,
  Keyboard,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { formatDate, formatDuration } from "../utils/timeFormat";

const DIFFICULTIES = ["all", "easy", "medium", "hard"];
const EXPERIENCES = ["all", "intern", "junior", "mid-level", "senior", "lead"];

const DIFF_STYLE = {
  easy: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <Star className="w-3 h-3" />,
  },
  medium: {
    text: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: <Zap className="w-3 h-3" />,
  },
  hard: {
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: <Flame className="w-3 h-3" />,
  },
};

export default function Marketplace() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taking, setTaking] = useState(null);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [experience, setExperience] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Mode selection modal state
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const hasShownToast = useRef(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const { data } = await api.get("/interviews/public/list");
        const interviewList = Array.isArray(data)
          ? data
          : (data.interviews ?? []);
        setInterviews(interviewList);

        if (!hasShownToast.current) {
          hasShownToast.current = true;

          toast.success(`📚 ${interviewList.length} interviews loaded`, {
            description:
              "Find the perfect interview practice for your next role",
          });
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ?? "Failed to load marketplace.";
        setError(errorMsg);
        toast.error("Failed to load marketplace", {
          description: errorMsg,
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  // Handle take with mode selection
  const handleTakeClick = (interview) => {
    setSelectedInterview(interview);
    setShowModeModal(true);
  };

  // Handle mode selection and navigation
  const handleModeSelect = async (mode) => {
    if (!selectedInterview) return;
    
    setShowModeModal(false);
    
    const roleName = selectedInterview.role || selectedInterview.jobRole || selectedInterview.title || "Interview";
    
    setTaking(selectedInterview._id);

    try {
      // Clone the interview
      const { data: cloned } = await api.post(
        `/interviews/${selectedInterview._id}/take`
      );
      const newId = cloned._id ?? cloned.interview?._id;

      if (!newId) {
        throw new Error("Failed to create interview clone");
      }

      // Start the interview
      await api.post(`/interviews/${newId}/start`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success(`"${roleName}" interview ready! 🚀`);
      
      // Navigate based on selected mode
      if (mode === "voice") {
        navigate(`/interview/${newId}/voice`);
      } else {
        navigate(`/interview/${newId}/room`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to start interview");
      setTaking(null);
    }
  };

  const filtered = interviews.filter((iv) => {
    const q = search.toLowerCase().trim();

    const roleToSearch = iv.role || iv.jobRole || iv.title || "";
    const levelToSearch = iv.experienceLevel || iv.experience || iv.level || "";

    const matchSearch =
      !q ||
      roleToSearch.toLowerCase().includes(q) ||
      levelToSearch.toLowerCase().includes(q);

    const interviewDifficulty = iv.difficulty?.toLowerCase() || "";
    const matchDiff =
      difficulty === "all" || interviewDifficulty === difficulty;

    const interviewExperience = (
      iv.experienceLevel ||
      iv.experience ||
      ""
    ).toLowerCase();
    const matchExp = experience === "all" || interviewExperience === experience;

    return matchSearch && matchDiff && matchExp;
  });

  const activeFilters =
    (difficulty !== "all" ? 1 : 0) +
    (experience !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  const clearFilters = () => {
    setDifficulty("all");
    setExperience("all");
    setSearch("");

    toast.success("Filters cleared", {
      icon: "✨",
      description: `Showing all ${interviews.length} interviews`,
      duration: 2000,
    });
  };

  useEffect(() => {
    if (
      !loading &&
      interviews.length > 0 &&
      filtered.length === 0 &&
      (search || difficulty !== "all" || experience !== "all")
    ) {
      toast.info("No matching interviews found", {
        description: "Try adjusting your search or filters",
        duration: 4000,
        icon: "🔍",
        action: {
          label: "Clear filters",
          onClick: clearFilters,
        },
      });
    }
  }, [
    filtered.length,
    loading,
    interviews.length,
    search,
    difficulty,
    experience,
  ]);

  if (loading) return <Loader message="Loading marketplace…" />;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-red-600/8 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-900/6 blur-[120px]" />
      </div>

      <div className="sticky top-0 z-20 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="font-semibold text-sm text-white/90">
              Marketplace
            </span>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs text-white/30 hover:text-white/70 transition-colors"
          >
            My interviews →
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1 pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Community interviews
          </h1>
          <p className="text-sm text-white/35">
            Practice with real interview sets shared by the community — clone
            any one and start instantly.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role or level…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500/40 focus:bg-white/[0.06] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
              activeFilters > 0
                ? "bg-red-600/15 border-red-500/40 text-red-400"
                : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/20"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Difficulty
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        if (d !== "all") {
                          toast.success(`Filtering by ${d} difficulty`, {
                            icon: "🎯",
                            duration: 1500,
                          });
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
                        difficulty === d
                          ? "bg-red-600/20 border-red-500/40 text-red-400"
                          : "bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70"
                      }`}
                    >
                      {d === "all" ? "Any" : d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Experience
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCES.map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        setExperience(e);
                        if (e !== "all") {
                          toast.success(`${e} level selected`, {
                            icon: "💼",
                            duration: 1500,
                          });
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all ${
                        experience === e
                          ? "bg-red-600/20 border-red-500/40 text-red-400"
                          : "bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70"
                      }`}
                    >
                      {e === "all" ? "Any" : e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/25">
            <span className="text-white/50 font-medium">{filtered.length}</span>
            {filtered.length !== interviews.length && (
              <span>of {interviews.length}</span>
            )}
            <span>interviews available</span>
          </div>

          {interviews.length === 0 && (
            <button
              onClick={() => navigate("/interview/create")}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 transition-all"
            >
              Create first interview →
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            hasFilters={!!search || activeFilters > 0}
            onClear={clearFilters}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((iv) => (
              <MarketplaceCard
                key={iv._id}
                interview={iv}
                taking={taking === iv._id}
                onTake={() => handleTakeClick(iv)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mode Selection Modal */}
      {showModeModal && (
        <ModeSelectionModal
          interview={selectedInterview}
          onClose={() => setShowModeModal(false)}
          onSelectMode={handleModeSelect}
        />
      )}
    </div>
  );
}

// Mode Selection Modal Component
function ModeSelectionModal({ interview, onClose, onSelectMode }) {
  const displayRole = interview?.role || interview?.jobRole || interview?.title || "Interview";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.09] bg-[#111]/95 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">
            Choose interview mode
          </h2>
          <p className="text-sm text-white/40">
            {displayRole} • {interview?.difficulty || "Medium"} • {interview?.duration || "15"} min
          </p>
        </div>

        {/* Mode options */}
        <div className="space-y-3 mb-6">
          {/* Text Mode */}
          <button
            onClick={() => onSelectMode("text")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-red-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/[0.05] group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <Keyboard className="w-5 h-5 text-white/60 group-hover:text-red-400 transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-white/90 group-hover:text-white">Text Mode</p>
              <p className="text-xs text-white/40 mt-0.5">Type your answers to AI questions</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
          </button>

          {/* Voice Mode */}
          <button
            onClick={() => onSelectMode("voice")}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-red-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/[0.05] group-hover:bg-red-600/20 flex items-center justify-center transition-colors">
              <Mic className="w-5 h-5 text-white/60 group-hover:text-red-400 transition-colors" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-white/90 group-hover:text-white">Voice Mode</p>
              <p className="text-xs text-white/40 mt-0.5">Speak naturally with AI interviewer</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
          </button>
        </div>

        {/* Info note */}
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-white/30 text-center leading-relaxed">
            💡 Voice mode requires microphone access. Text mode works in any browser.
            You can switch modes during the interview setup.
          </p>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MarketplaceCard({ interview, taking, onTake }) {
  const diff = DIFF_STYLE[interview.difficulty?.toLowerCase()] ?? null;

  const displayRole =
    interview.role || interview.jobRole || interview.title || "Untitled Role";
  const displayExperience =
    interview.experienceLevel || interview.experience || interview.level || "";

  return (
    <div className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md overflow-hidden hover:border-red-500/30 hover:bg-white/[0.05] transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base text-white/90 leading-snug line-clamp-2 flex-1">
            {displayRole}
          </h3>
          {diff && (
            <span
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize flex-shrink-0 ${diff.bg} ${diff.text}`}
            >
              {diff.icon}
              {interview.difficulty}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayExperience && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-white/45 capitalize">
              <Layers className="w-2.5 h-2.5" />
              {displayExperience}
            </span>
          )}
          {interview.duration && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-white/45">
              <Clock className="w-2.5 h-2.5" />
              {formatDuration(interview.duration)}
            </span>
          )}
          {interview.questions?.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-white/45">
              <Award className="w-2.5 h-2.5" />
              {interview.questions.length} Q
            </span>
          )}
        </div>

        <div className="h-px bg-white/[0.05]" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-white/30">
            <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-2.5 h-2.5" />
            </div>
            <span className="truncate max-w-[100px]">
              {interview.createdBy?.name ??
                interview.createdBy?.username ??
                "Community"}
            </span>
          </div>
          <span className="text-[11px] text-white/20">
            {formatDate(interview.createdAt)}
          </span>
        </div>

        <button
          onClick={onTake}
          disabled={taking}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-900/80 hover:bg-rose-800/80 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {taking ? (
            <>
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
              Starting…
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Take this interview
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-4">
        <Globe className="w-6 h-6 text-red-400" />
      </div>
      <h2 className="text-base font-semibold text-white mb-1">
        {hasFilters ? "No matches found" : "Marketplace is empty"}
      </h2>
      <p className="text-sm text-white/35 mb-5 max-w-xs">
        {hasFilters
          ? "Try adjusting your search or filters to find more interviews."
          : "Be the first to share an interview with the community! Create your first interview and help others practice."}
      </p>
      {hasFilters ? (
        <button
          onClick={onClear}
          className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" /> Clear filters
        </button>
      ) : (
        <button
          onClick={() => (window.location.href = "/interview/create")}
          className="px-4 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800/80 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
        >
          Create your first interview →
        </button>
      )}
    </div>
  );
}