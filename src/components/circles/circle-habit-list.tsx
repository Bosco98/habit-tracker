import { ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { HabitMenu } from "@/components/habits/habit-menu";
import { MemberAvatars } from "@/components/habits/member-avatars";
import { habitStats } from "@/data/stats";
import type { HabitEntry } from "@/data/types";
import { describeCadence, isDueDay } from "@/lib/cadence";

interface CircleHabitListProps {
  entries: HabitEntry[];
  myId: string;
  myName: string;
  onOpen: (entry: HabitEntry) => void;
  onEdit: (entry: HabitEntry) => void;
  onArchive: (entry: HabitEntry) => void;
  onDelete: (entry: HabitEntry) => void;
}

export function CircleHabitList({
  entries,
  myId,
  myName,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: CircleHabitListProps) {
  return (
    <section aria-labelledby="circle-habits-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 id="circle-habits-title" className="text-sm font-extrabold">
          Shared habits
        </h3>
        <p className="text-muted-foreground text-xs">Log from Home or the tray</p>
      </div>
      <div className="stock overflow-hidden rounded-xl">
        {entries.map((entry, index) => {
          const stats = habitStats(entry, myId, myName);
          const due = isDueDay(stats.today, stats.createdDay, stats.cadence);
          const completed = stats.members.filter((member) =>
            member.doneDays.has(stats.today),
          ).length;
          return (
            <article
              key={entry.habit.$jazz.id}
              className={index === 0 ? "flex items-center" : "tear flex items-center"}
            >
              <button
                type="button"
                onClick={() => onOpen(entry)}
                className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset"
                aria-label={`Open ${entry.habit.name} details`}
              >
                <span className="stock-flat flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <AppIcon value={entry.habit.emoji} className="size-5" strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold">
                    {entry.habit.name}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {describeCadence(stats.cadence)} ·{" "}
                    {due
                      ? `${completed}/${stats.members.length} today`
                      : "Not due today"}
                  </span>
                </span>
                <MemberAvatars members={stats.members} day={stats.today} />
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </button>
              <div className="pr-2">
                <HabitMenu
                  habitName={entry.habit.name}
                  shared
                  onEdit={() => onEdit(entry)}
                  onArchive={() => onArchive(entry)}
                  onDelete={() => onDelete(entry)}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
