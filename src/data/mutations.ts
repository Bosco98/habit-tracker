import type { DayKey } from "@/lib/days";
import type { HabitKind } from "@/lib/completion";
import type { ScheduleSpec } from "@/lib/streaks";
import type { LoadedHabit, WritableAccount } from "./types";

export interface HabitInput {
  name: string;
  emoji: string;
  kind: HabitKind;
  target?: number;
  schedule: ScheduleSpec;
}

export function toScheduleInit(schedule: ScheduleSpec) {
  return {
    type: schedule.type,
    days: schedule.type === "weekdays" ? [...schedule.days] : undefined,
    perWeek: schedule.type === "timesPerWeek" ? schedule.perWeek : undefined,
  };
}

export function createHabit(account: WritableAccount, input: HabitInput): void {
  account.root.habits.$jazz.push({
    name: input.name,
    emoji: input.emoji,
    kind: input.kind,
    target: input.target,
    schedule: toScheduleInit(input.schedule),
    checkIns: [],
    createdAt: Date.now(),
  });
}

export function updateHabit(habit: LoadedHabit, input: HabitInput): void {
  habit.$jazz.set("name", input.name);
  habit.$jazz.set("emoji", input.emoji);
  habit.$jazz.set("kind", input.kind);
  habit.$jazz.set("target", input.target);
  habit.$jazz.set("schedule", toScheduleInit(input.schedule));
}

/**
 * Log (or overwrite) a day's value. Feeds are append-only, so an
 * overwrite is a new entry; reads resolve latest-per-day. `edited`
 * marks intentional after-the-fact changes (soft signal).
 */
export function logCheckIn(
  habit: LoadedHabit,
  forDay: DayKey,
  value: number,
  options?: { edited?: boolean },
): void {
  habit.checkIns.$jazz.push({
    forDay,
    loggedAt: Date.now(),
    value,
    editedAt: options?.edited ? Date.now() : undefined,
  });
}

export function archiveHabit(habit: LoadedHabit): void {
  habit.$jazz.set("archivedAt", Date.now());
}

export function deleteHabit(account: WritableAccount, habit: LoadedHabit): void {
  const index = account.root.habits.findIndex(
    (h) => h?.$jazz.id === habit.$jazz.id,
  );
  if (index >= 0) account.root.habits.$jazz.splice(index, 1);
}

export function setWeekStart(account: WritableAccount, weekStartsOn: number): void {
  account.root.settings.$jazz.set("weekStartsOn", weekStartsOn);
}

export function setDisplayName(account: WritableAccount, name: string): void {
  account.profile.$jazz.set("name", name);
}
