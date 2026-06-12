import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../api/axios";
import { useVapi } from "../../hooks/useVapi";
import VoiceOrb from "../../components/voice/VoiceOrb";
import VoiceTranscript from "../../components/voice/VoiceTranscript";
import {
  Mic, MicOff, PhoneOff, Phone,
  ArrowLeft, Loader2,
} from "lucide-react";

export default function VoiceInterviewRoom() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const {
    status, isSpeaking, isMuted,
    transcript, error,
    startCall, endCall, toggleMute,
  } = useVapi();

  const [interview,    setInterview]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [endModal,     setEndModal]     = useState(false);
  const [callStarted,  setCallStarted]  = useState(false);

  // Keep transcript in ref so handleCallEnded always has latest value
  const transcriptRef = useRef([]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

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

  // API errors
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // When call ends (naturally or manually) → save + report 
  useEffect(() => {
    if (status === "ended" && callStarted) {
      handleCallEnded();
    }
  }, [status, callStarted]);

  // Start call
  const handleStartCall = () => {
    if (!interview) return;
    setCallStarted(true);
    startCall({
      role:       interview.role        ?? "Software Engineer",
      experience: interview.experience  ?? "mid-level",
      difficulty: interview.difficulty  ?? "medium",
      maxRounds:  interview.maxRounds   ?? 5,
      personality: interview.personality ?? "friendly",
    });
    toast.success("Connecting to your AI interviewer…", { duration: 2000 });
  };

  // End call manually
  const handleEndCall = () => {
    setEndModal(false);
    endCall();
  };

  // Save transcript + generate report
  const handleCallEnded = async () => {
    if (saving) return;
    setSaving(true);

    const currentTranscript = transcriptRef.current;

    toast.loading("Generating your report…", { id: "report-toast" });

    try {
      // Build a conversation string for the AI to evaluate
      const conversationText = currentTranscript
        .filter((t) => !t.partial)
        .map((t) => `${t.role === "assistant" ? "Interviewer" : "Candidate"}: ${t.text}`)
        .join("\n\n");

      // Send to backend
      await api.post(`/interviews/${id}/end`, {
        voiceTranscript: currentTranscript
          .filter((t) => !t.partial)
          .map((t) => ({ role: t.role, text: t.text })),
        conversationText,
        endedBy: "voice",
      });

      toast.success("Report ready!", { id: "report-toast" });
    } catch (e) {
      toast.info("Redirecting to report…", { id: "report-toast" });
      console.log(e)
    } finally {
      setTimeout(() => navigate(`/interview/${id}/report`), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const isActive     = status === "active";
  const isConnecting = status === "connecting";
  const isEnded      = status === "ended" || status === "ending";
  const isBusy       = isEnded || saving;

  return (
    <div className="h-screen bg-[#080808] text-white flex flex-col overflow-hidden">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/8 blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-red-900/6 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 flex-shrink-0 border-b border-white/[0.06] backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isActive || isConnecting) ? setEndModal(true) : navigate("/dashboard")}
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

          {/* Status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            isConnecting ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : isActive   ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : isBusy     ? "bg-white/5 border-white/10 text-white/30"
            : "bg-white/5 border-white/10 text-white/30"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnecting ? "bg-amber-400 animate-pulse"
              : isActive   ? "bg-emerald-400 animate-pulse"
              : "bg-white/20"
            }`} />
            {isConnecting ? "Connecting…" : isActive ? "Live" : isBusy ? "Saving…" : "Ready"}
          </div>

          {/* End call button */}
          {(isActive || isConnecting) && (
            <button
              onClick={() => setEndModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" /> End Interview
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* LEFT — Transcript with real-time streaming */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.05]">
          <VoiceTranscript transcript={transcript} status={status} />
        </div>

        {/* RIGHT — Orb + controls */}
        <div className="w-80 xl:w-96 flex-shrink-0 flex flex-col items-center justify-between py-8 px-6">
          <div className="flex-1 flex items-center justify-center">
            <VoiceOrb status={status} isSpeaking={isSpeaking} isMuted={isMuted} />
          </div>

          <div className="w-full space-y-3">
            {/* Not started */}
            {status === "idle" && !saving && (
              <button
                onClick={handleStartCall}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-red-900/40 active:scale-[0.98] text-base"
              >
                <Phone className="w-5 h-5" /> Start Voice Interview
              </button>
            )}

            {/* Connecting */}
            {isConnecting && (
              <div className="w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center gap-2.5 text-white/40 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" /> Connecting…
              </div>
            )}

            {/* Active — mute + end */}
            {isActive && (
              <div className="flex gap-3">
                <button
                  onClick={toggleMute}
                  className={`flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border transition-all ${
                    isMuted
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      : "bg-white/[0.05] border-white/[0.09] text-white/60 hover:bg-white/[0.09]"
                  }`}
                >
                  {isMuted ? <><MicOff className="w-4 h-4" /> Unmute</> : <><Mic className="w-4 h-4" /> Mute</>}
                </button>
                <button
                  onClick={() => setEndModal(true)}
                  className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 transition-all"
                >
                  <PhoneOff className="w-4 h-4" /> End Call
                </button>
              </div>
            )}

            {/* Saving / generating report */}
            {(isBusy || saving) && (
              <div className="w-full py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center gap-2 text-white/30 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating your report…
              </div>
            )}

            {/* Hint */}
            {isActive && (
              <p className="text-[11px] text-white/20 text-center leading-relaxed">
                🎙️ Speak naturally — your words appear in real-time within the message bubble
              </p>
            )}

            {/* Browser support warning */}
            {status === "idle" && !saving && (
              <p className="text-[11px] text-white/20 text-center leading-relaxed">
                ⚠️ Voice interviews require <span className="text-white/40">Google Chrome</span> for best results.
                Other browsers may have limited microphone support.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* End call modal */}
      {endModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEndModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#111]/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <PhoneOff className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-base font-semibold mb-1">End interview?</h2>
            <p className="text-sm text-white/40 mb-2 leading-relaxed">
              The call will end and your report will be generated from the conversation so far.
            </p>
            <p className="text-xs text-emerald-400/70 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              ✓ You'll get a full report even if you didn't finish all questions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEndModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.09] text-sm text-white/50 hover:text-white hover:border-white/20 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={handleEndCall}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                End & get report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}