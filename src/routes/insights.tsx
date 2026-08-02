import { useMemo, useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { HabitInsightRow } from "@/components/insights/habit-insight-row";
import {
  HabitComparisonChart,
  HabitSpiderChart,
} from "@/components/insights/insight-charts";
import { InsightControls } from "@/components/insights/insight-controls";
import { InsightHeatmap } from "@/components/insights/insight-heatmap";
import { InsightSummary } from "@/components/insights/insight-summary";
import type { HabitInsightView } from "@/components/insights/types";
import { TopBar } from "@/components/top-bar";
import { useAppAccount, useHabitEntries } from "@/data/hooks";
import { habitStats } from "@/data/stats";
import { dueDaysIn } from "@/lib/cadence";
import { lastNDays, todayKey } from "@/lib/days";
import { hueForIndex } from "@/lib/habit-color";
import {
  aggregateHeatmap,
  aggregateOpportunities,
  compareInsightStrength,
  insightStatus,
  momentum,
  opportunitySummary,
  volumeSummary,
  type InsightFilter,
  type InsightRange,
  type InsightSeries,
} from "@/lib/insights";

export function Insights() {
  const account = useAppAccount();
  const { personal, shared } = useHabitEntries(account);
  const [filter, setFilter] = useState<InsightFilter>("all");
  const [range, setRange] = useState<InsightRange>(7);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = todayKey();
  const window = useMemo(() => lastNDays(range, today), [range, today]);
  const historyWindow = useMemo(() => lastNDays(30, today), [today]);
  const myId = account.$isLoaded ? account.$jazz.id : "";
  const myName = account.$isLoaded ? (account.profile.name ?? "You") : "You";

  const indexedEntries = useMemo(
    () => [...personal, ...shared].map((entry, index) => ({ entry, index })),
    [personal, shared],
  );

  const visibleEntries = useMemo(
    () =>
      indexedEntries.filter(({ entry }) =>
        filter === "all"
          ? true
          : filter === "shared"
            ? Boolean(entry.circle)
            : !entry.circle,
      ),
    [indexedEntries, filter],
  );

  const rows = useMemo<HabitInsightView[]>(
    () =>
      visibleEntries
        .map(({ entry, index }) => {
          const stats = habitStats(entry, myId, myName);
          const series: InsightSeries = {
            createdDay: stats.createdDay,
            cadence: stats.cadence,
            goal: stats.goal,
            doneDays: stats.me.doneDays,
            values: stats.me.values,
          };
          const summary = opportunitySummary(window, series, today);
          const trend = momentum(
            today,
            stats.me.doneDays,
            stats.createdDay,
            stats.cadence,
          );
          const judgedDueDays = dueDaysIn(window, stats.createdDay, stats.cadence).filter(
            (day) => day !== today || stats.me.doneDays.has(day),
          );
          return {
            entry,
            stats,
            index,
            hue: hueForIndex(index),
            window,
            series,
            summary,
            trend,
            volume: volumeSummary(window, stats.me.values, stats.me.doneDays),
            status: insightStatus(summary, trend, judgedDueDays, stats.me.doneDays),
            heatmap: aggregateHeatmap(historyWindow, [series]),
          };
        })
        .sort((a, b) =>
          compareInsightStrength(
            {
              opportunities: a.summary.due,
              rate: a.summary.rate,
              momentum: a.trend.delta,
              currentStreak: a.stats.me.streak,
              index: a.index,
            },
            {
              opportunities: b.summary.due,
              rate: b.summary.rate,
              momentum: b.trend.delta,
              currentStreak: b.stats.me.streak,
              index: b.index,
            },
          ),
        ),
    [visibleEntries, myId, myName, window, historyWindow, today],
  );

  const overview = useMemo(() => {
    const series = rows.map((row) => row.series);
    const comparison = lastNDays(14, today);
    const previousWindow = comparison.slice(0, 7);
    const recentWindow = comparison.slice(7);
    const previous = aggregateOpportunities(previousWindow, series, today);
    const recent = aggregateOpportunities(recentWindow, series, today);
    return {
      summary: aggregateOpportunities(window, series, today),
      momentum:
        recent.due < 3 || previous.due < 3 ? null : recent.rate - previous.rate,
      heatmap: aggregateHeatmap(historyWindow, series),
    };
  }, [rows, today, window, historyWindow]);

  if (!account.$isLoaded) return null;

  if (indexedEntries.length === 0) {
    return (
      <>
        <TopBar title="Insights" progress={null} />
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-4 pb-24 md:pb-8">
          <EmptyState
            icon={<ChartNoAxesCombined className="size-6" strokeWidth={2.5} />}
            title="Nothing to show yet"
            hint="Track a habit for a few days and the patterns show up here."
          />
        </div>
      </>
    );
  }

  const changeFilter = (next: InsightFilter) => {
    setFilter(next);
    setExpandedId(null);
  };

  return (
    <>
      <TopBar title="Insights" progress={null} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-4 pb-24 md:pb-8">
        <InsightControls
          filter={filter}
          range={range}
          personalCount={personal.length}
          sharedCount={shared.length}
          onFilterChange={changeFilter}
          onRangeChange={setRange}
        />

        {rows.length === 0 ? (
          <section className="stock-flat rounded-xl px-4 py-10 text-center">
            <p className="font-extrabold">
              {filter === "shared" ? "No shared habits yet." : "No personal habits yet."}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Switch the filter to see the habits you already track.
            </p>
          </section>
        ) : (
          <>
            <InsightSummary
              summary={overview.summary}
              momentum={overview.momentum}
              range={range}
            />

            <div className="grid items-stretch gap-3 md:grid-cols-2">
              <HabitSpiderChart rows={rows} />
              <section className="stock flex flex-col gap-3 rounded-xl p-4">
                <div>
                  <h2 className="text-sm font-extrabold">Daily consistency</h2>
                  <p className="text-muted-foreground text-xs">
                    Your 30-day record. Darker squares mean more due goals were completed.
                  </p>
                </div>
                <InsightHeatmap
                  cells={overview.heatmap}
                  today={today}
                  label="Overall consistency"
                />
              </section>
              <HabitComparisonChart rows={rows} />
            </div>

            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <h2 className="text-sm font-extrabold">Habits</h2>
                <p className="text-muted-foreground text-xs">Strongest first</p>
              </div>
              <div className="grid items-start gap-3 xl:grid-cols-2">
                {rows.map((row) => {
                  const id = row.entry.habit.$jazz.id;
                  return (
                    <HabitInsightRow
                      key={id}
                      row={row}
                      open={expandedId === id}
                      onToggle={() =>
                        setExpandedId((current) => (current === id ? null : id))
                      }
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
