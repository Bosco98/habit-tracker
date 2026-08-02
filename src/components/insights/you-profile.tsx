import { useMemo, useState } from "react";
import { Award, Crown, Heart, ShieldCheck, Sparkles, Trophy, UserRound, Users } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import {
  currentCirclePulse,
  readAchievementEvents,
} from "@/data/achievements";
import { habitStats } from "@/data/stats";
import type { HabitEntry, LoadedAccount } from "@/data/types";
import {
  dedupeAchievementEvents,
  groupTrophies,
  nextLevelProgress,
  rollingAchievementMetric,
  type AchievementTrack,
  type CircleHonor,
} from "@/lib/achievements";
import { lastNDays, type DayKey } from "@/lib/days";
import {
  aggregateOpportunities,
  type InsightSeries,
} from "@/lib/insights";
import { cn } from "@/lib/utils";

interface YouProfileProps {
  account: LoadedAccount;
  entries: HabitEntry[];
  myId: string;
  myName: string;
  today: DayKey;
}

const trackCopy: Record<
  AchievementTrack,
  { label: string; unit: string; icon: typeof Trophy }
> = {
  consistency: { label: "Consistency", unit: "due goals", icon: ShieldCheck },
  teamwork: { label: "Teamwork", unit: "perfect days", icon: Users },
  encouragement: { label: "Encouragement", unit: "reactions", icon: Heart },
  leadership: { label: "Leadership", unit: "honors", icon: Crown },
};

const honorLabel: Record<CircleHonor, string> = {
  consistency: "Consistency",
  allIn: "All-in",
  earlyFinisher: "Early Finisher",
};

export function YouProfile({
  account,
  entries,
  myId,
  myName,
  today,
}: YouProfileProps) {
  const [cabinetFilter, setCabinetFilter] = useState<"personal" | "circles">(
    "personal",
  );
  const events = useMemo(() => readAchievementEvents(account), [account]);
  const unique = useMemo(() => dedupeAchievementEvents(events), [events]);
  const trophies = useMemo(() => groupTrophies(unique), [unique]);
  const totalTrophies = unique.filter((event) => event.kind !== "credit").length;

  const consistency = useMemo(() => {
    const window = lastNDays(30, today);
    const series: InsightSeries[] = entries.map((entry) => {
      const stats = habitStats(entry, myId, myName);
      return {
        createdDay: stats.createdDay,
        cadence: stats.cadence,
        goal: stats.goal,
        doneDays: stats.me.doneDays,
        values: stats.me.values,
      };
    });
    const summary = aggregateOpportunities(window, series, today);
    const status =
      summary.due < 5
        ? "Gathering"
        : summary.rate >= 0.8
          ? "Steady"
          : summary.rate >= 0.6
            ? "Building"
            : "Rebuilding";
    return { ...summary, status };
  }, [entries, myId, myName, today]);

  const circlePulses = useMemo(
    () =>
      account.root.circles.flatMap((circle) => {
        if (!circle?.$isLoaded) return [];
        return [{
          circle,
          pulse: currentCirclePulse(circle, myId, today),
        }];
      }),
    [account, myId, today],
  );

  const liveHonors = useMemo(
    () =>
      circlePulses.flatMap(({ circle, pulse }) =>
        pulse.honors.flatMap((honor) =>
          honor.holders.some((holder) => holder.id === myId)
            ? [{
                key: `${circle.$jazz.id}:${honor.honor}`,
                circleName: circle.name,
                circleEmoji: circle.emoji,
                honor: honor.honor,
              }]
            : [],
        ),
      ),
    [circlePulses, myId],
  );

  const metrics: Record<AchievementTrack, number> = {
    consistency: consistency.completed,
    teamwork: circlePulses.reduce(
      (total, { pulse }) => total + pulse.perfectDays.length,
      0,
    ),
    encouragement: rollingAchievementMetric(unique, "encouragement", today),
    leadership: rollingAchievementMetric(unique, "leadership", today),
  };
  const visibleTrophies = trophies.filter((trophy) =>
    cabinetFilter === "personal"
      ? trophy.kind === "trackLevel"
      : trophy.kind === "circleHonor",
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="you-profile-title">
      <div className="stock overflow-hidden rounded-xl">
        <div className="bg-chart-1 text-primary-foreground flex flex-wrap items-center gap-4 p-4">
          <div className="border-line flex size-12 items-center justify-center rounded-xl border-2 bg-white text-black">
            <UserRound className="size-6" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="you-profile-title" className="truncate text-xl font-black">
              {myName}
            </h2>
            <p className="text-sm font-semibold">
              30-day consistency · {consistency.status}
              {consistency.due > 0 && ` · ${Math.round(consistency.rate * 100)}%`}
            </p>
          </div>
          <div className="border-line rounded-lg border-2 bg-white px-3 py-2 text-center text-black">
            <Trophy className="mx-auto size-4" />
            <p className="tnum text-xl font-black">{totalTrophies}</p>
            <p className="text-[10px] font-bold uppercase">All-time trophies</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          {(Object.keys(trackCopy) as AchievementTrack[]).map((track) => {
            const copy = trackCopy[track];
            const progress = nextLevelProgress(track, metrics[track]);
            const Icon = copy.icon;
            return (
              <article key={track} className="bg-well border-line rounded-lg border-2 p-3">
                <div className="flex items-center gap-1.5">
                  <Icon className="mt-0.5 size-3.5 shrink-0" />
                  <p className="min-w-0 flex-1 text-xs font-extrabold">{copy.label}</p>
                </div>
                <p className="tnum mt-1 text-sm font-black">
                  Level {progress.level} · 30d
                </p>
                <div className="border-line mt-1 h-2 overflow-hidden rounded-full border-2 bg-card">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(3, progress.progress * 100)}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-[10px] font-semibold">
                  {metrics[track]} / {progress.next} {copy.unit} · last 30 days
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <section className="stock rounded-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold">Trophy cabinet</h3>
            <p className="text-muted-foreground text-xs">
              Permanent milestones and seven-day Circle honors.
            </p>
          </div>
          <div className="border-line flex rounded-lg border-2 bg-well p-0.5">
            {(["personal", "circles"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCabinetFilter(filter)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-extrabold capitalize",
                  cabinetFilter === filter && "bg-foreground text-background",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {cabinetFilter === "circles" && liveHonors.length > 0 && (
          <div className="mt-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">
              Held right now
            </p>
            <div className="flex flex-wrap gap-1.5">
              {liveHonors.map((honor) => (
                <span
                  key={honor.key}
                  className="bg-chart-4 text-primary-foreground border-line rounded-full border-2 px-2.5 py-1 text-xs font-extrabold"
                >
                  <AppIcon
                    value={honor.circleEmoji}
                    kind="circle"
                    className="mr-1 inline size-3.5"
                  />
                  {honorLabel[honor.honor]} · {honor.circleName}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibleTrophies.length === 0 ? (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 rounded-lg bg-well p-3 text-sm">
            <Sparkles className="size-4 shrink-0" />
            {cabinetFilter === "personal"
              ? "Your first track level will land here."
              : "Complete a seven-day Circle checkpoint to earn an honor."}
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleTrophies.map((trophy) => (
              <article
                key={trophy.key}
                className="border-line flex items-center gap-3 rounded-lg border-2 p-3"
              >
                <span className="bg-chart-3 text-primary-foreground border-line flex size-9 items-center justify-center rounded-lg border-2">
                  {trophy.kind === "circleHonor" ? (
                    trophy.circleEmoji ? (
                      <AppIcon value={trophy.circleEmoji} kind="circle" className="size-4" />
                    ) : (
                      <Award className="size-4" />
                    )
                  ) : (
                    <Trophy className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">
                    {trophy.kind === "circleHonor" && trophy.honor
                      ? honorLabel[trophy.honor]
                      : `${trackCopy[trophy.track].label} · Level ${trophy.level}`}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {trophy.circleName ?? "Personal milestone"}
                  </p>
                </div>
                {trophy.count > 1 && (
                  <span className="tnum text-sm font-black">×{trophy.count}</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
