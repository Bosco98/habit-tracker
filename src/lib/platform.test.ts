import { afterEach, describe, expect, it, vi } from "vitest";

const startDragging = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ startDragging }),
}));

import {
  DESKTOP_PEER_SYNC_DELAY_MS,
  startDesktopWindowDrag,
  syncDesktopPeers,
} from "./platform";

afterEach(() => {
  vi.useRealTimers();
  startDragging.mockClear();
  vi.unstubAllGlobals();
});

class DragTarget {
  private readonly interactive: boolean;

  constructor(interactive = false) {
    this.interactive = interactive;
  }

  closest(): object | null {
    return this.interactive ? {} : null;
  }
}

function desktopWindow(): void {
  vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
  vi.stubGlobal("Element", DragTarget);
}

describe("desktop window dragging", () => {
  it("starts native dragging from blank app chrome", () => {
    desktopWindow();

    startDesktopWindowDrag({
      button: 0,
      target: new DragTarget() as unknown as EventTarget,
    });

    expect(startDragging).toHaveBeenCalledOnce();
  });

  it("leaves controls and non-primary clicks interactive", () => {
    desktopWindow();

    startDesktopWindowDrag({
      button: 0,
      target: new DragTarget(true) as unknown as EventTarget,
    });
    startDesktopWindowDrag({
      button: 2,
      target: new DragTarget() as unknown as EventTarget,
    });

    expect(startDragging).not.toHaveBeenCalled();
  });
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
