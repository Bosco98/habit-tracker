'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { AppSettings } from '@/types/habit';
import { Habit, HabitLog, ExportData } from '@/types/habit';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onConnect: () => Promise<void>;
  onSignOut: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportCSV: (file: File) => void;
  onImportJSON: (file: File) => void;
  habits: Habit[];
  logs: HabitLog;
  year: number;
  month: number;
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onConnect,
  onSignOut,
  onExportCSV,
  onExportJSON,
  onImportCSV,
  onImportJSON,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [clientId, setClientId] = useState(settings.clientId);
  const [spreadsheetId, setSpreadsheetId] = useState(settings.spreadsheetId);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(settings.cloudSyncEnabled);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = () => {
    onUpdateSettings({
      apiKey,
      clientId,
      spreadsheetId,
      cloudSyncEnabled,
    });
  };

  const handleConnect = async () => {
    handleSaveSettings();
    await onConnect();
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      if (jsonInputRef.current) {
        jsonInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            App Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cloud Sync Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase text-slate-400">
              Google Sheets Management
            </h3>
            <Label className="flex cursor-pointer items-center gap-2 text-[10px] font-bold uppercase text-slate-500">
              <span>Enabled</span>
              <input
                type="checkbox"
                checked={cloudSyncEnabled}
                onChange={(e) => setCloudSyncEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </Label>
          </div>

          {/* Google Sheets Section */}
          {cloudSyncEnabled && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Card className="border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-800">
                <strong>Setup Instructions:</strong>
                <p>
                  1. Go to {' '}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-block"
                  >
                    https://console.cloud.google.com
                  </a>
                </p>
                <p>
                  2. Enable <strong>Google Sheets API</strong>
                </p>
                <p>
                  3. Create OAuth 2.0 Client ID credentials
                </p>
                <p>
                  4. Add this URL to <strong>Authorized JavaScript origins</strong>:
                  <br />
                  <code className="mt-1 block rounded bg-white px-2 py-1 text-[10px]">
                    {typeof window !== 'undefined' ? window.location.origin : ''}
                  </code>
                </p>
              </Card>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  API Key
                </Label>
                <Input
                  type="text"
                  placeholder="Enter Google API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Client ID
                </Label>
                <Input
                  type="text"
                  placeholder="Enter Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <Card className="border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <strong>Tip:</strong> Use different spreadsheets for different months!
                <br />
                The Active Sheet ID lets you quickly switch between them.
              </Card>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Spreadsheet ID
                </Label>
                <Input
                  type="text"
                  placeholder="Spreadsheet ID from URL"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleConnect} className="flex-1">
                  Connect & Sync
                </Button>
                <Button onClick={onSignOut} variant="secondary">
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Export Options */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-slate-400">
              Export Options
            </h3>
            <Button onClick={onExportCSV} variant="secondary" className="w-full">
              Export CSV
            </Button>
            <Button onClick={onExportJSON} variant="secondary" className="w-full">
              Export JSON
            </Button>
          </div>

          {/* Import Options */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-slate-400">
              Import Options
            </h3>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCSVImport}
            />
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleJSONImport}
            />
            <Button
              onClick={() => csvInputRef.current?.click()}
              variant="secondary"
              className="w-full"
            >
              Import CSV
            </Button>
            <Button
              onClick={() => jsonInputRef.current?.click()}
              variant="secondary"
              className="w-full"
            >
              Import JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
