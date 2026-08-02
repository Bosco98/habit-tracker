import { afterEach, describe, expect, it, vi } from "vitest";
import { DESKTOP_PEER_SYNC_DELAY_MS, syncDesktopPeers } from "./platform";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("desktop peer sync", () => {
  it("debounces writes and identifies the tray as the source", () => {
    vi.useFakeTimers();
    const invoke = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {
      __TAURI_INTERNALS__: { invoke },
      location: { search: "?view=widget" },
    });

    syncDesktopPeers();
    syncDesktopPeers();
    vi.advanceTimersByTime(DESKTOP_PEER_SYNC_DELAY_MS - 1);
    expect(invoke).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(invoke).toHaveBeenCalledOnce();
    expect(invoke).toHaveBeenCalledWith("sync_peers", { from: "widget" });
  });
});
