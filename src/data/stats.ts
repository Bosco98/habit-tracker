import { goalFor } from "@/lib/completion";
import { toDayKey, todayKey, type DayKey } from "@/lib/days";
import { intersectDoneDays } from "@/lib/shared";
import { currentStreak, bestStreak, type ScheduleSpec, type Streak } from "@/lib/streaks";
import { doneDaySet, logByDay, type DayLog } from "./checkins";
import { circleMembers, type Member } from "./members";
import type { HabitEntry, LoadedHabit } from "./types";

export interface MemberStats {
  member: Member;
  log: Map<DayKey, DayLog>;
  doneDays: Set<DayKey>;
  /** Raw logged value per day — feeds duel volume and partials. */
  values: Map<DayKey, number>;
  streak: Streak;
  best: Streak;
}

export interface HabitStats {
  schedule: ScheduleSpec;
  createdDay: DayKey;
  goal: number;
  members: MemberStats[];
  me: MemberStats;
  /** Only meaningful for shared habits with 2+ members. */
  combinedStreak: Streak;
  isShared: boolean;
}

/** The stored schedule CoMap, narrowed to the pure-logic shape. */
export function toScheduleSpec(habit: LoadedHabit): ScheduleSpec {
  const schedule = habit.schedule;
  if (schedule.type === "weekdays") return { type: "weekdays", days: schedule.days ?? [] };
  if (schedule.type === "timesPerWeek") {
    return { type: "timesPerWeek", perWeek: schedule.perWeek ?? 1 };
  }
  return { type: "daily" };
}

function statsFor(
  habit: LoadedHabit,
  member: Member,
  schedule: ScheduleSpec,
  createdDay: DayKey,
  weekStartsOn: number,
): MemberStats {
  const log = logByDay(habit, member.id);
  const doneDays = doneDaySet(log, habit);
  const values = new Map([...log].map(([day, entry]) => [day, entry.value]));
  const streakInput = {
    doneDays,
    schedule,
    today: todayKey(),
    createdDay,
    weekStartsOn,
  };
  return {
    member,
    log,
    doneDays,
    values,
    streak: currentStreak(streakInput),
    best: bestStreak(streakInput),
  };
}

/**
 * One derivation of everything the UI shows about a habit — for me and,
 * when shared, for every circle member. Cards, duels and insights all read
 * from here so there is exactly one definition of "done".
 */
export function habitStats(
  entry: HabitEntry,
  myId: string,
  myName: string,
  weekStartsOn: number,
): HabitStats {
  const { habit, circle } = entry;
  const schedule = toScheduleSpec(habit);
  const createdDay = toDayKey(new Date(habit.createdAt));

  const roster: Member[] = circle
    ? circleMembers(circle, myId)
    : [{ id: myId, name: myName, isMe: true }];
  // A circle whose members haven't synced yet must still show my own data.
  const members = (roster.some((member) => member.isMe)
    ? roster
    : [{ id: myId, name: myName, isMe: true }, ...roster]
  ).map((member) => statsFor(habit, member, schedule, createdDay, weekStartsOn));

  const me = members.find((stats) => stats.member.isMe) ?? members[0];
  const combined = intersectDoneDays(members.map((stats) => stats.doneDays));

  return {
    schedule,
    createdDay,
    goal: goalFor(habit.kind, habit.target),
    members,
    me,
    combinedStreak: currentStreak({
      doneDays: combined,
      schedule,
      today: todayKey(),
      createdDay,
      weekStartsOn,
    }),
    isShared: Boolean(circle) && members.length > 1,
  };
}
