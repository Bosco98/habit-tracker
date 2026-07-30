/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Injected by the Tauri shell; absent on the web. */
    __TAURI_INTERNALS__?: Record<string, unknown>;
  }
}

export {};
