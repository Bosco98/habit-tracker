/**
 * Day-key math. A DayKey is a local-timezone "YYYY-MM-DD" string.
 * All arithmetic goes through noon-anchored Dates so DST shifts can
 * never move a result across a day boundary.
 */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function toDayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): DayKey {
  return toDayKey(new Date());
}

function toNoonDate(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(key: DayKey, n: number): DayKey {
  const date = toNoonDate(key);
  date.setDate(date.getDate() + n);
  return toDayKey(date);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(key: DayKey): number {
  return toNoonDate(key).getDay();
}

/** Signed whole days from `from` to `to`. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round(
    (toNoonDate(to).getTime() - toNoonDate(from).getTime()) / 86_400_000,
  );
}

/** First day of the week containing `key`. */
export function weekStart(key: DayKey, weekStartsOn: number): DayKey {
  return addDays(key, -((dayOfWeek(key) - weekStartsOn + 7) % 7));
}

/** The `n` day keys ending at (and including) `end`, oldest first. */
export function lastNDays(n: number, end: DayKey): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

/** The 7 days of the week beginning at `start`. */
export function weekDays(start: DayKey): DayKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatDay(
  key: DayKey,
  options: Intl.DateTimeFormatOptions,
): string {
  return toNoonDate(key).toLocaleDateString(undefined, options);
}
