import { useRef } from "react";
import { Check } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PunchButtonProps {
  done: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  /** Filled in the habit's own colour once done. */
  hue?: string;
}

/** The signature interaction: the card presses down onto its own shadow. */
export function PunchButton({
  done,
  onToggle,
  label,
  disabled = false,
  hue,
}: PunchButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const handleClick = contextSafe(() => {
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        ref.current,
        { x: 3, y: 3 },
        { x: 0, y: 0, duration: 0.24, ease: "expo.out", overwrite: "auto" },
      );
    }
    onToggle();
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={done}
      aria-label={label}
      title={disabled ? "Rest day — this habit is not due today" : undefined}
      style={done ? { backgroundColor: hue, color: "var(--on-hue)" } : undefined}
      className={cn(
        "stock stock-press active:stock-press-active",
        "flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-extrabold uppercase",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-0",
        !done && "text-muted-foreground",
      )}
    >
      <Check strokeWidth={3} className={cn("size-4", done ? "opacity-100" : "opacity-40")} />
      {done ? "Done" : "Punch"}
    </button>
  );
}
