const DAY_MS = 86_400_000;

export const PRESENCE_HEARTBEAT_MS = 60_000;
export const PRESENCE_ONLINE_WINDOW_MS = 180_000;

export interface CircleNudgeEvent {
  id: string;
  circleId: string;
  circleName: string;
  memberId: string;
  memberName: string;
  day: number;
  madeAt: number;
}

/** A shared UTC boundary keeps the circle's one daily poke deterministic. */
export function nudgeDay(at = Date.now()): number {
  return Math.floor(at / DAY_MS);
}

export function wasNudgedToday(
  events: readonly Pick<CircleNudgeEvent, "day">[],
  today = nudgeDay(),
): boolean {
  return events.some((event) => event.day === today);
}

/** Marks everything observed, returning only fresh pokes for this UTC day. */
export function unseenRemoteNudges(
  events: readonly CircleNudgeEvent[],
  seen: Set<string>,
  myId: string,
  today = nudgeDay(),
): CircleNudgeEvent[] {
  const fresh: CircleNudgeEvent[] = [];
  const emitted = new Set<string>();

  for (const event of [...events].sort((a, b) => a.madeAt - b.madeAt)) {
    const alreadySeen = seen.has(event.id);
    seen.add(event.id);
    if (alreadySeen || event.day !== today) continue;

    const key = `circle-day:${event.circleId}:${event.day}`;
    const dayAlreadySeen = seen.has(key);
    seen.add(key);
    if (dayAlreadySeen || emitted.has(key) || event.memberId === myId) continue;
    emitted.add(key);
    fresh.push(event);
  }

  return fresh;
}

export function isOnline(lastActiveAt: number | null, now = Date.now()): boolean {
  return lastActiveAt !== null && now - lastActiveAt <= PRESENCE_ONLINE_WINDOW_MS;
}

export function lastActiveLabel(lastActiveAt: number | null, now = Date.now()): string {
  if (lastActiveAt === null) return "Not active yet";
  const age = Math.max(0, now - lastActiveAt);
  if (age <= PRESENCE_ONLINE_WINDOW_MS) return "Online";

  const minutes = Math.max(1, Math.floor(age / 60_000));
  if (minutes < 60) return `Active ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  if (hours < 48) return "Active yesterday";

  return `Active ${Math.floor(hours / 24)} days ago`;
}
