import {
  nudgeDay,
  wasNudgedToday,
  type CircleNudgeEvent,
} from "@/lib/circle-social";
import { circleMembers, memberName } from "./members";
import type { LoadedCircle } from "./types";

export function circleNudgeEvents(
  circle: LoadedCircle,
  myId: string,
): CircleNudgeEvent[] {
  const nudges = circle.nudges;
  if (!nudges?.$isLoaded) return [];
  const members = circleMembers(circle, myId);

  return Object.entries(nudges.perAccount).flatMap(
    ([accountId, stream]) =>
      [...stream.all].flatMap((entry) => {
        const nudge = entry.value;
        if (!nudge?.$isLoaded) return [];
        return [{
          id: nudge.$jazz.id,
          circleId: circle.$jazz.id,
          circleName: circle.name,
          memberId: accountId,
          memberName: memberName(members, accountId),
          day: nudge.day,
          madeAt: entry.madeAt.getTime(),
        }];
      }),
  );
}

export function allCircleNudgeEvents(
  circles: readonly LoadedCircle[],
  myId: string,
): CircleNudgeEvent[] {
  return circles.flatMap((circle) => circleNudgeEvents(circle, myId));
}

export function nudgeCircle(circle: LoadedCircle, myId: string): boolean {
  const today = nudgeDay();
  if (wasNudgedToday(circleNudgeEvents(circle, myId), today)) return false;
  if (!circle.nudges?.$isLoaded) circle.$jazz.set("nudges", []);
  if (!circle.nudges?.$isLoaded) return false;
  circle.nudges.$jazz.push({ day: today });
  return true;
}

export function touchCirclePresence(circle: LoadedCircle, at = Date.now()): void {
  if (!circle.presence?.$isLoaded) circle.$jazz.set("presence", []);
  const presence = circle.presence;
  if (!presence?.$isLoaded) return;
  const current = presence.inCurrentSession?.value;
  if (current?.$isLoaded) {
    current.$jazz.set("lastActiveAt", at);
  } else {
    presence.$jazz.push({ lastActiveAt: at });
  }
}

export function circleLastActiveByMember(circle: LoadedCircle): Map<string, number> {
  const latest = new Map<string, number>();
  const presence = circle.presence;
  if (!presence?.$isLoaded) return latest;

  for (const [accountId, stream] of Object.entries(presence.perAccount)) {
    for (const entry of stream.all) {
      const presence = entry.value;
      if (!presence?.$isLoaded) continue;
      latest.set(
        accountId,
        Math.max(latest.get(accountId) ?? 0, presence.lastActiveAt),
      );
    }
  }

  return latest;
}
