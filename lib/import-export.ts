import { Habit, HabitLog, ExportData } from '@/types/habit';
import { getDaysInMonth, getMonthKey, isViceHabit } from './utils-habit';

export function exportCSV(
  habits: Habit[],
  logs: HabitLog,
  year: number,
  month: number
): void {
  const days = getDaysInMonth(year, month);
  const monthKey = getMonthKey(year, month);
  const headerRow = ['Habit Name', ...Array.from({ length: days }, (_, i) => i + 1)];

  const rows = habits.map((h) => {
    const row = [h.name];
    for (let d = 1; d <= days; d++) {
      const logKey = `${monthKey}-${d}-${h.id}`;
      row.push(logs[logKey] ? 'Checked' : '');
    }
    return row;
  });

  const encode = (value: any) => `"${String(value).replace(/"/g, '""')}"`;
  const csvLines = [headerRow, ...rows].map((row) => row.map(encode).join(','));
  const csvContent = csvLines.join('\n');

  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `habit-tracker-${monthLabel}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportJSON(
  habits: Habit[],
  logs: HabitLog,
  year: number,
  month: number
): void {
  const monthLabel = `${year}-${String(month + 1).padStart(2, '0')}`;
  const storageSnapshot: Record<string, string> = {};

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          storageSnapshot[key] = value;
        }
      }
    }
  }

  const payload: ExportData = {
    exportedAt: new Date().toISOString(),
    month: {
      label: monthLabel,
      year,
      monthIndex: month,
      key: getMonthKey(year, month),
    },
    habits: habits.map((h) => ({ ...h })),
    logs: { ...logs },
    storageSnapshot,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `habit-tracker-${monthLabel}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

export async function importCSV(
  file: File,
  currentHabits: Habit[],
  currentLogs: HabitLog,
  year: number,
  month: number
): Promise<{ habits: Habit[]; logs: HabitLog }> {
  const text = await file.text();
  const rows = parseCSV(text);

  if (!rows.length) {
    throw new Error('CSV file is empty.');
  }

  const header = rows[0];
  if (header.length < 2) {
    throw new Error('CSV should include at least one day column.');
  }

  const days = header.length - 1;
  const monthKey = getMonthKey(year, month);
  const existingByName: Record<string, Habit> = {};
  currentHabits.forEach((h) => {
    existingByName[h.name] = h;
  });

  const updatedHabits: Habit[] = [];
  const monthUpdates: HabitLog = {};

  rows.slice(1).forEach((rawRow, index) => {
    const row = [...rawRow];
    while (row.length < header.length) {
      row.push('');
    }

    const habitName = row[0] ? row[0].trim() : '';
    if (!habitName) return;

    const isVice = isViceHabit(habitName);
    const base = existingByName[habitName];
    const habit: Habit = base
      ? { ...base }
      : {
          id: `import-${Date.now()}-${index}`,
          name: habitName,
          type: isVice ? 'vice' : 'health',
          xp: isVice ? -15 : 15,
        };

    if (isVice && habit.type !== 'vice') {
      habit.type = 'vice';
      habit.xp = habit.xp < 0 ? habit.xp : -Math.abs(habit.xp || 15);
    } else if (!isVice && habit.type === 'vice') {
      habit.type = 'health';
      habit.xp = Math.abs(habit.xp || 15);
    }

    existingByName[habitName] = habit;
    updatedHabits.push(habit);

    for (let d = 1; d <= days; d++) {
      const cell = String(row[d] ?? '').trim().toLowerCase();
      const isChecked =
        cell === 'true' ||
        cell === '1' ||
        cell === 'yes' ||
        cell === 'y' ||
        cell === 'checked' ||
        cell === '✓';
      const logKey = `${monthKey}-${d}-${habit.id}`;
      monthUpdates[logKey] = isChecked;
    }
  });

  if (!updatedHabits.length) {
    throw new Error('No habits detected in CSV.');
  }

  const newLogs = { ...currentLogs };
  Object.keys(newLogs).forEach((key) => {
    if (key.startsWith(`${monthKey}-`)) {
      delete newLogs[key];
    }
  });
  Object.entries(monthUpdates).forEach(([key, value]) => {
    newLogs[key] = Boolean(value);
  });

  return { habits: updatedHabits, logs: newLogs };
}

export async function importJSON(
  file: File,
  currentYear: number,
  currentMonth: number
): Promise<{
  habits: Habit[];
  logs: HabitLog;
  year?: number;
  month?: number;
}> {
  const text = await file.text();
  const payload: ExportData = JSON.parse(text);

  if (!payload || !Array.isArray(payload.habits) || typeof payload.logs !== 'object') {
    throw new Error('JSON file is missing required fields.');
  }

  let year = currentYear;
  let month = currentMonth;

  if (payload.month) {
    if (Number.isInteger(payload.month.year)) {
      year = payload.month.year;
    }
    if (
      Number.isInteger(payload.month.monthIndex) &&
      payload.month.monthIndex >= 0 &&
      payload.month.monthIndex <= 11
    ) {
      month = payload.month.monthIndex;
    }
  }

  const habits = payload.habits
    .map((h, index) => {
      const isVice = h.type === 'vice' || (h.name && h.name.startsWith('~'));
      const baseXP = typeof h.xp === 'number' ? h.xp : 15;
      return {
        id: h.id || `import-${Date.now()}-${index}`,
        name: h.name || `Habit ${index + 1}`,
        type: isVice ? ('vice' as const) : ('health' as const),
        xp: isVice ? (baseXP < 0 ? baseXP : -Math.abs(baseXP)) : Math.abs(baseXP),
      };
    })
    .filter((h) => h.name);

  const logs = { ...(payload.logs || {}) };

  if (payload.storageSnapshot && typeof payload.storageSnapshot === 'object') {
    Object.entries(payload.storageSnapshot).forEach(([key, value]) => {
      if (typeof value === 'string' && typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    });
  }

  return { habits, logs, year, month };
}
