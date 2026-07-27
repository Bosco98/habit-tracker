/// <reference types="vite/client" />

declare global {
  interface Window {
    /** Present only when running inside the Electron shell (see electron/preload.cjs). */
    desktop?: { platform: NodeJS.Platform };
  }
}

export {};
