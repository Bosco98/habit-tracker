/**
 * Retention enforcement. CoFeeds are append-only, so old entries can't be
 * deleted — instead each member folds their own aged-out days into a single
 * `Carry` summary and the read layer stops looking past the 30-day window.
 *
 * Every member compacts only their own stream, which is the only stream they
 * can write to anyway. Running it twice is a no-op.
 */
import { daysBetween, type DayKey } from "@/lib/days";
import { compactionCutoff } from "@/lib/retention";
import { compactCarry } from "@/lib/streaks";
import { doneDaySet, fullLogByDay, readCarry } from "./checkins";
import { habitCadence, habitCreatedDay } from "./stats";
import type { LoadedHabit } from "./types";

/** True when this habit has history older than the window that isn't summarised yet. */
export function needsCompaction(
  habit: LoadedHabit,
  myId: string,
  today: DayKey,
): boolean {
  const cutoff = compactionCutoff(today, habitCreatedDay(habit));
  if (cutoff === null) return false;
  const previous = readCarry(habit, myId);
  return previous === null || daysBetween(previous.throughDay, cutoff) > 0;
}

/** Fold everything older than the window into this member's carry. */
export function compactHabit(habit: LoadedHabit, myId: string, today: DayKey): boolean {
  if (!needsCompaction(habit, myId, today)) return false;

  const createdDay = habitCreatedDay(habit);
  const cutoff = compactionCutoff(today, createdDay);
  if (cutoff === null) return false;

  const log = fullLogByDay(habit, myId);
  const next = compactCarry({
    previous: readCarry(habit, myId),
    doneDays: doneDaySet(log, habit),
    cadence: habitCadence(habit),
    createdDay,
    throughDay: cutoff,
  });

  // Habits created before retention existed have no carry feed yet.
  if (!habit.carry?.$isLoaded) habit.$jazz.set("carry", []);
  habit.carry?.$jazz.push({ ...next, writtenAt: Date.now() });
  return true;
}

export function compactAll(
  habits: readonly LoadedHabit[],
  myId: string,
  today: DayKey,
): number {
  let compacted = 0;
  for (const habit of habits) {
    if (compactHabit(habit, myId, today)) compacted++;
  }
  return compacted;
}
