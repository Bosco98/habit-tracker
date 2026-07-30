import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { isDesktop } from "./platform";

const prefix = "habits:circle-notifications";
const preferenceEvent = "habits:circle-notification-change";

function key(accountId: string, circleId: string): string {
  return `${prefix}:${accountId}:${circleId}`;
}

export function readCircleNotifications(
  accountId: string,
  circleId: string,
): boolean {
  if (!isDesktop()) return false;
  return localStorage.getItem(key(accountId, circleId)) !== "off";
}

export function writeCircleNotifications(
  accountId: string,
  circleId: string,
  enabled: boolean,
): void {
  localStorage.setItem(key(accountId, circleId), enabled ? "on" : "off");
  window.dispatchEvent(new CustomEvent(preferenceEvent));
}

export function onCircleNotificationPreferenceChange(
  listener: () => void,
): () => void {
  window.addEventListener(preferenceEvent, listener);
  return () => window.removeEventListener(preferenceEvent, listener);
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!isDesktop()) return false;
  if (await isPermissionGranted()) return true;
  return (await requestPermission()) === "granted";
}
