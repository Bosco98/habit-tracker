import { todayKey, type DayKey } from "@/lib/days";
import { retainedLog } from "./checkins";
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
  note?: string;
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

export const LATELY_LIMIT = 10;

export function activityKey(habitId: string, accountId: string, forDay: DayKey): string {
  return `${habitId}|${accountId}|${forDay}`;
}

export function newestActivitySummaries<T extends Pick<ActivityItem, "loggedAt">>(
  items: readonly T[],
  limit = LATELY_LIMIT,
): T[] {
  return [...items].sort((a, b) => b.loggedAt - a.loggedAt).slice(0, limit);
}

/** Newest check-ins across the circle, for the feed. */
export function circleActivity(
  circle: LoadedCircle,
  myId: string,
  limit = LATELY_LIMIT,
): ActivityItem[] {
  const members = circleMembers(circle, myId);
  const today = todayKey();
  const items: ActivityItem[] = [];

  for (const habit of circle.habits) {
    if (!habit?.$isLoaded) continue;
    for (const member of members) {
      // Retained window only — the feed can't surface what the app has dropped.
      for (const [forDay, log] of retainedLog(habit, member.id, today)) {
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
          note: log.note,
          loggedAt: log.loggedAt,
          backfilled: log.backfilled,
          edited: log.editedAt !== undefined,
        });
      }
    }
  }

  return newestActivitySummaries(items, limit);
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
