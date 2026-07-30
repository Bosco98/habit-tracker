/**
 * Day math. A DayKey is an opaque, sortable local-day identifier — it happens
 * to be "YYYY-MM-DD" because something has to anchor a day boundary, but
 * nothing above this module may take it apart. There are no weeks, no
 * weekdays and no calendar dates in this app: everything is counted in days.
 *
 * All arithmetic goes through noon-anchored Dates so a DST shift can never
 * move a result across a day boundary.
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

/** Signed whole days from `from` to `to`. */
export function daysBetween(from: DayKey, to: DayKey): number {
  return Math.round(
    (toNoonDate(to).getTime() - toNoonDate(from).getTime()) / 86_400_000,
  );
}

/** The `n` day keys ending at (and including) `end`, oldest first. */
export function lastNDays(n: number, end: DayKey): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

/**
 * How a day is named to a human — always relative, never a date.
 * "Today" · "Yesterday" · "4 days ago" · "in 3 days".
 */
export function relativeDay(day: DayKey, today: DayKey): string {
  const delta = daysBetween(today, day);
  if (delta === 0) return "Today";
  if (delta === -1) return "Yesterday";
  if (delta === 1) return "Tomorrow";
  return delta < 0 ? `${-delta} days ago` : `in ${delta} days`;
}

/** Compact form for dense strips: "0" is today, counting backwards. */
export function dayOffsetLabel(day: DayKey, today: DayKey): string {
  const delta = daysBetween(day, today);
  return delta === 0 ? "now" : `-${delta}`;
}
