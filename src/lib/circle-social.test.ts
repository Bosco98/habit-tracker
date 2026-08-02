import { describe, expect, it } from "vitest";
import {
  isOnline,
  lastActiveLabel,
  nudgeDay,
  unseenRemoteNudges,
  wasNudgedToday,
  type CircleNudgeEvent,
} from "./circle-social";

const DAY = 20_000;

function nudge(
  id: string,
  memberId = "friend",
  circleId = "circle",
): CircleNudgeEvent {
  return {
    id,
    circleId,
    circleName: "Crew",
    memberId,
    memberName: "Maya",
    day: DAY,
    madeAt: Number(id),
  };
}

describe("circle nudges", () => {
  it("uses one shared UTC day bucket", () => {
    expect(nudgeDay(86_400_000 - 1)).toBe(0);
    expect(nudgeDay(86_400_000)).toBe(1);
  });

  it("allows only one nudge state per circle day", () => {
    expect(wasNudgedToday([nudge("1")], DAY)).toBe(true);
    expect(wasNudgedToday([nudge("1")], DAY + 1)).toBe(false);
  });

  it("emits one remote poke per circle and marks duplicates and self pokes seen", () => {
    const seen = new Set<string>();
    const fresh = unseenRemoteNudges(
      [nudge("1"), nudge("2"), nudge("3", "me", "other")],
      seen,
      "me",
      DAY,
    );

    expect(fresh.map((event) => event.id)).toEqual(["1"]);
    expect(["1", "2", "3"].every((id) => seen.has(id))).toBe(true);
    expect(unseenRemoteNudges([nudge("1")], seen, "me", DAY)).toEqual([]);
  });

  it("does not replay a late duplicate for a day already handled", () => {
    const seen = new Set<string>();
    expect(unseenRemoteNudges([nudge("1")], seen, "me", DAY)).toHaveLength(1);
    expect(unseenRemoteNudges([nudge("1"), nudge("2")], seen, "me", DAY)).toEqual([]);
  });
});

describe("circle presence", () => {
  const now = 1_000_000_000;

  it("treats a recent heartbeat as online", () => {
    expect(isOnline(now - 180_000, now)).toBe(true);
    expect(isOnline(now - 180_001, now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });

  it("formats last activity without calendar dates", () => {
    expect(lastActiveLabel(null, now)).toBe("Not active yet");
    expect(lastActiveLabel(now - 60_000, now)).toBe("Online");
    expect(lastActiveLabel(now - 8 * 60_000, now)).toBe("Active 8m ago");
    expect(lastActiveLabel(now - 5 * 3_600_000, now)).toBe("Active 5h ago");
    expect(lastActiveLabel(now - 30 * 3_600_000, now)).toBe("Active yesterday");
    expect(lastActiveLabel(now - 4 * 86_400_000, now)).toBe("Active 4 days ago");
  });
});
