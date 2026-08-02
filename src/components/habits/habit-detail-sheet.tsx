import { useMemo } from "react";
import { AppIcon } from "@/components/app-icon";
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
import { relativeDay } from "@/lib/days";
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

  const notes = useMemo(
    () =>
      stats
        ? stats.members
            .flatMap((member) =>
              [...member.log].flatMap(([day, log]) =>
                log.note
                  ? [{
                      key: `${member.member.id}-${day}`,
                      memberName: member.member.isMe ? "You" : member.member.name,
                      day,
                      note: log.note,
                      loggedAt: log.loggedAt,
                    }]
                  : [],
              ),
            )
            .sort((a, b) => b.loggedAt - a.loggedAt)
            .slice(0, 10)
        : [],
    [stats],
  );

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
            <AppIcon value={entry.habit.emoji} className="size-5" strokeWidth={2.4} />
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

          {notes.length > 0 && (
            <section className="flex flex-col gap-2" aria-labelledby="check-in-notes-title">
              <h3
                id="check-in-notes-title"
                className="text-muted-foreground text-xs font-semibold"
              >
                Check-in notes
              </h3>
              <ul className="flex flex-col gap-2">
                {notes.map((note) => (
                  <li key={note.key} className="stock-flat rounded-lg px-3 py-2.5">
                    <p className="text-muted-foreground text-[11px] font-semibold">
                      {note.memberName} · {relativeDay(note.day, stats.today)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed break-words">{note.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
