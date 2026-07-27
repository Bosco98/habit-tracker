import { describe, expect, it } from "vitest";
import { bestStreak, currentStreak, type StreakInput } from "./streaks";

// 2026-07-27 is a Monday.
const TODAY = "2026-07-27";

function input(partial: Partial<StreakInput>): StreakInput {
  return {
    doneDays: new Set(),
    schedule: { type: "daily" },
    today: TODAY,
    createdDay: "2026-07-01",
    weekStartsOn: 1,
    ...partial,
  };
}

describe("currentStreak · daily", () => {
  it("is 0 with no check-ins", () => {
    expect(currentStreak(input({}))).toEqual({ count: 0, unit: "days" });
  });

  it("counts consecutive days ending today", () => {
    const doneDays = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    expect(currentStreak(input({ doneDays })).count).toBe(3);
  });

  it("graces a pending today", () => {
    const doneDays = new Set(["2026-07-25", "2026-07-26"]);
    expect(currentStreak(input({ doneDays })).count).toBe(2);
  });

  it("is strict: a missed yesterday kills it even if today is done", () => {
    const doneDays = new Set(["2026-07-24", "2026-07-25", "2026-07-27"]);
    expect(currentStreak(input({ doneDays })).count).toBe(1);
  });

  it("never looks before createdDay", () => {
    const doneDays = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    expect(
      currentStreak(input({ doneDays, createdDay: "2026-07-26" })).count,
    ).toBe(2);
  });
});

describe("currentStreak · weekdays schedule", () => {
  // Mon/Wed/Fri = [1, 3, 5]
  const schedule = { type: "weekdays", days: [1, 3, 5] } as const;

  it("skips unscheduled days without breaking", () => {
    // Wed 22, Fri 24 done; Sat/Sun unscheduled; Mon 27 pending → 2
    const doneDays = new Set(["2026-07-22", "2026-07-24"]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(2);
  });

  it("breaks on a missed scheduled day", () => {
    // Fri 24 missed
    const doneDays = new Set(["2026-07-22", "2026-07-27"]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(1);
  });

  it("ignores bonus check-ins on unscheduled days", () => {
    // Sat 25 done but unscheduled; Fri 24 missed → only Mon 27 counts
    const doneDays = new Set(["2026-07-25", "2026-07-27"]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(1);
  });
});

describe("currentStreak · timesPerWeek", () => {
  const schedule = { type: "timesPerWeek", perWeek: 3 } as const;

  it("counts in weeks", () => {
    expect(currentStreak(input({ schedule })).unit).toBe("weeks");
  });

  it("graces the in-progress week", () => {
    // Last week (Jul 20–26) met with 3; this week 0 so far → 1
    const doneDays = new Set(["2026-07-20", "2026-07-22", "2026-07-24"]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(1);
  });

  it("counts the current week once met", () => {
    const doneDays = new Set([
      "2026-07-20", "2026-07-22", "2026-07-24", // last week: 3
      "2026-07-27", // this week... only 1 — but today is Monday, week met? no
    ]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(1);
    const met = new Set([...doneDays, "2026-07-25"]); // still last week
    expect(currentStreak(input({ doneDays: met, schedule })).count).toBe(1);
  });

  it("breaks on an unmet finished week", () => {
    // Two weeks ago met, last week only 2 → streak resets to 0 (this week pending)
    const doneDays = new Set([
      "2026-07-13", "2026-07-14", "2026-07-15", // week of Jul 13: 3 ✓
      "2026-07-20", "2026-07-21", // week of Jul 20: 2 ✗
    ]);
    expect(currentStreak(input({ doneDays, schedule })).count).toBe(0);
  });
});

describe("bestStreak", () => {
  it("finds a past run longer than the current one", () => {
    const doneDays = new Set([
      "2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08", // best: 4
      "2026-07-26", "2026-07-27", // current: 2
    ]);
    expect(bestStreak(input({ doneDays })).count).toBe(4);
  });

  it("a pending today does not end the current run", () => {
    const doneDays = new Set(["2026-07-25", "2026-07-26"]);
    expect(bestStreak(input({ doneDays })).count).toBe(2);
  });

  it("weeks unit for timesPerWeek", () => {
    const schedule = { type: "timesPerWeek", perWeek: 2 } as const;
    const doneDays = new Set([
      "2026-07-06", "2026-07-08", // week 1 ✓
      "2026-07-13", "2026-07-16", // week 2 ✓
      // week of Jul 20: 1 only ✗
      "2026-07-21",
    ]);
    const best = bestStreak(input({ doneDays, schedule }));
    expect(best).toEqual({ count: 2, unit: "weeks" });
  });
});
