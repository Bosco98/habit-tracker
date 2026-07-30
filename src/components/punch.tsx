import { cn } from "@/lib/utils";

export interface PunchProps {
  /** 0..1 progress toward that day's goal. */
  intensity: number;
  /** False for days the cadence never asked for. */
  due: boolean;
  /** False for days before the habit existed — nothing was ever possible there. */
  exists?: boolean;
  isToday?: boolean;
  className?: string;
}

/**
 * One bar in the strip — the atom the whole visual system is built from.
 *
 * A logged day always shows as filled even when it wasn't due: bonus effort
 * is still a fact, and hiding it made the strip look broken.
 */
export function Punch({
  intensity,
  due,
  exists = true,
  isToday = false,
  className,
}: PunchProps) {
  const state =
    intensity >= 1
      ? "punch-done"
      : intensity > 0
        ? "punch-partial"
        : !exists
          ? "punch-void"
          : due
            ? "punch"
            : "punch-idle";

  return (
    <span
      aria-hidden
      className={cn("rounded-[2px]", state, isToday && "punch-today", className)}
    />
  );
}
