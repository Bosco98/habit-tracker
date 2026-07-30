import type {
  AchievementRecord,
  AchievementTrack,
  CircleHonor,
} from "./achievements";

export type TrophyAward = AchievementRecord & {
  kind: "trackLevel" | "circleHonor";
};

const trackLabel: Record<AchievementTrack, string> = {
  consistency: "Consistency",
  teamwork: "Teamwork",
  encouragement: "Encouragement",
  leadership: "Leadership",
};

const trackUnit: Record<AchievementTrack, [singular: string, plural: string]> = {
  consistency: ["completed due goal", "completed due goals"],
  teamwork: ["perfect Circle day", "perfect Circle days"],
  encouragement: ["reaction given", "reactions given"],
  leadership: ["Circle honor", "Circle honors"],
};

const honorLabel: Record<CircleHonor, string> = {
  consistency: "Consistency",
  allIn: "All In",
  earlyFinisher: "Early Finisher",
};

export function isTrophyAward(event: AchievementRecord): event is TrophyAward {
  return event.kind === "trackLevel" || event.kind === "circleHonor";
}

/** Marks every observed award seen and returns new ones oldest-first. */
export function unseenTrophyAwards(
  events: readonly AchievementRecord[],
  seen: Set<string>,
): TrophyAward[] {
  const fresh: TrophyAward[] = [];
  for (const event of [...events].sort((a, b) => a.awardedAt - b.awardedAt)) {
    if (!isTrophyAward(event) || seen.has(event.key)) continue;
    seen.add(event.key);
    fresh.push(event);
  }
  return fresh;
}

/**
 * A single action can cross several old level thresholds. Celebrate the
 * highest newly unlocked level per track instead of trapping the user in a
 * long stack of consecutive overlays.
 */
export function collapseTrophyAwards(events: readonly TrophyAward[]): TrophyAward[] {
  const byKey = new Map<string, TrophyAward>();
  for (const event of events) {
    const key =
      event.kind === "trackLevel"
        ? `track:${event.track}`
        : `honor:${event.key}`;
    const current = byKey.get(key);
    if (
      !current ||
      (event.kind === "trackLevel" &&
        (event.level ?? 0) > (current.level ?? 0))
    ) {
      byKey.set(key, event);
    }
  }
  return [...byKey.values()].sort((a, b) => a.awardedAt - b.awardedAt);
}

export function trophyCelebrationCopy(award: TrophyAward): {
  eyebrow: string;
  title: string;
  detail: string;
} {
  if (award.kind === "circleHonor") {
    return {
      eyebrow: "Circle honor earned",
      title: award.honor ? honorLabel[award.honor] : "New honor",
      detail: award.circleName
        ? `${award.circleEmoji ?? "🤝"} ${award.circleName} · Seven-day checkpoint`
        : "A new Circle honor is in your cabinet.",
    };
  }
  return {
    eyebrow: "Trophy unlocked",
    title: `${trackLabel[award.track]} · Level ${award.level ?? 1}`,
    detail: `You reached ${award.metricValue} ${
      trackUnit[award.track][award.metricValue === 1 ? 0 : 1]
    }.`,
  };
}
