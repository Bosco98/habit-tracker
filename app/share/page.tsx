import Link from 'next/link';
import { Suspense } from 'react';
import { ShareClient } from '@/components/share-client';
import { Toaster } from '@/components/ui/sonner';
import { Share2, Link as LinkIcon } from 'lucide-react';

function ShareContent() {
  return <ShareClient />;
}

export default function SharePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className="w-fit text-xs font-semibold uppercase tracking-wider text-blue-600 transition hover:text-blue-700"
              >
                ← Back to App
              </Link>
              <h1 className="text-3xl font-bold text-slate-900">Shareables</h1>
              <p className="text-sm text-slate-500">Let the world know</p>
            </div>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-slate-500">Loading share data...</p>
          </div>
        }
      >
        <ShareContent />
      </Suspense>
      
      <Toaster position="top-center" />
    </div>
  );
}
