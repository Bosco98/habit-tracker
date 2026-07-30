import { describe, expect, it } from "vitest";
import type { Cadence } from "./cadence";
import { addDays, type DayKey } from "./days";
import { retentionStart, type Carry } from "./retention";
import {
  bestStreak,
  compactCarry,
  currentStreak,
  totalDone,
  type StreakInput,
} from "./streaks";

const TODAY = "2026-07-28";
const day = (offset: number): DayKey => addDays(TODAY, offset);
const days = (...offsets: number[]) => new Set(offsets.map(day));

/** Every day from offset `from` to offset `to`, inclusive. */
const range = (from: number, to: number) =>
  new Set(Array.from({ length: to - from + 1 }, (_, i) => day(from + i)));

const DAILY: Cadence = { everyDays: 1 };

function input(over: Partial<StreakInput> = {}): StreakInput {
  return {
    doneDays: new Set(),
    cadence: DAILY,
    today: TODAY,
    createdDay: day(-9),
    carry: null,
    ...over,
  };
}

describe("currentStreak — daily", () => {
  it("counts an unbroken run ending today", () => {
    expect(currentStreak(input({ doneDays: range(-4, 0), createdDay: day(-4) }))).toBe(5);
  });

  it("is zero with nothing logged", () => {
    expect(currentStreak(input())).toBe(0);
  });

  it("breaks on a missed day", () => {
    expect(currentStreak(input({ doneDays: days(-5, -4, -2, -1, 0) }))).toBe(3);
  });

  it("graces a still-pending today", () => {
    expect(currentStreak(input({ doneDays: range(-5, -1) }))).toBe(5);
  });

  it("ends at zero when yesterday was missed and today is still pending", () => {
    expect(currentStreak(input({ doneDays: range(-5, -2) }))).toBe(0);
  });

  it("never looks before the habit existed", () => {
    expect(currentStreak(input({ doneDays: range(-20, 0), createdDay: day(-3) }))).toBe(4);
  });
});

describe("currentStreak — every N days", () => {
  const every3: Cadence = { everyDays: 3 };

  it("counts only due days and ignores the gaps between them", () => {
    const state = input({
      cadence: every3,
      createdDay: day(-9),
      doneDays: days(-9, -6, -3, 0),
    });
    expect(currentStreak(state)).toBe(4);
  });

  it("is unaffected by logging on days that were never due", () => {
    const state = input({
      cadence: every3,
      createdDay: day(-9),
      doneDays: days(-9, -8, -7, -6, -5, -3, -2, 0),
    });
    expect(currentStreak(state)).toBe(4);
  });

  it("breaks when a due day is skipped, even if its neighbours were logged", () => {
    const state = input({
      cadence: every3,
      createdDay: day(-9),
      doneDays: days(-9, -5, -4, -3, 0), // due day -6 missed
    });
    expect(currentStreak(state)).toBe(2);
  });

  it("graces a due today and counts back from the previous due day", () => {
    const state = input({
      cadence: every3,
      createdDay: day(-9),
      doneDays: days(-9, -6, -3),
    });
    expect(currentStreak(state)).toBe(3);
  });

  it("counts back from the last due day when today is not due", () => {
    // created at -10 → due at -10, -7, -4, -1; today is off-grid
    const state = input({
      cadence: every3,
      createdDay: day(-10),
      doneDays: days(-10, -7, -4, -1),
    });
    expect(currentStreak(state)).toBe(4);
  });
});

describe("bestStreak", () => {
  it("finds the longest run, not the current one", () => {
    const state = input({
      createdDay: day(-9),
      doneDays: days(-9, -8, -7, -6, -3, -2),
    });
    expect(bestStreak(state)).toBe(4);
    expect(currentStreak(state)).toBe(0);
  });

  it("a pending today never ends the best run", () => {
    const state = input({ createdDay: day(-4), doneDays: range(-4, -1) });
    expect(bestStreak(state)).toBe(4);
  });

  it("agrees with the current streak when the run is unbroken", () => {
    const state = input({ createdDay: day(-6), doneDays: range(-6, 0) });
    expect(bestStreak(state)).toBe(7);
    expect(currentStreak(state)).toBe(7);
  });
});

describe("30-day retention", () => {
  it("ignores raw days that have aged out of the window", () => {
    const state = input({
      createdDay: day(-90),
      doneDays: new Set([...range(-90, -40), ...range(-4, 0)]),
    });
    // Only the retained run is visible, and no carry vouches for the rest.
    expect(currentStreak(state)).toBe(5);
    expect(bestStreak(state)).toBe(5);
  });

  it("a gap outside the window cannot break a retained streak", () => {
    const base = input({ createdDay: day(-90), doneDays: range(-29, 0) });
    const withHole = input({
      createdDay: day(-90),
      doneDays: new Set([...range(-90, -60), ...range(-29, 0)]),
    });
    expect(currentStreak(withHole)).toBe(currentStreak(base));
  });

  it("rejoins a long run through a contiguous carry", () => {
    const createdDay = day(-59);
    const carry = compactCarry({
      previous: null,
      doneDays: range(-59, -30),
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    expect(carry).toEqual({
      throughDay: day(-30),
      streak: 30,
      best: 30,
      totalDone: 30,
    });

    const state = input({ createdDay, doneDays: range(-29, 0), carry });
    // 30 carried + 30 retained — not the 30 a naive read would show.
    expect(currentStreak(state)).toBe(60);
    expect(bestStreak(state)).toBe(60);
    expect(totalDone(state)).toBe(60);
  });

  it("does not apply the carry when the retained window has a miss", () => {
    const carry: Carry = { throughDay: day(-30), streak: 30, best: 30, totalDone: 30 };
    const state = input({
      createdDay: day(-59),
      doneDays: new Set([...range(-29, -11), ...range(-9, 0)]), // missed -10
      carry,
    });
    expect(currentStreak(state)).toBe(10);
    // The best run still spans the seam: 30 carried + 19 retained before the miss.
    expect(bestStreak(state)).toBe(49);
  });

  it("ignores a carry that does not abut the window", () => {
    const carry: Carry = { throughDay: day(-31), streak: 30, best: 30, totalDone: 30 };
    const state = input({ createdDay: day(-59), doneDays: range(-29, 0), carry });
    expect(currentStreak(state)).toBe(30);
  });

  it("carries across a cadence, counting due days not calendar days", () => {
    const createdDay = day(-59);
    const every3: Cadence = { everyDays: 3 };
    const carry = compactCarry({
      previous: null,
      doneDays: range(-59, -30),
      cadence: every3,
      createdDay,
      throughDay: day(-30),
    });
    // due at offsets -59, -56 … -32 → 10 of them
    expect(carry.streak).toBe(10);

    const state = input({
      cadence: every3,
      createdDay,
      doneDays: range(-29, 0),
      carry,
    });
    // retained due days: -29, -26 … -2 → 10 more; today is off-grid
    expect(currentStreak(state)).toBe(20);
  });
});

describe("compactCarry", () => {
  const createdDay = day(-59);

  it("is idempotent through the same day", () => {
    const first = compactCarry({
      previous: null,
      doneDays: range(-59, -30),
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    const again = compactCarry({
      previous: first,
      doneDays: range(-59, -30),
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    expect(again).toEqual(first);
  });

  it("extends incrementally and matches a single full pass", () => {
    const stepwise = compactCarry({
      previous: compactCarry({
        previous: null,
        doneDays: range(-59, -45),
        cadence: DAILY,
        createdDay,
        throughDay: day(-45),
      }),
      doneDays: range(-44, -30),
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    const oneShot = compactCarry({
      previous: null,
      doneDays: range(-59, -30),
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    expect(stepwise).toEqual(oneShot);
  });

  it("records a broken run as streak 0 while keeping the best", () => {
    const carry = compactCarry({
      previous: null,
      doneDays: new Set([...range(-59, -40), ...range(-38, -31)]), // missed -39 and -30
      cadence: DAILY,
      createdDay,
      throughDay: day(-30),
    });
    expect(carry.streak).toBe(0);
    expect(carry.best).toBe(20);
    expect(carry.totalDone).toBe(28);
  });

  it("a broken carry cannot revive a retained streak", () => {
    const carry: Carry = { throughDay: day(-30), streak: 0, best: 20, totalDone: 28 };
    const state = input({ createdDay, doneDays: range(-29, 0), carry });
    expect(currentStreak(state)).toBe(30);
    expect(bestStreak(state)).toBe(30);
  });
});

describe("totalDone", () => {
  it("adds carried completions to retained ones", () => {
    const carry: Carry = { throughDay: day(-30), streak: 3, best: 12, totalDone: 25 };
    const state = input({ createdDay: day(-59), doneDays: range(-4, 0), carry });
    expect(totalDone(state)).toBe(30);
  });

  it("counts only due days", () => {
    const state = input({
      cadence: { everyDays: 3 },
      createdDay: day(-9),
      doneDays: range(-9, 0), // logged every day, but only 4 were due
    });
    expect(totalDone(state)).toBe(4);
  });
});

describe("window boundaries", () => {
  it("the retained floor is exactly retentionStart", () => {
    expect(retentionStart(TODAY)).toBe(day(-29));
  });
});
