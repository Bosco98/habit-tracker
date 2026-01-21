import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
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
          <h1 className="text-3xl font-bold">Contact</h1>
          <p className="text-sm text-slate-500">We would love to hear from you.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Get in Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Whether you found a bug, want to request a feature, or just want to share how the app
              has helped, drop a message using any of the channels below.
            </p>
            <div className="grid gap-6 text-sm md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">Support Email</h3>
                <p>
                  <a href="mailto:bosco98123@gmail.com" className="text-blue-600 hover:text-blue-700">
                    bosco98123@gmail.com
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">LinkedIn</h3>
                <p>
                  <a
                    href="https://www.linkedin.com/in/boscocorrea/"
                    className="text-blue-600 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    linkedin.com/in/boscocorrea
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Twitter/X</h3>
                <p>
                  <a
                    href="https://x.com/Bosco9806"
                    className="text-blue-600 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @Bosco9806
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">GitHub</h3>
                <p>
                  <a
                    href="https://github.com/bosco98"
                    className="text-blue-600 hover:text-blue-700"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/bosco98
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="https://formsubmit.co/bosco98123@gmail.com" method="POST" className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" type="text" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="py-10 text-center text-xs text-slate-400">
        © 2026 Habit Tracker. All rights reserved.
      </footer>
    </div>
  );
}
