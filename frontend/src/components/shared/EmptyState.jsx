import { useNavigate } from "react-router-dom";


export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) return onAction();
    if (actionTo) navigate(actionTo);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {/* Icon bubble */}
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <Icon className="w-7 h-7 text-red-400/80" />
        </div>
      )}

      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed mb-6">{description}</p>

      {actionLabel && (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-900/30"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}