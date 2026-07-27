import { describe, expect, it } from "vitest";
import { currentStreak } from "./streaks";
import { intersectDoneDays, unionDoneDays } from "./shared";

describe("intersectDoneDays", () => {
  it("keeps only days everyone hit", () => {
    const a = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    const b = new Set(["2026-07-26", "2026-07-27"]);
    expect([...intersectDoneDays([a, b])].sort()).toEqual(["2026-07-26", "2026-07-27"]);
  });

  it("is empty when one member has nothing", () => {
    const a = new Set(["2026-07-27"]);
    expect(intersectDoneDays([a, new Set<string>()]).size).toBe(0);
  });

  it("is the set itself for a solo circle", () => {
    const a = new Set(["2026-07-27"]);
    expect(intersectDoneDays([a])).toEqual(a);
  });

  it("is empty for no members", () => {
    expect(intersectDoneDays([]).size).toBe(0);
  });
});

describe("unionDoneDays", () => {
  it("merges every member's days", () => {
    const a = new Set(["2026-07-25"]);
    const b = new Set(["2026-07-26"]);
    expect([...unionDoneDays([a, b])].sort()).toEqual(["2026-07-25", "2026-07-26"]);
  });
});

describe("combined streak (shared fate)", () => {
  const base = {
    schedule: { type: "daily" } as const,
    today: "2026-07-27",
    createdDay: "2026-07-01",
    weekStartsOn: 1,
  };

  it("counts only days both delivered", () => {
    const mine = new Set(["2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27"]);
    const theirs = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    const combined = intersectDoneDays([mine, theirs]);
    expect(currentStreak({ ...base, doneDays: combined }).count).toBe(3);
  });

  it("one partner's miss breaks it for everyone", () => {
    const mine = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    const theirs = new Set(["2026-07-25", "2026-07-27"]); // missed the 26th
    const combined = intersectDoneDays([mine, theirs]);
    expect(currentStreak({ ...base, doneDays: combined }).count).toBe(1);
  });

  it("graces a today the partner hasn't logged yet", () => {
    const mine = new Set(["2026-07-25", "2026-07-26", "2026-07-27"]);
    const theirs = new Set(["2026-07-25", "2026-07-26"]);
    const combined = intersectDoneDays([mine, theirs]);
    expect(currentStreak({ ...base, doneDays: combined }).count).toBe(2);
  });
});
