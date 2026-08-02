/** True inside the Tauri desktop shell. */
export const isDesktop = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * The tray popover is the same bundle in a second window, told apart by a
 * query param — the asset protocol has no SPA fallback, so a real route
 * would 404 inside the shell.
 */
export const isWidget = (): boolean =>
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("view") === "widget";

const isMac = (): boolean =>
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform || navigator.userAgent);

/**
 * The desktop window is frameless on macOS, so the shell needs room for the
 * traffic lights and a draggable strip. Web keeps its normal header.
 */
export function applyPlatformClasses(): void {
  if (isWidget()) document.documentElement.classList.add("widget");
  if (!isDesktop()) return;
  document.documentElement.classList.add("desktop");
  if (isMac() && !isWidget()) document.documentElement.classList.add("desktop-mac");
}

interface TauriInternals {
  invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Calls a shell command without pulling `@tauri-apps/api` into the web bundle.
 * A no-op in the browser, so callers don't need to branch.
 */
export function invokeDesktop(cmd: string, args?: Record<string, unknown>): void {
  if (!isDesktop()) return;
  const internals = (window as unknown as { __TAURI_INTERNALS__?: TauriInternals })
    .__TAURI_INTERNALS__;
  if (typeof internals?.invoke !== "function") return;
  void internals.invoke(cmd, args);
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;
export const DESKTOP_PEER_SYNC_DELAY_MS = 750;

/**
 * The tray popover and the main window are separate webviews, each running its
 * own Jazz node over the same IndexedDB. Neither jazz-tools nor
 * cojson-storage-indexeddb ships a BroadcastChannel, so a write in one is
 * invisible to the other until it re-reads — which is why the two lists drifted.
 *
 * Signed-up accounts reconcile through the sync relay; anonymous ones have no
 * relay at all, so the shell reloads the *other* window instead. Give the
 * IndexedDB writer time to commit first; a burst of writes still costs one reload.
 */
export function syncDesktopPeers(): void {
  if (!isDesktop()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    invokeDesktop("sync_peers", { from: isWidget() ? "widget" : "main" });
  }, DESKTOP_PEER_SYNC_DELAY_MS);
}

/**
 * The service worker is a web concern; the desktop shell serves its own assets.
 * It's only emitted by the production build, so dev must not try to register it.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || isDesktop() || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
