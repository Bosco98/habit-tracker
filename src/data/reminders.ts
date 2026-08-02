import {
  DEFAULT_REMINDER,
  pushHabitReminders,
  validReminderTime,
  type NativeHabitReminder,
  type ReminderTime,
} from "@/lib/reminder";
import type { LoadedAccount, LoadedHabitReminder } from "./types";

function latestReminder(
  account: LoadedAccount,
  habitId: string,
): LoadedHabitReminder | null {
  const reminders = account.root.reminders;
  if (!reminders?.$isLoaded) return null;

  let latest: LoadedHabitReminder | null = null;
  for (const reminder of reminders) {
    if (!reminder?.$isLoaded || reminder.habitId !== habitId) continue;
    if (!latest || reminder.updatedAt > latest.updatedAt) latest = reminder;
  }
  return latest;
}

export function habitReminder(account: LoadedAccount, habitId: string): ReminderTime {
  const reminder = latestReminder(account, habitId);
  if (!reminder) return DEFAULT_REMINDER;
  return {
    enabled: reminder.enabled,
    ...validReminderTime(reminder),
  };
}

export function setHabitReminder(
  account: LoadedAccount,
  habitId: string,
  value: ReminderTime,
): void {
  if (!account.root.reminders?.$isLoaded) {
    account.root.$jazz.set("reminders", []);
  }

  const current = latestReminder(account, habitId);
  const next = { ...value, ...validReminderTime(value), updatedAt: Date.now() };
  if (current) {
    current.$jazz.set("enabled", next.enabled);
    current.$jazz.set("hour", next.hour);
    current.$jazz.set("minute", next.minute);
    current.$jazz.set("updatedAt", next.updatedAt);
  } else {
    account.root.reminders?.$jazz.push({ habitId, ...next });
  }
  pushAccountHabitReminders(account);
}

function liveHabitNames(account: LoadedAccount): Map<string, string> {
  const habits = new Map<string, string>();
  for (const habit of account.root.habits) {
    if (habit?.$isLoaded && !habit.archivedAt) habits.set(habit.$jazz.id, habit.name);
  }
  for (const circle of account.root.circles) {
    if (!circle?.$isLoaded) continue;
    for (const habit of circle.habits) {
      if (habit?.$isLoaded && !habit.archivedAt) habits.set(habit.$jazz.id, habit.name);
    }
  }
  return habits;
}

export function nativeHabitReminders(account: LoadedAccount): NativeHabitReminder[] {
  const names = liveHabitNames(account);
  const latest = new Map<string, LoadedHabitReminder>();
  if (account.root.reminders?.$isLoaded) {
    for (const reminder of account.root.reminders) {
      if (!reminder?.$isLoaded) continue;
      const previous = latest.get(reminder.habitId);
      if (!previous || reminder.updatedAt > previous.updatedAt) {
        latest.set(reminder.habitId, reminder);
      }
    }
  }

  return [...latest.values()]
    .flatMap((reminder) => {
      const habitName = names.get(reminder.habitId);
      if (!reminder.enabled || !habitName) return [];
      const time = validReminderTime(reminder);
      return [{
        id: `${account.$jazz.id}:${reminder.habitId}`,
        habitName,
        ...time,
      }];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function habitReminderSignature(account: LoadedAccount): string {
  return JSON.stringify(nativeHabitReminders(account));
}

export function pushAccountHabitReminders(account: LoadedAccount): void {
  pushHabitReminders(nativeHabitReminders(account));
}
