export interface Habit {
  id: string;
  name: string;
  type: 'health' | 'vice';
  xp: number;
}

export interface HabitLog {
  [key: string]: boolean;
}

export interface AppSettings {
  apiKey: string;
  clientId: string;
  spreadsheetId: string;
  cloudSyncEnabled: boolean;
  monthlyGoal: number;
}

export interface MonthData {
  year: number;
  month: number; // 0-11
  habits: Habit[];
  logs: HabitLog;
}

export interface ExportData {
  exportedAt: string;
  month: {
    label: string;
    year: number;
    monthIndex: number;
    key: string;
  };
  habits: Habit[];
  logs: HabitLog;
  storageSnapshot: Record<string, string>;
}
