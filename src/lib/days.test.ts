import { describe, expect, it } from "vitest";
import {
  addDays,
  dayOffsetLabel,
  daysBetween,
  lastNDays,
  relativeDay,
  toDayKey,
  todayKey,
} from "./days";

describe("day keys", () => {
  it("zero-pads month and day", () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(toDayKey(new Date(2026, 11, 31, 0, 1))).toBe("2026-12-31");
  });

  it("todayKey agrees with toDayKey(now)", () => {
    expect(todayKey()).toBe(toDayKey(new Date()));
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
  });

  it("handles leap years", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("is its own inverse", () => {
    expect(addDays(addDays("2026-07-28", 37), -37)).toBe("2026-07-28");
  });

  // Noon anchoring is the whole point: a ±1h DST shift can never land the
  // result on another day. 2026-03-08 and 2026-11-01 are US switch days.
  it("is stable across DST transitions", () => {
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-11-02", -1)).toBe("2026-11-01");
    expect(daysBetween("2026-03-06", "2026-03-13")).toBe(7);
  });
});

describe("daysBetween", () => {
  it("is signed and zero on the same day", () => {
    expect(daysBetween("2026-07-01", "2026-07-27")).toBe(26);
    expect(daysBetween("2026-07-27", "2026-07-01")).toBe(-26);
    expect(daysBetween("2026-07-27", "2026-07-27")).toBe(0);
  });

  it("counts a whole year", () => {
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
  });
});

describe("lastNDays", () => {
  it("ends at the given day and runs oldest first", () => {
    expect(lastNDays(3, "2026-08-01")).toEqual([
      "2026-07-30",
      "2026-07-31",
      "2026-08-01",
    ]);
  });

  it("returns exactly n distinct days across a DST boundary", () => {
    const days = lastNDays(30, "2026-03-20");
    expect(days).toHaveLength(30);
    expect(new Set(days).size).toBe(30);
  });
});

describe("relativeDay", () => {
  const today = "2026-07-28";

  it("names days relatively and never as a date", () => {
    expect(relativeDay(today, today)).toBe("Today");
    expect(relativeDay("2026-07-27", today)).toBe("Yesterday");
    expect(relativeDay("2026-07-29", today)).toBe("Tomorrow");
    expect(relativeDay("2026-07-24", today)).toBe("4 days ago");
    expect(relativeDay("2026-08-02", today)).toBe("in 5 days");
  });
});

describe("dayOffsetLabel", () => {
  it("counts backwards from now", () => {
    expect(dayOffsetLabel("2026-07-28", "2026-07-28")).toBe("now");
    expect(dayOffsetLabel("2026-07-25", "2026-07-28")).toBe("-3");
  });
});
