import { describe, expect, it } from "vitest";
import { lastNDays } from "./days";
import {
  loserIds,
  runDuel,
  scheduledCount,
  scoreWindow,
  type MemberWindowInput,
} from "./duels";

// Mon 2026-07-20 … Sun 2026-07-26
const WEEK = lastNDays(7, "2026-07-26");

function member(
  accountId: string,
  done: string[],
  values?: Record<string, number>,
): MemberWindowInput {
  return {
    accountId,
    doneDays: new Set(done),
    values: new Map(Object.entries(values ?? Object.fromEntries(done.map((d) => [d, 1])))),
  };
}

describe("scheduledCount", () => {
  it("daily = every day in the window", () => {
    expect(scheduledCount({ type: "daily" }, WEEK)).toBe(7);
  });

  it("weekdays = matching days only", () => {
    // Mon/Wed/Fri
    expect(scheduledCount({ type: "weekdays", days: [1, 3, 5] }, WEEK)).toBe(3);
  });

  it("timesPerWeek = the quota, capped by window length", () => {
    expect(scheduledCount({ type: "timesPerWeek", perWeek: 3 }, WEEK)).toBe(3);
    expect(scheduledCount({ type: "timesPerWeek", perWeek: 9 }, WEEK)).toBe(7);
  });
});

describe("scoreWindow", () => {
  it("computes completion against the schedule", () => {
    const score = scoreWindow(
      member("a", ["2026-07-20", "2026-07-21", "2026-07-22"]),
      { type: "daily" },
      WEEK,
    );
    expect(score.done).toBe(3);
    expect(score.scheduled).toBe(7);
    expect(score.completion).toBeCloseTo(3 / 7);
  });

  it("clamps completion at 1 when bonus days beat the quota", () => {
    const score = scoreWindow(
      member("a", ["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24"]),
      { type: "timesPerWeek", perWeek: 3 },
      WEEK,
    );
    expect(score.done).toBe(5);
    expect(score.completion).toBe(1);
  });

  it("sums volume for the tiebreak", () => {
    const score = scoreWindow(
      member("a", ["2026-07-20", "2026-07-21"], {
        "2026-07-20": 8,
        "2026-07-21": 12,
      }),
      { type: "daily" },
      WEEK,
    );
    expect(score.volume).toBe(20);
  });

  it("ignores values logged outside the window", () => {
    const score = scoreWindow(
      member("a", ["2026-07-20"], { "2026-07-20": 5, "2026-08-05": 99 }),
      { type: "daily" },
      WEEK,
    );
    expect(score.volume).toBe(5);
  });
});

describe("runDuel", () => {
  const schedule = { type: "daily" } as const;

  it("ranks by completion", () => {
    const result = runDuel(
      [
        member("a", ["2026-07-20"]),
        member("b", ["2026-07-20", "2026-07-21", "2026-07-22"]),
      ],
      schedule,
      WEEK,
    );
    expect(result.ranked[0].accountId).toBe("b");
    expect(result.winnerIds).toEqual(["b"]);
    expect(result.isDraw).toBe(false);
  });

  it("breaks ties on volume", () => {
    const result = runDuel(
      [
        member("a", ["2026-07-20", "2026-07-21"], { "2026-07-20": 1, "2026-07-21": 1 }),
        member("b", ["2026-07-20", "2026-07-21"], { "2026-07-20": 5, "2026-07-21": 5 }),
      ],
      schedule,
      WEEK,
    );
    expect(result.winnerIds).toEqual(["b"]);
  });

  it("declares a draw when completion and volume match", () => {
    const result = runDuel(
      [member("a", ["2026-07-20"]), member("b", ["2026-07-21"])],
      schedule,
      WEEK,
    );
    expect(result.winnerIds.sort()).toEqual(["a", "b"]);
    expect(result.isDraw).toBe(true);
  });

  it("crowns nobody when nobody played", () => {
    const result = runDuel([member("a", []), member("b", [])], schedule, WEEK);
    expect(result.winnerIds).toEqual([]);
    expect(result.isDraw).toBe(false);
  });

  it("handles a solo circle", () => {
    const result = runDuel([member("a", ["2026-07-20"])], schedule, WEEK);
    expect(result.winnerIds).toEqual(["a"]);
    expect(result.isDraw).toBe(false);
  });
});

describe("loserIds", () => {
  const schedule = { type: "daily" } as const;

  it("is everyone below the winner", () => {
    const result = runDuel(
      [
        member("a", ["2026-07-20", "2026-07-21"]),
        member("b", ["2026-07-20"]),
        member("c", []),
      ],
      schedule,
      WEEK,
    );
    expect(loserIds(result).sort()).toEqual(["b", "c"]);
  });

  it("is empty on a draw — nobody owes a forfeit", () => {
    const result = runDuel(
      [member("a", ["2026-07-20"]), member("b", ["2026-07-21"])],
      schedule,
      WEEK,
    );
    expect(loserIds(result)).toEqual([]);
  });

  it("is empty when nobody played", () => {
    expect(loserIds(runDuel([member("a", []), member("b", [])], schedule, WEEK))).toEqual([]);
  });
});
