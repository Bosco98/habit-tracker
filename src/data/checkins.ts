import { goalFor } from "@/lib/completion";
import { toDayKey, type DayKey } from "@/lib/days";
import { isRetained, type Carry } from "@/lib/retention";
import type { LoadedHabit } from "./types";

/** The effective log for one day: the latest entry wins (feeds are append-only). */
export interface DayLog {
  value: number;
  note?: string;
  loggedAt: number;
  editedAt?: number;
  /** Logged on a different day than it counts toward — soft signal. */
  backfilled: boolean;
  /** Timestamp of the winning entry, used for latest-wins resolution. */
  madeAt: number;
}

type AccountKey = `co_z${string}`;

/**
 * Every day this member ever logged. Only compaction reads this — the UI
 * goes through `retainedLog`, so aged-out days can't leak into a view.
 */
export function fullLogByDay(
  habit: LoadedHabit,
  accountId: string,
): Map<DayKey, DayLog> {
  const out = new Map<DayKey, DayLog>();
  const stream = habit.checkIns.perAccount[accountId as AccountKey];
  if (!stream) return out;
  for (const entry of stream.all) {
    const checkIn = entry.value;
    if (!checkIn?.$isLoaded) continue;
    const madeAt = entry.madeAt.getTime();
    const previous = out.get(checkIn.forDay);
    if (previous && previous.madeAt >= madeAt) continue;
    out.set(checkIn.forDay, {
      value: checkIn.value,
      note: checkIn.note,
      loggedAt: checkIn.loggedAt,
      editedAt: checkIn.editedAt,
      backfilled: toDayKey(new Date(checkIn.loggedAt)) !== checkIn.forDay,
      madeAt,
    });
  }
  return out;
}

/** The 30-day view — the only log the app is allowed to show. */
export function retainedLog(
  habit: LoadedHabit,
  accountId: string,
  today: DayKey,
): Map<DayKey, DayLog> {
  const out = new Map<DayKey, DayLog>();
  for (const [day, entry] of fullLogByDay(habit, accountId)) {
    if (isRetained(day, today)) out.set(day, entry);
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

/** This member's latest retention summary, or null if they've never compacted. */
export function readCarry(habit: LoadedHabit, accountId: string): Carry | null {
  const feed = habit.carry;
  if (!feed?.$isLoaded) return null;
  const stream = feed.perAccount[accountId as AccountKey];
  if (!stream) return null;

  let latest: Carry | null = null;
  let latestAt = -Infinity;
  for (const entry of stream.all) {
    const carry = entry.value;
    if (!carry?.$isLoaded) continue;
    const at = carry.writtenAt;
    if (at <= latestAt) continue;
    latestAt = at;
    latest = {
      throughDay: carry.throughDay,
      streak: carry.streak,
      best: carry.best,
      totalDone: carry.totalDone,
    };
  }
  return latest;
}
