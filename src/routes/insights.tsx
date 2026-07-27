import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { HeatStrip } from "@/components/insights/heat-strip";
import { StatTile } from "@/components/insights/stat-tile";
import { WeekdayBars } from "@/components/insights/weekday-bars";
import { Segmented } from "@/components/segmented";
import { useAppAccount, useHabitEntries } from "@/data/hooks";
import { habitStats } from "@/data/stats";
import { lastNDays, todayKey } from "@/lib/days";
import {
  bestWeekday,
  completionRate,
  heatmap,
  weekdayBreakdown,
} from "@/lib/insights";

const RANGES = [
  { value: "28", label: "4 weeks" },
  { value: "91", label: "3 months" },
  { value: "182", label: "6 months" },
];

const WEEKDAY_NAMES = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

export function Insights() {
  const account = useAppAccount();
  const { personal, shared } = useHabitEntries(account);
  const [range, setRange] = useState("91");

  const entries = useMemo(() => [...personal, ...shared], [personal, shared]);
  const window = useMemo(() => lastNDays(Number(range), todayKey()), [range]);

  const myId = account.$isLoaded ? account.$jazz.id : "";
  const myName = account.$isLoaded ? (account.profile.name ?? "You") : "You";
  const weekStartsOn = account.$isLoaded ? account.root.settings.weekStartsOn : 1;

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const stats = habitStats(entry, myId, myName, weekStartsOn);
        const partials = new Map(
          [...stats.me.values].map(([day, value]) => [day, Math.min(1, value / stats.goal)]),
        );
        return {
          entry,
          stats,
          cells: heatmap(window, stats.me.doneDays, partials, stats.schedule),
          rate: completionRate(window, stats.me.doneDays, stats.schedule),
        };
      }),
    [entries, myId, myName, weekStartsOn, window],
  );

  const overall = useMemo(() => {
    if (rows.length === 0) return { rate: 0, best: null, longest: 0 };
    const rate = rows.reduce((sum, row) => sum + row.rate, 0) / rows.length;
    const allDone = new Set(rows.flatMap((row) => [...row.stats.me.doneDays]));
    const best = bestWeekday(weekdayBreakdown(window, allDone, { type: "daily" }));
    const longest = Math.max(...rows.map((row) => row.stats.me.best.count));
    return { rate, best, longest };
  }, [rows, window]);

  if (!account.$isLoaded) return null;

  if (entries.length === 0) {
    return (
      <EmptyState
        emoji="📊"
        title="Nothing to show yet"
        hint="Track a habit for a few days and the patterns show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Segmented label="Time range" value={range} onChange={setRange} options={RANGES} />

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Completion" value={`${Math.round(overall.rate * 100)}%`} hint="average" />
        <StatTile label="Longest streak" value={String(overall.longest)} hint="all time" />
        <StatTile
          label="Best day"
          value={overall.best ? WEEKDAY_NAMES[overall.best.weekday].slice(0, 3) : "—"}
          hint={overall.best ? `${Math.round(overall.best.rate * 100)}%` : "no data"}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground px-1 text-xs font-medium">By habit</h2>
        {rows.map((row) => (
          <div
            key={row.entry.habit.$jazz.id}
            className="neu-raised flex flex-col gap-2.5 rounded-2xl bg-card p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{row.entry.habit.emoji}</span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {row.entry.habit.name}
              </p>
              <span className="text-muted-foreground text-xs tabular-nums">
                {Math.round(row.rate * 100)}% · 🔥{row.stats.me.streak.count}
              </span>
            </div>
            <HeatStrip cells={row.cells} columns={Math.min(row.cells.length, 26)} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground px-1 text-xs font-medium">
          When you actually show up
        </h2>
        <div className="neu-raised rounded-2xl bg-card p-3">
          <WeekdayBars
            stats={weekdayBreakdown(
              window,
              new Set(rows.flatMap((row) => [...row.stats.me.doneDays])),
              { type: "daily" },
            )}
            weekStartsOn={weekStartsOn}
          />
        </div>
      </section>
    </div>
  );
}
