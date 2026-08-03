import { normalizeCadence, type Cadence } from "@/lib/cadence";
import type { HabitKind } from "@/lib/completion";
import type { DayKey } from "@/lib/days";
import { storedAppIcon } from "@/lib/app-icons";
import { syncDesktopPeers } from "@/lib/platform";
import type { LoadedHabit, WritableAccount } from "./types";

export interface HabitInput {
  name: string;
  emoji: string;
  kind: HabitKind;
  target?: number;
  cadence: Cadence;
}

export function createHabit(account: WritableAccount, input: HabitInput): void {
  account.root.habits.$jazz.push(habitInit(input));
  syncDesktopPeers();
}

/** The shape a new Habit CoMap starts from — shared by personal and circle habits. */
export function habitInit(input: HabitInput) {
  return {
    name: input.name,
    emoji: storedAppIcon(input.emoji, "habit"),
    kind: input.kind,
    target: input.target,
    everyDays: normalizeCadence(input.cadence.everyDays).everyDays,
    checkIns: [],
    carry: [],
    createdAt: Date.now(),
  };
}

export function updateHabit(habit: LoadedHabit, input: HabitInput): void {
  habit.$jazz.set("name", input.name);
  habit.$jazz.set("emoji", storedAppIcon(input.emoji, "habit"));
  habit.$jazz.set("kind", input.kind);
  habit.$jazz.set("target", input.target);
  habit.$jazz.set("everyDays", normalizeCadence(input.cadence.everyDays).everyDays);
  syncDesktopPeers();
}

/**
 * Log (or overwrite) a day's value. Feeds are append-only, so an
 * overwrite is a new entry; reads resolve latest-per-day. `edited`
 * marks intentional after-the-fact changes (soft signal).
 */
export function logCheckIn(
  habit: LoadedHabit,
  forDay: DayKey,
  value: number,
  options?: { edited?: boolean; note?: string },
): void {
  const note = options?.note?.trim();
  habit.checkIns.$jazz.push({
    forDay,
    loggedAt: Date.now(),
    value,
    editedAt: options?.edited ? Date.now() : undefined,
    note: note || undefined,
  });
  syncDesktopPeers();
}

export function archiveHabit(habit: LoadedHabit): void {
  habit.$jazz.set("archivedAt", Date.now());
  syncDesktopPeers();
}

export function deleteHabit(account: WritableAccount, habit: LoadedHabit): void {
  const index = account.root.habits.findIndex((h) => h?.$jazz.id === habit.$jazz.id);
  if (index >= 0) {
    account.root.habits.$jazz.splice(index, 1);
    syncDesktopPeers();
  }
}

export function setDisplayName(account: WritableAccount, name: string): void {
  account.profile.$jazz.set("name", name);
}
