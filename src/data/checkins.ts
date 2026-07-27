import { goalFor } from "@/lib/completion";
import { toDayKey, type DayKey } from "@/lib/days";
import type { LoadedHabit } from "./types";

/** The effective log for one day: the latest entry wins (feeds are append-only). */
export interface DayLog {
  value: number;
  loggedAt: number;
  editedAt?: number;
  /** Logged on a different day than it counts toward — soft signal. */
  backfilled: boolean;
  /** Timestamp of the winning entry, used for latest-wins resolution. */
  madeAt: number;
}

/** Latest-entry-per-day view of one member's check-in stream. */
export function logByDay(
  habit: LoadedHabit,
  accountId: string,
): Map<DayKey, DayLog> {
  const out = new Map<DayKey, DayLog>();
  const stream = habit.checkIns.perAccount[accountId as `co_z${string}`];
  if (!stream) return out;
  for (const entry of stream.all) {
    const checkIn = entry.value;
    if (!checkIn?.$isLoaded) continue;
    const madeAt = entry.madeAt.getTime();
    const previous = out.get(checkIn.forDay);
    if (previous && previous.madeAt >= madeAt) continue;
    out.set(checkIn.forDay, {
      value: checkIn.value,
      loggedAt: checkIn.loggedAt,
      editedAt: checkIn.editedAt,
      backfilled: toDayKey(new Date(checkIn.loggedAt)) !== checkIn.forDay,
      madeAt,
    });
  }
  return out;
}

export function valueForDay(log: Map<DayKey, DayLog>, day: DayKey): number {
  return log.get(day)?.value ?? 0;
}

/** Days on which this member met the habit's goal. */
export function doneDaySet(
  log: Map<DayKey, DayLog>,
  habit: Pick<LoadedHabit, "kind" | "target">,
): Set<DayKey> {
  const goal = goalFor(habit.kind, habit.target);
  const done = new Set<DayKey>();
  for (const [day, entry] of log) {
    if (entry.value >= goal) done.add(day);
  }
  return done;
}
