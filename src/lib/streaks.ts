/**
 * Strict streaks over a fixed cadence: a run of consecutive *due* days, all
 * completed. One miss on a due day ends it; days that aren't due are skipped
 * entirely and can never break anything.
 *
 * Only the retained window is readable, so a run that started before it is
 * rejoined through the `Carry` summary — see retention.ts.
 */
import {
  isDueDay,
  previousDueDay,
  type Cadence,
} from "./cadence";
import { addDays, daysBetween, type DayKey } from "./days";
import { carryIsContiguous, retentionStart, type Carry } from "./retention";

export interface StreakInput {
  /** Due days completed, within the retained window only. */
  doneDays: ReadonlySet<DayKey>;
  cadence: Cadence;
  today: DayKey;
  /** Day the habit was created — the cadence grid is anchored here. */
  createdDay: DayKey;
  /** Frozen summary of everything that aged out, or null. */
  carry: Carry | null;
}

/** Safety bound — the window is 30 days, so this is never reached in practice. */
const MAX_STEPS = 400;

/** Earliest day any derivation may look at. */
function floorDay({ today, createdDay }: Pick<StreakInput, "today" | "createdDay">): DayKey {
  const start = retentionStart(today);
  return daysBetween(createdDay, start) >= 0 ? start : createdDay;
}

/** Due days from the floor up to `today`, oldest first. */
function retainedDueDays(input: StreakInput): DayKey[] {
  const { today, createdDay, cadence } = input;
  const days: DayKey[] = [];
  let day = floorDay(input);
  for (let step = 0; step < MAX_STEPS && daysBetween(day, today) >= 0; step++) {
    if (isDueDay(day, createdDay, cadence)) days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

/**
 * The live streak. A due day that is still today and still pending is graced —
 * an unfinished "now" doesn't end a run until the day is over.
 */
export function currentStreak(input: StreakInput): number {
  const { doneDays, cadence, today, createdDay, carry } = input;
  const floor = floorDay(input);

  let day = isDueDay(today, createdDay, cadence)
    ? today
    : previousDueDay(today, createdDay, cadence);
  if (day === today && !doneDays.has(day)) {
    day = previousDueDay(day, createdDay, cadence);
  }

  let count = 0;
  for (let step = 0; step < MAX_STEPS; step++) {
    if (day === null || daysBetween(floor, day) < 0) break;
    if (!doneDays.has(day)) return count; // a real miss — carry can't apply
    count++;
    day = previousDueDay(day, createdDay, cadence);
  }

  // Walked the whole retained window unbroken. If there were due days below it,
  // the run continues into the frozen summary.
  const ranOffTheWindow = day !== null && daysBetween(floor, day) < 0;
  if (ranOffTheWindow && carryIsContiguous(carry, today)) count += carry.streak;
  return count;
}

/** Longest run ever, under the same rules. */
export function bestStreak(input: StreakInput): number {
  const { doneDays, today, carry } = input;
  let best = carry?.best ?? 0;
  let run = carryIsContiguous(carry, today) ? carry.streak : 0;

  for (const day of retainedDueDays(input)) {
    if (doneDays.has(day)) {
      run++;
      if (run > best) best = run;
    } else if (day !== today) {
      run = 0; // a pending today never ends a run
    }
  }
  return best;
}

/** Due days completed in total, including everything already folded away. */
export function totalDone(input: StreakInput): number {
  const carried = input.carry?.totalDone ?? 0;
  const retained = retainedDueDays(input).filter((day) => input.doneDays.has(day));
  return carried + retained.length;
}

export interface CompactionInput {
  previous: Carry | null;
  /** Must cover every due day in (previous.throughDay, throughDay]. */
  doneDays: ReadonlySet<DayKey>;
  cadence: Cadence;
  createdDay: DayKey;
  throughDay: DayKey;
}

/**
 * Fold the days that just aged out into the carry. Runs forward from where
 * the previous carry stopped, so compaction is incremental and idempotent:
 * compacting twice through the same day yields the same summary.
 */
export function compactCarry({
  previous,
  doneDays,
  cadence,
  createdDay,
  throughDay,
}: CompactionInput): Carry {
  if (previous && daysBetween(previous.throughDay, throughDay) <= 0) return previous;

  let run = previous?.streak ?? 0;
  let best = previous?.best ?? 0;
  let done = previous?.totalDone ?? 0;

  let day = previous ? addDays(previous.throughDay, 1) : createdDay;
  for (let step = 0; step < MAX_STEPS && daysBetween(day, throughDay) >= 0; step++) {
    if (isDueDay(day, createdDay, cadence)) {
      if (doneDays.has(day)) {
        run++;
        done++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    day = addDays(day, 1);
  }
  return { throughDay, streak: run, best, totalDone: done };
}
