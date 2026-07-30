/**
 * Insights over the retained window only — 30 days, counted in days.
 * There is no weekday breakdown any more: with an "every N days" cadence,
 * which weekday a due day lands on carries no meaning.
 */
import { countDue, dueDaysIn, isDueDay, type Cadence } from "./cadence";
import { daysBetween, lastNDays, type DayKey } from "./days";

export type InsightRange = 7 | 14 | 30;
export type InsightFilter = "all" | "personal" | "shared";

export interface InsightSeries {
  createdDay: DayKey;
  cadence: Cadence;
  goal: number;
  doneDays: ReadonlySet<DayKey>;
  values: ReadonlyMap<DayKey, number>;
}

export interface OpportunitySummary {
  /** Due opportunities that are complete, or old enough to be judged. */
  due: number;
  completed: number;
  /** Due opportunities with progress below the goal, including Today. */
  partial: number;
  rate: number;
}

export interface VolumeSummary {
  total: number;
  activeDays: number;
  completedDays: number;
  averagePerActiveDay: number;
  averagePerCompletedDay: number;
}

export interface AggregateHeatCell {
  day: DayKey;
  due: number;
  completed: number;
  partial: number;
  /** Completed due goals / all due goals for this day. */
  intensity: number;
}

export type InsightStatus = "gathering" | "building" | "steady" | "rebuilding" | "mixed";

export interface InsightStrength {
  opportunities: number;
  rate: number;
  momentum: number;
  currentStreak: number;
  index: number;
}

export interface HeatCell {
  day: DayKey;
  /** 0..1 progress toward that day's goal. */
  intensity: number;
  due: boolean;
  /** False for days before the habit was created — there is no history there. */
  exists: boolean;
}

export function heatmap(
  window: readonly DayKey[],
  doneDays: ReadonlySet<DayKey>,
  partials: ReadonlyMap<DayKey, number>,
  createdDay: DayKey,
  cadence: Cadence,
): HeatCell[] {
  return window.map((day) => ({
    day,
    intensity: doneDays.has(day) ? 1 : Math.min(0.85, partials.get(day) ?? 0),
    due: isDueDay(day, createdDay, cadence),
    exists: daysBetween(createdDay, day) >= 0,
  }));
}

/**
 * The cells worth drawing: the days the habit actually asked for, plus any
 * bonus day that was logged anyway.
 *
 * Drawing all 30 calendar days made an "every 7 days" habit render 30 slots to
 * carry 4 data points — 26 of them blank filler that read as a dotted rule. A
 * pulse should be one mark per opportunity.
 */
export function pulseCells(cells: readonly HeatCell[]): HeatCell[] {
  return cells.filter((cell) => (cell.due && cell.exists) || cell.intensity > 0);
}

/** Share of the window's due days that were taken. */
export function completionRate(
  window: readonly DayKey[],
  doneDays: ReadonlySet<DayKey>,
  createdDay: DayKey,
  cadence: Cadence,
): number {
  const due = countDue(window, createdDay, cadence);
  if (due === 0) return 0;
  const done = window.filter((day) => doneDays.has(day)).length;
  return Math.min(1, done / due);
}

/**
 * A due goal is only eligible to lower the rate after its day has passed.
 * Today joins the denominator immediately when completed, but pending and
 * partial work remains in progress instead of being called a miss.
 */
export function opportunitySummary(
  window: readonly DayKey[],
  series: InsightSeries,
  today: DayKey,
): OpportunitySummary {
  const dueDays = dueDaysIn(window, series.createdDay, series.cadence);
  const eligible = dueDays.filter((day) => day !== today || series.doneDays.has(day));
  const completed = eligible.filter((day) => series.doneDays.has(day)).length;
  const partial = dueDays.filter((day) => {
    const value = series.values.get(day) ?? 0;
    return value > 0 && value < series.goal;
  }).length;

  return {
    due: eligible.length,
    completed,
    partial,
    rate: eligible.length === 0 ? 0 : completed / eligible.length,
  };
}

/** One honest rate across many habits: completed chances / due chances. */
export function aggregateOpportunities(
  window: readonly DayKey[],
  series: readonly InsightSeries[],
  today: DayKey,
): OpportunitySummary {
  const summaries = series.map((item) => opportunitySummary(window, item, today));
  const due = summaries.reduce((sum, item) => sum + item.due, 0);
  const completed = summaries.reduce((sum, item) => sum + item.completed, 0);
  return {
    due,
    completed,
    partial: summaries.reduce((sum, item) => sum + item.partial, 0),
    rate: due === 0 ? 0 : completed / due,
  };
}

export function volumeSummary(
  window: readonly DayKey[],
  values: ReadonlyMap<DayKey, number>,
  doneDays: ReadonlySet<DayKey>,
): VolumeSummary {
  const inWindow = window.map((day) => values.get(day) ?? 0);
  const total = inWindow.reduce((sum, value) => sum + Math.max(0, value), 0);
  const activeDays = inWindow.filter((value) => value > 0).length;
  const completedDays = window.filter((day) => doneDays.has(day)).length;
  return {
    total,
    activeDays,
    completedDays,
    averagePerActiveDay: activeDays === 0 ? 0 : total / activeDays,
    averagePerCompletedDay: completedDays === 0 ? 0 : total / completedDays,
  };
}

export function aggregateHeatmap(
  window: readonly DayKey[],
  series: readonly InsightSeries[],
): AggregateHeatCell[] {
  return window.map((day) => {
    const dueSeries = series.filter((item) =>
      isDueDay(day, item.createdDay, item.cadence),
    );
    const completed = dueSeries.filter((item) => item.doneDays.has(day)).length;
    const partial = dueSeries.filter((item) => {
      const value = item.values.get(day) ?? 0;
      return value > 0 && value < item.goal;
    }).length;
    return {
      day,
      due: dueSeries.length,
      completed,
      partial,
      intensity: dueSeries.length === 0 ? 0 : completed / dueSeries.length,
    };
  });
}

export function insightStatus(
  summary: OpportunitySummary,
  trend: Momentum,
  recentDueDays: readonly DayKey[],
  doneDays: ReadonlySet<DayKey>,
): InsightStatus {
  if (summary.due < 3) return "gathering";
  if (trend.delta >= 0.1) return "building";
  if (summary.rate >= 0.8 && trend.delta > -0.1) return "steady";
  const lastTwoMissed =
    recentDueDays.length >= 2 &&
    recentDueDays.slice(-2).every((day) => !doneDays.has(day));
  if (summary.rate < 0.6 || lastTwoMissed) return "rebuilding";
  return "mixed";
}

/** Strongest first; low-sample habits wait below established ones. */
export function compareInsightStrength(a: InsightStrength, b: InsightStrength): number {
  const aGathering = a.opportunities < 3;
  const bGathering = b.opportunities < 3;
  if (aGathering !== bGathering) return aGathering ? 1 : -1;
  return (
    b.rate - a.rate ||
    b.momentum - a.momentum ||
    b.currentStreak - a.currentStreak ||
    a.index - b.index
  );
}

export interface Momentum {
  recent: number;
  previous: number;
  /** recent − previous, in completion points. */
  delta: number;
}

/**
 * Are you speeding up or slowing down? Compares the last 7 days against the
 * 7 before them — both inside retention, so this is always answerable.
 */
export function momentum(
  today: DayKey,
  doneDays: ReadonlySet<DayKey>,
  createdDay: DayKey,
  cadence: Cadence,
  span = 7,
): Momentum {
  const all = lastNDays(span * 2, today);
  const previousWindow = all.slice(0, span);
  const recentWindow = all.slice(span);
  const recentDue = dueDaysIn(recentWindow, createdDay, cadence).filter(
    (day) => day !== today || doneDays.has(day),
  );
  const recentDone = recentDue.filter((day) => doneDays.has(day)).length;
  const recent = recentDue.length === 0 ? 0 : recentDone / recentDue.length;
  const previous = completionRate(previousWindow, doneDays, createdDay, cadence);
  return { recent, previous, delta: recent - previous };
}

/** Days since the last completion, or null if there has never been one. */
export function daysSinceLastDone(
  window: readonly DayKey[],
  doneDays: ReadonlySet<DayKey>,
  today: DayKey,
): number | null {
  let latest: DayKey | null = null;
  for (const day of window) {
    if (doneDays.has(day)) latest = day;
  }
  return latest === null ? null : daysBetween(latest, today);
}
