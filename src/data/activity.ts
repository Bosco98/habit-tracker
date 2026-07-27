import type { DayKey } from "@/lib/days";
import { logByDay } from "./checkins";
import { circleMembers } from "./members";
import type { LoadedCircle, LoadedHabit } from "./types";

export interface ActivityItem {
  key: string;
  habit: LoadedHabit;
  habitId: string;
  accountId: string;
  memberName: string;
  isMe: boolean;
  forDay: DayKey;
  value: number;
  loggedAt: number;
  backfilled: boolean;
  edited: boolean;
}

export interface ReactionSummary {
  /** `${habitId}|${accountId}|${forDay}` → emoji → count. */
  counts: Map<string, Map<string, number>>;
  /** Keys I have already reacted to. */
  mine: Set<string>;
}

export function activityKey(habitId: string, accountId: string, forDay: DayKey): string {
  return `${habitId}|${accountId}|${forDay}`;
}

/** Newest check-ins across the circle, for the feed. */
export function circleActivity(
  circle: LoadedCircle,
  myId: string,
  limit = 30,
): ActivityItem[] {
  const members = circleMembers(circle, myId);
  const items: ActivityItem[] = [];

  for (const habit of circle.habits) {
    if (!habit?.$isLoaded) continue;
    for (const member of members) {
      for (const [forDay, log] of logByDay(habit, member.id)) {
        if (log.value <= 0) continue;
        items.push({
          key: activityKey(habit.$jazz.id, member.id, forDay),
          habit,
          habitId: habit.$jazz.id,
          accountId: member.id,
          memberName: member.name,
          isMe: member.isMe,
          forDay,
          value: log.value,
          loggedAt: log.loggedAt,
          backfilled: log.backfilled,
          edited: log.editedAt !== undefined,
        });
      }
    }
  }

  return items.sort((a, b) => b.loggedAt - a.loggedAt).slice(0, limit);
}

export function summarizeReactions(circle: LoadedCircle, myId: string): ReactionSummary {
  const counts = new Map<string, Map<string, number>>();
  const mine = new Set<string>();

  for (const entry of circle.reactions.perAccount
    ? Object.entries(circle.reactions.perAccount)
    : []) {
    const [accountId, stream] = entry;
    for (const item of stream.all) {
      const reaction = item.value;
      if (!reaction?.$isLoaded) continue;
      const key = activityKey(reaction.habitId, reaction.targetAccountId, reaction.forDay);
      const byEmoji = counts.get(key) ?? new Map<string, number>();
      byEmoji.set(reaction.emoji, (byEmoji.get(reaction.emoji) ?? 0) + 1);
      counts.set(key, byEmoji);
      if (accountId === myId) mine.add(key);
    }
  }

  return { counts, mine };
}
