import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { OpportunitySummary } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface InsightSummaryProps {
  summary: OpportunitySummary;
  momentum: number | null;
  range: number;
}

export function InsightSummary({ summary, momentum, range }: InsightSummaryProps) {
  const rate = summary.due === 0 ? null : Math.round(summary.rate * 100);
  const points = momentum === null ? null : Math.round(momentum * 100);
  const TrendIcon =
    points === null ? Minus : points > 0 ? ArrowUpRight : points < 0 ? ArrowDownRight : Minus;

  return (
    <section className="stock flex flex-col gap-3 rounded-xl p-4" aria-label="Insight summary">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold">
            {summary.due === 0
              ? "No finished opportunities to score yet."
              : `You kept ${summary.completed} of ${summary.due} due goals.`}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Last {range} days. Today stays in progress until it is finished.
          </p>
        </div>
        <span className="tnum shrink-0 text-2xl font-black tracking-[-0.03em]">
          {rate === null ? "—" : `${rate}%`}
        </span>
      </div>

      <dl className="tear grid grid-cols-3 gap-3 pt-3">
        <SummaryDatum label="Completed" value={`${summary.completed}/${summary.due}`} />
        <SummaryDatum label="In progress" value={String(summary.partial)} />
        <div>
          <dt className="text-muted-foreground text-[11px] font-semibold">7-day momentum</dt>
          <dd
            className={cn(
              "tnum mt-0.5 flex items-center gap-1 text-sm font-extrabold",
              points !== null && points > 0
                ? "text-primary-strong"
                : points !== null && points < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            <TrendIcon className="size-3.5" strokeWidth={2.5} />
            {points === null
              ? "Gathering"
              : points === 0
                ? "Flat"
                : `${points > 0 ? "+" : ""}${points} pts`}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function SummaryDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[11px] font-semibold">{label}</dt>
      <dd className="tnum mt-0.5 text-sm font-extrabold">{value}</dd>
    </div>
  );
}
