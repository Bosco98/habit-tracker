export const ACTIVITY_RETENTION_MS = 24 * 60 * 60 * 1_000;

export function activityExpiresAt(createdAt: number): number {
  return createdAt + ACTIVITY_RETENTION_MS;
}

export function isActivityActive(createdAt: number, now = Date.now()): boolean {
  return createdAt <= now && activityExpiresAt(createdAt) > now;
}

export function activityAgeLabel(createdAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - createdAt) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

export function activityTimeLeftLabel(expiresAt: number, now = Date.now()): string {
  const minutes = Math.max(0, Math.ceil((expiresAt - now) / 60_000));
  if (minutes < 60) return `${minutes}m left`;
  return `${Math.ceil(minutes / 60)}h left`;
}
