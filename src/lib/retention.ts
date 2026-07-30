/**
 * The app keeps 30 days of raw history and nothing more.
 *
 * Jazz CoFeeds are append-only — there is no delete — so retention is
 * enforced on the read side: every derivation reads only the retained
 * window, and anything older is folded once into a small per-account
 * `Carry` summary and then never read again. Without the carry, a 60-day
 * streak would silently render as 30 the moment its early days aged out.
 */
import { addDays, daysBetween, lastNDays, type DayKey } from "./days";

export const RETENTION_DAYS = 30;

/** Oldest day still readable — `today` included in the count. */
export function retentionStart(today: DayKey): DayKey {
  return addDays(today, -(RETENTION_DAYS - 1));
}

/** The retained days, oldest first. */
export function retentionWindow(today: DayKey): DayKey[] {
  return lastNDays(RETENTION_DAYS, today);
}

export function isRetained(day: DayKey, today: DayKey): boolean {
  return daysBetween(retentionStart(today), day) >= 0 && daysBetween(day, today) >= 0;
}

/**
 * Everything through this day (inclusive) has aged out and belongs in the
 * carry. Null when the habit is younger than the window, i.e. nothing to fold.
 */
export function compactionCutoff(today: DayKey, createdDay: DayKey): DayKey | null {
  const cutoff = addDays(retentionStart(today), -1);
  return daysBetween(createdDay, cutoff) >= 0 ? cutoff : null;
}

/**
 * The frozen summary of every day at or before `throughDay`. One per account
 * per habit — members can only ever compact their own stream.
 */
export interface Carry {
  /** Everything up to and including this day is summarised here. */
  throughDay: DayKey;
  /** Length of the run of due days ending exactly at `throughDay` (0 if broken). */
  streak: number;
  /** Longest run seen at any point up to `throughDay`. */
  best: number;
  /** Total due days completed up to `throughDay`. */
  totalDone: number;
}

/** True when `carry` ends on the day immediately before the retained window. */
export function carryIsContiguous(carry: Carry | null, today: DayKey): carry is Carry {
  if (!carry) return false;
  return daysBetween(carry.throughDay, retentionStart(today)) === 1;
}
