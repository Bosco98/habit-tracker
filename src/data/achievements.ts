import { isDueDay } from "@/lib/cadence";
import { goalFor } from "@/lib/completion";
import { addDays, daysBetween, lastNDays, toDayKey, todayKey, type DayKey } from "@/lib/days";
import {
  achievementMetric,
  dedupeAchievementEvents,
  deriveCirclePulse,
  levelForMetric,
  thresholdForLevel,
  type AchievementRecord,
  type AchievementTrack,
  type CircleMetricDay,
  type CircleMetricHabit,
  type CircleMetricMember,
  type CirclePulse,
} from "@/lib/achievements";
import { readCarry, retainedLog } from "./checkins";
import { circleMembers } from "./members";
import { habitCadence, habitCreatedDay } from "./stats";
import type {
  LoadedAccount,
  LoadedCircle,
  LoadedHabit,
} from "./types";

type AccountKey = `co_z${string}`;

function firstCompletedAt(
  habit: LoadedHabit,
  accountId: string,
): Map<DayKey, number> {
  const out = new Map<DayKey, number>();
  const goal = goalFor(habit.kind, habit.target);
  const stream = habit.checkIns.perAccount[accountId as AccountKey];
  if (!stream) return out;
  for (const entry of stream.all) {
    const checkIn = entry.value;
    if (!checkIn?.$isLoaded || checkIn.value < goal) continue;
    const current = out.get(checkIn.forDay);
    if (current === undefined || checkIn.loggedAt < current) {
      out.set(checkIn.forDay, checkIn.loggedAt);
    }
  }
  return out;
}

export function circleMetricInput(
  circle: LoadedCircle,
  myId: string,
  today: DayKey = todayKey(),
): { members: CircleMetricMember[]; habits: CircleMetricHabit[] } {
  const members = circleMembers(circle, myId);
  const habits = circle.habits
    .filter(
      (habit): habit is LoadedHabit =>
        Boolean(habit?.$isLoaded) && habit!.archivedAt === undefined,
    )
    .map((habit) => {
      const memberDays = new Map<string, Map<DayKey, CircleMetricDay>>();
      for (const member of members) {
        const first = firstCompletedAt(habit, member.id);
        memberDays.set(
          member.id,
          new Map(
            [...retainedLog(habit, member.id, today)].map(([day, log]) => [
              day,
              {
                value: log.value,
                firstCompletedAt: first.get(day),
              },
            ]),
          ),
        );
      }
      return {
        id: habit.$jazz.id,
        createdDay: habitCreatedDay(habit),
        cadence: habitCadence(habit),
        goal: goalFor(habit.kind, habit.target),
        memberDays,
      };
    });
  return { members, habits };
}

export function currentCirclePulse(
  circle: LoadedCircle,
  myId: string,
  today: DayKey = todayKey(),
): CirclePulse {
  const input = circleMetricInput(circle, myId, today);
  return deriveCirclePulse(input.members, input.habits, today);
}

export function readAchievementEvents(account: LoadedAccount): AchievementRecord[] {
  const values: AchievementRecord[] = [];
  for (const stream of Object.values(account.root.achievements.perAccount)) {
    for (const entry of stream.all) {
      const event = entry.value;
      if (!event?.$isLoaded) continue;
      values.push({
        key: event.key,
        track: event.track,
        kind: event.kind,
        eventType: event.eventType,
        level: event.level,
        honor: event.honor,
        circleId: event.circleId,
        circleName: event.circleName,
        circleEmoji: event.circleEmoji,
        metricValue: event.metricValue,
        awardedAt: event.awardedAt,
      });
    }
  }
  return dedupeAchievementEvents(values);
}

function allHabits(account: LoadedAccount): LoadedHabit[] {
  return [
    ...account.root.habits.filter(
      (habit): habit is LoadedHabit => Boolean(habit?.$isLoaded),
    ),
    ...account.root.circles.flatMap((circle) =>
      circle?.$isLoaded
        ? circle.habits.filter(
            (habit): habit is LoadedHabit => Boolean(habit?.$isLoaded),
          )
        : [],
    ),
  ];
}

function consistencyCredits(
  account: LoadedAccount,
  today: DayKey,
): AchievementRecord[] {
  const awardedAt = Date.now();
  return allHabits(account).flatMap((habit) => {
    const createdDay = habitCreatedDay(habit);
    const cadence = habitCadence(habit);
    const log = retainedLog(habit, account.$jazz.id, today);
    const goal = goalFor(habit.kind, habit.target);
    const retained = [...log]
      .filter(
        ([day, item]) =>
          item.value >= goal && isDueDay(day, createdDay, cadence),
      )
      .map(([day, item]) => ({
        key: `credit:consistency:${habit.$jazz.id}:${day}`,
        track: "consistency" as const,
        kind: "credit" as const,
        eventType: "completed-due-opportunity",
        metricValue: 1,
        awardedAt: item.loggedAt || awardedAt,
      }));
    const carry = readCarry(habit, account.$jazz.id);
    const legacy =
      carry && carry.totalDone > 0
        ? [{
            key: `credit:consistency:${habit.$jazz.id}:carry`,
            track: "consistency" as const,
            kind: "credit" as const,
            eventType: "retention-carry",
            metricValue: carry.totalDone,
            awardedAt,
          }]
        : [];
    return [...legacy, ...retained];
  });
}

function teamworkCredits(
  account: LoadedAccount,
  today: DayKey,
): AchievementRecord[] {
  return account.root.circles.flatMap((circle) => {
    if (!circle?.$isLoaded) return [];
    return currentCirclePulse(circle, account.$jazz.id, today).perfectDays.map((day) => ({
      key: `credit:teamwork:${circle.$jazz.id}:${day}`,
      track: "teamwork" as const,
      kind: "credit" as const,
      eventType: "perfect-circle-day",
      circleId: circle.$jazz.id,
      circleName: circle.name,
      circleEmoji: circle.emoji,
      metricValue: 1,
      awardedAt: new Date(`${day}T23:59:59`).getTime(),
    }));
  });
}

function encouragementCredits(account: LoadedAccount): AchievementRecord[] {
  const mine = account.$jazz.id as AccountKey;
  return account.root.circles.flatMap((circle) => {
    if (!circle?.$isLoaded) return [];
    const stream = circle.reactions.perAccount[mine];
    if (!stream) return [];
    return [...stream.all].flatMap((entry) => {
      const reaction = entry.value;
      if (!reaction?.$isLoaded) return [];
      return [{
        key: `credit:encouragement:${reaction.$jazz.id}`,
        track: "encouragement" as const,
        kind: "credit" as const,
        eventType: "reaction-given",
        circleId: circle.$jazz.id,
        circleName: circle.name,
        circleEmoji: circle.emoji,
        metricValue: 1,
        awardedAt: reaction.createdAt,
      }];
    });
  });
}

function completedCheckpointEnds(circle: LoadedCircle, today: DayKey): DayKey[] {
  const createdDay = toDayKey(new Date(circle.createdAt));
  const yesterday = addDays(today, -1);
  const elapsed = daysBetween(createdDay, yesterday);
  if (elapsed < 6) return [];
  const latestIndex = Math.floor((elapsed - 6) / 7);
  const retained = new Set(lastNDays(30, today));
  return Array.from({ length: latestIndex + 1 }, (_, index) =>
    addDays(createdDay, index * 7 + 6),
  ).filter((end) => retained.has(addDays(end, -6)));
}

function leadershipAwards(
  account: LoadedAccount,
  today: DayKey,
): AchievementRecord[] {
  return account.root.circles.flatMap((circle) => {
    if (!circle?.$isLoaded) return [];
    return completedCheckpointEnds(circle, today).flatMap((end) => {
      const input = circleMetricInput(circle, account.$jazz.id, end);
      const pulse = deriveCirclePulse(input.members, input.habits, end, 7);
      return pulse.honors.flatMap((honor) =>
        honor.holders.some((holder) => holder.id === account.$jazz.id)
          ? [{
              key: `honor:${circle.$jazz.id}:${end}:${honor.honor}:${account.$jazz.id}`,
              track: "leadership" as const,
              kind: "circleHonor" as const,
              eventType: "seven-day-circle-honor",
              honor: honor.honor,
              circleId: circle.$jazz.id,
              circleName: circle.name,
              circleEmoji: circle.emoji,
              metricValue: honor.value,
              awardedAt: new Date(`${end}T23:59:59`).getTime(),
            }]
          : [],
      );
    });
  });
}

function metricForTrack(
  events: readonly AchievementRecord[],
  track: AchievementTrack,
): number {
  if (track === "leadership") {
    return events.filter(
      (event) => event.track === track && event.kind === "circleHonor",
    ).length;
  }
  return achievementMetric(events, track);
}

export function deriveMissingAchievementEvents(
  account: LoadedAccount,
  today: DayKey = todayKey(),
): AchievementRecord[] {
  const existing = readAchievementEvents(account);
  const candidates = dedupeAchievementEvents([
    ...existing,
    ...consistencyCredits(account, today),
    ...teamworkCredits(account, today),
    ...encouragementCredits(account),
    ...leadershipAwards(account, today),
  ]);
  const existingByKey = new Map(existing.map((event) => [event.key, event]));
  const tracks: AchievementTrack[] = [
    "consistency",
    "teamwork",
    "encouragement",
    "leadership",
  ];
  const levels = tracks.flatMap((track) => {
    const metric = metricForTrack(candidates, track);
    const level = levelForMetric(track, metric);
    return Array.from({ length: level }, (_, index): AchievementRecord => {
      const awardedLevel = index + 1;
      return {
        key: `level:${track}:${awardedLevel}`,
        track,
        kind: "trackLevel",
        eventType: "track-level",
        level: awardedLevel,
        metricValue: thresholdForLevel(track, awardedLevel),
        awardedAt: Date.now(),
      };
    });
  });

  return dedupeAchievementEvents([...candidates, ...levels]).filter((event) => {
    const current = existingByKey.get(event.key);
    return !current || event.metricValue > current.metricValue;
  });
}

export function appendAchievementEvents(
  account: LoadedAccount,
  events: readonly AchievementRecord[],
): void {
  for (const event of events) {
    account.root.achievements.$jazz.push(event);
  }
}
