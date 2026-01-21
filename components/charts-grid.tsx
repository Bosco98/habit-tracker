'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  StatsCardHeader
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Habit } from '@/types/habit';
import { getDisplayName } from '@/lib/utils-habit';

interface ChartsGridProps {
  dailyXP: number[];
  habits: Habit[];
  habitCounts: Record<string, number>;
  streaks: Array<{ name: string; current: number; max: number }>;
  days: number;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

const GRID_STROKE = '#e2e8f0';
const AXIS_STROKE = '#94a3b8';

const CHART_MARGIN = { top: 30, right: 0, left: -25, bottom: 10 };

export function ChartsGrid({
  dailyXP,
  habits,
  habitCounts,
  streaks,
  days,
}: ChartsGridProps) {
  /* ----------------------------- Derived Data ----------------------------- */

  const dailyXPData = useMemo(
    () =>
      dailyXP.map((xp, index) => ({
        day: index + 1,
        xp,
      })),
    [dailyXP]
  );

  const consistencyData = useMemo(
    () =>
      habits.map((h) => ({
        name: getDisplayName(h.name),
        count: habitCounts[h.id] ?? 0,
        isVice: h.type === 'vice',
      })),
    [habits, habitCounts]
  );

  const completionData = useMemo(
    () =>
      habits.map((h, index) => ({
        name: getDisplayName(h.name),
        rate: days ? ((habitCounts[h.id] ?? 0) / days) * 100 : 0,
        color: COLORS[index % COLORS.length],
      })),
    [habits, habitCounts, days]
  );

  const xpDistributionData = useMemo(
    () =>
      habits.map((h) => ({
        name: getDisplayName(h.name),
        xp: (habitCounts[h.id] ?? 0) * h.xp,
        isVice: h.type === 'vice',
      })),
    [habits, habitCounts]
  );

  const weeklyData = useMemo(() => {
    const weeks = Math.ceil(days / 7);
    const weeklyXP = Array(weeks).fill(0);

    dailyXP.forEach((xp, index) => {
      weeklyXP[Math.floor(index / 7)] += xp;
    });

    return weeklyXP.map((xp, index) => ({
      week: `Week ${index + 1}`,
      xp,
    }));
  }, [dailyXP, days]);

  const streakData = useMemo(
    () =>
      streaks.map((s) => ({
        name: s.name,
        current: s.current,
        max: s.max,
      })),
    [streaks]
  );

  /* ----------------------------------------------------------------------- */

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <StatsCardHeader className="pt-4">
          Daily XP Trend
        </StatsCardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={dailyXPData}
              margin={CHART_MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="day"
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
              />
              <YAxis
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
                allowDecimals={false}
                domain={[0, 'dataMax + 5']}
                tickCount={5}
              />
              <Tooltip labelFormatter={(label) => `Day: ${label}`} />
              <Line
                type="monotone"
                dataKey="xp"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <StatsCardHeader>
          Consistency Bars
        </StatsCardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={consistencyData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
              />
              <YAxis
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {consistencyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isVice ? '#ef4444' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <StatsCardHeader>
          Habit Completion Rate
        </StatsCardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={completionData}
                dataKey="rate"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                style={{ fontSize: 12 }}
                label={({ name, value }) =>
                  `${name}: ${value?.toFixed(1) ?? 0}%`
                }
              >
                {completionData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value?: number) =>
                  `${value?.toFixed(1) ?? 0}%`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <StatsCardHeader>
          XP Distribution
        </StatsCardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={xpDistributionData}
              layout="vertical"
              margin={CHART_MARGIN}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis type="number" stroke={AXIS_STROKE}
                style={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="xp" radius={[0, 6, 6, 0]}>
                {xpDistributionData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isVice ? '#ef4444' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <StatsCardHeader>
          Weekly Progress
        </StatsCardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis dataKey="week" stroke={AXIS_STROKE}
                style={{ fontSize: 12 }}
              />
              <YAxis
                stroke={AXIS_STROKE}
                allowDecimals={false}
                domain={[0, 'dataMax + 10']}
                tickCount={5}
                style={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar
                dataKey="xp"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <StatsCardHeader>
          Habit Streak Analysis
        </StatsCardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={streakData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="name"
                stroke={AXIS_STROKE}
                style={{ fontSize: 11 }}
              />
              <YAxis
                stroke={AXIS_STROKE}
                allowDecimals={false}
                style={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="current"
                name="Current Streak 🔥"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="max"
                name="Max Streak 🏆"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
