export interface CircleSaveEvent {
  id: string;
  circleId: string;
  circleName: string;
  memberId: string;
  memberName: string;
  habitId: string;
  habitName: string;
  habitKind: "binary" | "note" | "count" | "timer";
  value: number;
  note?: string;
  goal: number;
  madeAt: number;
}

/** New saves are emitted once, even if the Circle was muted at the time. */
export function unseenRemoteSaves(
  events: readonly CircleSaveEvent[],
  seen: Set<string>,
  myId: string,
): CircleSaveEvent[] {
  const fresh: CircleSaveEvent[] = [];
  for (const event of [...events].sort((a, b) => a.madeAt - b.madeAt)) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    if (event.memberId !== myId) fresh.push(event);
  }
  return fresh;
}

function duration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (minutes === 0) return `${rest}s`;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

export function notificationBody(event: CircleSaveEvent): string {
  if (event.value <= 0) return `${event.memberName} reset ${event.habitName}.`;
  if (event.habitKind === "note" && event.note) {
    return `${event.memberName} checked in on ${event.habitName}: ${event.note}`;
  }
  if (event.habitKind === "binary" || event.habitKind === "note") {
    return `${event.memberName} checked in on ${event.habitName}.`;
  }
  const value =
    event.habitKind === "timer" ? duration(event.value) : String(event.value);
  const goal =
    event.habitKind === "timer" ? duration(event.goal) : String(event.goal);
  return `${event.memberName} updated ${event.habitName} to ${value} of ${goal}.`;
}
