import { describe, expect, it } from "vitest";
import { addDays } from "./days";
import {
  carryIsContiguous,
  compactionCutoff,
  isRetained,
  RETENTION_DAYS,
  retentionStart,
  retentionWindow,
  type Carry,
} from "./retention";

const TODAY = "2026-07-28";

describe("the retention window", () => {
  it("is 30 days", () => {
    expect(RETENTION_DAYS).toBe(30);
  });

  it("starts 29 days back, so today is the 30th day", () => {
    expect(retentionStart(TODAY)).toBe(addDays(TODAY, -29));
    expect(retentionStart(TODAY)).toBe("2026-06-29");
  });

  it("yields exactly 30 distinct days ending today", () => {
    const window = retentionWindow(TODAY);
    expect(window).toHaveLength(30);
    expect(new Set(window).size).toBe(30);
    expect(window[0]).toBe("2026-06-29");
    expect(window.at(-1)).toBe(TODAY);
  });
});

describe("isRetained", () => {
  it("keeps today and the 29 days before it", () => {
    expect(isRetained(TODAY, TODAY)).toBe(true);
    expect(isRetained(addDays(TODAY, -29), TODAY)).toBe(true);
  });

  it("drops the 30th day back and anything older", () => {
    expect(isRetained(addDays(TODAY, -30), TODAY)).toBe(false);
    expect(isRetained(addDays(TODAY, -365), TODAY)).toBe(false);
  });

  it("drops the future", () => {
    expect(isRetained(addDays(TODAY, 1), TODAY)).toBe(false);
  });

  it("agrees with retentionWindow on every boundary", () => {
    const window = new Set(retentionWindow(TODAY));
    for (let offset = -35; offset <= 2; offset++) {
      const day = addDays(TODAY, offset);
      expect(isRetained(day, TODAY)).toBe(window.has(day));
    }
  });
});

describe("compactionCutoff", () => {
  it("is null while the habit is younger than the window", () => {
    expect(compactionCutoff(TODAY, addDays(TODAY, -29))).toBeNull();
    expect(compactionCutoff(TODAY, TODAY)).toBeNull();
  });

  it("is the day just before the window once history overflows", () => {
    expect(compactionCutoff(TODAY, addDays(TODAY, -30))).toBe(addDays(TODAY, -30));
    expect(compactionCutoff(TODAY, addDays(TODAY, -100))).toBe(addDays(TODAY, -30));
  });
});

describe("carryIsContiguous", () => {
  const carry = (throughDay: string): Carry => ({
    throughDay,
    streak: 5,
    best: 9,
    totalDone: 12,
  });

  it("accepts a carry ending the day before the window", () => {
    expect(carryIsContiguous(carry(addDays(TODAY, -30)), TODAY)).toBe(true);
  });

  it("rejects a stale carry that left a gap", () => {
    expect(carryIsContiguous(carry(addDays(TODAY, -31)), TODAY)).toBe(false);
  });

  it("rejects a carry that overlaps the window", () => {
    expect(carryIsContiguous(carry(addDays(TODAY, -29)), TODAY)).toBe(false);
  });

  it("rejects null", () => {
    expect(carryIsContiguous(null, TODAY)).toBe(false);
  });
});
