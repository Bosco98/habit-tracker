'use client';

import React from 'react';
import { Habit, HabitLog } from '@/types/habit';
import { getLogKey, getDisplayName, getDaysInMonth, getMonthKey } from '@/lib/utils-habit';
import { cn } from '@/lib/utils';

interface HabitGridProps {
  habits: Habit[];
  logs: HabitLog;
  year: number;
  month: number;
  onLogToggle: (logKey: string, currentValue: boolean) => void;
}

export function HabitGrid({ habits, logs, year, month, onLogToggle }: HabitGridProps) {
  const days = getDaysInMonth(year, month);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid select-none"
        style={{
          gridTemplateColumns: `160px repeat(${days}, 1fr)`,
        }}
      >
        {/* Header Row */}
        <div className="sticky left-0 z-10 flex items-center justify-center border bg-slate-50 px-3 py-2 text-[9px] font-bold text-slate-400">
          HABIT
        </div>
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className="flex min-w-[35px] items-center justify-center border-b-2 border-slate-200 bg-white px-2 py-2 text-[9px] font-bold text-slate-400"
          >
            {day}
          </div>
        ))}

        {/* Habit Rows */}
        {habits.map((habit) => (
          <React.Fragment key={habit.id}>
            <div
              className="sticky left-0 z-10 flex items-center truncate border border-r-2 border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700"
            >
              {getDisplayName(habit.name)}
            </div>
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
              const logKey = getLogKey(year, month, day, habit.id);
              const isChecked = logs[logKey] || false;
              const isVice = habit.type === 'vice';

              return (
                <button
                  key={`${habit.id}-${day}`}
                  onClick={() => onLogToggle(logKey, isChecked)}
                  className={cn(
                    'flex min-h-[35px] min-w-[35px] items-center justify-center border border-slate-100 text-xs transition-all hover:bg-slate-50',
                    isChecked && !isVice && 'bg-green-200 text-green-800 hover:bg-green-300',
                    isChecked && isVice && 'bg-red-200 text-red-800 hover:bg-red-300',
                    !isChecked && 'bg-white text-slate-300'
                  )}
                >
                  {isChecked ? '✓' : ''}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
