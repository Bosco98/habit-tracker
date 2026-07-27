import { useState } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { DayStrip } from "@/components/habits/day-strip";
import { HabitDetailSheet } from "@/components/habits/habit-detail-sheet";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { createSharedHabit, removeSharedHabit } from "@/data/circles";
import { useAppAccount, useHabitEntries } from "@/data/hooks";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  updateHabit,
  type HabitInput,
} from "@/data/mutations";
import type { HabitEntry } from "@/data/types";
import { formatDay, lastNDays, todayKey } from "@/lib/days";

export function Home() {
  const account = useAppAccount();
  const { personal, shared, circles } = useHabitEntries(account);
  const today = todayKey();
  const [selectedDay, setSelectedDay] = useState(today);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HabitEntry | null>(null);
  const [detail, setDetail] = useState<HabitEntry | null>(null);

  if (!account.$isLoaded) return null; // first local read is imperceptible

  const myId = account.$jazz.id;
  const myName = account.profile.name ?? "You";
  const weekStartsOn = account.root.settings.weekStartsOn;
  const isEmpty = personal.length === 0 && shared.length === 0;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const submit = (input: HabitInput, circleId: string | null) => {
    if (editing) {
      updateHabit(editing.habit, input);
      return;
    }
    const circle = circles.find((c) => c.$jazz.id === circleId);
    if (circle) createSharedHabit(circle, input);
    else createHabit(account, input);
  };

  const listProps = {
    myId,
    myName,
    day: selectedDay,
    weekStartsOn,
    onOpen: setDetail,
    onEdit: (entry: HabitEntry) => {
      setEditing(entry);
      setFormOpen(true);
    },
    onArchive: (entry: HabitEntry) => archiveHabit(entry.habit),
    onDelete: (entry: HabitEntry) =>
      entry.circle
        ? removeSharedHabit(entry.circle, entry.habit)
        : deleteHabit(account, entry.habit),
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-sm">
        {selectedDay === today
          ? "Today"
          : formatDay(selectedDay, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <DayStrip
        days={lastNDays(7, today)}
        selected={selectedDay}
        today={today}
        onSelect={setSelectedDay}
      />

      {isEmpty ? (
        <EmptyState
          emoji="🌱"
          title="No habits yet"
          hint="Plant the first one — small, daily, yours."
          actionLabel="Create a habit"
          onAction={openCreate}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <HabitList
            label={shared.length > 0 ? "Yours" : undefined}
            entries={personal}
            {...listProps}
          />
          <HabitList label="Shared" entries={shared} {...listProps} />
          <button
            type="button"
            onClick={openCreate}
            className="neu-raised text-muted-foreground mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-shadow active:neu-pressed"
          >
            <Plus className="size-4" /> New habit
          </button>
        </div>
      )}

      <HabitForm
        key={editing?.habit.$jazz.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        habit={editing?.habit ?? null}
        circles={circles}
        onSubmit={submit}
      />
      <HabitDetailSheet
        entry={detail}
        myId={myId}
        myName={myName}
        weekStartsOn={weekStartsOn}
        onOpenChange={(open) => !open && setDetail(null)}
      />
    </div>
  );
}
