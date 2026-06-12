// src/pages/interview/VoiceInterviewRoom.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import api from "../../api/axios";
import { useVapi } from "../../hooks/useVapi";
import VoiceOrb from "../../components/voice/VoiceOrb";
import VoiceTranscript from "../../components/voice/VoiceTranscript";
import { VoiceControls } from "../../components/voice/VoiceControls";
import { EndCallModal } from "../../components/voice/EndCallModal";

export default function VoiceInterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    status,
    isSpeaking,
    isMuted,
    transcript,
    error,
    startCall,
    endCall,
    toggleMute,
  } = useVapi();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [endModal, setEndModal] = useState(false);
  const [callStarted, setCallStarted] = useState(false);

  const transcriptRef = useRef([]);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Load interview
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/interviews/${id}`);
        const iv = data.data?.interview ?? data.interview ?? data.data ?? data;
        if (iv.status === "completed") {
          navigate(`/interview/${id}/report`, { replace: true });
          return;
        }
        setInterview(iv);
      } catch {
        toast.error("Failed to load interview.");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (status === "ended" && callStarted) handleCallEnded(); //eslint-disable-line
  }, [status, callStarted]); // eslint-disable-line

  const handleStartCall = () => {
    if (!interview) return;
    setCallStarted(true);
    startCall({
      role: interview.role ?? "Software Engineer",
      experience: interview.experience ?? "mid-level",
      difficulty: interview.difficulty ?? "medium",
      maxRounds: interview.maxRounds ?? 5,
      personality: interview.personality ?? "friendly",
    });
    toast.success("Connecting to your AI interviewer…", { duration: 2000 });
  };

  const handleEndCall = () => {
    setEndModal(false);
    endCall();
  };

  const handleCallEnded = async () => {
    if (saving) return;
    setSaving(true);
    toast.loading("Generating your report…", { id: "report-toast" });
    try {
      const current = transcriptRef.current;
      const conversationText = current
        .filter((t) => !t.partial)
        .map(
          (t) =>
            `${t.role === "assistant" ? "Interviewer" : "Candidate"}: ${t.text}`,
        )
        .join("\n\n");

      await api.post(`/interviews/${id}/end`, {
        voiceTranscript: current
          .filter((t) => !t.partial)
          .map((t) => ({ role: t.role, text: t.text })),
        conversationText,
        endedBy: "voice",
      });
      toast.success("Report ready!", { id: "report-toast" });
    } catch (e) {
      console.error(e);
      toast.info("Redirecting to report…", { id: "report-toast" });
    } finally {
      setTimeout(() => navigate(`/interview/${id}/report`), 1000);
    }
  };

  const isActive = status === "active";
  const isConnecting = status === "connecting";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#080808] text-white flex flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/8 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-900/6 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex-shrink-0 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                isActive || isConnecting
                  ? setEndModal(true)
                  : navigate("/dashboard")
              }
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-white/80">
                {interview?.role ?? "Interview"}
              </p>
              <p className="text-xs text-white/30 capitalize">
                {interview?.difficulty} • {interview?.experience}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
              isConnecting
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : isActive
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-white/5 border-white/10 text-white/30"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnecting ? "bg-amber-400 animate-pulse" : isActive ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`}
            />
            {isConnecting
              ? "Connecting…"
              : isActive
                ? "Live"
                : saving
                  ? "Saving…"
                  : "Ready"}
          </div>

          {(isActive || isConnecting) && (
            <button
              onClick={() => setEndModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 transition-all"
            >
              End Interview
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.05]">
          <VoiceTranscript transcript={transcript} status={status} />
        </div>

        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col items-center justify-between py-8 px-6">
          <div className="flex-1 flex items-center justify-center">
            <VoiceOrb
              status={status}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
            />
          </div>
          <VoiceControls
            status={status}
            isMuted={isMuted}
            saving={saving}
            onStart={handleStartCall}
            onEnd={() => setEndModal(true)}
            onMute={toggleMute}
          />
        </div>
      </div>

      <EndCallModal
        open={endModal}
        onClose={() => setEndModal(false)}
        onConfirm={handleEndCall}
      />
    </div>
  );
}
