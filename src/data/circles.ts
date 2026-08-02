import { Group } from "jazz-tools";
import { createInviteLink } from "jazz-tools/react";
import { inviteBaseUrl } from "@/lib/links";
import { syncDesktopPeers } from "@/lib/platform";
import { Circle } from "./schema";
import type { LoadedCircle, LoadedHabit, WritableAccount } from "./types";
import { habitInit, type HabitInput } from "./mutations";

export const INVITE_HINT = "circle";

/**
 * A hard cap, not a nudge. Circles are meant to be the two or three people who
 * actually notice — past that the shelf stops being shared and starts being a
 * feed, and every member's habits land in everyone else's day.
 */
export const MAX_CIRCLES = 3;

export function circleCount(account: WritableAccount): number {
  return account.root.circles.length;
}

export function atCircleLimit(account: WritableAccount): boolean {
  return circleCount(account) >= MAX_CIRCLES;
}

/**
 * A circle is a CoMap owned by its own Group — membership in that group
 * *is* membership in the circle, so sharing needs no extra bookkeeping.
 *
 * Returns false when the cap is already reached.
 */
export function createCircle(
  account: WritableAccount,
  input: { name: string; emoji: string },
): boolean {
  if (atCircleLimit(account)) return false;
  const group = Group.create();
  const circle = Circle.create(
    {
      name: input.name,
      emoji: input.emoji,
      habits: [],
      reactions: [],
      createdAt: Date.now(),
    },
    { owner: group },
  );
  account.root.circles.$jazz.push(circle);
  return true;
}

export function updateCircle(
  circle: LoadedCircle,
  input: { name: string; emoji: string },
): void {
  circle.$jazz.set("name", input.name);
  circle.$jazz.set("emoji", input.emoji);
}

/** Shared habits are created into the circle's group — same shape, wider owner. */
export function createSharedHabit(circle: LoadedCircle, input: HabitInput): void {
  circle.habits.$jazz.push(habitInit(input));
  syncDesktopPeers();
}

export function removeSharedHabit(circle: LoadedCircle, habit: LoadedHabit): void {
  const index = circle.habits.findIndex((h) => h?.$jazz.id === habit.$jazz.id);
  if (index >= 0) {
    circle.habits.$jazz.splice(index, 1);
    syncDesktopPeers();
  }
}

/** Anyone with this link becomes a writer — they can log, not administrate. */
export function circleInviteLink(circle: LoadedCircle): string {
  return createInviteLink(circle, "writer", {
    baseURL: inviteBaseUrl(),
    valueHint: INVITE_HINT,
  });
}

/** Join a circle from an accepted invite. Refused once you're at the cap. */
export async function joinCircle(
  account: WritableAccount,
  circleId: string,
): Promise<"joined" | "already" | "full"> {
  if (account.root.circles.some((c) => c?.$jazz.id === circleId)) return "already";
  if (atCircleLimit(account)) return "full";
  const circle = await Circle.load(circleId);
  if (!circle) return "full";
  account.root.circles.$jazz.push(circle);
  return "joined";
}

export function leaveCircle(account: WritableAccount, circle: LoadedCircle): void {
  const index = account.root.circles.findIndex((c) => c?.$jazz.id === circle.$jazz.id);
  if (index >= 0) {
    account.root.circles.$jazz.splice(index, 1);
    syncDesktopPeers();
  }
}

/** Only the creator holds admin on the circle's group. */
export function isCircleAdmin(circle: LoadedCircle): boolean {
  const owner = circle.$jazz.owner;
  return owner instanceof Group && owner.myRole() === "admin";
}

/**
 * Delete for everyone, as far as a CRDT allows: revoking every other member
 * makes the circle unreadable to them, and it drops off this account's shelf.
 * The bytes they already synced can't be recalled — nothing in a local-first
 * store can be — so this is "no longer shared", not "erased from history".
 */
export function deleteCircle(account: WritableAccount, circle: LoadedCircle): void {
  const owner = circle.$jazz.owner;
  if (owner instanceof Group && owner.myRole() === "admin") {
    for (const member of owner.members) {
      if (member.id !== account.$jazz.id && member.account) {
        owner.removeMember(member.account);
      }
    }
  }
  leaveCircle(account, circle);
}

export function addReaction(
  circle: LoadedCircle,
  input: { habitId: string; targetAccountId: string; forDay: string; emoji: string },
): void {
  circle.reactions.$jazz.push({ ...input, createdAt: Date.now() });
}
