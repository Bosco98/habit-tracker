'use client';

import { useState, useCallback } from 'react';
import { Habit, HabitLog, AppSettings } from '@/types/habit';
import { storage } from '@/lib/storage';
import { getDaysInMonth } from '@/lib/utils-habit';

/* =========================
   Habits Hook
   ========================= */

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const loadedHabits = storage.getHabits();

    if (loadedHabits.length > 0) {
      return loadedHabits;
    }

    const defaultHabits: Habit[] = [
      { id: '1', name: 'Exercise', type: 'health', xp: 15 },
      { id: '2', name: 'Drink Water', type: 'health', xp: 15 },
    ];

    storage.setHabits(defaultHabits);
    return defaultHabits;
  });

  const [logs, setLogs] = useState<HabitLog>(() => {
    return storage.getLogs();
  });

  const [currentYear] = useState(() => new Date().getFullYear());
  const [currentMonth] = useState(() => new Date().getMonth());

  const saveHabits = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits);
    storage.setHabits(newHabits);
  }, []);

  const saveLogs = useCallback((newLogs: HabitLog) => {
    setLogs(newLogs);
    storage.setLogs(newLogs);
  }, []);

  return {
    habits,
    logs,
    currentYear,
    currentMonth,
    setHabits: saveHabits,
    setLogs: saveLogs,
    updateLogs: saveLogs,
  };
}

/* =========================
   Settings Hook
   ========================= */

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = storage.getSettings();
    const now = new Date();
    const days = getDaysInMonth(now.getFullYear(), now.getMonth());

    if (loaded.monthlyGoal === 0) {
      const updated: AppSettings = {
        ...loaded,
        monthlyGoal: 15 * days,
      };

      storage.setSettings(updated);
      return updated;
    }

    return loaded;
  });

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      storage.setSettings(updated);
      return updated;
    });
  }, []);

  return {
    settings,
    updateSettings,
  };
}
