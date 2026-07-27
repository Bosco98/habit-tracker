import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatTile } from "@/components/insights/stat-tile";
import { PeerRow } from "./peer-row";
import { habitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { lastNDays, todayKey, weekDays, weekStart } from "@/lib/days";
import { runDuel } from "@/lib/duels";
import { completionRate } from "@/lib/insights";

interface HabitDetailSheetProps {
  entry: HabitEntry | null;
  myId: string;
  myName: string;
  weekStartsOn: number;
  onOpenChange: (open: boolean) => void;
}

const WINDOW_DAYS = 28;

/** Tap a habit → how everyone is actually doing, side by side. */
export function HabitDetailSheet({
  entry,
  myId,
  myName,
  weekStartsOn,
  onOpenChange,
}: HabitDetailSheetProps) {
  const stats = useMemo(
    () => (entry ? habitStats(entry, myId, myName, weekStartsOn) : null),
    [entry, myId, myName, weekStartsOn],
  );

  const window = useMemo(() => lastNDays(WINDOW_DAYS, todayKey()), []);
  // The full week, matching the circle's duel scoring — one definition of a week.
  const thisWeek = useMemo(
    () => weekDays(weekStart(todayKey(), weekStartsOn)),
    [weekStartsOn],
  );

  const duel = useMemo(() => {
    if (!stats?.isShared) return null;
    return runDuel(
      stats.members.map((member) => ({
        accountId: member.member.id,
        doneDays: member.doneDays,
        values: member.values,
      })),
      stats.schedule,
      thisWeek,
    );
  }, [stats, thisWeek]);

  if (!entry || !stats) return null;

  const leaderName =
    duel && duel.winnerIds.length === 1
      ? duel.winnerIds[0] === myId
        ? "You're"
        : `${stats.members.find((m) => m.member.id === duel.winnerIds[0])?.member.name ?? "Someone"} is`
      : null;

  return (
    <Sheet open={Boolean(entry)} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-xl">{entry.habit.emoji}</span>
            {entry.habit.name}
          </SheetTitle>
          <SheetDescription>
            {entry.circle ? `Shared in ${entry.circle.name}` : "Personal habit"} · last{" "}
            {WINDOW_DAYS} days
          </SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label={stats.isShared ? "Together" : "Streak"}
              value={String(
                stats.isShared ? stats.combinedStreak.count : stats.me.streak.count,
              )}
              hint={stats.me.streak.unit === "weeks" ? "weeks" : "days"}
            />
            <StatTile label="Your best" value={String(stats.me.best.count)} hint="all time" />
            <StatTile
              label="Last 4 weeks"
              value={`${Math.round(
                completionRate(window, stats.me.doneDays, stats.schedule) * 100,
              )}%`}
            />
          </div>

          {duel && (
            <div className="neu-well flex items-center justify-between rounded-2xl bg-well p-3">
              <div>
                <p className="text-sm font-medium">This week</p>
                <p className="text-muted-foreground text-xs">
                  {duel.winnerIds.length === 0
                    ? "Nobody's on the board yet"
                    : duel.isDraw
                      ? "Dead even"
                      : `${leaderName} ahead`}
                </p>
              </div>
              <span className="text-social text-sm font-semibold tabular-nums">
                {duel.ranked.map((score) => `${Math.round(score.completion * 100)}%`).join(" · ")}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {stats.members.map((member) => (
              <PeerRow
                key={member.member.id}
                stats={member}
                window={window}
                schedule={stats.schedule}
                kind={entry.habit.kind}
                goal={stats.goal}
                completion={completionRate(window, member.doneDays, stats.schedule)}
              />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
