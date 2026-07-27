import { useRef } from "react";
import { Flame } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/motion";
import type { Streak } from "@/lib/streaks";
import { cn } from "@/lib/utils";

interface StreakFlameProps {
  streak: Streak;
  /** A shared streak only survives while everyone delivers. */
  shared?: boolean;
}

export function StreakFlame({ streak, shared = false }: StreakFlameProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);
  const active = streak.count > 0;

  useGSAP(
    () => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (prefersReducedMotion() || streak.count === 0) return;
      gsap.fromTo(
        ref.current,
        { scale: 1.35 },
        { scale: 1, duration: 0.35, ease: "power3.out" },
      );
    },
    { dependencies: [streak.count] },
  );

  const unitLabel = streak.unit === "weeks" ? "week" : "day";

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        active
          ? shared
            ? "text-social"
            : "text-primary-strong"
          : "text-muted-foreground/60",
      )}
      aria-label={`${shared ? "Combined " : ""}${streak.count} ${unitLabel} streak`}
    >
      <Flame className="size-4" fill={active ? "currentColor" : "none"} />
      <span className="font-semibold tabular-nums">{streak.count}</span>
      {streak.unit === "weeks" && <span className="text-muted-foreground text-xs">wk</span>}
    </span>
  );
}
