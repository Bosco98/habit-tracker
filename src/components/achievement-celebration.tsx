import { useEffect, useRef } from "react";
import { Check, Sparkles, Trophy } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import {
  trophyCelebrationCopy,
  type TrophyAward,
} from "@/lib/trophy-celebration";

interface AchievementCelebrationProps {
  award: TrophyAward | null;
  onComplete: () => void;
}

const confetti = Array.from({ length: 44 }, (_, index) => ({
  left: `${3 + ((index * 43) % 94)}%`,
  drift: ((index * 71) % 180) - 90,
  delay: (index % 11) * 0.035,
  rotate: (index * 67) % 180,
  color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"][
    index % 4
  ],
}));

function playTrophySound(): void {
  const AudioContextCtor: typeof globalThis.AudioContext | undefined =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  void context.resume();
  const now = context.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 3 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.085);
    gain.gain.exponentialRampToValueAtTime(0.14, now + index * 0.085 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.085 + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.085);
    oscillator.stop(now + index * 0.085 + 0.24);
  });
  window.setTimeout(() => void context.close(), 900);
}

export function AchievementCelebration({
  award,
  onComplete,
}: AchievementCelebrationProps) {
  const scope = useRef<HTMLDivElement>(null);
  const soundedKey = useRef<string | null>(null);
  const copy = award ? trophyCelebrationCopy(award) : null;

  useEffect(() => {
    if (!award) return;
    if (soundedKey.current !== award.key) {
      soundedKey.current = award.key;
      playTrophySound();
    }
    const timer = window.setTimeout(onComplete, 3300);
    return () => window.clearTimeout(timer);
  }, [award, onComplete]);

  useGSAP(
    () => {
      if (!award || !scope.current) return;
      if (prefersReducedMotion()) {
        gsap.fromTo(
          "[data-trophy-card]",
          { opacity: 0 },
          { opacity: 1, duration: 0.15 },
        );
        return;
      }

      gsap.fromTo(
        "[data-trophy-veil]",
        { opacity: 0 },
        { opacity: 1, duration: 0.2 },
      );
      gsap.fromTo(
        "[data-trophy-confetti]",
        { y: -50, opacity: 0, rotate: 0 },
        {
          y: "110vh",
          x: (_, element) =>
            Number((element as HTMLElement).dataset.drift ?? 0),
          opacity: 1,
          rotate: 540,
          duration: 2.45,
          delay: (_, element) =>
            Number((element as HTMLElement).dataset.delay ?? 0),
          ease: "power1.in",
        },
      );
      const timeline = gsap.timeline();
      timeline
        .fromTo(
          "[data-trophy-card]",
          { y: 48, scale: 0.72, rotate: -5, opacity: 0 },
          {
            y: 0,
            scale: 1,
            rotate: 1,
            opacity: 1,
            duration: 0.52,
            ease: "back.out(1.8)",
          },
        )
        .fromTo(
          "[data-trophy-icon]",
          { scale: 0, rotate: -24 },
          { scale: 1, rotate: 0, duration: 0.42, ease: "back.out(2)" },
          "-=0.25",
        )
        .fromTo(
          "[data-trophy-copy]",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.28, stagger: 0.06 },
          "-=0.16",
        )
        .to(
          ["[data-trophy-card]", "[data-trophy-veil]"],
          { opacity: 0, duration: 0.28, ease: "power1.in" },
          2.8,
        );
    },
    {
      scope,
      dependencies: [award?.key],
      revertOnUpdate: true,
    },
  );

  if (!award || !copy) return null;

  return (
    <div
      ref={scope}
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={`${copy.eyebrow}: ${copy.title}. ${copy.detail}`}
    >
      <div
        data-trophy-veil
        className="absolute inset-0 bg-black/45"
        aria-hidden
      />

      {!prefersReducedMotion() &&
        confetti.map((piece, index) => (
          <span
            key={index}
            data-trophy-confetti
            data-drift={piece.drift}
            data-delay={piece.delay}
            className={`absolute top-0 z-10 h-4 w-2 border border-black will-change-transform ${
              index % 3 === 0 ? "rounded-full" : ""
            }`}
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
            }}
            aria-hidden
          />
        ))}

      <div className="absolute inset-0 z-20 flex items-center justify-center p-5">
        <div
          data-trophy-card
          className="stock bg-card w-full max-w-sm overflow-hidden rounded-xl text-center will-change-transform"
        >
          <div className="border-line bg-chart-3 relative flex justify-center border-b-2 px-6 py-7 text-primary-foreground">
            <Sparkles className="absolute top-4 left-5 size-5 -rotate-12" />
            <Sparkles className="absolute right-5 bottom-4 size-4 rotate-12" />
            <span
              data-trophy-icon
              className="border-line flex size-20 items-center justify-center rounded-full border-2 bg-white text-black shadow-[4px_4px_0_var(--stock-shadow)]"
            >
              <Trophy className="size-10" strokeWidth={2.5} />
            </span>
          </div>
          <div className="px-6 py-6">
            <p
              data-trophy-copy
              className="text-primary-strong text-xs font-black tracking-[0.12em] uppercase"
            >
              {copy.eyebrow}
            </p>
            <p
              data-trophy-copy
              className="mt-2 text-3xl leading-none font-black tracking-[-0.04em]"
            >
              {copy.title}
            </p>
            <p
              data-trophy-copy
              className="text-muted-foreground mt-3 text-sm font-semibold"
            >
              {copy.detail}
            </p>
            <p
              data-trophy-copy
              className="tear mt-5 flex items-center justify-center gap-1.5 pt-4 text-xs font-extrabold"
            >
              <Check className="size-4 text-primary-strong" strokeWidth={3} />
              Added to You · Trophy cabinet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
