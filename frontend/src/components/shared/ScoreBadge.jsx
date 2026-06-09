import { scoreColour, formatScore } from "../../utils/formatScore";

export default function ScoreBadge({ score, size = "md" }) {
  const colour = scoreColour(score);

  const sizeClasses = {
    sm: "text-xs  px-2   py-0.5",
    md: "text-sm  px-2.5 py-0.5",
    lg: "text-base px-3  py-1",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border bg-white/[0.05] backdrop-blur-sm border-white/[0.08] ${colour} ${sizeClasses[size] ?? sizeClasses.md}`}
    >
      {formatScore(score)}
    </span>
  );
}