import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOfWeek,
  daysBetween,
  lastNDays,
  toDayKey,
  weekDays,
  weekStart,
} from "./days";

describe("toDayKey", () => {
  it("zero-pads month and day", () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("adds within a month", () => {
    expect(addDays("2026-07-27", 1)).toBe("2026-07-28");
  });
  it("crosses month boundaries", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
  });
  it("crosses year boundaries", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("is stable across US DST transitions", () => {
    // 2026-03-08 and 2026-11-01 are US DST switch days
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-11-02", -1)).toBe("2026-11-01");
  });
});

describe("daysBetween", () => {
  it("is signed", () => {
    expect(daysBetween("2026-07-01", "2026-07-27")).toBe(26);
    expect(daysBetween("2026-07-27", "2026-07-01")).toBe(-26);
    expect(daysBetween("2026-07-27", "2026-07-27")).toBe(0);
  });
  it("survives DST weeks", () => {
    expect(daysBetween("2026-03-06", "2026-03-13")).toBe(7);
  });
});

describe("dayOfWeek / weekStart", () => {
  it("2026-07-27 is a Monday", () => {
    expect(dayOfWeek("2026-07-27")).toBe(1);
  });
  it("weekStart with Monday start", () => {
    expect(weekStart("2026-07-27", 1)).toBe("2026-07-27"); // itself
    expect(weekStart("2026-07-26", 1)).toBe("2026-07-20"); // Sunday → prev Monday
    expect(weekStart("2026-08-01", 1)).toBe("2026-07-27"); // Saturday
  });
  it("weekStart with Sunday start", () => {
    expect(weekStart("2026-07-27", 0)).toBe("2026-07-26");
    expect(weekStart("2026-07-26", 0)).toBe("2026-07-26");
  });
});

describe("lastNDays", () => {
  it("returns n days ending at end, oldest first", () => {
    expect(lastNDays(3, "2026-08-01")).toEqual([
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
    ]);
  });
});

describe("weekDays", () => {
  it("returns 7 consecutive days from the start", () => {
    expect(weekDays("2026-07-27")).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
      "2026-08-02",
    ]);
  });

  it("crosses a DST boundary without duplicating a day", () => {
    const days = weekDays("2026-03-06");
    expect(new Set(days).size).toBe(7);
    expect(days.at(-1)).toBe("2026-03-12");
  });
});
