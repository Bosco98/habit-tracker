import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountStepperProps {
  value: number;
  target: number;
  onChange: (next: number) => void;
  label: string;
}

export function CountStepper({ value, target, onChange, label }: CountStepperProps) {
  const done = value >= target;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full p-1 transition-shadow duration-200",
        done ? "neu-pressed" : "neu-well",
      )}
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        aria-label="Decrease"
        className="neu-raised flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground transition-shadow active:neu-pressed disabled:opacity-40 disabled:shadow-none"
      >
        <Minus className="size-4" />
      </button>
      <span
        className={cn(
          "min-w-11 text-center text-sm tabular-nums",
          done ? "text-primary-strong font-semibold" : "text-foreground",
        )}
        aria-live="polite"
      >
        {value}
        <span className="text-muted-foreground font-normal">/{target}</span>
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
        className="neu-raised flex size-9 items-center justify-center rounded-full bg-background transition-shadow active:neu-pressed"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
