'use client';

import { Habit, HabitLog } from '@/types/habit';
import { getDaysInMonth, getMonthKey, isViceHabit } from '@/lib/utils-habit';
import { storage } from '@/lib/storage';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

export class GoogleSheetsService {
  private gapiInited = false;
  private tokenClient: any = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;

  async initialize(apiKey: string, clientId: string): Promise<void> {
    if (!apiKey || !clientId) {
      throw new Error('API Key and Client ID are required');
    }

    // Initialize GAPI
    await new Promise<void>((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.gapiInited = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    // Initialize Token Client
    if (window.google?.accounts?.oauth2) {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: () => {}, // Will be set when requesting token
      });
    }

    // Restore saved token if available
    const savedToken = storage.getAccessToken();
    const expiryMs = storage.getTokenExpiry();

    if (savedToken && expiryMs && Date.now() < expiryMs) {
      window.gapi.client.setToken({ access_token: savedToken });
      const secondsRemaining = Math.max(Math.floor((expiryMs - Date.now()) / 1000), 60);
      this.scheduleTokenRefresh(secondsRemaining);
    }
  }

  async requestToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }

        if (resp.access_token) {
          const expiresIn = Number(resp.expires_in) || 3600;
          const expiryMs = Date.now() + expiresIn * 1000;
          
          window.gapi.client.setToken({ access_token: resp.access_token });
          storage.setAccessToken(resp.access_token, expiryMs);
          this.scheduleTokenRefresh(expiresIn);
        }

        resolve();
      };

      const hasToken = Boolean(window.gapi.client?.getToken());
      this.tokenClient.requestAccessToken({ 
        prompt: hasToken ? '' : 'consent' 
      });
    });
  }

  signOut(): void {
    const token = window.gapi.client?.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken('');
      storage.clearAccessToken();
      this.clearScheduledRefresh();
    }
  }

  isAuthenticated(): boolean {
    return Boolean(window.gapi?.client?.getToken());
  }

  private scheduleTokenRefresh(expiresInSeconds: number): void {
    this.clearScheduledRefresh();
    const refreshLead = Math.max(expiresInSeconds - 300, 60); // Refresh 5 minutes early
    
    this.tokenRefreshTimeout = setTimeout(() => {
      this.requestToken().catch(console.error);
    }, refreshLead * 1000);
  }

  private clearScheduledRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }

  async pushToSheets(
    spreadsheetId: string,
    habits: Habit[],
    logs: HabitLog,
    year: number,
    month: number
  ): Promise<void> {
    if (!this.gapiInited || !window.gapi.client.sheets) {
      throw new Error('Google API not ready');
    }

    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const days = getDaysInMonth(year, month);
    const monthKey = getMonthKey(year, month);
    const headerRow = ['Habit Name', ...Array.from({ length: days }, (_, i) => i + 1)];

    const rows = habits.map((h) => {
      const row = [h.name];
      for (let d = 1; d <= days; d++) {
        const isChecked = logs[`${monthKey}-${d}-${h.id}`];
        row.push(isChecked ? 'TRUE' : 'FALSE');
      }
      return row;
    });

    const body = { values: [headerRow, ...rows] };

    // Clear existing data
    try {
      await window.gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'A1:ZZ1000',
      });
    } catch (error) {
      console.warn('Sheet clear warning:', error);
    }

    // Write new data
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      resource: body,
    });
  }

  async pullFromSheets(
    spreadsheetId: string,
    currentHabits: Habit[],
    year: number,
    month: number
  ): Promise<{ habits: Habit[]; logs: HabitLog; sheetName: string }> {
    if (!this.gapiInited || !window.gapi.client.sheets) {
      throw new Error('Google API not ready');
    }

    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    // Get spreadsheet metadata
    const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetName = metadataResponse.result.properties.title;

    // Get data
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A1:ZZ100',
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the spreadsheet');
    }

    const headerRow = rows[0];
    const days = headerRow.length - 1;
    const monthKey = getMonthKey(year, month);

    const newHabits: Habit[] = [];
    const newLogs: HabitLog = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const habitName = row[0];
      if (!habitName) continue;

      const isVice = isViceHabit(habitName);
      let habit = currentHabits.find((h) => h.name === habitName);
      
      if (!habit) {
        habit = {
          id: Date.now().toString() + i,
          name: habitName,
          type: isVice ? 'vice' : 'health',
          xp: isVice ? -15 : 15,
        };
      }
      newHabits.push(habit);

      for (let d = 1; d <= days; d++) {
        const cellValue = row[d];
        const logKey = `${monthKey}-${d}-${habit.id}`;
        newLogs[logKey] = cellValue === 'TRUE' || cellValue === true;
      }
    }

    return { habits: newHabits, logs: newLogs, sheetName };
  }

  async smartMerge(
    spreadsheetId: string,
    currentHabits: Habit[],
    currentLogs: HabitLog,
    year: number,
    month: number
  ): Promise<{ habits: Habit[]; logs: HabitLog; sheetName: string }> {
    // Pull from sheets first
    const { habits: sheetHabits, logs: sheetLogs, sheetName } = await this.pullFromSheets(
      spreadsheetId,
      currentHabits,
      year,
      month
    );

    const monthKey = getMonthKey(year, month);
    const mergedHabits = [...sheetHabits];
    const mergedLogs = { ...sheetLogs };

    // Add any local habits not in sheet
    currentHabits.forEach((h) => {
      if (!mergedHabits.find((mh) => mh.name === h.name)) {
        mergedHabits.push(h);
      }
    });

    // Merge logs (TRUE values take precedence)
    Object.keys(currentLogs).forEach((key) => {
      if (key.startsWith(`${monthKey}-`) && currentLogs[key]) {
        mergedLogs[key] = true;
      }
    });

    return { habits: mergedHabits, logs: mergedLogs, sheetName };
  }

  async fetchSheetName(spreadsheetId: string): Promise<string> {
    if (!this.gapiInited || !window.gapi.client.sheets) {
      throw new Error('Google API not ready');
    }

    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    const metadataResponse = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });

    return metadataResponse.result.properties.title;
  }
}

export const googleSheetsService = new GoogleSheetsService();
