export type HabitKind = "binary" | "note" | "count" | "timer";

/** The value a day's log must reach to count as done. */
export function goalFor(kind: HabitKind, target?: number): number {
  if (kind === "binary" || kind === "note") return 1;
  return target && target > 0 ? target : 1;
}

export function isDayDone(
  kind: HabitKind,
  target: number | undefined,
  value: number,
): boolean {
  return value >= goalFor(kind, target);
}

/** 0..1 progress toward the day's goal. */
export function progressFraction(
  kind: HabitKind,
  target: number | undefined,
  value: number,
): number {
  return Math.min(1, Math.max(0, value / goalFor(kind, target)));
}
