import {
  appIconLabel,
  REACTION_ICON_OPTIONS,
} from "@/lib/app-icons";
import { AppIcon } from "@/components/app-icon";
import { activityKey, type ActivityItem, type ReactionSummary } from "@/data/activity";
import { relativeDay, todayKey } from "@/lib/days";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  items: ActivityItem[];
  reactions: ReactionSummary;
  onReact: (item: ActivityItem, emoji: string) => void;
}

function describe(item: ActivityItem): string {
  if (item.habit.kind === "timer") return formatDuration(item.value);
  if (item.habit.kind === "count") return `${item.value}×`;
  return "done";
}

export function ActivityFeed({ items, reactions, onReact }: ActivityFeedProps) {
  const today = todayKey();

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No check-ins yet. Be the first.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const key = activityKey(item.habitId, item.accountId, item.forDay);
        const counts = reactions.counts.get(key);
        const alreadyReacted = reactions.mine.has(key);

        return (
          <li key={item.key} className="stock flex flex-col gap-2 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <AppIcon value={item.habit.emoji} className="size-4 shrink-0" strokeWidth={2.4} />
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className={cn("font-semibold", item.isMe && "text-primary-strong")}>
                  {item.isMe ? "You" : item.memberName}
                </span>{" "}
                <span className="text-muted-foreground">
                  {describe(item)} · {item.habit.name}
                </span>
              </p>
              <span className="text-muted-foreground shrink-0 text-[11px]">
                {relativeDay(item.forDay, today)}
              </span>
            </div>

            {item.note && (
              <p className="bg-muted rounded-lg px-2.5 py-2 text-sm leading-relaxed break-words">
                {item.note}
              </p>
            )}

            <div className="flex items-center gap-1.5">
              {(item.backfilled || item.edited) && (
                <span className="text-muted-foreground stock-flat rounded-full px-2 py-0.5 text-[11px]">
                  {item.backfilled ? "backfilled" : "edited"}
                </span>
              )}
              <span className="flex-1" />
              {counts &&
                [...counts].map(([icon, count]) => (
                  <span
                    key={icon}
                    className="stock-flat tnum inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                  >
                    <AppIcon value={icon} kind="reaction" className="size-3" />
                    {count}
                  </span>
                ))}
              {!item.isMe && !alreadyReacted && (
                <span className="flex gap-1">
                  {REACTION_ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => onReact(item, icon)}
                      aria-label={`${appIconLabel(icon, "reaction")} for ${item.memberName}'s check-in`}
                      className="stock stock-press active:stock-press-active flex size-7 items-center justify-center rounded-full text-xs"
                    >
                      <AppIcon value={icon} kind="reaction" className="size-3.5" />
                    </button>
                  ))}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
