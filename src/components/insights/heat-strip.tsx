import type { HeatCell } from "@/lib/insights";
import { formatDay } from "@/lib/days";
import { cn } from "@/lib/utils";

interface HeatStripProps {
  cells: HeatCell[];
  /** Grid columns; 7 renders a calendar-style week grid. */
  columns?: number;
}

/** Intensity is carried by opacity over the brand amber, plus a title for a11y. */
export function HeatStrip({ cells, columns }: HeatStripProps) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns ?? cells.length}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`Completion for the last ${cells.length} days`}
    >
      {cells.map((cell) => (
        <span
          key={cell.day}
          title={`${formatDay(cell.day, { month: "short", day: "numeric" })}${
            cell.intensity >= 1 ? " · done" : cell.scheduled ? " · missed" : " · not scheduled"
          }`}
          className={cn(
            "aspect-square rounded-[4px]",
            cell.intensity > 0 ? "bg-primary" : cell.scheduled ? "bg-well" : "bg-well/50",
          )}
          style={cell.intensity > 0 ? { opacity: 0.35 + cell.intensity * 0.65 } : undefined}
        />
      ))}
    </div>
  );
}
