import { describe, expect, it } from "vitest";
import { cappedTimerValue, runningTimerSecondsLeft } from "./habit-timer";

describe("cappedTimerValue", () => {
  it("adds elapsed time below the goal", () => {
    expect(cappedTimerValue(30, 20, 60)).toBe(50);
  });

  it("never records time beyond the goal", () => {
    expect(cappedTimerValue(30, 90, 60)).toBe(60);
  });

  it("caps old over-goal values for display", () => {
    expect(cappedTimerValue(900, 0, 180)).toBe(180);
  });
});

describe("runningTimerSecondsLeft", () => {
  it("resumes only the unelapsed portion of a countdown", () => {
    expect(
      runningTimerSecondsLeft(
        { startedAt: 10_000, baseSeconds: 30, targetSeconds: 90 },
        35_000,
      ),
    ).toBe(35);
  });

  it("never schedules past an expired deadline", () => {
    expect(
      runningTimerSecondsLeft(
        { startedAt: 10_000, baseSeconds: 30, targetSeconds: 90 },
        80_000,
      ),
    ).toBe(0);
  });
});
