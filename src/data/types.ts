import type { co } from "jazz-tools";
import type { AppAccount, CheckIn, Circle, Forfeit, Habit } from "./schema";

/** Depth query for a habit with everything the UI needs. */
export const habitResolve = {
  schedule: true,
  checkIns: { $each: true },
} as const;

export const circleResolve = {
  habits: { $each: habitResolve },
  reactions: { $each: true },
  forfeits: { $each: true },
} as const;

/** Depth query for the whole account tree. */
export const accountResolve = {
  profile: true,
  root: {
    habits: { $each: habitResolve },
    circles: { $each: circleResolve },
    settings: true,
  },
} as const;

/**
 * Shallow view used by mutations. Deeply-resolved values are assignable to
 * it, but not the reverse — so writes accept a freshly-created CoValue
 * (which is always shallow) without fighting the resolve-depth types.
 */
export const writableResolve = {
  profile: true,
  root: { habits: true, circles: true, settings: true },
} as const;

export type WritableAccount = co.loaded<typeof AppAccount, typeof writableResolve>;

export type LoadedHabit = co.loaded<typeof Habit, typeof habitResolve>;
export type LoadedCheckIn = co.loaded<typeof CheckIn>;
export type LoadedCircle = co.loaded<typeof Circle, typeof circleResolve>;
export type LoadedForfeit = co.loaded<typeof Forfeit>;
export type LoadedAccount = co.loaded<typeof AppAccount, typeof accountResolve>;

/** A habit plus where it lives — the single shape the UI renders. */
export interface HabitEntry {
  habit: LoadedHabit;
  /** null for personal habits. */
  circle: LoadedCircle | null;
}
