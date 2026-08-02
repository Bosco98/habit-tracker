import type { ReactNode } from "react";
import { hueForIndex } from "@/lib/habit-color";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** One block, one action. No preview cards pretending to be data. */
export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="stock flex flex-col items-center gap-3 rounded-xl px-5 py-8 text-center">
      <span
        aria-hidden
        className="border-line flex size-12 items-center justify-center rounded-lg border-2 bg-[var(--hue-blue)] text-[var(--on-hue)]"
      >
        {icon}
      </span>
      <div>
        <p className="text-lg font-extrabold tracking-[-0.02em] uppercase">{title}</p>
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-64 text-sm">{hint}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{ backgroundColor: hueForIndex(0), color: "var(--on-hue)" }}
          className={cn(
            "stock stock-press active:stock-press-active",
            "mt-1 rounded-lg px-5 py-2.5 text-sm font-extrabold uppercase",
          )}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
