'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  emoji?: string;
}

export function StatsCard({ title, value, subtitle, emoji }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-bold uppercase text-slate-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-slate-800">
          {emoji && <span className="mr-1">{emoji}</span>}
          {value}
          {subtitle && (
            <span className="ml-1 text-sm text-slate-300">
              / {subtitle}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsSectionProps {
  bestHabit: string;
  totalXP: number;
  goal: number;
  completionRate: number;
  syncStatus: string;
  sheetName: string;
  onSync?: {
    pull: () => void;
    push: () => void;
    merge: () => void;
  };
  showSyncCard?: boolean;
}

export function TopPerformerStatSection({
  bestHabit,
}: StatsSectionProps) {
  return (
    <StatsCard title="Top Performer" value={bestHabit} />
  );
}

export function MonthlsGoalStatSection({
  totalXP,
  goal,
}: StatsSectionProps) {
  return (
    <StatsCard
      title="Month's Goal"
      value={totalXP.toLocaleString()}
      subtitle={`${goal.toLocaleString()} XP`}
    />
  );
}

export function CompletionStatSection({
  completionRate,
}: StatsSectionProps) {
  return (
    <StatsCard title="Completion" value={`${completionRate}%`} />
  );
}

export function StatsSection(statsSectionProps: StatsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-5">

      <TopPerformerStatSection {...statsSectionProps} />
      <MonthlsGoalStatSection  {...statsSectionProps} />
      <CompletionStatSection {...statsSectionProps} />
      
      {statsSectionProps.showSyncCard && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase text-slate-400">
              Sheets Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-bold text-red-500">
              {statsSectionProps.syncStatus}
            </div>
            {statsSectionProps.onSync && (
              <div className="flex gap-1">
                <button
                  onClick={statsSectionProps.onSync.pull}
                  className="flex-1 rounded bg-green-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-green-700"
                  title="Pull from Sheets"
                >
                  ↓
                </button>
                <button
                  onClick={statsSectionProps.onSync.push}
                  className="flex-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700"
                  title="Push to Sheets"
                >
                  ↑
                </button>
                <button
                  onClick={statsSectionProps.onSync.merge}
                  className="flex-1 rounded bg-purple-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-purple-700"
                  title="Smart Merge"
                >
                  ⟳
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold uppercase text-slate-400">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-xs font-bold italic text-slate-400">
            {statsSectionProps.syncStatus}
          </div>
          <div className="truncate text-[11px] font-semibold text-slate-600">
            {statsSectionProps.sheetName || 'No sheet selected'}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
