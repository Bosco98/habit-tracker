/** True inside the Tauri desktop shell. */
export const isDesktop = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const isMac = (): boolean =>
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform || navigator.userAgent);

/**
 * The desktop window is frameless on macOS, so the shell needs room for the
 * traffic lights and a draggable strip. Web keeps its normal header.
 */
export function applyPlatformClasses(): void {
  if (!isDesktop()) return;
  document.documentElement.classList.add("desktop");
  if (isMac()) document.documentElement.classList.add("desktop-mac");
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
