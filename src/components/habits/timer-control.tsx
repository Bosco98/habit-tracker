import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { formatClock, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TimerControlProps {
  loggedSeconds: number;
  targetSeconds: number;
  onLog: (totalSeconds: number) => void;
  label: string;
}

export function TimerControl({ loggedSeconds, targetSeconds, onLog, label }: TimerControlProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null;
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalRef.current ?? undefined);
  }, [running]);

  const elapsed = running ? Math.floor((now - startedAt) / 1000) : 0;
  const total = loggedSeconds + elapsed;
  const done = total >= targetSeconds;

  const toggle = () => {
    if (running) {
      setStartedAt(null);
      if (elapsed > 0) onLog(loggedSeconds + elapsed);
    } else {
      setNow(Date.now());
      setStartedAt(Date.now());
    }
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full p-1 pl-3 transition-shadow duration-200",
        done ? "neu-pressed" : "neu-well",
      )}
    >
      <span
        className={cn(
          "text-sm tabular-nums",
          running
            ? "text-foreground font-medium"
            : done
              ? "text-primary-strong font-semibold"
              : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {running ? formatClock(elapsed) : formatDuration(total)}
        {!running && (
          <span className="text-muted-foreground font-normal">
            /{formatDuration(targetSeconds)}
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={toggle}
        aria-label={running ? `Stop timer for ${label}` : `Start timer for ${label}`}
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-background transition-shadow",
          running ? "neu-pressed text-destructive" : "neu-raised text-primary-strong",
        )}
      >
        {running ? <Square className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
    </div>
  );
}
