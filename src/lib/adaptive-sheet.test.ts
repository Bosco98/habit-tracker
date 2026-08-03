import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("adaptive sheets", () => {
  it("keeps bottom sheets on phones and centers every one on larger screens", () => {
    const component = readFileSync(
      new URL("../components/ui/sheet.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

    expect(component).toContain("adaptive-sheet fixed");
    expect(styles).toContain("@media (min-width: 36rem)");
    expect(styles).toContain('.adaptive-sheet[data-side="bottom"]');
    expect(styles).toContain("transform: translate(-50%, -50%)");
  });
});
