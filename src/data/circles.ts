import { Group } from "jazz-tools";
import { createInviteLink } from "jazz-tools/react";
import { Circle } from "./schema";
import type { LoadedCircle, LoadedForfeit, LoadedHabit, WritableAccount } from "./types";
import type { HabitInput } from "./mutations";
import { toScheduleInit } from "./mutations";

export const INVITE_HINT = "circle";

/**
 * A circle is a CoMap owned by its own Group — membership in that group
 * *is* membership in the circle, so sharing needs no extra bookkeeping.
 */
export function createCircle(
  account: WritableAccount,
  input: { name: string; emoji: string; stake?: string },
): void {
  const group = Group.create();
  const circle = Circle.create(
    {
      name: input.name,
      emoji: input.emoji,
      stake: input.stake,
      habits: [],
      reactions: [],
      forfeits: [],
      createdAt: Date.now(),
    },
    { owner: group },
  );
  account.root.circles.$jazz.push(circle);
}

export function updateCircle(
  circle: LoadedCircle,
  input: { name: string; emoji: string; stake?: string },
): void {
  circle.$jazz.set("name", input.name);
  circle.$jazz.set("emoji", input.emoji);
  circle.$jazz.set("stake", input.stake);
}

/** Shared habits are created into the circle's group — same shape, wider owner. */
export function createSharedHabit(circle: LoadedCircle, input: HabitInput): void {
  circle.habits.$jazz.push({
    name: input.name,
    emoji: input.emoji,
    kind: input.kind,
    target: input.target,
    schedule: toScheduleInit(input.schedule),
    checkIns: [],
    createdAt: Date.now(),
  });
}

export function removeSharedHabit(circle: LoadedCircle, habit: LoadedHabit): void {
  const index = circle.habits.findIndex((h) => h?.$jazz.id === habit.$jazz.id);
  if (index >= 0) circle.habits.$jazz.splice(index, 1);
}

/** Anyone with this link becomes a writer — they can log, not administrate. */
export function circleInviteLink(circle: LoadedCircle): string {
  return createInviteLink(circle, "writer", { valueHint: INVITE_HINT });
}

/** Join a circle from an accepted invite, ignoring duplicates. */
export async function joinCircle(account: WritableAccount, circleId: string): Promise<void> {
  if (account.root.circles.some((c) => c?.$jazz.id === circleId)) return;
  const circle = await Circle.load(circleId);
  if (circle) account.root.circles.$jazz.push(circle);
}

export function leaveCircle(account: WritableAccount, circle: LoadedCircle): void {
  const index = account.root.circles.findIndex((c) => c?.$jazz.id === circle.$jazz.id);
  if (index >= 0) account.root.circles.$jazz.splice(index, 1);
}

export function addReaction(
  circle: LoadedCircle,
  input: { habitId: string; targetAccountId: string; forDay: string; emoji: string },
): void {
  circle.reactions.$jazz.push({ ...input, createdAt: Date.now() });
}

export function recordForfeit(
  circle: LoadedCircle,
  input: { title: string; weekKey: string; habitId: string; loserAccountId: string },
): void {
  circle.forfeits.$jazz.push({ ...input, status: "open", createdAt: Date.now() });
}

export function setForfeitStatus(
  forfeit: LoadedForfeit,
  status: "open" | "paid" | "waived",
): void {
  forfeit.$jazz.set("status", status);
}
