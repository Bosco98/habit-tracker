import { useRef } from "react";
import { Check } from "lucide-react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface CheckPuckProps {
  done: boolean;
  onToggle: () => void;
  label: string;
}

/** The signature interaction: a physical button that stays pressed in when done. */
export function CheckPuck({ done, onToggle, label }: CheckPuckProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { contextSafe } = useGSAP({ scope: ref });

  const handleClick = contextSafe(() => {
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        ref.current,
        { scale: 0.94 },
        { scale: 1, duration: 0.22, ease: "power3.out", overwrite: "auto" },
      );
    }
    onToggle();
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      aria-pressed={done}
      aria-label={label}
      className={cn(
        "flex size-13 shrink-0 items-center justify-center rounded-full transition-shadow duration-200",
        done ? "neu-pressed text-primary-strong" : "neu-raised text-muted-foreground",
      )}
    >
      <Check
        strokeWidth={3}
        className={cn("size-5 transition-opacity duration-200", done ? "opacity-100" : "opacity-30")}
      />
    </button>
  );
}
