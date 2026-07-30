import { useEffect, useRef, useState } from "react";
import { Check, Play, Square } from "lucide-react";
import { formatClock, formatDuration } from "@/lib/format";
import {
  cancelHabitTimer,
  cappedTimerValue,
  finishHabitTimer,
  readRunningHabitTimer,
  resumeHabitTimer,
  startHabitTimer,
} from "@/lib/habit-timer";
import { cn } from "@/lib/utils";

interface TimerControlProps {
  timerId: string;
  loggedSeconds: number;
  targetSeconds: number;
  onLog: (totalSeconds: number) => void;
  label: string;
  disabled?: boolean;
}

export function TimerControl({
  timerId,
  loggedSeconds,
  targetSeconds,
  onLog,
  label,
  disabled = false,
}: TimerControlProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null;
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (disabled) {
      cancelHabitTimer(timerId);
      return;
    }
    const saved = readRunningHabitTimer(timerId);
    if (!saved) return;
    if (
      loggedSeconds >= targetSeconds ||
      saved.baseSeconds !== loggedSeconds ||
      saved.targetSeconds !== targetSeconds
    ) {
      cancelHabitTimer(timerId);
      return;
    }
    const restoredAt = Date.now();
    setNow(restoredAt);
    setStartedAt(saved.startedAt);
    resumeHabitTimer(timerId, label, saved, restoredAt);
  }, [timerId, label, loggedSeconds, targetSeconds, disabled]);

  useEffect(() => {
    if (!disabled) return;
    setStartedAt(null);
    cancelHabitTimer(timerId);
  }, [disabled, timerId]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalRef.current ?? undefined);
  }, [running]);

  const rawElapsed = running ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const remainingAtStart = Math.max(0, targetSeconds - loggedSeconds);
  const elapsed = Math.min(rawElapsed, remainingAtStart);
  const remaining = Math.max(0, remainingAtStart - elapsed);
  const total = cappedTimerValue(loggedSeconds, elapsed, targetSeconds);
  const done = total >= targetSeconds;

  useEffect(() => {
    if (!running || remainingAtStart === 0 || rawElapsed < remainingAtStart) return;
    setStartedAt(null);
    finishHabitTimer(timerId);
    onLog(targetSeconds);
  }, [onLog, rawElapsed, remainingAtStart, running, targetSeconds, timerId]);

  const toggle = () => {
    if (running) {
      setStartedAt(null);
      cancelHabitTimer(timerId);
      if (elapsed > 0) onLog(total);
    } else {
      if (done || disabled) return;
      const started = Date.now();
      setNow(started);
      setStartedAt(started);
      startHabitTimer(timerId, label, loggedSeconds, targetSeconds, started);
    }
  };

  return (
    <div
      className={cn(
        "stock-flat flex shrink-0 items-center gap-2 rounded-lg p-1.5 pl-3",
        done && !running && "bg-primary",
        disabled && "opacity-50 saturate-0",
      )}
      aria-disabled={disabled}
      title={disabled ? "Rest day — this habit is not due today" : undefined}
    >
      <span
        className={cn(
          "tnum text-sm",
          running
            ? "text-foreground font-semibold"
            : done
              ? "text-primary-foreground font-semibold"
              : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {running ? formatClock(remaining) : formatDuration(total)}
        {!running && (
          <span className={cn("font-normal", done ? "opacity-70" : "text-muted-foreground")}>
            /{formatDuration(targetSeconds)}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || (done && !running)}
        aria-label={
          disabled
            ? `Timer unavailable for ${label}; not due today`
            : running
            ? `Stop timer for ${label}`
            : done
              ? `Timer complete for ${label}`
              : `Start timer for ${label}`
        }
        className={cn(
          "stock stock-press active:stock-press-active",
          "flex size-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:saturate-0",
          running ? "text-destructive" : done ? "text-primary-foreground" : "text-primary-strong",
        )}
      >
        {running ? (
          <Square className="size-4" />
        ) : done ? (
          <Check className="size-4" strokeWidth={3} />
        ) : (
          <Play className="size-4 translate-x-px" />
        )}
      </button>
    </div>
  );
}
