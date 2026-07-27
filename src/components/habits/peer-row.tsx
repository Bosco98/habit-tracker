import { HeatStrip } from "@/components/insights/heat-strip";
import type { MemberStats } from "@/data/stats";
import { formatDuration } from "@/lib/format";
import { heatmap } from "@/lib/insights";
import type { DayKey } from "@/lib/days";
import type { HabitKind } from "@/lib/completion";
import type { ScheduleSpec } from "@/lib/streaks";
import { cn } from "@/lib/utils";

interface PeerRowProps {
  stats: MemberStats;
  window: DayKey[];
  schedule: ScheduleSpec;
  kind: HabitKind;
  goal: number;
  completion: number;
}

function formatValue(kind: HabitKind, value: number): string {
  if (kind === "timer") return formatDuration(value);
  return String(value);
}

/** One member's line in the side-by-side comparison. */
export function PeerRow({ stats, window, schedule, kind, goal, completion }: PeerRowProps) {
  const partials = new Map(
    [...stats.values].map(([day, value]) => [day, Math.min(1, value / goal)]),
  );
  const cells = heatmap(window, stats.doneDays, partials, schedule);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("truncate text-sm font-medium", stats.member.isMe && "text-primary-strong")}>
          {stats.member.isMe ? "You" : stats.member.name}
        </span>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {Math.round(completion * 100)}% · 🔥{stats.streak.count}
          {kind !== "binary" && (
            <> · {formatValue(kind, [...stats.values.values()].reduce((a, b) => a + b, 0))}</>
          )}
        </span>
      </div>
      <HeatStrip cells={cells} />
    </div>
  );
}
