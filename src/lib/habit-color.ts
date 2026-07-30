/**
 * Every habit owns a saturated colour. Neobrutalism is colour blocking — one
 * accent on a neutral field is just a neutral field, which is what the first
 * two attempts shipped.
 *
 * All six are light enough (L ≥ 0.70) to carry the near-black ink, so text contrast
 * never depends on which colour a habit landed on.
 */
export const HABIT_HUES = [
  "blue",
  "pink",
  "lime",
  "violet",
  "red",
  "cyan",
] as const;

export type HabitHue = (typeof HABIT_HUES)[number];

/**
 * Assigned by position, not by hashing the id: a hash collides, and two
 * neighbouring cards in the same colour looks like a bug rather than a scheme.
 * Position guarantees the run cycles through all six before repeating.
 */
export function habitHue(index: number): HabitHue {
  return HABIT_HUES[((index % HABIT_HUES.length) + HABIT_HUES.length) % HABIT_HUES.length];
}

export function hueVar(hue: HabitHue): string {
  return `var(--hue-${hue})`;
}

/** Convenience for callers that only have a list position. */
export function hueForIndex(index: number): string {
  return hueVar(habitHue(index));
}
