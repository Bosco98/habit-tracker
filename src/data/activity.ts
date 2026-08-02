import { todayKey, type DayKey } from "@/lib/days";
import { isActivityActive } from "@/lib/activity-retention";
import { retainedLog } from "./checkins";
import { circleMembers } from "./members";
import type { LoadedCircle, LoadedHabit, LoadedPhotoActivity } from "./types";

interface BaseActivityItem {
  key: string;
  accountId: string;
  memberName: string;
  isMe: boolean;
  occurredAt: number;
}

export interface CheckInActivityItem extends BaseActivityItem {
  kind: "check-in";
  habit: LoadedHabit;
  habitId: string;
  forDay: DayKey;
  value: number;
  note?: string;
  backfilled: boolean;
  edited: boolean;
}

export interface PhotoActivityItem extends BaseActivityItem {
  kind: "photo";
  photo: LoadedPhotoActivity;
  fileId: string;
  expiresAt: number;
}

export type ActivityItem = CheckInActivityItem | PhotoActivityItem;

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

export function newestActivitySummaries<T extends Pick<ActivityItem, "occurredAt">>(
  items: readonly T[],
  limit = LATELY_LIMIT,
  now = Date.now(),
): T[] {
  return items
    .filter((item) => isActivityActive(item.occurredAt, now))
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, limit);
}

/** Check-ins and photos active in the Circle's rolling 24-hour timeline. */
export function circleActivity(
  circle: LoadedCircle,
  myId: string,
  limit = LATELY_LIMIT,
  now = Date.now(),
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
          kind: "check-in",
          key: activityKey(habit.$jazz.id, member.id, forDay),
          habit,
          habitId: habit.$jazz.id,
          accountId: member.id,
          memberName: member.name,
          isMe: member.isMe,
          forDay,
          value: log.value,
          note: log.note,
          occurredAt: log.loggedAt,
          backfilled: log.backfilled,
          edited: log.editedAt !== undefined,
        });
      }
    }
  }

  if (circle.photoActivities?.$isLoaded) {
    for (const photo of circle.photoActivities) {
      if (!photo?.$isLoaded) continue;
      const member = members.find((candidate) => candidate.id === photo.authorId);
      items.push({
        kind: "photo",
        key: photo.$jazz.id,
        photo,
        fileId: photo.fileId,
        accountId: photo.authorId,
        memberName: member?.name ?? `Friend ${photo.authorId.slice(-4)}`,
        isMe: photo.authorId === myId,
        occurredAt: photo.createdAt,
        expiresAt: photo.expiresAt,
      });
    }
  }

  return newestActivitySummaries(items, limit, now);
}

export function summarizeReactions(
  circle: LoadedCircle,
  myId: string,
  now = Date.now(),
): ReactionSummary {
  const counts = new Map<string, Map<string, number>>();
  const mine = new Set<string>();

  for (const entry of circle.reactions.perAccount
    ? Object.entries(circle.reactions.perAccount)
    : []) {
    const [accountId, stream] = entry;
    for (const item of stream.all) {
      const reaction = item.value;
      if (!reaction?.$isLoaded) continue;
      if (!isActivityActive(reaction.createdAt, now)) continue;
      const key = activityKey(reaction.habitId, reaction.targetAccountId, reaction.forDay);
      const byEmoji = counts.get(key) ?? new Map<string, number>();
      byEmoji.set(reaction.emoji, (byEmoji.get(reaction.emoji) ?? 0) + 1);
      counts.set(key, byEmoji);
      if (accountId === myId) mine.add(key);
    }
  }

  return { counts, mine };
}
