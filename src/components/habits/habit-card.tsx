import { useMemo } from "react";
import { Users } from "lucide-react";
import { PunchStrip } from "@/components/punch-strip";
import { valueForDay } from "@/data/checkins";
import { logCheckIn } from "@/data/mutations";
import { habitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { describeCadence, nextDueDay } from "@/lib/cadence";
import { relativeDay } from "@/lib/days";
import { hueForIndex } from "@/lib/habit-color";
import { heatmap } from "@/lib/insights";
import { retentionWindow } from "@/lib/retention";
import { cn } from "@/lib/utils";
import { CountStepper } from "./count-stepper";
import { HabitMenu } from "./habit-menu";
import { MemberAvatars } from "./member-avatars";
import { PunchButton } from "./punch-button";
import { StreakStamp } from "./streak-stamp";
import { TimerControl } from "./timer-control";

interface HabitCardProps {
  entry: HabitEntry;
  myId: string;
  myName: string;
  /** Drives the colour and the resting tilt. */
  index?: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

/** ±0.5°, deterministic per position — never random, so it survives a re-render. */
const tiltFor = (index: number) => ((index % 3) - 1) * 0.5;

/**
 * Logging is **today only**. There is no day picker and no backfill: a record
 * you can rewrite isn't a record, and the streak stops meaning anything.
 */
export function HabitCard({
  entry,
  myId,
  myName,
  index = 0,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: HabitCardProps) {
  const { habit, circle } = entry;
  const stats = useMemo(() => habitStats(entry, myId, myName), [entry, myId, myName]);
  const hue = hueForIndex(index);
  const today = stats.today;

  const cells = useMemo(
    () =>
      heatmap(
        retentionWindow(today),
        stats.me.doneDays,
        new Map([...stats.me.values].map(([d, v]) => [d, v / stats.goal])),
        stats.createdDay,
        stats.cadence,
      ),
    [stats, today],
  );

  const value = valueForDay(stats.me.log, today);
  const streak = stats.isShared ? stats.combinedStreak : stats.me.streak;
  const dueToday = cells.at(-1)?.due ?? true;
  const nextDue = dueToday ? null : nextDueDay(today, stats.createdDay, stats.cadence);

  const log = (next: number) => logCheckIn(habit, today, next);

  return (
    <article
      className={cn(
        "habit-card stock overflow-hidden rounded-xl",
        "rotate-[var(--tilt)] transition-transform duration-200 hover:rotate-0",
        "motion-reduce:rotate-0",
      )}
      style={{ "--tilt": `${tiltFor(index)}deg` } as React.CSSProperties}
    >
      {/* Colour block: the habit's identity, edge to edge. */}
      <div
        className="border-line flex items-center gap-2 border-b-2 py-1.5 pr-1 pl-3"
        style={{ backgroundColor: hue, color: "var(--on-hue)" }}
      >
        <span aria-hidden className="text-sm leading-none">
          {habit.emoji}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 truncate py-1 text-left text-[13px] leading-none font-extrabold tracking-[-0.01em] uppercase"
        >
          {habit.name}
        </button>
        {circle && (
          <span title={`Shared in ${circle.name}`} className="inline-flex shrink-0 items-center">
            <Users className="size-3.5" strokeWidth={2.5} />
            <span className="sr-only">Shared in {circle.name}</span>
          </span>
        )}
        <HabitMenu
          habitName={habit.name}
          shared={Boolean(circle)}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </div>

      <div className="flex flex-col gap-2.5 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <StreakStamp days={streak} shared={stats.isShared} hue={hue} />

          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-[11px] font-bold uppercase">
              {describeCadence(stats.cadence)}
            </p>
            {nextDue && (
              <p className="text-muted-foreground truncate text-[11px] font-bold uppercase">
                Next {relativeDay(nextDue, today).toLowerCase()}
              </p>
            )}
          </div>

          {habit.kind === "binary" && (
            <PunchButton
              done={value >= stats.goal}
              disabled={!dueToday}
              hue={hue}
              onToggle={() => log(value >= stats.goal ? 0 : 1)}
              label={
                dueToday
                  ? `Mark ${habit.name} ${value >= stats.goal ? "not done" : "done"}`
                  : `${habit.name} is not due today`
              }
            />
          )}
          {habit.kind === "count" && (
            <CountStepper
              value={value}
              target={stats.goal}
              onChange={log}
              label={`Progress for ${habit.name}`}
              disabled={!dueToday}
            />
          )}
          {habit.kind === "timer" && (
            <TimerControl
              timerId={habit.$jazz.id}
              loggedSeconds={value}
              targetSeconds={stats.goal}
              onLog={log}
              label={habit.name}
              disabled={!dueToday}
            />
          )}
        </div>

        <PunchStrip cells={cells} today={today} label={habit.name} hue={hue} />

        {stats.isShared && <MemberAvatars members={stats.members} day={today} />}
      </div>
    </article>
  );
}
