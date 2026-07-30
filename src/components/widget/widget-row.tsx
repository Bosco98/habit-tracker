import { Check } from "lucide-react";
import { TimerControl } from "@/components/habits/timer-control";
import { valueForDay } from "@/data/checkins";
import { logCheckIn } from "@/data/mutations";
import type { HabitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { isDueDay } from "@/lib/cadence";
import type { DayKey } from "@/lib/days";
import { cn } from "@/lib/utils";

interface WidgetRowProps {
  entry: HabitEntry;
  stats: HabitStats;
  today: DayKey;
}

/** One line of the tray popover: name, run, and a single tap to log it. */
export function WidgetRow({ entry, stats, today }: WidgetRowProps) {
  const { habit } = entry;
  const value = valueForDay(stats.me.log, today);
  const done = value >= stats.goal;
  const isTimer = habit.kind === "timer";
  const dueToday = isDueDay(today, stats.createdDay, stats.cadence);

  if (isTimer) {
    return (
      <li className="stock flex items-center gap-2 rounded-lg py-1.5 pr-1.5 pl-2.5">
        <span aria-hidden className="text-base leading-none">
          {habit.emoji}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{habit.name}</span>
        <TimerControl
          timerId={habit.$jazz.id}
          loggedSeconds={value}
          targetSeconds={stats.goal}
          onLog={(total) => logCheckIn(habit, today, total)}
          label={habit.name}
          disabled={!dueToday}
        />
      </li>
    );
  }

  const act = () => {
    if (!dueToday) return;
    if (habit.kind === "count") {
      logCheckIn(habit, today, done ? 0 : value + 1);
      return;
    }
    logCheckIn(habit, today, done ? 0 : 1);
  };

  return (
    <li>
      <button
        type="button"
        onClick={act}
        disabled={!dueToday}
        aria-pressed={done}
        aria-label={
          dueToday
            ? `Mark ${habit.name} ${done ? "not done" : "done"}`
            : `${habit.name} is not due today`
        }
        title={!dueToday ? "Rest day — this habit is not due today" : undefined}
        className={cn(
          "stock stock-press active:stock-press-active",
          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-0",
          done && "bg-primary text-primary-foreground",
        )}
      >
        <span aria-hidden className="text-base leading-none">
          {habit.emoji}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{habit.name}</span>
        <span className={cn("tnum text-xs", !done && "text-muted-foreground")}>
          {dueToday
            ? `${stats.isShared ? stats.combinedStreak : stats.me.streak}d`
            : "Rest"}
        </span>
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full",
            done ? "text-primary-foreground" : "text-muted-foreground/50",
          )}
        >
          <Check strokeWidth={3} className={cn("size-4", !done && "opacity-40")} />
        </span>
      </button>
    </li>
  );
}
