import { goalFor } from "@/lib/completion";
import type { CircleSaveEvent } from "@/lib/circle-notifications";
import { circleMembers, memberName } from "./members";
import type { LoadedCircle } from "./types";

/** Every raw save remains distinct; unlike Lately, nothing is summarized here. */
export function circleSaveEvents(
  circles: readonly LoadedCircle[],
  myId: string,
): CircleSaveEvent[] {
  return circles.flatMap((circle) => {
    const members = circleMembers(circle, myId);
    return circle.habits.flatMap((habit) => {
      if (!habit?.$isLoaded) return [];
      return Object.entries(habit.checkIns.perAccount).flatMap(
        ([accountId, stream]) =>
          [...stream.all].flatMap((entry) => {
            const checkIn = entry.value;
            if (!checkIn?.$isLoaded) return [];
            return [{
              id: checkIn.$jazz.id,
              circleId: circle.$jazz.id,
              circleName: circle.name,
              memberId: accountId,
              memberName: memberName(members, accountId),
              habitId: habit.$jazz.id,
              habitName: habit.name,
              habitKind: habit.kind,
              value: checkIn.value,
              note: checkIn.note,
              goal: goalFor(habit.kind, habit.target),
              madeAt: entry.madeAt.getTime(),
            }];
          }),
      );
    });
  });
}
