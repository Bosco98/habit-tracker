import type { HabitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import type { DayKey } from "@/lib/days";
import type {
  AggregateHeatCell,
  InsightSeries,
  InsightStatus,
  Momentum,
  OpportunitySummary,
  VolumeSummary,
} from "@/lib/insights";

export interface HabitInsightView {
  entry: HabitEntry;
  stats: HabitStats;
  index: number;
  hue: string;
  window: DayKey[];
  series: InsightSeries;
  summary: OpportunitySummary;
  trend: Momentum;
  volume: VolumeSummary;
  status: InsightStatus;
  heatmap: AggregateHeatCell[];
}
