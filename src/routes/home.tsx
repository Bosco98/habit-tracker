import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { HabitDetailSheet } from "@/components/habits/habit-detail-sheet";
import { HabitForm } from "@/components/habits/habit-form";
import { HabitList } from "@/components/habits/habit-list";
import { TopBar } from "@/components/top-bar";
import { createSharedHabit, removeSharedHabit } from "@/data/circles";
import { doneDaySet, retainedLog } from "@/data/checkins";
import { useAppAccount, useHabitEntries, useRetention } from "@/data/hooks";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  updateHabit,
  type HabitInput,
} from "@/data/mutations";
import type { HabitEntry } from "@/data/types";
import { isDueDay } from "@/lib/cadence";
import { habitCadence, habitCreatedDay } from "@/data/stats";
import { todayKey } from "@/lib/days";

export function Home() {
  const account = useAppAccount();
  const { personal, shared, circles } = useHabitEntries(account);
  useRetention(account);
  const today = todayKey();
  const [formOpen, setFormOpen] = useState(false);
  const [formSeq, setFormSeq] = useState(0);
  const [editing, setEditing] = useState<HabitEntry | null>(null);
  const [detail, setDetail] = useState<HabitEntry | null>(null);

  const myId = account.$isLoaded ? account.$jazz.id : "";

  /** Only habits actually due today count toward the day's score. */
  const progress = useMemo(() => {
    const due = [...personal, ...shared].filter((entry) =>
      isDueDay(today, habitCreatedDay(entry.habit), habitCadence(entry.habit)),
    );
    const done = due.filter((entry) =>
      doneDaySet(retainedLog(entry.habit, myId, today), entry.habit).has(today),
    ).length;
    return { done, total: due.length };
  }, [personal, shared, myId, today]);

  if (!account.$isLoaded) return null; // first local read is imperceptible

  const myName = account.profile.name ?? "You";
  const isEmpty = personal.length === 0 && shared.length === 0;

  // Bumped on every open so the form remounts — otherwise the previous
  // habit's type and cadence leak into the next one you create.
  const openCreate = () => {
    setEditing(null);
    setFormSeq((n) => n + 1);
    setFormOpen(true);
  };

  const openEdit = (entry: HabitEntry) => {
    setEditing(entry);
    setFormSeq((n) => n + 1);
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
    onOpen: setDetail,
    onEdit: openEdit,
    onArchive: (entry: HabitEntry) => archiveHabit(entry.habit),
    onDelete: (entry: HabitEntry) =>
      entry.circle
        ? removeSharedHabit(entry.circle, entry.habit)
        : deleteHabit(account, entry.habit),
  };

  return (
    <>
      <TopBar progress={isEmpty ? null : progress} onCreate={openCreate} />

      <div className="flex flex-col gap-6 px-4 pt-4">
        {isEmpty ? (
          <EmptyState
            emoji="🌱"
            title="No habits yet"
            hint="Start with one. Small, and yours."
            actionLabel="Create a habit"
            onAction={openCreate}
          />
        ) : (
          <>
            <HabitList
              label={shared.length > 0 ? "Yours" : undefined}
              entries={personal}
              {...listProps}
            />
            <HabitList
              label="Shared"
              entries={shared}
              indexOffset={personal.length}
              {...listProps}
            />
          </>
        )}

        <HabitForm
          key={`${editing?.habit.$jazz.id ?? "new"}-${formSeq}`}
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
          onOpenChange={(open) => !open && setDetail(null)}
        />
      </div>
    </>
  );
}
