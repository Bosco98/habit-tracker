'use client';

import { Habit, HabitLog, AppSettings } from '@/types/habit';

const STORAGE_KEYS = {
  HABITS: 'habit_template',
  LOGS: 'habit_logs',
  API_KEY: 'g_api_key',
  CLIENT_ID: 'g_client_id',
  SPREADSHEET_ID: 'g_sheet_id',
  CLOUD_SYNC: 'cloud_sync_enabled',
  MONTHLY_GOAL: 'monthly_goal',
  ACCESS_TOKEN: 'g_access_token',
  TOKEN_EXPIRY: 'g_token_expiry',
  SHEET_NAME: 'g_sheet_name',
};

export const storage = {
  getHabits: (): Habit[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  },

  setHabits: (habits: Habit[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  getLogs: (): HabitLog => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : {};
  },

  setLogs: (logs: HabitLog) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  getSettings: (): AppSettings => {
    if (typeof window === 'undefined') {
      return {
        apiKey: '',
        clientId: '',
        spreadsheetId: '',
        cloudSyncEnabled: false,
        monthlyGoal: 0,
      };
    }

    return {
      apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
      clientId: localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '',
      spreadsheetId: localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID) || '',
      cloudSyncEnabled: localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC) === 'true',
      monthlyGoal: parseInt(localStorage.getItem(STORAGE_KEYS.MONTHLY_GOAL) || '0'),
    };
  },

  setSettings: (settings: Partial<AppSettings>) => {
    if (typeof window === 'undefined') return;
    
    if (settings.apiKey !== undefined) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, settings.apiKey);
    }
    if (settings.clientId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, settings.clientId);
    }
    if (settings.spreadsheetId !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, settings.spreadsheetId);
    }
    if (settings.cloudSyncEnabled !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC, settings.cloudSyncEnabled ? 'true' : 'false');
    }
    if (settings.monthlyGoal !== undefined) {
      localStorage.setItem(STORAGE_KEYS.MONTHLY_GOAL, settings.monthlyGoal.toString());
    }
  },

  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: (token: string, expiryMs: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryMs.toString());
  },

  clearAccessToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  },

  getTokenExpiry: () => {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || '0');
  },

  getSheetName: () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.SHEET_NAME) || '';
  },

  setSheetName: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SHEET_NAME, name);
  },
};
