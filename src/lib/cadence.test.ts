import { describe, expect, it } from "vitest";
import {
  countDue,
  describeCadence,
  dueDaysIn,
  isDueDay,
  MAX_EVERY_DAYS,
  nextDueDay,
  normalizeCadence,
  previousDueDay,
} from "./cadence";
import { lastNDays } from "./days";

const CREATED = "2026-07-01";

describe("normalizeCadence", () => {
  it("defaults junk to daily", () => {
    expect(normalizeCadence(undefined)).toEqual({ everyDays: 1 });
    expect(normalizeCadence(0)).toEqual({ everyDays: 1 });
    expect(normalizeCadence(-4)).toEqual({ everyDays: 1 });
    expect(normalizeCadence(Number.NaN)).toEqual({ everyDays: 1 });
  });

  it("rounds and clamps to the retention window", () => {
    expect(normalizeCadence(3.4)).toEqual({ everyDays: 3 });
    expect(normalizeCadence(999)).toEqual({ everyDays: MAX_EVERY_DAYS });
  });
});

describe("isDueDay", () => {
  it("is due every day at cadence 1", () => {
    for (const day of lastNDays(5, "2026-07-10")) {
      expect(isDueDay(day, CREATED, { everyDays: 1 })).toBe(true);
    }
  });

  it("lands on a fixed grid anchored at creation", () => {
    const every3 = { everyDays: 3 };
    expect(isDueDay("2026-07-01", CREATED, every3)).toBe(true); // day 0
    expect(isDueDay("2026-07-02", CREATED, every3)).toBe(false);
    expect(isDueDay("2026-07-03", CREATED, every3)).toBe(false);
    expect(isDueDay("2026-07-04", CREATED, every3)).toBe(true); // day 3
    expect(isDueDay("2026-07-07", CREATED, every3)).toBe(true); // day 6
  });

  it("is never due before the habit existed", () => {
    expect(isDueDay("2026-06-30", CREATED, { everyDays: 1 })).toBe(false);
    expect(isDueDay("2026-06-28", CREATED, { everyDays: 3 })).toBe(false);
  });

  it("keeps the grid fixed across a month boundary", () => {
    // day 30 and day 33 from 2026-07-01
    expect(isDueDay("2026-07-31", CREATED, { everyDays: 3 })).toBe(true);
    expect(isDueDay("2026-08-03", CREATED, { everyDays: 3 })).toBe(true);
    expect(isDueDay("2026-08-01", CREATED, { everyDays: 3 })).toBe(false);
  });
});

describe("dueDaysIn / countDue", () => {
  const window = lastNDays(10, "2026-07-10"); // 2026-07-01 … 2026-07-10

  it("counts every day at cadence 1", () => {
    expect(countDue(window, CREATED, { everyDays: 1 })).toBe(10);
  });

  it("counts every other day at cadence 2", () => {
    expect(dueDaysIn(window, CREATED, { everyDays: 2 })).toEqual([
      "2026-07-01",
      "2026-07-03",
      "2026-07-05",
      "2026-07-07",
      "2026-07-09",
    ]);
  });

  it("ignores days before creation", () => {
    const early = lastNDays(10, "2026-07-03"); // starts 2026-06-24
    expect(countDue(early, CREATED, { everyDays: 1 })).toBe(3);
  });
});

describe("nextDueDay", () => {
  it("returns the day itself when it is already on the grid", () => {
    expect(nextDueDay("2026-07-04", CREATED, { everyDays: 3 })).toBe("2026-07-04");
  });

  it("advances to the next grid day", () => {
    expect(nextDueDay("2026-07-05", CREATED, { everyDays: 3 })).toBe("2026-07-07");
    expect(nextDueDay("2026-07-06", CREATED, { everyDays: 3 })).toBe("2026-07-07");
  });

  it("clamps to creation day for anything earlier", () => {
    expect(nextDueDay("2026-06-20", CREATED, { everyDays: 3 })).toBe(CREATED);
  });
});

describe("previousDueDay", () => {
  it("steps back one full cadence from a grid day", () => {
    expect(previousDueDay("2026-07-07", CREATED, { everyDays: 3 })).toBe("2026-07-04");
  });

  it("steps back to the grid from an off-grid day", () => {
    expect(previousDueDay("2026-07-06", CREATED, { everyDays: 3 })).toBe("2026-07-04");
  });

  it("stops at creation", () => {
    expect(previousDueDay(CREATED, CREATED, { everyDays: 3 })).toBeNull();
    expect(previousDueDay("2026-07-02", CREATED, { everyDays: 3 })).toBe(CREATED);
  });

  it("round-trips with nextDueDay", () => {
    const back = previousDueDay("2026-07-13", CREATED, { everyDays: 4 });
    expect(back).not.toBeNull();
    expect(nextDueDay(back!, CREATED, { everyDays: 4 })).toBe(back);
  });
});

describe("describeCadence", () => {
  it("reads in days, never in weekdays", () => {
    expect(describeCadence({ everyDays: 1 })).toBe("Every day");
    expect(describeCadence({ everyDays: 2 })).toBe("Every other day");
    expect(describeCadence({ everyDays: 5 })).toBe("Every 5 days");
  });
});
