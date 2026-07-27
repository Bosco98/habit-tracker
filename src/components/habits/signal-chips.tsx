import type { DayLog } from "@/data/checkins";

interface SignalChipsProps {
  log: DayLog | undefined;
}

const chipStyle =
  "text-muted-foreground rounded-full bg-well px-2 py-0.5 text-[11px] leading-tight";

/**
 * Facts about how a check-in was logged — never accusations.
 * The honesty model is transparency, not enforcement.
 */
export function SignalChips({ log }: SignalChipsProps) {
  if (!log) return null;

  const chips: string[] = [];
  if (log.backfilled) chips.push("backfilled");
  if (log.editedAt !== undefined) chips.push("edited");
  if (!log.backfilled) {
    const hour = new Date(log.loggedAt).getHours();
    if (hour >= 23) chips.push("late night");
  }
  if (chips.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span key={chip} className={chipStyle}>
          {chip}
        </span>
      ))}
    </span>
  );
}
