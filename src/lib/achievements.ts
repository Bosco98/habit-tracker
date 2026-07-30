import { isDueDay, type Cadence } from "./cadence";
import { lastNDays, toDayKey, type DayKey } from "./days";

export type AchievementTrack =
  | "consistency"
  | "teamwork"
  | "encouragement"
  | "leadership";
export type CircleHonor = "consistency" | "allIn" | "earlyFinisher";
export type AchievementKind = "credit" | "trackLevel" | "circleHonor";

export interface AchievementRecord {
  key: string;
  track: AchievementTrack;
  kind: AchievementKind;
  eventType: string;
  level?: number;
  honor?: CircleHonor;
  circleId?: string;
  circleName?: string;
  circleEmoji?: string;
  metricValue: number;
  awardedAt: number;
}

export interface CircleMetricMember {
  id: string;
  name: string;
  isMe?: boolean;
}

export interface CircleMetricDay {
  value: number;
  /** Earliest raw save at which the day's goal was reached. */
  firstCompletedAt?: number;
}

export interface CircleMetricHabit {
  id: string;
  createdDay: DayKey;
  cadence: Cadence;
  goal: number;
  memberDays: ReadonlyMap<string, ReadonlyMap<DayKey, CircleMetricDay>>;
}

export interface HonorResult {
  honor: CircleHonor;
  holders: CircleMetricMember[];
  value: number;
  sample: number;
}

export interface CirclePulse {
  currentStreak: number;
  perfectDays: DayKey[];
  perfectToday: boolean;
  honors: HonorResult[];
}

export const TRACK_MULTIPLIER: Record<AchievementTrack, number> = {
  consistency: 10,
  teamwork: 1,
  encouragement: 5,
  leadership: 1,
};

export function triangular(level: number): number {
  const safe = Math.max(0, Math.floor(level));
  return (safe * (safe + 1)) / 2;
}

export function thresholdForLevel(track: AchievementTrack, level: number): number {
  return TRACK_MULTIPLIER[track] * triangular(level);
}

/** Highest uncapped level whose triangular threshold has been met. */
export function levelForMetric(track: AchievementTrack, metric: number): number {
  const units = Math.max(0, metric) / TRACK_MULTIPLIER[track];
  return Math.floor((Math.sqrt(1 + 8 * units) - 1) / 2);
}

export function nextLevelProgress(
  track: AchievementTrack,
  metric: number,
): { level: number; current: number; next: number; progress: number } {
  const level = levelForMetric(track, metric);
  const current = thresholdForLevel(track, level);
  const next = thresholdForLevel(track, level + 1);
  return {
    level,
    current,
    next,
    progress: next === current ? 1 : Math.min(1, (metric - current) / (next - current)),
  };
}

function dayValue(
  habit: CircleMetricHabit,
  memberId: string,
  day: DayKey,
): CircleMetricDay | undefined {
  return habit.memberDays.get(memberId)?.get(day);
}

function complete(habit: CircleMetricHabit, memberId: string, day: DayKey): boolean {
  return (dayValue(habit, memberId, day)?.value ?? 0) >= habit.goal;
}

function maxHolders(
  honor: CircleHonor,
  members: readonly CircleMetricMember[],
  values: ReadonlyMap<string, number>,
  samples: ReadonlyMap<string, number>,
  minimumSample: number,
): HonorResult | null {
  const eligible = members.filter((member) => (samples.get(member.id) ?? 0) >= minimumSample);
  if (eligible.length === 0) return null;
  const value = Math.max(...eligible.map((member) => values.get(member.id) ?? 0));
  return {
    honor,
    holders: eligible.filter((member) => (values.get(member.id) ?? 0) === value),
    value,
    sample: Math.max(
      ...eligible
        .filter((member) => (values.get(member.id) ?? 0) === value)
        .map((member) => samples.get(member.id) ?? 0),
    ),
  };
}

/**
 * The rolling Circle pulse. Today is pending rather than failed until it ends,
 * while completed opportunities and a completed perfect day count immediately.
 */
export function deriveCirclePulse(
  members: readonly CircleMetricMember[],
  habits: readonly CircleMetricHabit[],
  today: DayKey,
  range = 30,
): CirclePulse {
  const window = lastNDays(range, today);
  const perfectDays: DayKey[] = [];
  const dueByDay = new Map(
    window.map((day) => [
      day,
      habits.filter((habit) => isDueDay(day, habit.createdDay, habit.cadence)),
    ]),
  );

  for (const day of window) {
    const due = dueByDay.get(day) ?? [];
    if (
      due.length > 0 &&
      members.length > 0 &&
      members.every((member) =>
        due.every((habit) => complete(habit, member.id, day)),
      )
    ) {
      perfectDays.push(day);
    }
  }

  const perfect = new Set(perfectDays);
  const judgedDays = window.filter((day) => (dueByDay.get(day)?.length ?? 0) > 0);
  let currentStreak = 0;
  for (let index = judgedDays.length - 1; index >= 0; index -= 1) {
    const day = judgedDays[index];
    if (day === today && !perfect.has(day)) continue;
    if (!perfect.has(day)) break;
    currentStreak += 1;
  }

  const completionValues = new Map<string, number>();
  const completionSamples = new Map<string, number>();
  const allInValues = new Map<string, number>();
  const allInSamples = new Map<string, number>();
  const earlyValues = new Map<string, number>();
  const earlySamples = new Map<string, number>();

  for (const member of members) {
    let opportunities = 0;
    let completed = 0;
    let allIn = 0;
    let dueDays = 0;

    for (const day of window) {
      const due = dueByDay.get(day) ?? [];
      if (due.length === 0) continue;
      const completedToday = due.filter((habit) => complete(habit, member.id, day)).length;
      // An unfinished Today cannot lower either rolling metric.
      if (day !== today || completedToday === due.length) {
        opportunities += due.length;
        completed += completedToday;
        dueDays += 1;
        if (completedToday === due.length) allIn += 1;
      }
    }

    completionValues.set(member.id, opportunities === 0 ? 0 : completed / opportunities);
    completionSamples.set(member.id, opportunities);
    allInValues.set(member.id, allIn);
    allInSamples.set(member.id, dueDays);
    earlyValues.set(member.id, 0);
    earlySamples.set(member.id, 0);
  }

  for (const day of window) {
    for (const habit of dueByDay.get(day) ?? []) {
      const finishers = members
        .map((member) => ({
          member,
          at: dayValue(habit, member.id, day)?.firstCompletedAt,
        }))
        .filter(
          (item): item is { member: CircleMetricMember; at: number } =>
            item.at !== undefined && complete(habit, item.member.id, day),
        );
      if (finishers.length < 2) continue;
      const earliest = Math.min(...finishers.map((item) => item.at));
      for (const member of members) {
        earlySamples.set(member.id, (earlySamples.get(member.id) ?? 0) + 1);
      }
      for (const finisher of finishers) {
        if (finisher.at === earliest) {
          earlyValues.set(
            finisher.member.id,
            (earlyValues.get(finisher.member.id) ?? 0) + 1,
          );
        }
      }
    }
  }

  const honors = [
    maxHolders("consistency", members, completionValues, completionSamples, 5),
    maxHolders("allIn", members, allInValues, allInSamples, 1),
    maxHolders("earlyFinisher", members, earlyValues, earlySamples, 1),
  ].filter((honor): honor is HonorResult => honor !== null);

  return {
    currentStreak,
    perfectDays,
    perfectToday: perfect.has(today),
    honors,
  };
}

/** Concurrent devices may append the same deterministic receipt. */
export function dedupeAchievementEvents(
  events: readonly AchievementRecord[],
): AchievementRecord[] {
  const byKey = new Map<string, AchievementRecord>();
  for (const event of events) {
    const current = byKey.get(event.key);
    if (
      !current ||
      event.metricValue > current.metricValue ||
      (event.metricValue === current.metricValue && event.awardedAt < current.awardedAt)
    ) {
      byKey.set(event.key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => b.awardedAt - a.awardedAt);
}

export interface TrophyGroup {
  key: string;
  track: AchievementTrack;
  kind: Exclude<AchievementKind, "credit">;
  honor?: CircleHonor;
  level?: number;
  circleId?: string;
  circleName?: string;
  circleEmoji?: string;
  count: number;
  latestAt: number;
}

export function groupTrophies(events: readonly AchievementRecord[]): TrophyGroup[] {
  const awards = dedupeAchievementEvents(events).filter((event) => event.kind !== "credit");
  const groups = new Map<string, TrophyGroup>();
  for (const event of awards) {
    const key =
      event.kind === "circleHonor"
        ? `${event.honor}|${event.circleId ?? event.circleName ?? "circle"}`
        : `${event.track}|level|${event.level ?? 0}`;
    const current = groups.get(key);
    if (current) {
      current.count += 1;
      current.latestAt = Math.max(current.latestAt, event.awardedAt);
      continue;
    }
    groups.set(key, {
      key,
      track: event.track,
      kind: event.kind as Exclude<AchievementKind, "credit">,
      honor: event.honor,
      level: event.level,
      circleId: event.circleId,
      circleName: event.circleName,
      circleEmoji: event.circleEmoji,
      count: 1,
      latestAt: event.awardedAt,
    });
  }
  return [...groups.values()].sort((a, b) => b.latestAt - a.latestAt);
}

export function achievementMetric(
  events: readonly AchievementRecord[],
  track: AchievementTrack,
): number {
  return dedupeAchievementEvents(events)
    .filter((event) => event.kind === "credit" && event.track === track)
    .reduce((total, event) => total + Math.max(0, event.metricValue), 0);
}

function achievementEventDay(event: AchievementRecord): DayKey {
  const parts = event.key.split(":");
  const keyedDay =
    event.track === "leadership" && event.kind === "circleHonor"
      ? parts[2]
      : event.kind === "credit" &&
          (event.track === "consistency" || event.track === "teamwork")
        ? parts.at(-1)
        : undefined;
  return keyedDay && /^\d{4}-\d{2}-\d{2}$/.test(keyedDay)
    ? (keyedDay as DayKey)
    : toDayKey(new Date(event.awardedAt));
}

/**
 * Live profile progress is limited to retained raw history. Permanent level
 * and honor receipts stay in the trophy cabinet, but cannot inflate this
 * rolling metric after their day leaves the window.
 */
export function rollingAchievementMetric(
  events: readonly AchievementRecord[],
  track: AchievementTrack,
  today: DayKey,
  range = 30,
): number {
  const window = new Set(lastNDays(range, today));
  return dedupeAchievementEvents(events)
    .filter(
      (event) =>
        event.eventType !== "retention-carry" &&
        event.track === track &&
        window.has(achievementEventDay(event)) &&
        (track === "leadership"
          ? event.kind === "circleHonor"
          : event.kind === "credit"),
    )
    .reduce(
      (total, event) =>
        total + (track === "leadership" ? 1 : Math.max(0, event.metricValue)),
      0,
    );
}
