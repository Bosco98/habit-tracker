import { Habit, HabitLog } from '@/types/habit';

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

export function normalizeHabitName(raw: string): string {
  if (!raw) return '';
  return raw.replace(/^~/, '').trim().toLowerCase();
}

export function isViceHabit(name: string): boolean {
  return name.startsWith('~');
}

export function getDisplayName(name: string): string {
  return name.startsWith('~') ? name.substring(1) : name;
}

export function getLogKey(year: number, month: number, day: number, habitId: string): string {
  return `${getMonthKey(year, month)}-${day}-${habitId}`;
}

export function calculateStats(
  habits: Habit[],
  logs: HabitLog,
  year: number,
  month: number,
  goal: number
) {
  const days = getDaysInMonth(year, month);
  const monthKey = getMonthKey(year, month);

  let totalXP = 0;
  const dailyXP: number[] = new Array(days).fill(0);
  const habitCounts: Record<string, number> = {};
  let checkedCells = 0;

  habits.forEach((h) => {
    habitCounts[h.id] = 0;
  });

  const positiveHabits = habits.filter((h) => h.xp > 0).length;
  const totalCells = positiveHabits * days;

  for (let d = 1; d <= days; d++) {
    habits.forEach((h) => {
      const logKey = `${monthKey}-${d}-${h.id}`;
      if (logs[logKey]) {
        totalXP += h.xp;
        dailyXP[d - 1] += h.xp;
        habitCounts[h.id]++;
        if (h.xp > 0) {
          checkedCells++;
        }
      }
    });
  }

  const completionRate = goal > 0 ? Math.min(Math.round((totalXP / goal) * 100), 100) : 0;

  let bestHabitName = 'None';
  let maxCount = -1;
  habits.forEach((h) => {
    if (habitCounts[h.id] > maxCount) {
      maxCount = habitCounts[h.id];
      bestHabitName = getDisplayName(h.name);
    }
  });

  if (maxCount === 0) {
    bestHabitName = 'Keep going!';
  }

  return {
    totalXP,
    completionRate,
    bestHabitName,
    dailyXP,
    habitCounts,
    days,
  };
}

export function calculateStreaks(
  habits: Habit[],
  logs: HabitLog,
  year: number,
  month: number
) {
  const days = getDaysInMonth(year, month);
  const monthKey = getMonthKey(year, month);
  const today = new Date();
  const currentDay = today.getFullYear() === year && today.getMonth() === month 
    ? today.getDate() 
    : days;

  return habits.map((h) => {
    let maxStreak = 0;
    let rolling = 0;
    let currentStreak = 0;

    for (let d = 1; d <= days; d++) {
      if (logs[`${monthKey}-${d}-${h.id}`]) {
        rolling++;
        maxStreak = Math.max(maxStreak, rolling);
      } else {
        rolling = 0;
      }
    }

    for (let d = Math.min(currentDay, days); d >= 1; d--) {
      if (logs[`${monthKey}-${d}-${h.id}`]) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      name: getDisplayName(h.name),
      current: currentStreak,
      max: maxStreak,
    };
  });
}

export function isLikelyApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.startsWith('GOCSPX')) return false;
  return /^AIza[0-9A-Za-z_\-]{20,}$/.test(key.trim());
}
