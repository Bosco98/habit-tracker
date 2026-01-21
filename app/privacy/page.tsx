import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link
            href="/"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700"
          >
            ← Back to App
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: January 15, 2026</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>1. Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The Habit Tracker stores data locally in your browser and optionally syncs with Google
              Sheets when you connect your account. This policy explains what information is
              collected, how it is used, and the choices you have.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Data Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Local storage:</strong> Habits, daily logs, visual preferences, and Google
                API credentials are saved in your browser so they persist between sessions.
              </li>
              <li>
                <strong>Google Sheets:</strong> When sync is enabled, the app reads from and writes
                to the spreadsheet you provide. No other remote storage is used.
              </li>
              <li>
                <strong>No tracking:</strong> The app does not use cookies, analytics, or
                third-party trackers.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. How Information Is Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Data is used exclusively to render your habit dashboard, calculate insights, and sync
              with your chosen Google Sheet. Credentials are requested only to perform the actions
              you initiate (pull, push, or bidirectional sync).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Data Control</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2">
              <li>
                You can clear data anytime via the app settings or by clearing your browser storage.
              </li>
              <li>
                To revoke Google access, use the built-in sign-out button or remove the app from
                your Google Account security settings.
              </li>
              <li>Switching the cloud sync toggle off keeps all information local.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This policy may change as new features ship. Material updates will appear on this page
              with a revised date. Continued use of the app signifies acceptance of the updated
              policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              If you have privacy questions or requests, reach out at{' '}
              <a href="mailto:bosco98123@gmail.com" className="text-blue-600 hover:text-blue-700">
                bosco98123@gmail.com
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="py-10 text-center text-xs text-slate-400">
        © 2026 Habit Tracker. All rights reserved.
      </footer>
    </div>
  );
}
