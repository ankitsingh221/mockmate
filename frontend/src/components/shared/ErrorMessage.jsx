import { AlertTriangle } from "lucide-react";

export default function ErrorMessage({ message, onRetry, fullPage = true }) {
  const inner = (
    <div className="flex flex-col items-center gap-3 text-center max-w-sm">
      <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-900/20">
        <AlertTriangle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm text-white/50">{message ?? "Something went wrong."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/60 hover:text-white transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );

  if (!fullPage) return inner;

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>
      <div className="relative">{inner}</div>
    </div>
  );
}