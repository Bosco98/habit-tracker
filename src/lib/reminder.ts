import { invokeDesktop, isDesktop } from "./platform";

export interface Reminder {
  enabled: boolean;
  /** Local wall-clock time, 24h. */
  hour: number;
  minute: number;
}

const KEY = "habits.reminder";

export const DEFAULT_REMINDER: Reminder = { enabled: false, hour: 20, minute: 0 };

/**
 * Device-local, not account data: an alarm belongs to the machine that rings,
 * and syncing it would have your laptop go off because you set it on a phone.
 */
export function readReminder(): Reminder {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed = JSON.parse(raw) as Partial<Reminder>;
    return {
      enabled: Boolean(parsed.enabled),
      hour: clamp(parsed.hour, 0, 23, DEFAULT_REMINDER.hour),
      minute: clamp(parsed.minute, 0, 59, DEFAULT_REMINDER.minute),
    };
  } catch {
    return DEFAULT_REMINDER;
  }
}

export function writeReminder(reminder: Reminder): void {
  localStorage.setItem(KEY, JSON.stringify(reminder));
  pushReminder(reminder);
}

/**
 * Hand the schedule to the shell, which owns the clock. Both desktop windows
 * may push it: the shell treats identical schedules as a no-op, and the tray
 * popover also exposes the reminder control.
 */
export function pushReminder(reminder: Reminder): void {
  if (!isDesktop()) return;
  invokeDesktop(
    "set_reminder",
    reminder.enabled ? { hour: reminder.hour, minute: reminder.minute } : {},
  );
}

/** "20:00" ⇄ the pair, for `<input type="time">`. */
export function formatTime({ hour, minute }: Pick<Reminder, "hour" | "minute">): string {
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

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}
