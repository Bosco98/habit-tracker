import type { InsightFilter, InsightRange } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface InsightControlsProps {
  filter: InsightFilter;
  range: InsightRange;
  personalCount: number;
  sharedCount: number;
  onFilterChange: (filter: InsightFilter) => void;
  onRangeChange: (range: InsightRange) => void;
}

const filters: { value: InsightFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "personal", label: "Personal" },
  { value: "shared", label: "Shared" },
];

const ranges: InsightRange[] = [7, 14, 30];

export function InsightControls({
  filter,
  range,
  personalCount,
  sharedCount,
  onFilterChange,
  onRangeChange,
}: InsightControlsProps) {
  const countFor = (value: InsightFilter) =>
    value === "personal"
      ? personalCount
      : value === "shared"
        ? sharedCount
        : personalCount + sharedCount;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div
        role="radiogroup"
        aria-label="Habit ownership"
        className="stock-flat flex min-w-0 gap-1 rounded-lg p-1"
      >
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={filter === option.value}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold outline-none",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset",
              filter === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            <span className="tnum text-[11px] opacity-70">{countFor(option.value)}</span>
          </button>
        ))}
      </div>

      <div
        role="radiogroup"
        aria-label="Insight range"
        className="stock-flat flex gap-1 self-end rounded-lg p-1 md:self-auto"
      >
        {ranges.map((days) => (
          <button
            key={days}
            type="button"
            role="radio"
            aria-checked={range === days}
            onClick={() => onRangeChange(days)}
            className={cn(
              "tnum rounded-md px-3 py-2 text-sm font-semibold outline-none",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset",
              range === days
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {days}d
          </button>
        ))}
      </div>
    </div>
  );
}
