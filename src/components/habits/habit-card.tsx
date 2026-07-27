import { useMemo } from "react";
import { Users } from "lucide-react";
import { valueForDay } from "@/data/checkins";
import { logCheckIn } from "@/data/mutations";
import { habitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { todayKey, type DayKey } from "@/lib/days";
import { cn } from "@/lib/utils";
import { CheckPuck } from "./check-puck";
import { CountStepper } from "./count-stepper";
import { HabitMenu } from "./habit-menu";
import { MemberAvatars } from "./member-avatars";
import { SignalChips } from "./signal-chips";
import { StreakFlame } from "./streak-flame";
import { TimerControl } from "./timer-control";

interface HabitCardProps {
  entry: HabitEntry;
  myId: string;
  myName: string;
  day: DayKey;
  weekStartsOn: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function HabitCard({
  entry,
  myId,
  myName,
  day,
  weekStartsOn,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: HabitCardProps) {
  const { habit, circle } = entry;
  const stats = useMemo(
    () => habitStats(entry, myId, myName, weekStartsOn),
    [entry, myId, myName, weekStartsOn],
  );

  const value = valueForDay(stats.me.log, day);
  const streak = stats.isShared ? stats.combinedStreak : stats.me.streak;

  // Overwriting an existing entry on a past day is an edit (soft signal).
  const log = (next: number) =>
    logCheckIn(habit, day, next, {
      edited: stats.me.log.has(day) && day !== todayKey(),
    });

  return (
    <div className="habit-card neu-raised flex items-center gap-3 rounded-2xl bg-card p-3">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${habit.name}`}
        className="neu-well flex size-11 shrink-0 items-center justify-center rounded-full text-xl transition-shadow active:neu-pressed"
      >
        {habit.emoji}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpen}
            className="min-w-0 flex-1 truncate text-left font-medium"
          >
            {habit.name}
          </button>
          {circle && (
            <span
              title={`Shared in ${circle.name}`}
              className="text-social inline-flex shrink-0 items-center gap-1 text-xs"
            >
              <Users className="size-3.5" />
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
        <div className="flex flex-wrap items-center gap-2">
          <StreakFlame streak={streak} shared={stats.isShared} />
          {stats.isShared && <MemberAvatars members={stats.members} day={day} />}
          <SignalChips log={stats.me.log.get(day)} />
        </div>
      </div>

      <div className={cn(habit.kind === "binary" && "pl-1")}>
        {habit.kind === "binary" && (
          <CheckPuck
            done={value >= stats.goal}
            onToggle={() => log(value >= stats.goal ? 0 : 1)}
            label={`Mark ${habit.name} ${value >= stats.goal ? "not done" : "done"}`}
          />
        )}
        {habit.kind === "count" && (
          <CountStepper
            value={value}
            target={stats.goal}
            onChange={log}
            label={`Progress for ${habit.name}`}
          />
        )}
        {habit.kind === "timer" && (
          <TimerControl
            loggedSeconds={value}
            targetSeconds={stats.goal}
            onLog={log}
            label={habit.name}
          />
        )}
      </div>
    </div>
  );
}
