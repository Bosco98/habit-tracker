import type { DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import { isDesktop, isWidget } from "@/lib/platform";

export const AUTO_UPDATE_CHECK_DELAY_MS = 10_000;
export const AUTO_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1_000;

export type DesktopUpdateState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "up-to-date" }
  | { phase: "downloading"; version: string; progress: number | null }
  | { phase: "ready"; version: string }
  | { phase: "installing"; version: string }
  | { phase: "error"; message: string };

let state: DesktopUpdateState = { phase: "idle" };
let pendingUpdate: Update | null = null;
let checkInFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: DesktopUpdateState): void {
  state = next;
  for (const listener of listeners) listener();
}

function friendlyError(error: unknown): string {
  console.error("desktop update failed", error);
  return "Could not check for updates. Try again when you are online.";
}

export function getDesktopUpdateState(): DesktopUpdateState {
  return state;
}

export function subscribeDesktopUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function checkForDesktopUpdate(): Promise<void> {
  if (!isDesktop() || isWidget() || pendingUpdate) return;
  if (checkInFlight) return checkInFlight;

  checkInFlight = (async () => {
    publish({ phase: "checking" });
    let update: Update | null = null;
    try {
      const updater = await import("@tauri-apps/plugin-updater");
      update = await updater.check({ timeout: 30_000 });
      if (!update) {
        publish({ phase: "up-to-date" });
        return;
      }

      let downloaded = 0;
      let contentLength: number | undefined;
      const onDownload = (event: DownloadEvent) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
        }
        const progress = contentLength
          ? Math.min(100, Math.round((downloaded / contentLength) * 100))
          : null;
        publish({ phase: "downloading", version: update!.version, progress });
      };

      publish({ phase: "downloading", version: update.version, progress: null });
      await update.download(onDownload, { timeout: 5 * 60_000 });
      pendingUpdate = update;
      publish({ phase: "ready", version: update.version });
    } catch (error) {
      if (update && update !== pendingUpdate) await update.close().catch(() => undefined);
      publish({ phase: "error", message: friendlyError(error) });
    } finally {
      checkInFlight = null;
    }
  })();

  return checkInFlight;
}

export async function installDesktopUpdate(): Promise<void> {
  if (!pendingUpdate || state.phase === "installing") return;
  const update = pendingUpdate;
  publish({ phase: "installing", version: update.version });
  try {
    await update.install();
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
  } catch (error) {
    pendingUpdate = null;
    await update.close().catch(() => undefined);
    publish({ phase: "error", message: friendlyError(error) });
  }
}

/** Main-window service: check after startup and then periodically while open. */
export function startDesktopUpdater(): () => void {
  if (!isDesktop() || isWidget()) return () => undefined;

  const firstCheck = window.setTimeout(() => {
    void checkForDesktopUpdate();
  }, AUTO_UPDATE_CHECK_DELAY_MS);
  const periodicCheck = window.setInterval(() => {
    void checkForDesktopUpdate();
  }, AUTO_UPDATE_CHECK_INTERVAL_MS);

  return () => {
    window.clearTimeout(firstCheck);
    window.clearInterval(periodicCheck);
  };
}
