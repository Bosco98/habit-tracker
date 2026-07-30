import { Punch } from "@/components/punch";
import type { DayKey } from "@/lib/days";
import { pulseCells, type HeatCell } from "@/lib/insights";
import { RETENTION_DAYS } from "@/lib/retention";
import { cn } from "@/lib/utils";

interface PunchStripProps {
  cells: HeatCell[];
  today: DayKey;
  /** Announced to screen readers, since the bars themselves are decorative. */
  label: string;
  /** CSS colour for filled days — the habit's own hue. */
  hue?: string;
  className?: string;
}

/**
 * The pulse: one bar per opportunity the habit gave you inside the 30-day
 * window, oldest left, most recent right.
 *
 * It draws *due* days, not calendar days. A weekly habit has four or five
 * marks, not thirty — bars stay wide enough to read instead of collapsing into
 * a dotted line. Bars are right-aligned so "now" is always at the same edge.
 */
export function PunchStrip({ cells, today, label, hue, className }: PunchStripProps) {
  const marks = pulseCells(cells);
  const done = marks.filter((cell) => cell.intensity >= 1).length;

  if (marks.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-[11px] font-bold uppercase", className)}>
        Nothing due yet
      </p>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${label}: ${done} of ${marks.length} done in the last ${RETENTION_DAYS} days`}
      // The baseline is what makes a sparse pulse read as a chart. A new habit
      // has exactly one opportunity, and a lone bar with nothing under it looks
      // like a rendering artefact rather than a data point.
      className={cn(
        "border-line/25 flex h-7 items-stretch justify-end gap-[3px] border-b-2 pb-[3px]",
        className,
      )}
      style={hue ? ({ "--habit-hue": hue } as React.CSSProperties) : undefined}
    >
      {marks.map((cell) => (
        <Punch
          key={cell.day}
          intensity={cell.intensity}
          due={cell.due}
          exists={cell.exists}
          isToday={cell.day === today}
          className="min-w-[3px] max-w-[14px] flex-1"
        />
      ))}
    </div>
  );
}
