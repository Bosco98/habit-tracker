import { dayOfWeek, type DayKey } from "./days";
import type { ScheduleSpec } from "./streaks";

export interface MemberWindowInput {
  accountId: string;
  doneDays: ReadonlySet<DayKey>;
  /** Raw logged values, for the quantity tiebreak. */
  values: ReadonlyMap<DayKey, number>;
}

export interface DuelScore {
  accountId: string;
  scheduled: number;
  done: number;
  /** done / scheduled, clamped to 0..1. */
  completion: number;
  /** Sum of logged values in the window — the tiebreak. */
  volume: number;
}

export interface DuelResult {
  ranked: DuelScore[];
  /** Empty when nobody logged anything; more than one on a draw. */
  winnerIds: string[];
  isDraw: boolean;
}

/** How many chances the window offered, per the schedule. */
export function scheduledCount(schedule: ScheduleSpec, window: DayKey[]): number {
  if (schedule.type === "daily") return window.length;
  if (schedule.type === "weekdays") {
    return window.filter((day) => schedule.days.includes(dayOfWeek(day))).length;
  }
  return Math.min(schedule.perWeek, window.length);
}

export function scoreWindow(
  member: MemberWindowInput,
  schedule: ScheduleSpec,
  window: DayKey[],
): DuelScore {
  const scheduled = scheduledCount(schedule, window);
  let done = 0;
  let volume = 0;
  for (const day of window) {
    if (member.doneDays.has(day)) done++;
    volume += member.values.get(day) ?? 0;
  }
  // Bonus days beyond the quota shouldn't push completion above 1.
  const completion = scheduled === 0 ? 0 : Math.min(1, done / scheduled);
  return { accountId: member.accountId, scheduled, done, completion, volume };
}

/**
 * Rank a week. Completion first, logged volume as tiebreak.
 * A week nobody engaged with has no winner — we don't crown inactivity.
 */
export function runDuel(
  members: MemberWindowInput[],
  schedule: ScheduleSpec,
  window: DayKey[],
): DuelResult {
  const ranked = members
    .map((member) => scoreWindow(member, schedule, window))
    .sort((a, b) => b.completion - a.completion || b.volume - a.volume);

  const top = ranked[0];
  if (!top || (top.done === 0 && top.volume === 0)) {
    return { ranked, winnerIds: [], isDraw: false };
  }
  const winners = ranked.filter(
    (score) => score.completion === top.completion && score.volume === top.volume,
  );
  return {
    ranked,
    winnerIds: winners.map((score) => score.accountId),
    isDraw: winners.length > 1 && winners.length === ranked.length,
  };
}

/** Everyone who isn't a winner loses — that's who owes the forfeit. */
export function loserIds(result: DuelResult): string[] {
  if (result.winnerIds.length === 0 || result.isDraw) return [];
  return result.ranked
    .map((score) => score.accountId)
    .filter((id) => !result.winnerIds.includes(id));
}
