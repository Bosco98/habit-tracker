import { Plus } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { hueForIndex } from "@/lib/habit-color";
import { cn } from "@/lib/utils";

interface TopBarProps {
  /** Names the screen. Defaults to the day, which is what home is about. */
  title?: string;
  /** Today's progress, or null on screens where it means nothing. */
  progress: { done: number; total: number } | null;
  onCreate?: () => void;
  /** What the New button makes here — habits, unless told otherwise. */
  createLabel?: string;
}

/**
 * Sticky. Replaces the old "Habits" wordmark — a title that repeated the app
 * name told you nothing; today's count is the one number worth the space.
 * Creating a habit is the primary action, so it lives here and never scrolls
 * away.
 */
export function TopBar({
  title = "Today",
  progress,
  onCreate,
  createLabel = "New habit",
}: TopBarProps) {
  const complete = progress !== null && progress.total > 0 && progress.done === progress.total;

  return (
    <header
      className={cn(
        "app-bar border-line bg-background sticky top-0 z-30 border-b-2",
        "flex items-center gap-3 px-4 py-2.5",
      )}
    >
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-sm font-extrabold tracking-[-0.01em] uppercase">
          {title}
        </span>
        {progress && progress.total > 0 && (
          <span
            className={cn("tnum text-sm font-extrabold", !complete && "text-muted-foreground")}
            style={complete ? { color: hueForIndex(2) } : undefined}
          >
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          aria-label={createLabel}
          style={{ backgroundColor: hueForIndex(0), color: "var(--on-hue)" }}
          className={cn(
            "stock stock-press active:stock-press-active",
            "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold uppercase",
          )}
        >
          <Plus className="size-4" strokeWidth={3} /> New
        </button>
      )}

      <div className="flex shrink-0 items-center">
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
