import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("desktop release configuration", () => {
  it("builds every supported desktop target from version tags", () => {
    const workflow = read(".github/workflows/release.yml");

    expect(workflow).toContain('"v*.*.*"');
    expect(workflow).toContain("aarch64-apple-darwin");
    expect(workflow).toContain("x86_64-apple-darwin");
    expect(workflow).toContain("x86_64-pc-windows-msvc");
    expect(workflow).toContain("uploadUpdaterJson: true");
    expect(workflow).toContain("updaterJsonPreferNsis: true");
    expect(workflow).toContain("TAURI_SIGNING_PRIVATE_KEY");
    expect(workflow).toContain("SHA256SUMS.txt");
    expect(workflow).toContain("needs: build");
    expect(workflow).toContain("--draft=false --latest");
  });

  it("requires signed updater artifacts and passive Windows installs", () => {
    const config = JSON.parse(read("src-tauri/tauri.conf.json")) as {
      bundle: { createUpdaterArtifacts?: boolean };
      plugins: {
        updater: {
          pubkey: string;
          endpoints: string[];
          windows: { installMode: string };
        };
      };
    };

    expect(config.bundle.createUpdaterArtifacts).toBe(true);
    expect(config.plugins.updater.pubkey).not.toContain("PLACEHOLDER");
    expect(config.plugins.updater.pubkey.length).toBeGreaterThan(100);
    expect(config.plugins.updater.endpoints).toEqual([
      "https://github.com/Bosco98/habit-tracker/releases/latest/download/latest.json",
    ]);
    expect(config.plugins.updater.windows.installMode).toBe("passive");
  });
});
