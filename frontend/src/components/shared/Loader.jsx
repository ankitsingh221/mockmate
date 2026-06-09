export default function Loader({ message = "Loading…" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] text-white/40 gap-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[120px]" />
      </div>
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 animate-spin text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
      <p className="text-sm text-white/30">{message}</p>
    </div>
  );
}