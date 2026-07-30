import { describe, expect, it } from "vitest";
import { LATELY_LIMIT, newestActivitySummaries } from "./activity";

describe("Circle Lately", () => {
  it("returns exactly the newest ten summaries", () => {
    const items = Array.from({ length: 15 }, (_, loggedAt) => ({ loggedAt }));
    const latest = newestActivitySummaries(items);
    expect(LATELY_LIMIT).toBe(10);
    expect(latest).toHaveLength(10);
    expect(latest.map((item) => item.loggedAt)).toEqual([
      14, 13, 12, 11, 10, 9, 8, 7, 6, 5,
    ]);
  });
});
