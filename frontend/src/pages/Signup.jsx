import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mic, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import api from "../api/axios";

export default function SignUp() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError("Name is required");
      toast.error("Name is required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      toast.error("Email is required");
      return;
    }
    if (!form.password.trim()) {
      setError("Password is required");
      toast.error("Password is required");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      const { data } = await api.post("/auth/signup", form);
      setAuth(data.user);
      
      // Success toast with welcome message
      toast.success(`Welcome to MockMate, ${form.name}! 🎉`, {
        id: loadingToast,
        description: "Your account has been created successfully. Ready to start practicing?",
        duration: 5000,
        icon: "🚀",
        action: {
          label: "Start Interview",
          onClick: () => navigate("/dashboard"),
        },
      });
      
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Something went wrong. Try again.";
      setError(errorMsg);
      toast.error(errorMsg, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient background blobs */}
      <div className="absolute -top-30 -left-20 w-105 h-105 rounded-full bg-red-700/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-25 -right-15 w-90 h-90 rounded-full bg-red-900/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">MockMate</span>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl border border-white/10 p-8"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-zinc-400 mt-1">Start practising interviews with AI today</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-red-500/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-red-500/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-red-500/60 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-lg shadow-red-900/30 hover:shadow-red-700/40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-600">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          By signing up you agree to our{" "}
          <span className="text-zinc-500 cursor-pointer hover:text-zinc-400">Terms</span> &{" "}
          <span className="text-zinc-500 cursor-pointer hover:text-zinc-400">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}