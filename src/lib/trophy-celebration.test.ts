import { describe, expect, it } from "vitest";
import {
  collapseTrophyAwards,
  trophyCelebrationCopy,
  type TrophyAward,
  unseenTrophyAwards,
} from "./trophy-celebration";

const level = (
  key: string,
  track: "consistency" | "teamwork" = "consistency",
  value = 1,
): TrophyAward => ({
  key,
  track,
  kind: "trackLevel",
  eventType: "track-level",
  level: value,
  metricValue: value * 10,
  awardedAt: value,
});

describe("trophy celebrations", () => {
  it("baselines seen awards and never replays them", () => {
    const seen = new Set(["level:consistency:1"]);
    const events = [
      level("level:consistency:1"),
      {
        key: "credit",
        track: "consistency" as const,
        kind: "credit" as const,
        eventType: "completed-due-opportunity",
        metricValue: 1,
        awardedAt: 2,
      },
      level("level:teamwork:1", "teamwork"),
    ];

    expect(unseenTrophyAwards(events, seen).map((event) => event.key)).toEqual([
      "level:teamwork:1",
    ]);
    expect(unseenTrophyAwards(events, seen)).toEqual([]);
  });

  it("collapses a multi-level burst to the highest level per track", () => {
    expect(
      collapseTrophyAwards([
        level("level:consistency:1", "consistency", 1),
        level("level:consistency:2", "consistency", 2),
        level("level:teamwork:1", "teamwork", 1),
      ]).map((event) => event.key),
    ).toEqual(["level:teamwork:1", "level:consistency:2"]);
  });

  it("writes distinct track and Circle-honor copy", () => {
    expect(
      trophyCelebrationCopy({
        ...level("level:teamwork:1", "teamwork", 1),
        metricValue: 1,
      }),
    ).toMatchObject({
      detail: "You reached 1 perfect Circle day.",
    });
    expect(trophyCelebrationCopy(level("level:teamwork:2", "teamwork", 2))).toEqual({
      eyebrow: "Trophy unlocked",
      title: "Teamwork · Level 2",
      detail: "You reached 20 perfect Circle days.",
    });
    expect(
      trophyCelebrationCopy({
        key: "honor",
        track: "leadership",
        kind: "circleHonor",
        eventType: "seven-day-circle-honor",
        honor: "allIn",
        circleName: "Weekend crew",
        circleEmoji: "🤝",
        metricValue: 2,
        awardedAt: 3,
      }),
    ).toMatchObject({
      eyebrow: "Circle honor earned",
      title: "All In",
      detail: "🤝 Weekend crew · Seven-day checkpoint",
    });
  });
});
