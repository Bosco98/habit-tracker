import { addDays, dayOfWeek, weekStart, type DayKey } from "./days";

export type ScheduleSpec =
  | { type: "daily" }
  | { type: "weekdays"; days: readonly number[] }
  | { type: "timesPerWeek"; perWeek: number };

export interface StreakInput {
  /** Days on which the goal was met. */
  doneDays: ReadonlySet<DayKey>;
  schedule: ScheduleSpec;
  today: DayKey;
  /** Day the habit was created — streaks never look before it. */
  createdDay: DayKey;
  /** 0 = Sunday, 1 = Monday. Only used by timesPerWeek. */
  weekStartsOn: number;
}

export interface Streak {
  count: number;
  unit: "days" | "weeks";
}

/** Safety bound: ~11 years of walking backwards. */
const MAX_STEPS = 4000;

function isScheduled(key: DayKey, schedule: ScheduleSpec): boolean {
  if (schedule.type === "daily") return true;
  if (schedule.type === "weekdays") return schedule.days.includes(dayOfWeek(key));
  return true; // timesPerWeek handled week-wise, not day-wise
}

function doneInWeek(
  start: DayKey,
  doneDays: ReadonlySet<DayKey>,
): number {
  let count = 0;
  for (let i = 0; i < 7; i++) {
    if (doneDays.has(addDays(start, i))) count++;
  }
  return count;
}

/**
 * Strict streak: one miss on a scheduled day (or an unmet week) breaks it.
 * Today (or the current week) is graced while still pending — an unmet
 * "now" doesn't break the streak until it's over.
 */
export function currentStreak(input: StreakInput): Streak {
  return input.schedule.type === "timesPerWeek"
    ? currentWeekStreak(input, input.schedule.perWeek)
    : currentDayStreak(input);
}

function currentDayStreak({
  doneDays,
  schedule,
  today,
  createdDay,
}: StreakInput): Streak {
  let count = 0;
  let day = today;
  // A still-pending today doesn't break the streak — start from yesterday.
  if (isScheduled(today, schedule) && !doneDays.has(today)) {
    day = addDays(day, -1);
  }
  for (let step = 0; step < MAX_STEPS && day >= createdDay; step++) {
    if (isScheduled(day, schedule)) {
      if (!doneDays.has(day)) break;
      count++;
    }
    day = addDays(day, -1);
  }
  return { count, unit: "days" };
}

function currentWeekStreak(
  { doneDays, today, createdDay, weekStartsOn }: StreakInput,
  perWeek: number,
): Streak {
  let count = 0;
  const currentWeek = weekStart(today, weekStartsOn);
  const firstWeek = weekStart(createdDay, weekStartsOn);
  // The in-progress week counts if already met, and is graced otherwise.
  if (doneInWeek(currentWeek, doneDays) >= perWeek) count++;
  let week = addDays(currentWeek, -7);
  for (let step = 0; step < MAX_STEPS && week >= firstWeek; step++) {
    if (doneInWeek(week, doneDays) < perWeek) break;
    count++;
    week = addDays(week, -7);
  }
  return { count, unit: "weeks" };
}

/** Longest run ever, using the same strictness rules. */
export function bestStreak(input: StreakInput): Streak {
  return input.schedule.type === "timesPerWeek"
    ? bestWeekStreak(input, input.schedule.perWeek)
    : bestDayStreak(input);
}

function bestDayStreak({
  doneDays,
  schedule,
  today,
  createdDay,
}: StreakInput): Streak {
  let best = 0;
  let run = 0;
  let day = createdDay;
  for (let step = 0; step < MAX_STEPS && day <= today; step++) {
    if (isScheduled(day, schedule)) {
      if (doneDays.has(day)) {
        run++;
        if (run > best) best = run;
      } else if (day !== today) {
        run = 0; // pending today never ends a run
      }
    }
    day = addDays(day, 1);
  }
  return { count: best, unit: "days" };
}

function bestWeekStreak(
  { doneDays, today, createdDay, weekStartsOn }: StreakInput,
  perWeek: number,
): Streak {
  let best = 0;
  let run = 0;
  const currentWeek = weekStart(today, weekStartsOn);
  let week = weekStart(createdDay, weekStartsOn);
  for (let step = 0; step < MAX_STEPS && week <= currentWeek; step++) {
    if (doneInWeek(week, doneDays) >= perWeek) {
      run++;
      if (run > best) best = run;
    } else if (week !== currentWeek) {
      run = 0; // the in-progress week never ends a run
    }
    week = addDays(week, 7);
  }
  return { count: best, unit: "weeks" };
}
