import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountStepperProps {
  value: number;
  target: number;
  onChange: (next: number) => void;
  label: string;
  disabled?: boolean;
}

const stepButton =
  "stock stock-press active:stock-press-active flex size-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:saturate-0";

export function CountStepper({
  value,
  target,
  onChange,
  label,
  disabled = false,
}: CountStepperProps) {
  const done = value >= target;
  return (
    <div
      className={cn(
        "stock-flat flex shrink-0 items-center gap-1.5 rounded-lg p-1.5",
        done && "bg-primary",
        disabled && "opacity-50 saturate-0",
      )}
      aria-label={label}
      aria-disabled={disabled}
      title={disabled ? "Rest day — this habit is not due today" : undefined}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value === 0}
        aria-label="Decrease"
        className={stepButton}
      >
        <Minus className="size-4" />
      </button>
      <span
        className={cn(
          "tnum min-w-11 text-center text-sm font-semibold",
          done ? "text-primary-foreground" : "text-foreground",
        )}
        aria-live="polite"
      >
        {value}
        <span className={cn("font-normal", done ? "opacity-70" : "text-muted-foreground")}>
          /{target}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="Increase"
        className={stepButton}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
