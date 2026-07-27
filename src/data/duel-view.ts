import { addDays, todayKey, weekDays, weekStart, type DayKey } from "@/lib/days";
import { loserIds, runDuel, type DuelResult } from "@/lib/duels";
import { tallyRecord, type DuelRecord } from "@/lib/insights";
import { habitStats, type HabitStats } from "./stats";
import type { LoadedCircle, LoadedHabit } from "./types";

export interface HabitDuel {
  habit: LoadedHabit;
  stats: HabitStats;
  weekKey: DayKey;
  lastWeekKey: DayKey;
  thisWeek: DuelResult;
  lastWeek: DuelResult;
  /** Who owes a forfeit for last week, if anyone. */
  lastWeekLosers: string[];
  record: DuelRecord;
}

const HISTORY_WEEKS = 8;

/**
 * Weekly standings per shared habit. Derived on read — no scores are ever
 * stored, so two devices can never disagree about who won.
 */
export function circleDuels(
  circle: LoadedCircle,
  myId: string,
  myName: string,
  weekStartsOn: number,
): HabitDuel[] {
  const thisWeekKey = weekStart(todayKey(), weekStartsOn);
  const lastWeekKey = addDays(thisWeekKey, -7);

  return circle.habits
    .filter((habit): habit is LoadedHabit => Boolean(habit?.$isLoaded) && !habit!.archivedAt)
    .map((habit) => {
      const stats = habitStats({ habit, circle }, myId, myName, weekStartsOn);
      const contenders = stats.members.map((member) => ({
        accountId: member.member.id,
        doneDays: member.doneDays,
        values: member.values,
      }));

      const forWeek = (start: DayKey) => runDuel(contenders, stats.schedule, weekDays(start));
      const thisWeek = forWeek(thisWeekKey);
      const lastWeek = forWeek(lastWeekKey);

      const history = Array.from({ length: HISTORY_WEEKS }, (_, i) => {
        const result = forWeek(addDays(thisWeekKey, -7 * (i + 1)));
        return {
          winnerIds: result.winnerIds,
          isDraw: result.isDraw,
          played: result.winnerIds.length > 0,
        };
      });

      return {
        habit,
        stats,
        weekKey: thisWeekKey,
        lastWeekKey,
        thisWeek,
        lastWeek,
        lastWeekLosers: loserIds(lastWeek),
        record: tallyRecord(history, myId),
      };
    });
}

/** A forfeit is owed only once per habit-week. */
export function hasForfeit(
  circle: LoadedCircle,
  habitId: string,
  weekKey: DayKey,
): boolean {
  return circle.forfeits.some(
    (forfeit) =>
      forfeit?.$isLoaded && forfeit.habitId === habitId && forfeit.weekKey === weekKey,
  );
}
