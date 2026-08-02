import { beforeEach, describe, expect, it, vi } from "vitest";

const plugin = vi.hoisted(() => ({
  check: vi.fn(),
  relaunch: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({ check: plugin.check }));
vi.mock("@tauri-apps/plugin-process", () => ({ relaunch: plugin.relaunch }));

function desktopWindow(search = "") {
  return {
    __TAURI_INTERNALS__: { invoke: vi.fn() },
    location: { search },
  };
}

function availableUpdate(version = "2.1.0") {
  return {
    version,
    download: vi.fn(async (onEvent?: (event: unknown) => void) => {
      onEvent?.({ event: "Started", data: { contentLength: 100 } });
      onEvent?.({ event: "Progress", data: { chunkLength: 100 } });
      onEvent?.({ event: "Finished" });
    }),
    install: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("desktop updater", () => {
  it("does nothing in the web app", async () => {
    vi.stubGlobal("window", {});
    const updater = await import("./desktop-updater");

    await updater.checkForDesktopUpdate();

    expect(plugin.check).not.toHaveBeenCalled();
    expect(updater.getDesktopUpdateState()).toEqual({ phase: "idle" });
  });

  it("does not run from the tray webview", async () => {
    vi.stubGlobal("window", desktopWindow("?view=widget"));
    const updater = await import("./desktop-updater");

    await updater.checkForDesktopUpdate();

    expect(plugin.check).not.toHaveBeenCalled();
  });

  it("downloads a signed update before presenting it as ready", async () => {
    vi.stubGlobal("window", desktopWindow());
    const update = availableUpdate();
    plugin.check.mockResolvedValue(update);
    const updater = await import("./desktop-updater");

    await updater.checkForDesktopUpdate();

    expect(plugin.check).toHaveBeenCalledWith({ timeout: 30_000 });
    expect(update.download).toHaveBeenCalledOnce();
    expect(updater.getDesktopUpdateState()).toEqual({
      phase: "ready",
      version: "2.1.0",
    });
  });

  it("installs the downloaded update and relaunches", async () => {
    vi.stubGlobal("window", desktopWindow());
    const update = availableUpdate();
    plugin.check.mockResolvedValue(update);
    const updater = await import("./desktop-updater");

    await updater.checkForDesktopUpdate();
    await updater.installDesktopUpdate();

    expect(update.install).toHaveBeenCalledOnce();
    expect(plugin.relaunch).toHaveBeenCalledOnce();
  });

  it("reports that the installed version is current", async () => {
    vi.stubGlobal("window", desktopWindow());
    plugin.check.mockResolvedValue(null);
    const updater = await import("./desktop-updater");

    await updater.checkForDesktopUpdate();

    expect(updater.getDesktopUpdateState()).toEqual({ phase: "up-to-date" });
  });
});
