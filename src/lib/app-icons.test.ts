import { describe, expect, it } from "vitest";
import { normalizeAppIcon } from "./app-icons";

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
});
