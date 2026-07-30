/**
 * A fixed set rather than a full unicode picker: this is a habit tracker, and
 * the long tail of emoji is noise. A free-text box also let people paste
 * multi-codepoint strings that broke the card layout.
 */
export const HABIT_EMOJI = [
  "🌱", "🏃", "🧠", "💪", "📚", "🧘",
  "💧", "🥗", "😴", "🪥", "🎸", "✍️",
  "🧹", "💸", "☎️", "🚭", "🧊", "🎯",
] as const;

/** Circles are people, not activities — a different shelf of icons. */
export const CIRCLE_EMOJI = [
  "🤝", "🏡", "👯", "🐝", "🚀", "🌊",
  "🔥", "🌍", "🎪", "🧩", "⛰️", "🛟",
  "🍀", "🪐", "🎈", "🐙", "🧭", "🫂",
] as const;
