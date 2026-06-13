import {
  Briefcase,
  BarChart2,
  Clock,
  Zap,
  Flame,
  Layers,
  Star,
  Mic,
  BookOpen,
  Scale,
  GraduationCap,
  Smile,
} from "lucide-react";

export const EXPERIENCE_OPTIONS = [
  { value: "intern", label: "Intern", sub: "0–1 year" },
  { value: "junior", label: "Junior", sub: "1–3 years" },
  { value: "mid-level", label: "Mid-level", sub: "3–5 years" },
  { value: "senior", label: "Senior", sub: "5–8 years" },
  { value: "lead", label: "Lead", sub: "8+ years" },
];

// Store icon components as references 
export const DIFFICULTY_OPTIONS = [
  {
    value: "easy",
    label: "Easy",
    sub: "Conceptual, broad questions",
    icon: Star,
    activeClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    dotClass: "bg-emerald-400",
  },
  {
    value: "medium",
    label: "Medium",
    sub: "Mix of theory and application",
    icon: BarChart2,
    activeClass: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    value: "hard",
    label: "Hard",
    sub: "Deep dives, edge cases, systems",
    icon: Flame,
    activeClass: "border-red-500/50 bg-red-500/10 text-red-400",
    dotClass: "bg-red-400",
  },
];

// Base duration options 
export const BASE_DURATION_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

// Text mode duration options 
export const TEXT_DURATION_OPTIONS = [
  { value: 5, label: "5 min", sub: "~2 questions" },
  { value: 10, label: "10 min", sub: "~4 questions" },
  { value: 15, label: "15 min", sub: "~6 questions" },
  { value: 20, label: "20 min", sub: "~8 questions" },
  { value: 30, label: "30 min", sub: "~10 questions" },
  { value: 45, label: "45 min", sub: "~15 questions" },
  { value: 60, label: "60 min", sub: "~20 questions" },
];

// Voice mode duration options (just time, no question estimate)
export const VOICE_DURATION_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

// Store icon components as references
export const PERSONALITY_OPTIONS = [
  {
    value: "friendly",
    label: "Friendly",
    sub: "Warm, encouraging, celebrates good answers",
    icon: Smile,
    voice: "Rohan",
    activeClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "tough but fair",
    label: "Tough but Fair",
    sub: "High standards, respectful, honest feedback",
    icon: Scale,
    voice: "Sarah",
    activeClass: "border-sky-500/50 bg-sky-500/10 text-sky-400",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    sub: "Intimidating, pushes back hard, no reassurance",
    icon: Flame,
    voice: "Cole",
    activeClass: "border-red-500/50 bg-red-500/10 text-red-400",
  },
  {
    value: "formal",
    label: "Formal",
    sub: "Strictly professional, structured, neutral tone",
    icon: BookOpen,
    voice: "Elliot",
    activeClass: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  },
  {
    value: "mentor", 
    label: "Mentor",
    sub: "Teaches while evaluating, adds insights",
    icon: GraduationCap,
    voice: "Lily",
    activeClass: "border-purple-500/50 bg-purple-500/10 text-purple-400",
  },
  {
    value: "rapid fire", 
    label: "Rapid Fire",
    sub: "Fast pace, short answers, covers max topics",
    icon: Zap,
    voice: "Hana",
    activeClass: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  },
];

// Base steps without personality
export const BASE_STEPS = [
  { id: 1, label: "Role", icon: Briefcase },
  { id: 2, label: "Experience", icon: Layers },
  { id: 3, label: "Difficulty", icon: Zap },
  { id: 4, label: "Mode", icon: Mic },
  { id: 5, label: "Duration", icon: Clock },
];

// Full steps including personality (for voice mode)
export const FULL_STEPS = [
  { id: 1, label: "Role", icon: Briefcase },
  { id: 2, label: "Experience", icon: Layers },
  { id: 3, label: "Difficulty", icon: Zap },
  { id: 4, label: "Mode", icon: Mic },
  { id: 5, label: "Duration", icon: Clock },
  { id: 6, label: "Personality", icon: Smile },
];

// Helper function to get steps based on mode
export const getSteps = (mode) => {
  if (mode === "voice") {
    return FULL_STEPS;
  }
  return BASE_STEPS;
};

// Helper function to get total steps based on mode
export const getTotalSteps = (mode) => {
  return getSteps(mode).length;
};

// Helper function to get duration options based on mode
export const getDurationOptions = (mode) => {
  if (mode === "text") {
    return TEXT_DURATION_OPTIONS;
  }
  return VOICE_DURATION_OPTIONS;
};

// Helper function to get duration display text
export const getDurationDisplay = (duration, mode) => {
  if (mode === "text") {
    const option = TEXT_DURATION_OPTIONS.find(opt => opt.value === duration);
    return option ? `${option.label} (${option.sub})` : `${duration} min`;
  }
  return `${duration} min`;
};