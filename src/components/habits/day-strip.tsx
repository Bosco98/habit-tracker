import { formatDay, type DayKey } from "@/lib/days";
import { cn } from "@/lib/utils";

interface DayStripProps {
  days: DayKey[];
  selected: DayKey;
  today: DayKey;
  onSelect: (day: DayKey) => void;
}

/** Horizontal well of pressable day pucks; selecting a past day enables backfill. */
export function DayStrip({ days, selected, today, onSelect }: DayStripProps) {
  return (
    <div role="tablist" aria-label="Day" className="neu-well flex gap-1 rounded-full bg-well p-1.5">
      {days.map((day) => {
        const isSelected = day === selected;
        const isToday = day === today;
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={formatDay(day, { weekday: "long", month: "long", day: "numeric" })}
            onClick={() => onSelect(day)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-shadow duration-200",
              isSelected && "neu-raised bg-background",
            )}
          >
            <span className="text-muted-foreground text-[11px]">
              {formatDay(day, { weekday: "narrow" })}
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                isToday ? "text-primary-strong" : "text-foreground",
              )}
            >
              {Number(day.slice(-2))}
            </span>
            <span
              aria-hidden
              className={cn("size-1 rounded-full", isToday ? "bg-primary-strong" : "bg-transparent")}
            />
          </button>
        );
      })}
    </div>
  );
}
