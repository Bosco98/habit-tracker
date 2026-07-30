import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface StreakStampProps {
  days: number;
  /** A shared streak only survives while everyone delivers. */
  shared?: boolean;
  /** The habit's colour, used to tint a live run. */
  hue?: string;
  size?: "lg" | "sm";
}

/**
 * The count is the hero. Numerals do the work — no flame, no badge, no
 * progress ring competing with the punch strip beside it.
 */
export function StreakStamp({ days, shared = false, hue, size = "lg" }: StreakStampProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);

  useGSAP(
    () => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (prefersReducedMotion() || days === 0) return;
      gsap.fromTo(
        ref.current,
        { yPercent: 40, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.26, ease: "expo.out" },
      );
    },
    { dependencies: [days] },
  );

  const active = days > 0;

  return (
    <span
      className="flex shrink-0 items-baseline gap-1"
      aria-label={`${shared ? "Combined " : ""}streak: ${days} ${days === 1 ? "day" : "days"}`}
    >
      <span
        ref={ref}
        className={cn(
          "tnum inline-block font-black tracking-[-0.03em]",
          size === "lg" ? "text-[3.25rem] leading-[0.85]" : "text-xl leading-none",
          !active && "text-muted-foreground/40",
        )}
        style={active ? { color: shared ? "var(--social)" : (hue ?? "inherit") } : undefined}
      >
        {days}
      </span>
      <span
        aria-hidden
        className={cn(
          "text-muted-foreground font-bold uppercase",
          size === "lg" ? "text-[11px]" : "text-[10px]",
        )}
      >
        {days === 1 ? "day" : "days"}
      </span>
    </span>
  );
}
