import { describe, expect, it } from "vitest";
import type { Cadence } from "./cadence";
import { addDays, lastNDays, type DayKey } from "./days";
import {
  aggregateHeatmap,
  aggregateOpportunities,
  compareInsightStrength,
  completionRate,
  daysSinceLastDone,
  heatmap,
  insightStatus,
  momentum,
  opportunitySummary,
  pulseCells,
  volumeSummary,
  type InsightSeries,
} from "./insights";
import { retentionWindow } from "./retention";

const TODAY = "2026-07-28";
const day = (offset: number): DayKey => addDays(TODAY, offset);
const range = (from: number, to: number) =>
  new Set(Array.from({ length: to - from + 1 }, (_, i) => day(from + i)));

const DAILY: Cadence = { everyDays: 1 };
const CREATED = day(-29);

const series = (
  doneDays: Set<DayKey>,
  values = new Map<DayKey, number>(),
  overrides?: Partial<InsightSeries>,
): InsightSeries => ({
  createdDay: CREATED,
  cadence: DAILY,
  goal: 1,
  doneDays,
  values,
  ...overrides,
});

describe("heatmap", () => {
  it("covers exactly the retained window", () => {
    const cells = heatmap(retentionWindow(TODAY), new Set(), new Map(), CREATED, DAILY);
    expect(cells).toHaveLength(30);
    expect(cells.at(-1)?.day).toBe(TODAY);
  });

  it("marks completed days at full intensity", () => {
    const cells = heatmap(lastNDays(3, TODAY), range(-1, 0), new Map(), CREATED, DAILY);
    expect(cells.map((c) => c.intensity)).toEqual([0, 1, 1]);
  });

  it("caps partial progress below a completion", () => {
    const partials = new Map([[day(-2), 0.99]]);
    const cells = heatmap(lastNDays(3, TODAY), new Set(), partials, CREATED, DAILY);
    expect(cells[0].intensity).toBe(0.85);
  });

  it("flags which days were actually due", () => {
    const cells = heatmap(
      lastNDays(4, TODAY),
      new Set(),
      new Map(),
      day(-3),
      { everyDays: 2 },
    );
    expect(cells.map((c) => c.due)).toEqual([true, false, true, false]);
  });
});

describe("completionRate", () => {
  it("is done over due", () => {
    const window = lastNDays(10, TODAY);
    expect(completionRate(window, range(-9, -5), day(-9), DAILY)).toBeCloseTo(0.5);
  });

  it("counts only due days as chances", () => {
    const window = lastNDays(10, TODAY); // day(-9) … day(0)
    // every 3 days from day(-9) → -9, -6, -3, 0 = 4 chances
    expect(completionRate(window, range(-9, -6), day(-9), { everyDays: 3 })).toBe(1);
  });

  it("is zero when nothing was due", () => {
    expect(completionRate(lastNDays(5, TODAY), new Set(), day(10), DAILY)).toBe(0);
  });

  it("never exceeds 1", () => {
    const window = lastNDays(7, TODAY);
    expect(completionRate(window, range(-6, 0), day(-6), { everyDays: 3 })).toBe(1);
  });
});

describe("opportunity summaries", () => {
  it("does not call an unfinished Today a miss", () => {
    const window = lastNDays(3, TODAY);
    const summary = opportunitySummary(window, series(range(-2, -1)), TODAY);
    expect(summary).toMatchObject({ due: 2, completed: 2, rate: 1 });
  });

  it("includes Today as soon as its goal is complete", () => {
    const window = lastNDays(3, TODAY);
    const summary = opportunitySummary(window, series(range(-2, 0)), TODAY);
    expect(summary).toMatchObject({ due: 3, completed: 3, rate: 1 });
  });

  it("reports partial work without putting Today in the denominator", () => {
    const window = lastNDays(2, TODAY);
    const values = new Map<DayKey, number>([[TODAY, 20]]);
    const summary = opportunitySummary(
      window,
      series(new Set(), values, { goal: 60 }),
      TODAY,
    );
    expect(summary).toMatchObject({ due: 1, completed: 0, partial: 1, rate: 0 });
  });

  it("weights aggregate completion by due opportunities", () => {
    const window = lastNDays(7, TODAY);
    const daily = series(range(-6, -1));
    const weekly = series(new Set(), new Map(), {
      createdDay: day(-6),
      cadence: { everyDays: 7 },
    });
    const summary = aggregateOpportunities(window, [daily, weekly], TODAY);
    expect(summary).toMatchObject({ due: 7, completed: 6 });
    expect(summary.rate).toBeCloseTo(6 / 7);
  });
});

describe("volume summaries", () => {
  it("calculates totals and averages inside the selected range", () => {
    const window = lastNDays(3, TODAY);
    const values = new Map<DayKey, number>([
      [day(-2), 20],
      [day(-1), 40],
      [TODAY, 0],
      [day(-3), 999],
    ]);
    expect(volumeSummary(window, values, new Set([day(-1)]))).toEqual({
      total: 60,
      activeDays: 2,
      completedDays: 1,
      averagePerActiveDay: 30,
      averagePerCompletedDay: 60,
    });
  });
});

describe("aggregate heatmap", () => {
  it("uses completed due goals for intensity and preserves partial progress", () => {
    const window = lastNDays(1, TODAY);
    const cells = aggregateHeatmap(window, [
      series(new Set([TODAY]), new Map([[TODAY, 1]])),
      series(new Set(), new Map([[TODAY, 0.5]])),
    ]);
    expect(cells[0]).toMatchObject({
      due: 2,
      completed: 1,
      partial: 1,
      intensity: 0.5,
    });
  });

  it("does not create opportunities for off-cadence habits", () => {
    const cells = aggregateHeatmap(
      lastNDays(2, TODAY),
      [series(new Set(), new Map(), { createdDay: day(-1), cadence: { everyDays: 2 } })],
    );
    expect(cells.map((cell) => cell.due)).toEqual([1, 0]);
  });
});

describe("momentum", () => {
  it("is positive when the last 7 days beat the 7 before", () => {
    const result = momentum(TODAY, range(-6, 0), day(-13), DAILY);
    expect(result.recent).toBe(1);
    expect(result.previous).toBe(0);
    expect(result.delta).toBe(1);
  });

  it("is negative when you're slowing down", () => {
    const result = momentum(TODAY, range(-13, -7), day(-13), DAILY);
    expect(result.recent).toBe(0);
    expect(result.previous).toBe(1);
    expect(result.delta).toBe(-1);
  });

  it("is flat when both halves match", () => {
    const result = momentum(TODAY, range(-13, 0), day(-13), DAILY);
    expect(result.delta).toBe(0);
  });

  it("stays inside the retained window", () => {
    // 2 × 7 days is well under 30, so momentum is always answerable
    const result = momentum(TODAY, new Set(), day(-13), DAILY);
    expect(result.recent).toBe(0);
    expect(result.previous).toBe(0);
  });

  it("does not lower recent momentum for a pending Today", () => {
    const result = momentum(TODAY, range(-6, -1), day(-13), DAILY);
    expect(result.recent).toBe(1);
  });
});

describe("status and ordering", () => {
  const trend = (delta: number) => ({ recent: 0.5, previous: 0.5 - delta, delta });

  it("labels low-sample habits as gathering data", () => {
    expect(
      insightStatus(
        { due: 2, completed: 2, partial: 0, rate: 1 },
        trend(1),
        [day(-1), TODAY],
        new Set([day(-1), TODAY]),
      ),
    ).toBe("gathering");
  });

  it("recognizes building, steady, rebuilding, and mixed signals", () => {
    const due = [day(-3), day(-2), day(-1)];
    expect(
      insightStatus(
        { due: 3, completed: 2, partial: 0, rate: 2 / 3 },
        trend(0.2),
        due,
        new Set(due.slice(0, 2)),
      ),
    ).toBe("building");
    expect(
      insightStatus(
        { due: 3, completed: 3, partial: 0, rate: 1 },
        trend(0),
        due,
        new Set(due),
      ),
    ).toBe("steady");
    expect(
      insightStatus(
        { due: 3, completed: 1, partial: 0, rate: 1 / 3 },
        trend(-0.2),
        due,
        new Set([due[0]]),
      ),
    ).toBe("rebuilding");
    expect(
      insightStatus(
        { due: 4, completed: 3, partial: 0, rate: 0.75 },
        trend(0),
        [...due, TODAY],
        new Set([due[0], due[1], TODAY]),
      ),
    ).toBe("mixed");
  });

  it("sorts established strong habits before low-sample habits", () => {
    const rows = [
      { opportunities: 2, rate: 1, momentum: 1, currentStreak: 2, index: 0 },
      { opportunities: 8, rate: 0.75, momentum: 0, currentStreak: 3, index: 1 },
      { opportunities: 8, rate: 1, momentum: -0.1, currentStreak: 4, index: 2 },
    ].sort(compareInsightStrength);
    expect(rows.map((row) => row.index)).toEqual([2, 1, 0]);
  });
});

describe("daysSinceLastDone", () => {
  const window = retentionWindow(TODAY);

  it("is zero when today is done", () => {
    expect(daysSinceLastDone(window, range(-2, 0), TODAY)).toBe(0);
  });

  it("counts days back to the most recent completion", () => {
    expect(daysSinceLastDone(window, range(-9, -4), TODAY)).toBe(4);
  });

  it("is null when nothing in the window was ever done", () => {
    expect(daysSinceLastDone(window, new Set(), TODAY)).toBeNull();
  });
});

/**
 * The pulse is a row of opportunities, not a row of dates — but a missed
 * opportunity still occupies its slot. "#" done · "." missed or pending.
 */
describe("pulseCells", () => {
  const draw = (done: Set<DayKey>, createdDay: DayKey, cadence: Cadence) =>
    pulseCells(heatmap(retentionWindow(TODAY), done, new Map(), createdDay, cadence))
      .map((cell) => (cell.intensity >= 1 ? "#" : "."))
      .join("");

  it("holds a skipped day open instead of closing the gap", () => {
    const created = day(-5);
    const done = new Set([day(-5), day(-4), day(-2), day(-1)]);
    expect(draw(done, created, DAILY)).toBe("##.##.");
  });

  it("draws one mark per due day, not per calendar day", () => {
    const created = day(-9);
    const cells = pulseCells(
      heatmap(retentionWindow(TODAY), new Set([day(-9), day(-3)]), new Map(), created, {
        everyDays: 3,
      }),
    );
    expect(cells.map((cell) => cell.day)).toEqual([day(-9), day(-6), day(-3), TODAY]);
  });

  it("shows a bonus day the cadence never asked for", () => {
    const cells = pulseCells(
      heatmap(retentionWindow(TODAY), new Set([day(-5)]), new Map(), day(-6), { everyDays: 3 }),
    );
    expect(cells.map((cell) => cell.day)).toContain(day(-5));
  });

  it("draws nothing before the habit existed", () => {
    expect(draw(new Set(), day(-2), DAILY)).toBe("...");
  });
});
