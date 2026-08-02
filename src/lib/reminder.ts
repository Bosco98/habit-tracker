import { invokeDesktop, isDesktop } from "./platform";

export interface ReminderTime {
  enabled: boolean;
  /** Local wall-clock time, 24h. */
  hour: number;
  minute: number;
}

export interface NativeHabitReminder {
  id: string;
  habitName: string;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER: ReminderTime = {
  enabled: false,
  hour: 20,
  minute: 0,
};

/** The browser may edit synced preferences, but only the desktop owns a clock. */
export function pushHabitReminders(reminders: readonly NativeHabitReminder[]): void {
  if (!isDesktop()) return;
  invokeDesktop("set_habit_reminders", { reminders });
}

/** "20:00" ⇄ the pair, for `<input type="time">`. */
export function formatTime({ hour, minute }: Pick<ReminderTime, "hour" | "minute">): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function validReminderTime(
  value: Partial<Pick<ReminderTime, "hour" | "minute">>,
): Pick<ReminderTime, "hour" | "minute"> {
  return {
    hour: clamp(value.hour, 0, 23, DEFAULT_REMINDER.hour),
    minute: clamp(value.minute, 0, 59, DEFAULT_REMINDER.minute),
  };
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}
