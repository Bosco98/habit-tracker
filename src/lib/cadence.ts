/**
 * Cadence replaces the old schedule. A habit is due every N days, counted
 * from the day it was created — a fixed grid that never shifts. Missing a
 * due day breaks the streak; it does not move the next one.
 */
import { addDays, daysBetween, type DayKey } from "./days";

export interface Cadence {
  /** 1 = every day, 2 = every other day, … */
  everyDays: number;
}

export const DAILY: Cadence = { everyDays: 1 };

/** Beyond the retention window a cadence can never come due, so cap it there. */
export const MAX_EVERY_DAYS = 30;

export function normalizeCadence(everyDays: number | undefined): Cadence {
  const n = Math.round(Number(everyDays));
  if (!Number.isFinite(n) || n < 1) return DAILY;
  return { everyDays: Math.min(n, MAX_EVERY_DAYS) };
}

/** Days before creation are never due; after that, every Nth day on the grid. */
export function isDueDay(day: DayKey, createdDay: DayKey, cadence: Cadence): boolean {
  const offset = daysBetween(createdDay, day);
  return offset >= 0 && offset % cadence.everyDays === 0;
}

export function dueDaysIn(
  window: readonly DayKey[],
  createdDay: DayKey,
  cadence: Cadence,
): DayKey[] {
  return window.filter((day) => isDueDay(day, createdDay, cadence));
}

/** How many chances a window offered. */
export function countDue(
  window: readonly DayKey[],
  createdDay: DayKey,
  cadence: Cadence,
): number {
  return dueDaysIn(window, createdDay, cadence).length;
}

/** The first due day at or after `from`. */
export function nextDueDay(from: DayKey, createdDay: DayKey, cadence: Cadence): DayKey {
  const offset = daysBetween(createdDay, from);
  if (offset <= 0) return createdDay;
  const remainder = offset % cadence.everyDays;
  return remainder === 0 ? from : addDays(from, cadence.everyDays - remainder);
}

/** The previous due day strictly before `from`, or null if there isn't one. */
export function previousDueDay(
  from: DayKey,
  createdDay: DayKey,
  cadence: Cadence,
): DayKey | null {
  const offset = daysBetween(createdDay, from);
  if (offset <= 0) return null;
  const back = offset % cadence.everyDays || cadence.everyDays;
  const candidate = addDays(from, -back);
  return daysBetween(createdDay, candidate) >= 0 ? candidate : null;
}

export function describeCadence(cadence: Cadence): string {
  if (cadence.everyDays === 1) return "Every day";
  if (cadence.everyDays === 2) return "Every other day";
  return `Every ${cadence.everyDays} days`;
}
