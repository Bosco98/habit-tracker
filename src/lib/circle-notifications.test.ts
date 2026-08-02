import { describe, expect, it } from "vitest";
import {
  notificationBody,
  unseenRemoteSaves,
  type CircleSaveEvent,
} from "./circle-notifications";

const event = (id: string, memberId = "friend"): CircleSaveEvent => ({
  id,
  circleId: "circle",
  circleName: "Crew",
  memberId,
  memberName: "Maya",
  habitId: "habit",
  habitName: "Read",
  habitKind: "count",
  value: 4,
  goal: 10,
  madeAt: Number(id),
});

describe("Circle remote-save notifications", () => {
  it("baselines and marks muted events seen without replaying them", () => {
    const seen = new Set<string>();
    // Initial observer snapshot is baselined by adding its IDs.
    for (const item of [event("1"), event("2")]) seen.add(item.id);
    expect(unseenRemoteSaves([event("1"), event("2")], seen, "me")).toEqual([]);

    const muted = unseenRemoteSaves([event("1"), event("2"), event("3")], seen, "me");
    expect(muted.map((item) => item.id)).toEqual(["3"]);
    expect(unseenRemoteSaves([event("3")], seen, "me")).toEqual([]);
  });

  it("excludes self saves while still marking them seen", () => {
    const seen = new Set<string>();
    expect(unseenRemoteSaves([event("1", "me")], seen, "me")).toEqual([]);
    expect(seen.has("1")).toBe(true);
  });

  it("describes count, timer, binary, note, and reset values", () => {
    expect(notificationBody(event("1"))).toBe("Maya updated Read to 4 of 10.");
    expect(
      notificationBody({ ...event("1"), habitKind: "timer", value: 125, goal: 180 }),
    ).toBe("Maya updated Read to 2m 5s of 3m.");
    expect(notificationBody({ ...event("1"), habitKind: "binary" })).toBe(
      "Maya checked in on Read.",
    );
    expect(
      notificationBody({
        ...event("1"),
        habitKind: "note",
        note: "Bench press 3 × 8",
      }),
    ).toBe("Maya checked in on Read: Bench press 3 × 8");
    expect(notificationBody({ ...event("1"), value: 0 })).toBe("Maya reset Read.");
  });
});
