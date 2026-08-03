import { describe, expect, it } from "vitest";
import { isStoredAppIconId, normalizeAppIcon, storedAppIcon } from "./app-icons";

describe("normalizeAppIcon", () => {
  it("maps saved habit and Circle emoji to stable icon ids", () => {
    expect(normalizeAppIcon("\u{1F331}", "habit")).toBe("sprout");
    expect(normalizeAppIcon("\u{1F91D}", "circle")).toBe("heart-handshake");
  });

  it("keeps Circle and reaction meanings distinct for the same legacy value", () => {
    expect(normalizeAppIcon("\u{1F525}", "circle")).toBe("flame");
    expect(normalizeAppIcon("\u{1F525}", "reaction")).toBe("energy");
  });

  it("uses a safe fallback for unsupported or missing values", () => {
    expect(normalizeAppIcon("not-an-icon", "habit")).toBe("sprout");
    expect(normalizeAppIcon(undefined, "reaction")).toBe("support");
  });

  it("stores a Unicode fallback that current clients normalize to the same icon", () => {
    expect(storedAppIcon("sprout", "habit")).toBe("\u{1F331}");
    expect(normalizeAppIcon(storedAppIcon("sprout", "habit"), "habit")).toBe(
      "sprout",
    );
    expect(storedAppIcon("house", "circle")).toBe("\u{1F3E1}");
    expect(storedAppIcon("house", "habit")).toBe("\u{1F9F9}");
  });

  it("only marks current icon ids for compatibility repair", () => {
    expect(isStoredAppIconId("sprout", "habit")).toBe(true);
    expect(isStoredAppIconId("\u{1F331}", "habit")).toBe(false);
  });
});
