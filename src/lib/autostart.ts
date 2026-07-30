import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { isDesktop } from "./platform";

const INITIALIZED_KEY = "habits:autostart-initialized";

export async function readOpenAtLogin(): Promise<boolean> {
  if (!isDesktop()) return false;
  return isEnabled();
}

export async function writeOpenAtLogin(enabled: boolean): Promise<void> {
  if (!isDesktop()) return;
  if (enabled) await enable();
  else await disable();
  localStorage.setItem(INITIALIZED_KEY, "true");
}

/** Enable once for a new desktop install, never overriding a later choice. */
export async function initializeOpenAtLogin(): Promise<void> {
  if (!isDesktop() || localStorage.getItem(INITIALIZED_KEY)) return;
  try {
    if (!(await isEnabled())) await enable();
    localStorage.setItem(INITIALIZED_KEY, "true");
  } catch {
    // Leave the sentinel unset so a temporary shell failure can retry later.
  }
}
