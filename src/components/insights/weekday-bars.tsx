import type { WeekdayStat } from "@/lib/insights";

interface WeekdayBarsProps {
  stats: WeekdayStat[];
  weekStartsOn: number;
}

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WeekdayBars({ stats, weekStartsOn }: WeekdayBarsProps) {
  const ordered = Array.from({ length: 7 }, (_, i) => stats[(weekStartsOn + i) % 7]);

  return (
    <div className="flex items-end gap-1.5">
      {ordered.map((stat) => (
        <div key={stat.weekday} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="neu-well flex h-20 w-full items-end overflow-hidden rounded-lg"
            title={`${NAMES[stat.weekday]}: ${Math.round(stat.rate * 100)}%`}
          >
            <div
              className="bg-primary w-full rounded-lg transition-[height] duration-300"
              style={{ height: `${Math.max(stat.rate * 100, stat.done > 0 ? 8 : 0)}%` }}
            />
          </div>
          <span className="text-muted-foreground text-[11px]">{LETTERS[stat.weekday]}</span>
        </div>
      ))}
    </div>
  );
}
