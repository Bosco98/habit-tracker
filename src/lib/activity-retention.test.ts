import { describe, expect, it } from "vitest";
import {
  ACTIVITY_RETENTION_MS,
  activityAgeLabel,
  activityExpiresAt,
  activityTimeLeftLabel,
  isActivityActive,
} from "./activity-retention";

describe("24-hour activity retention", () => {
  const now = Date.UTC(2026, 7, 3, 12);

  it("keeps activity until the exact 24-hour boundary", () => {
    expect(isActivityActive(now - ACTIVITY_RETENTION_MS + 1, now)).toBe(true);
    expect(isActivityActive(now - ACTIVITY_RETENTION_MS, now)).toBe(false);
    expect(isActivityActive(now + 1, now)).toBe(false);
  });

  it("derives expiry from creation time", () => {
    expect(activityExpiresAt(now)).toBe(now + ACTIVITY_RETENTION_MS);
  });

  it("uses compact relative labels", () => {
    expect(activityAgeLabel(now - 30_000, now)).toBe("now");
    expect(activityAgeLabel(now - 12 * 60_000, now)).toBe("12m");
    expect(activityAgeLabel(now - 3 * 60 * 60_000, now)).toBe("3h");
    expect(activityTimeLeftLabel(now + 35 * 60_000, now)).toBe("35m left");
    expect(activityTimeLeftLabel(now + 61 * 60_000, now)).toBe("2h left");
  });
});
