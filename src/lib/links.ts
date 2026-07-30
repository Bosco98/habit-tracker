export const SITE_URL = "https://habit-tracker.fun";
export const WEB_APP_URL = `${SITE_URL}/app`;
export const REPOSITORY_URL = "https://github.com/Bosco98/habit-tracker";
export const RELEASES_URL = `${REPOSITORY_URL}/releases/latest`;

interface BrowserLocation {
  hostname: string;
  origin: string;
}

/**
 * Desktop invite QR codes must point at the public web app, never Tauri's
 * internal asset origin. Local browser development stays local so invite
 * acceptance can still be tested end to end.
 */
export function inviteBaseUrl(
  location: BrowserLocation | undefined = typeof window === "undefined"
    ? undefined
    : window.location,
): string {
  if (
    location &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ) {
    return `${location.origin}/app`;
  }
  return WEB_APP_URL;
}
