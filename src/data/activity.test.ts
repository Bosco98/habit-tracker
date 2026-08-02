import { describe, expect, it } from "vitest";
import { ACTIVITY_RETENTION_MS } from "@/lib/activity-retention";
import { LATELY_LIMIT, newestActivitySummaries } from "./activity";

describe("Circle Lately", () => {
  it("returns exactly the newest ten summaries", () => {
    const now = Date.UTC(2026, 7, 3, 12);
    const items = Array.from({ length: 15 }, (_, index) => ({
      occurredAt: now - index,
    }));
    const latest = newestActivitySummaries(items, LATELY_LIMIT, now);
    expect(LATELY_LIMIT).toBe(10);
    expect(latest).toHaveLength(10);
    expect(latest.map((item) => item.occurredAt)).toEqual(
      Array.from({ length: 10 }, (_, index) => now - index),
    );
  });

  it("drops summaries once they reach 24 hours", () => {
    const now = Date.UTC(2026, 7, 3, 12);
    const latest = newestActivitySummaries(
      [
        { occurredAt: now - ACTIVITY_RETENTION_MS + 1 },
        { occurredAt: now - ACTIVITY_RETENTION_MS },
      ],
      LATELY_LIMIT,
      now,
    );
    expect(latest).toEqual([{ occurredAt: now - ACTIVITY_RETENTION_MS + 1 }]);
  });
});
