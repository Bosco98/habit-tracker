import type { CSSProperties } from "react";
import type { AggregateHeatCell } from "@/lib/insights";
import { relativeDay } from "@/lib/days";
import { cn } from "@/lib/utils";

interface InsightHeatmapProps {
  cells: AggregateHeatCell[];
  today: string;
  label: string;
  hue?: string;
  compact?: boolean;
}

export function InsightHeatmap({
  cells,
  today,
  label,
  hue = "var(--hue-blue)",
  compact = false,
}: InsightHeatmapProps) {
  const columns = Math.min(10, Math.max(1, cells.length));

  return (
    <div
      role="group"
      aria-label={`${label}, ${cells.length}-day activity heatmap`}
      className={cn(
        "mx-auto flex w-full flex-col gap-2.5",
        compact ? "max-w-44" : "max-w-sm",
      )}
      style={{ "--heat-hue": hue } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-8">
        <span className="text-muted-foreground text-[11px] font-semibold">
          {cells.length === 7 ? "7 days ago" : `${cells.length - 1} days ago`}
        </span>
        <span className="text-muted-foreground text-[11px] font-semibold">Today</span>
      </div>

      <div
        className={cn("grid gap-1", compact && "gap-0.5")}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const relative = relativeDay(cell.day, today);
          const progress =
            cell.due === 0
              ? "nothing due"
              : `${cell.completed} of ${cell.due} due goals completed${
                  cell.partial > 0 ? `, ${cell.partial} in progress` : ""
                }`;
          return (
            <span
              key={cell.day}
              role="img"
              tabIndex={0}
              aria-label={`${relative}: ${progress}`}
              title={`${relative}: ${progress}`}
              className={cn(
                "border-line aspect-square rounded-[3px] border-2 outline-none",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
                cell.day === today && "ring-2 ring-[var(--heat-hue)] ring-offset-1",
              )}
              style={{
                backgroundColor:
                  cell.due === 0
                    ? "transparent"
                    : heatColor(cell.intensity, cell.partial > 0),
              }}
            />
          );
        })}
      </div>

      {!compact && (
        <div className="text-muted-foreground flex items-center justify-center gap-1 text-[10px]">
          Less
          {[0.2, 0.45, 0.7, 1].map((intensity) => (
            <span
              key={intensity}
              aria-hidden
              className="border-line size-2.5 rounded-[2px] border"
              style={{ backgroundColor: heatColor(intensity, false) }}
            />
          ))}
          More
        </div>
      )}
    </div>
  );
}

function heatColor(intensity: number, partial: boolean): string {
  if (intensity >= 1) return "var(--heat-hue)";
  if (intensity > 0) {
    const mix = Math.round(25 + intensity * 65);
    return `color-mix(in oklch, var(--heat-hue) ${mix}%, var(--hole))`;
  }
  if (partial) return "color-mix(in oklch, var(--heat-hue) 25%, var(--hole))";
  return "var(--hole)";
}
