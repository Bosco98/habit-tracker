import { normalizeCadence, type Cadence } from "@/lib/cadence";
import { goalFor } from "@/lib/completion";
import { toDayKey, todayKey, type DayKey } from "@/lib/days";
import { carryIsContiguous, type Carry } from "@/lib/retention";
import { intersectDoneDays } from "@/lib/shared";
import { bestStreak, currentStreak, totalDone } from "@/lib/streaks";
import { doneDaySet, readCarry, retainedLog, type DayLog } from "./checkins";
import { circleMembers, type Member } from "./members";
import type { HabitEntry, LoadedHabit } from "./types";

export interface MemberStats {
  member: Member;
  /** Retained window only — 30 days. */
  log: Map<DayKey, DayLog>;
  doneDays: Set<DayKey>;
  /** Raw logged value per day — feeds duel volume and partials. */
  values: Map<DayKey, number>;
  streak: number;
  best: number;
  total: number;
}

export interface HabitStats {
  cadence: Cadence;
  createdDay: DayKey;
  today: DayKey;
  goal: number;
  members: MemberStats[];
  me: MemberStats;
  /** Only meaningful for shared habits with 2+ members. */
  combinedStreak: number;
  isShared: boolean;
}

/** A habit's cadence, defaulting to daily for anything written without one. */
export function habitCadence(habit: Pick<LoadedHabit, "everyDays">): Cadence {
  return normalizeCadence(habit.everyDays);
}

export function habitCreatedDay(habit: Pick<LoadedHabit, "createdAt">): DayKey {
  return toDayKey(new Date(habit.createdAt));
}

function statsFor(
  habit: LoadedHabit,
  member: Member,
  cadence: Cadence,
  createdDay: DayKey,
  today: DayKey,
): MemberStats {
  const log = retainedLog(habit, member.id, today);
  const doneDays = doneDaySet(log, habit);
  const values = new Map([...log].map(([day, entry]) => [day, entry.value]));
  const input = {
    doneDays,
    cadence,
    today,
    createdDay,
    carry: readCarry(habit, member.id),
  };
  return {
    member,
    log,
    doneDays,
    values,
    streak: currentStreak(input),
    best: bestStreak(input),
    total: totalDone(input),
  };
}

/**
 * The combined run needs a carry too, or a shared streak would collapse to 30
 * days. If every member's summary is contiguous, the intersection's run at the
 * cut is at least the shortest of theirs — which is exactly `min`.
 */
function combinedCarry(habit: LoadedHabit, members: Member[], today: DayKey): Carry | null {
  const carries = members.map((member) => readCarry(habit, member.id));
  if (carries.some((carry) => !carryIsContiguous(carry, today))) return null;
  const streak = Math.min(...carries.map((carry) => carry!.streak));
  return {
    throughDay: carries[0]!.throughDay,
    streak,
    // `best` and `totalDone` aren't derivable from an intersection of
    // summaries; only the combined *current* streak is ever displayed.
    best: streak,
    totalDone: 0,
  };
}

/**
 * One derivation of everything the UI shows about a habit — for me and,
 * when shared, for every circle member. Cards, duels and insights all read
 * from here so there is exactly one definition of "done".
 */
export function habitStats(entry: HabitEntry, myId: string, myName: string): HabitStats {
  const { habit, circle } = entry;
  const cadence = habitCadence(habit);
  const createdDay = habitCreatedDay(habit);
  const today = todayKey();

  const roster: Member[] = circle
    ? circleMembers(circle, myId)
    : [{ id: myId, name: myName, isMe: true }];
  // A circle whose members haven't synced yet must still show my own data.
  const present = roster.some((member) => member.isMe)
    ? roster
    : [{ id: myId, name: myName, isMe: true }, ...roster];
  const members = present.map((member) =>
    statsFor(habit, member, cadence, createdDay, today),
  );

  const me = members.find((stats) => stats.member.isMe) ?? members[0];
  const combined = intersectDoneDays(members.map((stats) => stats.doneDays));

  return {
    cadence,
    createdDay,
    today,
    goal: goalFor(habit.kind, habit.target),
    members,
    me,
    combinedStreak: currentStreak({
      doneDays: combined,
      cadence,
      today,
      createdDay,
      carry: combinedCarry(habit, present, today),
    }),
    isShared: Boolean(circle) && members.length > 1,
  };
}
