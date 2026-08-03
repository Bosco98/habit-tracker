import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("desktop window chrome", () => {
  it("grants dragging and wires both desktop header surfaces to native dragging", () => {
    const capability = JSON.parse(
      readFileSync(new URL("../../src-tauri/capabilities/default.json", import.meta.url), "utf8"),
    ) as { permissions: string[] };
    const topBar = readFileSync(
      new URL("../components/top-bar.tsx", import.meta.url),
      "utf8",
    );
    const sideRail = readFileSync(
      new URL("../components/side-rail.tsx", import.meta.url),
      "utf8",
    );

    expect(capability.permissions).toContain("core:window:allow-start-dragging");
    expect(topBar).toContain("data-tauri-drag-region");
    expect(topBar).toContain("onMouseDown={startDesktopWindowDrag}");
    expect(sideRail).toContain("data-tauri-drag-region");
    expect(sideRail).toContain("onMouseDown={startDesktopWindowDrag}");
  });
});
