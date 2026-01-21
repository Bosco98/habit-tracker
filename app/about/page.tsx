import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
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
          <h1 className="text-3xl font-bold">About Habit Tracker</h1>
          <p className="text-sm text-slate-500">Build momentum with data-driven daily habits.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Habit Tracker exists to make consistent change achievable. We blend a friendly
              interface, actionable analytics, and optional cloud sync so you can focus on progress
              instead of admin work.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Core Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2">
              <li>
                <strong>Simplicity:</strong> Log habits with one click and keep your workflow
                frictionless.
              </li>
              <li>
                <strong>Transparency:</strong> Everything is stored locally unless you explicitly
                sync it.
              </li>
              <li>
                <strong>Insight:</strong> Rich visualizations surface wins, streaks, and trends in
                seconds.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold">Sticky Habit Grid</h3>
                <p>
                  Track an entire month at a glance with keyboard-friendly toggles and clear
                  indicators for habits versus vices.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold">XP Economy</h3>
                <p>
                  Reward productive days and highlight setbacks automatically to keep motivation
                  balanced.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold">Insight Dashboards</h3>
                <p>
                  Six dashboards visualize trends: daily XP, consistency, completion, distribution,
                  weekly summaries, and streaks.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold">Cloud Sync</h3>
                <p>
                  Connect to Google Sheets for collaborative tracking, exports, and off-device
                  backups when you need them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-2">
              <li>Custom XP values per habit</li>
              <li>Weekly summary emails</li>
              <li>Community templates for common routines</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Source</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The project is open for feedback and contributions. Share ideas or improvements
              through the contact channels—every suggestion helps make the tool better for the
              community.
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
