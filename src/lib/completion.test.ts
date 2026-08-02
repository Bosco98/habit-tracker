import { describe, expect, it } from "vitest";
import { goalFor, isDayDone } from "./completion";

describe("note habit completion", () => {
  it("uses the same binary completion value as a plain check", () => {
    expect(goalFor("note")).toBe(1);
    expect(isDayDone("note", undefined, 0)).toBe(false);
    expect(isDayDone("note", undefined, 1)).toBe(true);
  });
});
