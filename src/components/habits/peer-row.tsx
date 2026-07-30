import { PunchStrip } from "@/components/punch-strip";
import type { MemberStats } from "@/data/stats";
import type { Cadence } from "@/lib/cadence";
import type { HabitKind } from "@/lib/completion";
import type { DayKey } from "@/lib/days";
import { formatDuration } from "@/lib/format";
import { heatmap } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface PeerRowProps {
  stats: MemberStats;
  window: DayKey[];
  cadence: Cadence;
  createdDay: DayKey;
  today: DayKey;
  kind: HabitKind;
  goal: number;
  completion: number;
}

function formatValue(kind: HabitKind, value: number): string {
  return kind === "timer" ? formatDuration(value) : String(value);
}

/** One member's line in the side-by-side comparison. */
export function PeerRow({
  stats,
  window,
  cadence,
  createdDay,
  today,
  kind,
  goal,
  completion,
}: PeerRowProps) {
  const partials = new Map(
    [...stats.values].map(([day, value]) => [day, Math.min(1, value / goal)]),
  );
  const cells = heatmap(window, stats.doneDays, partials, createdDay, cadence);
  const name = stats.member.isMe ? "You" : stats.member.name;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn("truncate text-sm font-semibold", stats.member.isMe && "text-primary-strong")}
        >
          {name}
        </span>
        <span className="text-muted-foreground tnum shrink-0 text-xs">
          {Math.round(completion * 100)}% · {stats.streak}d streak
          {kind !== "binary" && (
            <> · {formatValue(kind, [...stats.values.values()].reduce((a, b) => a + b, 0))}</>
          )}
        </span>
      </div>
      <PunchStrip cells={cells} today={today} label={name} />
    </div>
  );
}
