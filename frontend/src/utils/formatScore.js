//Converts a raw score (0–100 or 0–10) to a display string.
 // Normalises to 0-100 if the value looks like it's on a 0-10 scale.
 
export function formatScore(score) {
  if (score == null) return "—";
  const normalised = score <= 10 ? score * 10 : score;
  return `${Math.round(normalised)}%`;
}

// Returns a colour class based on the score.

export function scoreColour(score) {
  const n = score <= 10 ? score * 10 : score;
  if (n >= 80) return "text-emerald-400";
  if (n >= 60) return "text-amber-400";
  return "text-red-400";
}