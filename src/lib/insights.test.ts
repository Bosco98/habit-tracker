import { describe, expect, it } from "vitest";
import { lastNDays } from "./days";
import {
  bestWeekday,
  completionRate,
  heatmap,
  tallyRecord,
  weekdayBreakdown,
} from "./insights";

// Mon 2026-07-20 … Sun 2026-07-26
const WEEK = lastNDays(7, "2026-07-26");

describe("completionRate", () => {
  it("is done over scheduled", () => {
    const done = new Set(["2026-07-20", "2026-07-21"]);
    expect(completionRate(WEEK, done, { type: "daily" })).toBeCloseTo(2 / 7);
  });

  it("counts only scheduled chances for weekday habits", () => {
    // Mon/Wed/Fri = 3 chances; hit Mon + Wed
    const done = new Set(["2026-07-20", "2026-07-22"]);
    expect(completionRate(WEEK, done, { type: "weekdays", days: [1, 3, 5] })).toBeCloseTo(2 / 3);
  });

  it("is 0 when nothing is scheduled", () => {
    expect(completionRate([], new Set(), { type: "daily" })).toBe(0);
  });

  it("never exceeds 1", () => {
    const done = new Set(WEEK);
    expect(completionRate(WEEK, done, { type: "timesPerWeek", perWeek: 2 })).toBe(1);
  });
});

describe("heatmap", () => {
  it("marks done days at full intensity", () => {
    const cells = heatmap(WEEK, new Set(["2026-07-20"]), new Map(), { type: "daily" });
    expect(cells[0].intensity).toBe(1);
    expect(cells[1].intensity).toBe(0);
  });

  it("shows partial progress below full", () => {
    const cells = heatmap(WEEK, new Set(), new Map([["2026-07-21", 0.5]]), { type: "daily" });
    expect(cells[1].intensity).toBe(0.5);
  });

  it("caps partials so they never look complete", () => {
    const cells = heatmap(WEEK, new Set(), new Map([["2026-07-21", 0.99]]), { type: "daily" });
    expect(cells[1].intensity).toBeLessThan(1);
  });

  it("flags unscheduled days", () => {
    const cells = heatmap(WEEK, new Set(), new Map(), { type: "weekdays", days: [1] });
    expect(cells[0].scheduled).toBe(true); // Monday
    expect(cells[1].scheduled).toBe(false); // Tuesday
  });
});

describe("weekdayBreakdown / bestWeekday", () => {
  it("counts opportunities per weekday", () => {
    const stats = weekdayBreakdown(WEEK, new Set(["2026-07-20"]), { type: "daily" });
    expect(stats[1].opportunities).toBe(1); // one Monday in the window
    expect(stats[1].done).toBe(1);
    expect(stats[1].rate).toBe(1);
  });

  it("skips unscheduled weekdays entirely", () => {
    const stats = weekdayBreakdown(WEEK, new Set(), { type: "weekdays", days: [1] });
    expect(stats[2].opportunities).toBe(0);
  });

  it("bestWeekday picks the strongest rate", () => {
    const twoWeeks = lastNDays(14, "2026-07-26");
    // Mondays: 2026-07-13 and 2026-07-20 → both done. Tuesdays: 1 of 2.
    const done = new Set(["2026-07-13", "2026-07-20", "2026-07-14"]);
    const best = bestWeekday(weekdayBreakdown(twoWeeks, done, { type: "daily" }));
    expect(best?.weekday).toBe(1);
  });

  it("bestWeekday is null with no completions", () => {
    expect(bestWeekday(weekdayBreakdown(WEEK, new Set(), { type: "daily" }))).toBeNull();
  });
});

describe("tallyRecord", () => {
  it("counts wins, losses and draws", () => {
    const record = tallyRecord(
      [
        { winnerIds: ["me"], isDraw: false, played: true },
        { winnerIds: ["you"], isDraw: false, played: true },
        { winnerIds: ["me", "you"], isDraw: true, played: true },
      ],
      "me",
    );
    expect(record).toEqual({ wins: 1, losses: 1, draws: 1 });
  });

  it("skips weeks nobody played", () => {
    const record = tallyRecord([{ winnerIds: [], isDraw: false, played: false }], "me");
    expect(record).toEqual({ wins: 0, losses: 0, draws: 0 });
  });
});
