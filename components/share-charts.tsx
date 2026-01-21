'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { Habit } from '@/types/habit';
import { ProcessedStats } from '@/lib/share-utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// Configure Chart.js defaults
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#94a3b8';

interface ShareRadarChartProps {
  habits: Habit[];
  stats: ProcessedStats;
  goal: number;
}

export function ShareRadarChart({
  habits,
  stats,
  goal,
}: ShareRadarChartProps) {
  // ─────────────────────────────────────────────
  // Calculations
  // ─────────────────────────────────────────────
  const avgXp =
    habits.reduce((acc, curr) => acc + curr.xp, 0) /
    (habits.length || 1);

  const targetFreqPerHabit =
    goal / (avgXp || 1) / (habits.length || 1);

  // ─────────────────────────────────────────────
  // Chart Data
  // ─────────────────────────────────────────────
  const data = {
    labels: habits.map((h) => h.name.replace(/^~/, '')),
    datasets: [
      {
        label: 'Current Status',
        data: habits.map((h) => stats.habitFreq[h.id] || 0),
        backgroundColor: 'rgba(135, 255, 111, 0.1)',
        borderColor: '#c5ffb7',
        borderWidth: 2,
        pointBackgroundColor: '#c5ffb7',
        pointRadius: 3,
      },
      {
        label: 'Baseline',
        data: habits.map(() => targetFreqPerHabit),
        backgroundColor: 'transparent',
        borderColor: '#ecff74',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
      },
    ],
  };

  // ─────────────────────────────────────────────
  // Chart Options
  // ─────────────────────────────────────────────
  const options: any = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        suggestedMin: 0,
        grid: {
          color: '#f1f5f9',
        },
        angleLines: {
          color: '#f1f5f9',
        },
        pointLabels: {
          font: {
            size: 9,
            weight: 500,
          },
          color: '#94a3b8',
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 5,
          font: {
            size: 8,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="h-[300px] w-full">
      <Radar data={data} options={options} />
    </div>
  );
}


interface ShareBarChartProps {
  habits: Habit[];
  stats: ProcessedStats;
}

export function ShareBarChart({ habits, stats }: ShareBarChartProps) {
  const data = {
    labels: habits.map((h) => h.name.replace(/^~/, '')),
    datasets: [
      {
        data: habits.map((h) => stats.habitImpact[h.id] || 0),
        backgroundColor: (ctx: any) => {
          const value = ctx.raw;
          return value >= 0 ? '#949caf' : '#e2b2ba';
        },
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const options: any = {
    animation: false as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        border: { display: false },
        grid: { color: '#f8fafc' },
        ticks: { font: { size: 9 } },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { font: { size: 9, weight: 500 } },
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
