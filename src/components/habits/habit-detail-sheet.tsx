import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatTile } from "@/components/insights/stat-tile";
import { habitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { describeCadence } from "@/lib/cadence";
import { completionRate, momentum } from "@/lib/insights";
import { RETENTION_DAYS, retentionWindow } from "@/lib/retention";
import { PeerRow } from "./peer-row";

interface HabitDetailSheetProps {
  entry: HabitEntry | null;
  myId: string;
  myName: string;
  onOpenChange: (open: boolean) => void;
}

/** Tap a habit → how everyone is actually doing, side by side. */
export function HabitDetailSheet({
  entry,
  myId,
  myName,
  onOpenChange,
}: HabitDetailSheetProps) {
  const stats = useMemo(
    () => (entry ? habitStats(entry, myId, myName) : null),
    [entry, myId, myName],
  );

  const view = useMemo(() => {
    if (!stats) return null;
    const window = retentionWindow(stats.today);
    return {
      window,
      rate: completionRate(window, stats.me.doneDays, stats.createdDay, stats.cadence),
      trend: momentum(stats.today, stats.me.doneDays, stats.createdDay, stats.cadence),
    };
  }, [stats]);

  if (!entry || !stats || !view) return null;

  const delta = Math.round(view.trend.delta * 100);

  return (
    <Sheet open={Boolean(entry)} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-x-0 border-b-0 bg-background"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-xl">{entry.habit.emoji}</span>
            {entry.habit.name}
          </SheetTitle>
          <SheetDescription>
            {entry.circle ? `Shared in ${entry.circle.name}` : "Personal habit"} ·{" "}
            {describeCadence(stats.cadence).toLowerCase()} · last {RETENTION_DAYS} days
          </SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto px-4 pb-8">
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              label={stats.isShared ? "Together" : "Streak"}
              value={String(stats.isShared ? stats.combinedStreak : stats.me.streak)}
              hint="days"
            />
            <StatTile label="Your best" value={String(stats.me.best)} hint="days" />
            <StatTile
              label="Kept"
              value={`${Math.round(view.rate * 100)}%`}
              hint={delta === 0 ? "steady" : `${delta > 0 ? "+" : ""}${delta} pts`}
            />
          </div>

          <div className="flex flex-col gap-4">
            {stats.isShared && (
              <h3 className="text-muted-foreground text-xs font-semibold">Everyone</h3>
            )}
            {stats.members.map((member) => (
              <PeerRow
                key={member.member.id}
                stats={member}
                window={view.window}
                cadence={stats.cadence}
                createdDay={stats.createdDay}
                today={stats.today}
                kind={entry.habit.kind}
                goal={stats.goal}
                completion={completionRate(
                  view.window,
                  member.doneDays,
                  stats.createdDay,
                  stats.cadence,
                )}
              />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
