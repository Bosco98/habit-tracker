'use client';

import { useEffect, useState, useCallback } from 'react';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { HabitGrid } from '@/components/habit-grid';
import { StatsSection } from '@/components/stats-section';
import { ChartsGrid } from '@/components/charts-grid';
import { HabitManagementModal } from '@/components/habit-management-modal';
import { SettingsModal } from '@/components/settings-modal';
import { useHabits, useSettings } from '@/hooks/use-habits';
import { Habit } from '@/types/habit';
import { calculateStats, calculateStreaks, getMonthKey } from '@/lib/utils-habit';
import { storage } from '@/lib/storage';
import { googleSheetsService } from '@/lib/google-sheets';
import { exportCSV, exportJSON, importCSV, importJSON } from '@/lib/import-export';
import Link from 'next/link';

export default function Home() {
  const { habits, logs, currentYear, currentMonth, setHabits, setLogs, updateLogs } =
    useHabits();
  const { settings, updateSettings } = useSettings();
  
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Local Mode');
  const [sheetName, setSheetName] = useState(() => storage.getSheetName() || '');
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate stats
  const stats = calculateStats(habits, logs, currentYear, currentMonth, settings.monthlyGoal);
  const streaks = calculateStreaks(habits, logs, currentYear, currentMonth);

  // Handle log toggle
  const handleLogToggle = useCallback(
    (logKey: string, currentValue: boolean) => {
      const newLogs = { ...logs, [logKey]: !currentValue };
      updateLogs(newLogs);
    },
    [logs, updateLogs]
  );

  // Handle add habit
  const handleAddHabit = useCallback(
    (habit: Habit) => {
      const newHabits = [...habits, habit];
      setHabits(newHabits);
      toast.success(`Habit "${habit.name}" added!`);
    },
    [habits, setHabits]
  );

  // Handle remove habit
  const handleRemoveHabit = useCallback(
    (id: string) => {
      const newHabits = habits.filter((h) => h.id !== id);
      const newLogs = { ...logs };
      
      Object.keys(newLogs).forEach((key) => {
        if (key.endsWith(`-${id}`)) {
          delete newLogs[key];
        }
      });

      setHabits(newHabits);
      setLogs(newLogs);
      toast.success('Habit removed!');
    },
    [habits, logs, setHabits, setLogs]
  );

  // Handle set goal
  const handleSetGoal = useCallback(
    (goal: number) => {
      updateSettings({ monthlyGoal: goal });
      toast.success(`Monthly goal set to ${goal} XP!`);
    },
    [updateSettings]
  );

  // Google Sheets sync functions
  const handleConnect = useCallback(async () => {
    try {
      await googleSheetsService.initialize(settings.apiKey, settings.clientId);
      await googleSheetsService.requestToken();
      toast.success('Successfully connected to Google Sheets!');
      setSyncStatus('Cloud Mode');
      
      if (settings.spreadsheetId) {
        try {
          const name = await googleSheetsService.fetchSheetName(settings.spreadsheetId);
          setSheetName(name);
          storage.setSheetName(name);
        } catch (error) {
          console.error('Failed to fetch sheet name:', error);
        }
      }
    } catch (error: unknown) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [settings.apiKey, settings.clientId, settings.spreadsheetId]);

  const handleSignOut = useCallback(() => {
    googleSheetsService.signOut();
    setSyncStatus('Local Mode');
    toast.success('Signed out from Google Sheets');
  }, []);

  const handlePullFromSheets = useCallback(async () => {
    if (!settings.spreadsheetId) {
      toast.error('Please set a Spreadsheet ID first');
      return;
    }

    try {
      const result = await googleSheetsService.pullFromSheets(
        settings.spreadsheetId,
        habits,
        currentYear,
        currentMonth
      );
      setHabits(result.habits);
      setLogs(result.logs);
      setSheetName(result.sheetName);
      storage.setSheetName(result.sheetName);
      setSyncStatus(`↓ Pulled: ${new Date().toLocaleTimeString()}`);
      toast.success('Data pulled from Google Sheets!');
    } catch (error: unknown) {
      console.error('Pull error:', error);
      toast.error(`Failed to pull: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [settings.spreadsheetId, habits, currentYear, currentMonth, setHabits, setLogs]);

  const handlePushToSheets = useCallback(async () => {
    if (!settings.spreadsheetId) {
      toast.error('Please set a Spreadsheet ID first');
      return;
    }

    try {
      await googleSheetsService.pushToSheets(
        settings.spreadsheetId,
        habits,
        logs,
        currentYear,
        currentMonth
      );
      setSyncStatus(`↑ Pushed: ${new Date().toLocaleTimeString()}`);
      toast.success('Data pushed to Google Sheets!');
    } catch (error: unknown) {
      console.error('Push error:', error);
      toast.error(`Failed to push: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [settings.spreadsheetId, habits, logs, currentYear, currentMonth]);

  const handleSmartMerge = useCallback(async () => {
    if (!settings.spreadsheetId) {
      toast.error('Please set a Spreadsheet ID first');
      return;
    }

    try {
      const result = await googleSheetsService.smartMerge(
        settings.spreadsheetId,
        habits,
        logs,
        currentYear,
        currentMonth
      );
      setHabits(result.habits);
      setLogs(result.logs);
      setSheetName(result.sheetName);
      storage.setSheetName(result.sheetName);
      
      await googleSheetsService.pushToSheets(
        settings.spreadsheetId,
        result.habits,
        result.logs,
        currentYear,
        currentMonth
      );
      
      setSyncStatus(`⟳ Synced: ${new Date().toLocaleTimeString()}`);
      toast.success('Bidirectional sync complete!');
    } catch (error: unknown) {
      console.error('Merge error:', error);
      toast.error(`Failed to sync: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [settings.spreadsheetId, habits, logs, currentYear, currentMonth, setHabits, setLogs]);

  const handleClearLogs = useCallback(() => {
    if (!confirm('Are you sure you want to clear all logs for this month? This cannot be undone.')) {
      return;
    }

    const monthKey = getMonthKey(currentYear, currentMonth);
    const newLogs = { ...logs };
    
    Object.keys(newLogs).forEach((key) => {
      if (key.startsWith(`${monthKey}-`)) {
        delete newLogs[key];
      }
    });

    setLogs(newLogs);
    toast.success('All logs cleared!');
  }, [currentYear, currentMonth, logs, setLogs]);

  // Export functions
  const handleExportCSV = useCallback(() => {
    exportCSV(habits, logs, currentYear, currentMonth);
    toast.success('CSV exported successfully!');
  }, [habits, logs, currentYear, currentMonth]);

  const handleExportJSON = useCallback(() => {
    exportJSON(habits, logs, currentYear, currentMonth);
    toast.success('JSON exported successfully!');
  }, [habits, logs, currentYear, currentMonth]);

  // Import functions
  const handleImportCSV = useCallback(
    async (file: File) => {
      try {
        const result = await importCSV(file, habits, logs, currentYear, currentMonth);
        setHabits(result.habits);
        setLogs(result.logs);
        toast.success('CSV imported successfully!');
      } catch (error: unknown) {
        console.error('CSV import error:', error);
        toast.error(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [habits, logs, currentYear, currentMonth, setHabits, setLogs]
  );

  const handleImportJSON = useCallback(
    async (file: File) => {
      try {
        const result = await importJSON(file, currentYear, currentMonth);
        setHabits(result.habits);
        setLogs(result.logs);
        toast.success('JSON imported successfully!');
      } catch (error: unknown) {
        console.error('JSON import error:', error);
        toast.error(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [currentYear, currentMonth, setHabits, setLogs]
  );

  // Initialize Google API on mount
  useEffect(() => {
    if (gapiLoaded && settings.cloudSyncEnabled && settings.apiKey && settings.clientId) {
      googleSheetsService.initialize(settings.apiKey, settings.clientId).catch((error) => {
        console.error('Failed to initialize Google API:', error);
      });
    }
  }, [gapiLoaded, settings.cloudSyncEnabled, settings.apiKey, settings.clientId]);

  return (
    <>
      <Script
        src="https://apis.google.com/js/api.js"
        onLoad={() => setGapiLoaded(true)}
      />
      <Script src="https://accounts.google.com/gsi/client" />

      <div className="min-h-screen bg-slate-50 p-4 pb-32 md:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Habit Tracker</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setHabitModalOpen(true)}>
                ✏️ Habits
              </Button>
              <Button onClick={() => setSettingsModalOpen(true)}>
                ⚙️
              </Button>
              <Button asChild>
                <Link href="/share">🔗</Link>
              </Button>
            </div>
          </header>

          {/* Stats */}
          {mounted && (
            <StatsSection
              bestHabit={stats.bestHabitName}
              totalXP={stats.totalXP}
              goal={settings.monthlyGoal}
              completionRate={stats.completionRate}
              syncStatus={syncStatus}
              sheetName={sheetName}
              showSyncCard={settings.cloudSyncEnabled}
              onSync={{
                pull: handlePullFromSheets,
                push: handlePushToSheets,
                merge: handleSmartMerge,
              }}
            />
          )}

          {/* Tracker Grid */}
          {mounted && (
            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-3">
                <h2 className="text-sm font-bold text-slate-700">Monthly Log</h2>
                <Button
                  onClick={handleClearLogs}
                  variant="destructive"
                  size="sm"
                  className="text-[10px]"
                >
                  Clear All Logs
                </Button>
              </div>
              <HabitGrid
                habits={habits}
                logs={logs}
                year={currentYear}
                month={currentMonth}
                onLogToggle={handleLogToggle}
              />
            </Card>
          )}

          {/* Charts */}
          {mounted && (
            <ChartsGrid
              dailyXP={stats.dailyXP}
              habits={habits}
              habitCounts={stats.habitCounts}
              streaks={streaks}
              days={stats.days}
            />
          )}
        </div>

        {/* Modals */}
        <HabitManagementModal
          open={habitModalOpen}
          onOpenChange={setHabitModalOpen}
          habits={habits}
          onAddHabit={handleAddHabit}
          onRemoveHabit={handleRemoveHabit}
          monthlyGoal={settings.monthlyGoal}
          onSetGoal={handleSetGoal}
        />

        <SettingsModal
          open={settingsModalOpen}
          onOpenChange={setSettingsModalOpen}
          settings={settings}
          onUpdateSettings={updateSettings}
          onConnect={handleConnect}
          onSignOut={handleSignOut}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportCSV={handleImportCSV}
          onImportJSON={handleImportJSON}
          habits={habits}
          logs={logs}
          year={currentYear}
          month={currentMonth}
        />

        {/* Footer */}
        <footer className="fixed bottom-4 left-0 flex w-full justify-center pointer-events-none">
          <nav className="pointer-events-auto flex gap-4 rounded-full border border-slate-200 bg-white/90 px-6 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
            <Link href="/about" className="transition hover:text-blue-600">
              About
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/privacy" className="transition hover:text-blue-600">
              Privacy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/contact" className="transition hover:text-blue-600">
              Contact
            </Link>
          </nav>
        </footer>

        <Toaster />
      </div>
    </>
  );
}
