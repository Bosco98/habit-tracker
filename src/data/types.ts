import type { co } from "jazz-tools";
import type {
  AchievementEvent,
  AppAccount,
  Carry,
  CheckIn,
  Circle,
  Habit,
  HabitReminder,
  PhotoActivity,
} from "./schema";

/**
 * Depth query for a habit with everything the UI needs. `carry` is optional
 * on the schema (habits written before retention existed don't have one), so
 * it resolves shallowly and readers guard on `$isLoaded`.
 */
export const habitResolve = {
  checkIns: { $each: true },
  carry: { $each: true },
} as const;

export const circleResolve = {
  habits: { $each: habitResolve },
  reactions: { $each: true },
  nudges: { $each: true },
  presence: { $each: true },
  photoActivities: { $each: true },
} as const;

/** Depth query for the whole account tree. */
export const accountResolve = {
  profile: true,
  root: {
    habits: { $each: habitResolve },
    circles: { $each: circleResolve },
    achievements: { $each: true },
    reminders: { $each: true },
  },
} as const;

/**
 * Shallow view used by mutations. Deeply-resolved values are assignable to
 * it, but not the reverse — so writes accept a freshly-created CoValue
 * (which is always shallow) without fighting the resolve-depth types.
 */
export const writableResolve = {
  profile: true,
  root: { habits: true, circles: true, achievements: true, reminders: true },
} as const;

export type WritableAccount = co.loaded<typeof AppAccount, typeof writableResolve>;

export type LoadedHabit = co.loaded<typeof Habit, typeof habitResolve>;
export type LoadedCheckIn = co.loaded<typeof CheckIn>;
export type LoadedCarry = co.loaded<typeof Carry>;
export type LoadedCircle = co.loaded<typeof Circle, typeof circleResolve>;
export type LoadedPhotoActivity = co.loaded<typeof PhotoActivity>;
export type LoadedHabitReminder = co.loaded<typeof HabitReminder>;
export type LoadedAchievementEvent = co.loaded<typeof AchievementEvent>;
export type LoadedAccount = co.loaded<typeof AppAccount, typeof accountResolve>;

/** A habit plus where it lives — the single shape the UI renders. */
export interface HabitEntry {
  habit: LoadedHabit;
  /** null for personal habits. */
  circle: LoadedCircle | null;
}
