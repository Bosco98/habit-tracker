import { dayOfWeek, type DayKey } from "./days";
import { scheduledCount } from "./duels";
import type { ScheduleSpec } from "./streaks";

export interface HeatCell {
  day: DayKey;
  /** 0..1 progress toward that day's goal. */
  intensity: number;
  scheduled: boolean;
}

export function isScheduledDay(day: DayKey, schedule: ScheduleSpec): boolean {
  if (schedule.type === "daily") return true;
  if (schedule.type === "weekdays") return schedule.days.includes(dayOfWeek(day));
  return true; // week-quota habits have no fixed days
}

export function heatmap(
  window: DayKey[],
  doneDays: ReadonlySet<DayKey>,
  partials: ReadonlyMap<DayKey, number>,
  schedule: ScheduleSpec,
): HeatCell[] {
  return window.map((day) => ({
    day,
    intensity: doneDays.has(day) ? 1 : Math.min(0.85, partials.get(day) ?? 0),
    scheduled: isScheduledDay(day, schedule),
  }));
}

/** Share of the window's scheduled chances that were taken. */
export function completionRate(
  window: DayKey[],
  doneDays: ReadonlySet<DayKey>,
  schedule: ScheduleSpec,
): number {
  const scheduled = scheduledCount(schedule, window);
  if (scheduled === 0) return 0;
  const done = window.filter((day) => doneDays.has(day)).length;
  return Math.min(1, done / scheduled);
}

export interface WeekdayStat {
  weekday: number;
  done: number;
  opportunities: number;
  rate: number;
}

/** Which day of the week you actually show up on. */
export function weekdayBreakdown(
  window: DayKey[],
  doneDays: ReadonlySet<DayKey>,
  schedule: ScheduleSpec,
): WeekdayStat[] {
  const stats: WeekdayStat[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    done: 0,
    opportunities: 0,
    rate: 0,
  }));
  for (const day of window) {
    const stat = stats[dayOfWeek(day)];
    if (!isScheduledDay(day, schedule)) continue;
    stat.opportunities++;
    if (doneDays.has(day)) stat.done++;
  }
  for (const stat of stats) {
    stat.rate = stat.opportunities === 0 ? 0 : stat.done / stat.opportunities;
  }
  return stats;
}

export function bestWeekday(stats: WeekdayStat[]): WeekdayStat | null {
  const eligible = stats.filter((stat) => stat.opportunities > 0 && stat.done > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, stat) => (stat.rate > best.rate ? stat : best));
}

/** Head-to-head tally across finished weeks. */
export interface DuelRecord {
  wins: number;
  losses: number;
  draws: number;
}

export function tallyRecord(
  weeks: { winnerIds: string[]; isDraw: boolean; played: boolean }[],
  myId: string,
): DuelRecord {
  const record: DuelRecord = { wins: 0, losses: 0, draws: 0 };
  for (const week of weeks) {
    if (!week.played) continue;
    if (week.isDraw) record.draws++;
    else if (week.winnerIds.includes(myId)) record.wins++;
    else if (week.winnerIds.length > 0) record.losses++;
  }
  return record;
}
