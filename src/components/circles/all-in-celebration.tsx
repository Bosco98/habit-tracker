import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

interface AllInCelebrationProps {
  circleId: string;
  day: string;
  active: boolean;
}

const pieces = Array.from({ length: 20 }, (_, index) => ({
  left: `${8 + ((index * 37) % 84)}%`,
  color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"][
    index % 4
  ],
  rotate: (index * 47) % 180,
}));

function playCelebrationSound(): void {
  const AudioContextCtor: typeof globalThis.AudioContext | undefined =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const now = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, now + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.09 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.09);
    oscillator.stop(now + index * 0.09 + 0.2);
  });
  window.setTimeout(() => void context.close(), 700);
}

export function AllInCelebration({ circleId, day, active }: AllInCelebrationProps) {
  const scope = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const storageKey = `habits:all-in:${circleId}:${day}`;

  useEffect(() => {
    if (!active || localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "seen");
    setShow(true);
    playCelebrationSound();
    const timer = window.setTimeout(() => setShow(false), 2400);
    return () => window.clearTimeout(timer);
  }, [active, storageKey]);

  useGSAP(
    () => {
      if (!show || !scope.current) return;
      if (prefersReducedMotion()) {
        gsap.fromTo(
          "[data-all-in-stamp]",
          { opacity: 0 },
          { opacity: 1, duration: 0.15 },
        );
        return;
      }
      gsap.fromTo(
        "[data-confetti]",
        { y: -40, opacity: 0, rotate: 0 },
        {
          y: "85vh",
          opacity: 1,
          rotate: 360,
          duration: 1.65,
          stagger: 0.025,
          ease: "power1.in",
        },
      );
      gsap.fromTo(
        "[data-all-in-stamp]",
        { scale: 0.6, rotate: -8, opacity: 0 },
        { scale: 1, rotate: 2, opacity: 1, duration: 0.45, ease: "back.out(1.8)" },
      );
    },
    { scope, dependencies: [show], revertOnUpdate: true },
  );

  if (!show) return null;
  return (
    <div
      ref={scope}
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-live="polite"
    >
      {!prefersReducedMotion() &&
        pieces.map((piece, index) => (
          <span
            key={index}
            data-confetti
            className="absolute top-0 h-4 w-2 border border-black"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
            }}
          />
        ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          data-all-in-stamp
          className="stock bg-chart-4 text-primary-foreground rounded-xl px-7 py-4 text-center"
        >
          <p className="text-3xl font-black uppercase">All In</p>
          <p className="text-sm font-extrabold">Perfect Circle day</p>
        </div>
      </div>
    </div>
  );
}
