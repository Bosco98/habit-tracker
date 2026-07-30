import { ChevronDown, Users } from "lucide-react";
import { dueDaysIn } from "@/lib/cadence";
import { formatDuration } from "@/lib/format";
import {
  aggregateHeatmap,
  insightStatus,
  momentum,
  opportunitySummary,
  type InsightSeries,
  type InsightStatus,
} from "@/lib/insights";
import { intersectDoneDays } from "@/lib/shared";
import { cn } from "@/lib/utils";
import { InsightHeatmap } from "./insight-heatmap";
import type { HabitInsightView } from "./types";

interface HabitInsightRowProps {
  row: HabitInsightView;
  open: boolean;
  onToggle: () => void;
}

const statusLabel: Record<InsightStatus, string> = {
  gathering: "Gathering data",
  building: "Building",
  steady: "Steady",
  rebuilding: "Rebuilding",
  mixed: "Mixed",
};

export function HabitInsightRow({ row, open, onToggle }: HabitInsightRowProps) {
  const { habit, circle } = row.entry;
  const rate = row.summary.due === 0 ? null : Math.round(row.summary.rate * 100);
  const points = Math.round(row.trend.delta * 100);
  const panelId = `insight-${habit.$jazz.id}`;

  return (
    <article className="stock overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-3 p-3 text-left outline-none",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-inset",
        )}
      >
        <span
          aria-hidden
          className="border-line flex size-9 shrink-0 items-center justify-center rounded-lg border-2 text-lg"
          style={{ backgroundColor: row.hue, color: "var(--on-hue)" }}
        >
          {habit.emoji}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-extrabold">{habit.name}</span>
            {circle && (
              <span
                className="text-muted-foreground inline-flex min-w-0 items-center gap-1 text-[11px] font-semibold"
                title={`Shared in ${circle.name}`}
              >
                <Users className="size-3" />
                <span className="max-w-24 truncate">{circle.name}</span>
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            <Status status={row.status} />
            <span className="tnum">{row.stats.me.streak} due-day run</span>
            <span className="tnum">
              {row.status === "gathering"
                ? "baseline forming"
                : points === 0
                  ? "flat"
                  : `${points > 0 ? "+" : ""}${points} pts`}
            </span>
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="tnum block text-base font-black">{rate === null ? "—" : `${rate}%`}</span>
          <span className="text-muted-foreground block text-[10px] font-semibold">kept</span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div id={panelId} className="tear flex flex-col gap-4 px-3 pt-3 pb-4">
          {circle ? <SharedDetails row={row} /> : <PersonalDetails row={row} />}
        </div>
      )}
    </article>
  );
}

function PersonalDetails({ row }: { row: HabitInsightView }) {
  const { habit } = row.entry;
  const volume = row.volume;
  const volumeMetrics =
    habit.kind === "timer"
      ? [
          { label: "Total time", value: formatDuration(volume.total) },
          {
            label: "Average completed day",
            value: formatDuration(volume.averagePerCompletedDay),
          },
        ]
      : habit.kind === "count"
        ? [
            { label: "Total count", value: formatCount(volume.total) },
            {
              label: "Average active day",
              value: formatCount(volume.averagePerActiveDay),
            },
          ]
        : [
            { label: "Completed", value: String(row.summary.completed) },
            { label: "All-time completions", value: String(row.stats.me.total) },
          ];

  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {volumeMetrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
        <Metric label="Current run" value={`${row.stats.me.streak} due days`} />
        <Metric label="Best run" value={`${row.stats.me.best} due days`} />
      </dl>
      <InsightHeatmap
        cells={row.heatmap}
        today={row.stats.today}
        label={`${habit.name} progress`}
        hue={row.hue}
      />
    </>
  );
}

function SharedDetails({ row }: { row: HabitInsightView }) {
  const window = row.window;
  const historyWindow = row.heatmap.map((cell) => cell.day);
  const memberSeries: InsightSeries[] = row.stats.members.map((member) => ({
    createdDay: row.stats.createdDay,
    cadence: row.stats.cadence,
    goal: row.stats.goal,
    doneDays: member.doneDays,
    values: member.values,
  }));
  const togetherDone = intersectDoneDays(memberSeries.map((member) => member.doneDays));
  const togetherValues = new Map(
    window.map((day) => [
      day,
      Math.min(...memberSeries.map((member) => member.values.get(day) ?? 0)),
    ]),
  );
  const togetherSeries: InsightSeries = {
    ...row.series,
    doneDays: togetherDone,
    values: togetherValues,
  };
  const together = opportunitySummary(window, togetherSeries, row.stats.today);
  const groupHeatmap = aggregateHeatmap(historyWindow, memberSeries);
  const members = [...row.stats.members].sort(
    (a, b) => Number(b.member.isMe) - Number(a.member.isMe),
  );

  return (
    <>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Metric
          label="Together"
          value={
            together.due === 0
              ? together.partial > 0
                ? "In progress"
                : "—"
              : `${together.completed}/${together.due}`
          }
        />
        <Metric label="Combined run" value={`${row.stats.combinedStreak} due days`} />
        <Metric label="Members" value={String(row.stats.members.length)} />
        <Metric label="Your best" value={`${row.stats.me.best} due days`} />
      </dl>

      <InsightHeatmap
        cells={groupHeatmap}
        today={row.stats.today}
        label={`${row.entry.habit.name} member participation`}
        hue={row.hue}
      />

      <section aria-label="Member progress">
        <h3 className="mb-1 text-xs font-extrabold">Members</h3>
        <div className="divide-foreground/20 divide-y-2 divide-dashed">
          {members.map((member) => {
            const series: InsightSeries = {
              createdDay: row.stats.createdDay,
              cadence: row.stats.cadence,
              goal: row.stats.goal,
              doneDays: member.doneDays,
              values: member.values,
            };
            const summary = opportunitySummary(window, series, row.stats.today);
            const trend = momentum(
              row.stats.today,
              member.doneDays,
              row.stats.createdDay,
              row.stats.cadence,
            );
            const status = insightStatus(
              summary,
              trend,
              dueDaysIn(window, row.stats.createdDay, row.stats.cadence).filter(
                (day) => day !== row.stats.today || member.doneDays.has(day),
              ),
              member.doneDays,
            );
            return (
              <div key={member.member.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {member.member.name}
                  {member.member.isMe && (
                    <span className="text-muted-foreground ml-1 text-[11px]">(You)</span>
                  )}
                </span>
                <Status status={status} />
                <span className="tnum text-muted-foreground text-xs">
                  {summary.partial > 0
                    ? `${summary.partial} partial`
                    : `${summary.completed}/${summary.due}`}
                </span>
                <span className="tnum w-10 text-right text-sm font-extrabold">
                  {summary.due === 0
                    ? summary.partial > 0
                      ? "Now"
                      : "—"
                    : `${Math.round(summary.rate * 100)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] font-semibold">{label}</dt>
      <dd className="tnum mt-0.5 text-sm font-extrabold">{value}</dd>
    </div>
  );
}

function Status({ status }: { status: InsightStatus }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold",
        status === "building" && "bg-primary text-primary-foreground",
        status === "steady" && "bg-[var(--hue-lime)] text-[var(--on-hue)]",
        status === "rebuilding" && "text-destructive bg-destructive/10",
        status === "mixed" && "bg-muted text-foreground",
        status === "gathering" && "text-muted-foreground bg-muted",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}
