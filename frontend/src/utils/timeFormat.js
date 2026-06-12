//  Format an ISO date string to a readable date.
//  e.g.  "Jun 9, 2025"

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format seconds into mm:ss string.
// e.g.  90  →  "1:30"

export function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

//  Format a duration in minutes to a human label.
//  e.g.  30  →  "30 min"  |  90  →  "1 hr 30 min"

export function formatDuration(minutes) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
