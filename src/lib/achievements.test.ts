import { describe, expect, it } from "vitest";
import {
  dedupeAchievementEvents,
  deriveCirclePulse,
  groupTrophies,
  levelForMetric,
  rollingAchievementMetric,
  thresholdForLevel,
  triangular,
  type CircleMetricHabit,
  type CircleMetricMember,
} from "./achievements";

const members: CircleMetricMember[] = [
  { id: "a", name: "A", isMe: true },
  { id: "b", name: "B" },
];

function habit(
  id: string,
  days: Record<string, Record<string, { value: number; firstCompletedAt?: number }>>,
  everyDays = 1,
): CircleMetricHabit {
  return {
    id,
    createdDay: "2026-07-01",
    cadence: { everyDays },
    goal: 1,
    memberDays: new Map(
      Object.entries(days).map(([member, values]) => [
        member,
        new Map(Object.entries(values)),
      ]),
    ),
  };
}

describe("endless achievement levels", () => {
  it("uses triangular thresholds without a cap", () => {
    expect(triangular(4)).toBe(10);
    expect(thresholdForLevel("consistency", 4)).toBe(100);
    expect(thresholdForLevel("encouragement", 4)).toBe(50);
    expect(levelForMetric("teamwork", 5)).toBe(2);
    expect(levelForMetric("teamwork", 6)).toBe(3);
    expect(levelForMetric("leadership", 50_000)).toBeGreaterThan(300);
  });
});

describe("Circle pulse", () => {
  it("finds perfect days and leaves an unfinished Today pending", () => {
    const pulse = deriveCirclePulse(
      members,
      [
        habit("daily", {
          a: {
            "2026-07-27": { value: 1 },
            "2026-07-28": { value: 1 },
            "2026-07-29": { value: 1 },
          },
          b: {
            "2026-07-27": { value: 1 },
            "2026-07-28": { value: 1 },
          },
        }),
      ],
      "2026-07-29",
    );
    expect(pulse.perfectDays).toEqual(["2026-07-27", "2026-07-28"]);
    expect(pulse.currentStreak).toBe(2);
    expect(pulse.perfectToday).toBe(false);
  });

  it("shares exact honor ties and enforces five consistency opportunities", () => {
    const dates = Object.fromEntries(
      ["2026-07-24", "2026-07-25", "2026-07-26", "2026-07-27", "2026-07-28"].map(
        (day) => [day, { value: 1 }],
      ),
    );
    const tiedHabit = habit("daily", { a: dates, b: dates });
    tiedHabit.createdDay = "2026-07-24";
    const pulse = deriveCirclePulse(
      members,
      [tiedHabit],
      "2026-07-29",
    );
    const consistency = pulse.honors.find((item) => item.honor === "consistency");
    expect(consistency?.holders.map((holder) => holder.id)).toEqual(["a", "b"]);
    expect(consistency?.value).toBe(1);
  });

  it("counts All-in days across sparse cadences", () => {
    const pulse = deriveCirclePulse(
      members,
      [
        habit(
          "sparse",
          {
            a: { "2026-07-25": { value: 1 }, "2026-07-27": { value: 1 } },
            b: { "2026-07-25": { value: 1 } },
          },
          2,
        ),
      ],
      "2026-07-29",
    );
    const allIn = pulse.honors.find((item) => item.honor === "allIn");
    expect(allIn?.holders.map((holder) => holder.id)).toEqual(["a"]);
    expect(allIn?.value).toBe(2);
  });

  it("awards Early Finisher from the first goal-reaching save and shares timestamp ties", () => {
    const pulse = deriveCirclePulse(
      members,
      [
        habit("race", {
          a: { "2026-07-28": { value: 1, firstCompletedAt: 10 } },
          b: { "2026-07-28": { value: 1, firstCompletedAt: 10 } },
        }),
      ],
      "2026-07-29",
    );
    const early = pulse.honors.find((item) => item.honor === "earlyFinisher");
    expect(early?.holders.map((holder) => holder.id)).toEqual(["a", "b"]);
  });
});

describe("achievement receipts", () => {
  const base = {
    track: "leadership" as const,
    kind: "circleHonor" as const,
    eventType: "circle-honor",
    honor: "allIn" as const,
    circleId: "circle",
    circleName: "Crew",
    metricValue: 2,
  };

  it("collapses duplicate deterministic keys from concurrent devices", () => {
    expect(
      dedupeAchievementEvents([
        { ...base, key: "same", awardedAt: 20 },
        { ...base, key: "same", awardedAt: 10 },
      ]),
    ).toHaveLength(1);
    expect(
      dedupeAchievementEvents([
        { ...base, key: "same", awardedAt: 20 },
        { ...base, key: "same", awardedAt: 10 },
      ])[0].awardedAt,
    ).toBe(10);
  });

  it("groups repeat Circle honors while retaining their count", () => {
    const groups = groupTrophies([
      { ...base, key: "one", awardedAt: 10 },
      { ...base, key: "two", awardedAt: 20 },
    ]);
    expect(groups).toMatchObject([{ honor: "allIn", circleId: "circle", count: 2 }]);
  });

  it("limits live track metrics to the inclusive rolling 30-day window", () => {
    const credit = {
      track: "consistency" as const,
      kind: "credit" as const,
      eventType: "completed-due-opportunity",
      metricValue: 1,
    };
    const events = [
      {
        ...credit,
        key: "credit:consistency:habit:2026-07-01",
        awardedAt: new Date("2026-07-30T12:00:00").getTime(),
      },
      {
        ...credit,
        key: "credit:consistency:habit:2026-06-30",
        awardedAt: new Date("2026-07-30T12:00:00").getTime(),
      },
      {
        ...credit,
        key: "credit:consistency:habit:2026-07-30",
        awardedAt: new Date("2026-07-30T12:00:00").getTime(),
      },
      {
        ...credit,
        key: "credit:consistency:habit:2026-07-31",
        awardedAt: new Date("2026-07-30T12:00:00").getTime(),
      },
      {
        ...credit,
        key: "retention-carry",
        eventType: "retention-carry",
        metricValue: 40,
        awardedAt: new Date("2026-07-30T12:00:00").getTime(),
      },
    ];

    expect(
      rollingAchievementMetric(events, "consistency", "2026-07-30"),
    ).toBe(2);
  });

  it("counts rolling leadership honors rather than their scored value", () => {
    const honor = {
      track: "leadership" as const,
      kind: "circleHonor" as const,
      eventType: "seven-day-circle-honor",
      honor: "consistency" as const,
      circleId: "circle",
      circleName: "Crew",
      metricValue: 0.8,
    };
    expect(
      rollingAchievementMetric(
        [
          {
            ...honor,
            key: "retained-honor",
            awardedAt: new Date("2026-07-10T12:00:00").getTime(),
          },
          {
            ...honor,
            key: "old-honor",
            awardedAt: new Date("2026-06-10T12:00:00").getTime(),
          },
        ],
        "leadership",
        "2026-07-30",
      ),
    ).toBe(1);
  });
});
