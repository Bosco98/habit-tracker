import LZString from 'lz-string';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { Habit, HabitLog } from '@/types/habit';

export interface ShareData {
  logs: HabitLog;
  template: Habit[];
  goal: number;
}

export interface ProcessedStats {
  currentDay: number;
  totalXP: number;
  habitFreq: Record<string, number>;
  logCount: number;
  habitImpact: Record<string, number>;
}

export const quotesByPerformance = {
  euphoric: [
    "You are transcending limits. Pure divinity in motion.",
    "Symmetry, progress, perfection. You've become the standard.",
    "The atmosphere itself bows to your momentum.",
  ],
  polarizing: [
    "Mediocrity is a choice you are dangerously close to making.",
    "Is this the 'effort' they talk about in those motivational videos?",
    "Statistics don't lie, but your excuses certainly do.",
  ],
  gaslighting: [
    "You actually thought you were doing well today, didn't you?",
    "The data suggests you've been working, but your results say otherwise.",
    "Are you sure you remembered to log correctly? This looks... concerning.",
    "You're not tired. You're just bored of being average. Try harder.",
  ],
};

export function compressShareData(data: ShareData): string {
  return LZString.compressToEncodedURIComponent(JSON.stringify(data));
}

export function decompressShareData(compressed: string): ShareData | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (e) {
    console.error('Failed to decompress data:', e);
    return null;
  }
}

export function processStats(shareData: ShareData): ProcessedStats {
  let totalXP = 0;
  let logCount = 0;
  const habitFreq: Record<string, number> = {};
  const habitImpact: Record<string, number> = {};

  shareData.template.forEach((h) => {
    habitFreq[h.id] = 0;
    habitImpact[h.id] = 0;
  });

  Object.entries(shareData.logs).forEach(([key, val]) => {
    if (!val) return;

    const habitId = key.split('-').pop();
    if (!habitId) return;

    const habitDef = shareData.template.find((h) => h.id === habitId);
    if (habitDef) {
      const isVice = habitDef.name.startsWith('~');
      const multiplier = isVice ? -1 : 1;
      const xpValue = habitDef.xp * multiplier;

      totalXP += xpValue;
      habitFreq[habitId] += multiplier;
      habitImpact[habitId] += xpValue;
      logCount++;
    }
  });

  return { totalXP, habitFreq, logCount, habitImpact, currentDay: 0 };
}

export function getMotivationalQuote(progress: number): string {
  let quotePool: string[];

  if (progress >= 80) {
    quotePool = quotesByPerformance.euphoric;
  } else if (progress >= 40) {
    quotePool = quotesByPerformance.polarizing;
  } else {
    quotePool = quotesByPerformance.gaslighting;
  }

  return quotePool[Math.floor(Math.random() * quotePool.length)];
}

export async function captureSnapshot(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#f8fafc',
      scale: 3,
      logging: false,
      useCORS: true,
      ignoreElements: (element) => {
        // Skip elements that might have problematic styles
        return element.classList?.contains('animate-pulse') || false;
      },
      onclone: (clonedDoc) => {
        // Remove ALL existing stylesheets to avoid color parsing issues
        const allStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        allStyles.forEach((el) => el.remove());

        // Add comprehensive safe override styles
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            border-color: #e2e8f0 !important;
            box-shadow: none !important;
          }
          
          body, html, #capture-area {
            background-color: #f8fafc !important;
            color: #334155 !important;
          }
          
          /* Card styles */
          [data-slot="card"] {
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: #334155 !important;
            border-radius: 0.75rem !important;
            padding: 0.5rem !important;
          }
          
          .stat-card-main {
            background: linear-gradient(to bottom, #ffffff, #f0f7ff) !important;
            border: 1px solid #dbeafe !important;
          }
          
          .accent-line {
            height: 4px !important;
            width: 40px !important;
            background-color: #2563eb !important;
            border-radius: 2px !important;
            margin-top: 1rem !important;
          }
          
          /* Text colors */
          .text-slate-400 { color: #94a3b8 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-slate-600 { color: #475569 !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-blue-600 { color: #2563eb !important; }
          .text-blue-800 { color: #1e40af !important; }
          
          /* Background colors */
          .bg-blue-400 { background-color: #60a5fa !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-white { background-color: #ffffff !important; }
          .bg-gradient-to-b { background: linear-gradient(to bottom, #ffffff, #f0f7ff) !important; }
          
          /* Border colors */
          .border-slate-200 { border-color: #e2e8f0 !important; }
          .border-blue-100 { border-color: #dbeafe !important; }
          
          /* Font weights */
          .font-black { font-weight: 900 !important; }
          .font-bold { font-weight: 700 !important; }
          .font-semibold { font-weight: 600 !important; }
          
          /* Hide problematic elements */
          .animate-pulse { display: none !important; }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to capture snapshot:', err);
    return null;
  }
}

export async function shareSnapshot(dataUrl: string, stats: ProcessedStats): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'habit-progress.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Habit Tracker Progress',
        text: `My current progress: ${stats.totalXP} XP`,
      });
      return true;
    } else {
      // Fallback to download
      const link = document.createElement('a');
      link.download = 'habit-progress.png';
      link.href = dataUrl;
      link.click();
      return true;
    }
  } catch (err) {
    console.error('Failed to share snapshot:', err);
    return false;
  }
}

export function triggerConfetti(totalXP: number) {
  if (totalXP > 0) {
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#bfdbfe', '#1e40af', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, 500);
  }
}
