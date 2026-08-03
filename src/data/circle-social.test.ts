import { Group } from "jazz-tools";
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { Circle } from "./schema";
import {
  circleLastActiveByMember,
  circleNudgeEvents,
  nudgeCircle,
  touchCirclePresence,
} from "./circle-social";
import type { LoadedCircle } from "./types";

beforeEach(async () => {
  await setupJazzTestSync();
  await createJazzTestAccount({ isCurrentActiveAccount: true });
});

function legacyCircle(): LoadedCircle {
  return Circle.create(
    {
      name: "Legacy crew",
      emoji: "\u{1F91D}",
      habits: [],
      reactions: [],
      createdAt: Date.now(),
    },
    { owner: Group.create() },
  ) as LoadedCircle;
}

describe("legacy Circle social fields", () => {
  it("reads a Circle created before nudges and presence without blocking", () => {
    const circle = legacyCircle();

    expect(circleNudgeEvents(circle, "me")).toEqual([]);
    expect(circleLastActiveByMember(circle)).toEqual(new Map());
  });

  it("creates missing social feeds on the first write", () => {
    const circle = legacyCircle();

    expect(nudgeCircle(circle, "me")).toBe(true);
    touchCirclePresence(circle, 123_456);

    expect(circle.nudges?.$isLoaded).toBe(true);
    expect(circle.presence?.inCurrentSession?.value?.lastActiveAt).toBe(123_456);
  });
});
