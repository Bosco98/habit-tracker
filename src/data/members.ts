import { Group } from "jazz-tools";
import type { LoadedCircle } from "./types";

export interface Member {
  id: string;
  name: string;
  isMe: boolean;
}

/** Short, stable fallback when a partner's profile hasn't synced yet. */
function fallbackName(id: string): string {
  return `Friend ${id.slice(-4)}`;
}

/**
 * Circle members, derived from the owning Group.
 * The current user always sorts first.
 */
export function circleMembers(circle: LoadedCircle, myId: string): Member[] {
  const owner = circle.$jazz.owner;
  if (!(owner instanceof Group)) return [];
  return owner.members
    .map((member) => ({
      id: member.id,
      name: member.account?.profile?.$isLoaded
        ? (member.account.profile.name ?? fallbackName(member.id))
        : fallbackName(member.id),
      isMe: member.id === myId,
    }))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe));
}

export function memberName(members: Member[], id: string): string {
  return members.find((member) => member.id === id)?.name ?? fallbackName(id);
}
