import { useMemo, useState } from "react";
import { ArrowLeft, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { AppIcon } from "@/components/app-icon";
import { ActivityFeed } from "@/components/circles/activity-feed";
import { AllInCelebration } from "@/components/circles/all-in-celebration";
import { CircleHabitList } from "@/components/circles/circle-habit-list";
import { CircleForm, type CircleInput } from "@/components/circles/circle-form";
import { CirclePulse } from "@/components/circles/circle-pulse";
import { CircleNotificationToggle } from "@/components/circles/circle-notification-toggle";
import { InvitePanel } from "@/components/circles/invite-panel";
import { MemberList } from "@/components/circles/member-list";
import { HabitDetailSheet } from "@/components/habits/habit-detail-sheet";
import { HabitForm } from "@/components/habits/habit-form";
import { TopBar } from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { circleActivity, summarizeReactions, type ActivityItem } from "@/data/activity";
import {
  addReaction,
  createSharedHabit,
  deleteCircle,
  isCircleAdmin,
  leaveCircle,
  removeSharedHabit,
  updateCircle,
} from "@/data/circles";
import { useAppAccount } from "@/data/hooks";
import { currentCirclePulse } from "@/data/achievements";
import { circleMembers } from "@/data/members";
import { archiveHabit, updateHabit, type HabitInput } from "@/data/mutations";
import type { HabitEntry, LoadedCircle, LoadedHabit } from "@/data/types";
import { todayKey } from "@/lib/days";

/**
 * A circle is a shelf, not a scoreboard: the habits everyone here keeps, the
 * people keeping them, and what's happened lately. Nothing is scored and
 * nobody wins.
 */
export function CircleDetail() {
  const { circleId } = useParams();
  const account = useAppAccount();
  const navigate = useNavigate();
  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const [formSeq, setFormSeq] = useState(0);
  const [editing, setEditing] = useState<HabitEntry | null>(null);
  const [detail, setDetail] = useState<HabitEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const circle = account.$isLoaded
    ? (account.root.circles.find(
        (c): c is LoadedCircle => Boolean(c?.$isLoaded) && c.$jazz.id === circleId,
      ) ?? null)
    : null;

  const myId = account.$isLoaded ? account.$jazz.id : "";
  const myName = account.$isLoaded ? (account.profile.name ?? "You") : "You";

  const members = useMemo(() => (circle ? circleMembers(circle, myId) : []), [circle, myId]);
  const entries = useMemo<HabitEntry[]>(
    () =>
      circle
        ? circle.habits
            .filter((habit): habit is LoadedHabit => Boolean(habit?.$isLoaded))
            .filter((habit) => habit.archivedAt === undefined)
            .map((habit) => ({ habit, circle }))
        : [],
    [circle],
  );
  const activity = useMemo(() => (circle ? circleActivity(circle, myId) : []), [circle, myId]);
  const reactions = useMemo(
    () =>
      circle
        ? summarizeReactions(circle, myId)
        : { counts: new Map(), mine: new Set<string>() },
    [circle, myId],
  );
  const pulse = useMemo(
    () => (circle ? currentCirclePulse(circle, myId) : null),
    [circle, myId],
  );

  if (!account.$isLoaded) return null;

  if (!circle) {
    return (
      <>
        <TopBar title="Circle" progress={null} />
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <p className="text-muted-foreground text-sm">This circle isn't on this device.</p>
          <Link to="/circles" className="stock rounded-lg px-5 py-2.5 text-sm font-medium">
            Back to circles
          </Link>
        </div>
      </>
    );
  }

  const admin = isCircleAdmin(circle);

  const openCreate = () => {
    setEditing(null);
    setFormSeq((n) => n + 1);
    setHabitFormOpen(true);
  };

  const openEdit = (entry: HabitEntry) => {
    setEditing(entry);
    setFormSeq((n) => n + 1);
    setHabitFormOpen(true);
  };

  const submitHabit = (input: HabitInput) => {
    if (editing) updateHabit(editing.habit, input);
    else createSharedHabit(circle, input);
  };

  const react = (item: ActivityItem, icon: string) =>
    addReaction(circle, {
      habitId: item.habitId,
      targetAccountId: item.accountId,
      forDay: item.forDay,
      emoji: icon,
    });

  const leave = () => {
    leaveCircle(account, circle);
    void navigate("/circles");
  };

  const remove = () => {
    if (!window.confirm(`Delete "${circle.name}" for everyone in it?`)) return;
    deleteCircle(account, circle);
    void navigate("/circles");
  };

  return (
    <>
      <TopBar title={circle.name} progress={null} onCreate={openCreate} createLabel="New shared habit" />
      {pulse && (
        <AllInCelebration
          circleId={circle.$jazz.id}
          day={todayKey()}
          active={pulse.perfectToday}
        />
      )}
      <div className="flex flex-col gap-6 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Link
            to="/circles"
            aria-label="Back to circles"
            className="text-muted-foreground flex size-9 items-center justify-center rounded-full"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="stock-flat flex size-10 items-center justify-center rounded-lg">
            <AppIcon value={circle.emoji} kind="circle" className="size-5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{circle.name}</h2>
            <p className="text-muted-foreground text-xs">
              {members.length} {members.length === 1 ? "member" : "members"} · {entries.length}{" "}
              {entries.length === 1 ? "habit" : "habits"}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Edit circle" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
          </Button>
        </div>

        {/* Who and how you get in stays beside the shelf on a wide screen. */}
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
          <aside className="flex flex-col gap-3">
            <MemberList members={members} />
            <CircleNotificationToggle
              accountId={myId}
              circleId={circle.$jazz.id}
            />
            <InvitePanel circle={circle} />
            <div className="hidden flex-col items-start lg:flex">
              <Button
                variant="ghost"
                onClick={leave}
                className="text-muted-foreground h-10 rounded-full text-sm"
              >
                <LogOut className="size-4" /> Leave circle
              </Button>
              {admin && (
                <Button
                  variant="ghost"
                  onClick={remove}
                  className="text-destructive h-10 rounded-full text-sm"
                >
                  <Trash2 className="size-4" /> Delete circle
                </Button>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
        {pulse && <CirclePulse pulse={pulse} />}

        <section className="flex flex-col gap-3">
          {entries.length === 0 ? (
            <>
              <p className="text-muted-foreground py-2 text-center text-sm">
                Nothing on the shelf yet. Add a habit everyone here wants to keep.
              </p>
              {/* Only while it's empty — once there are habits, the bar's New
                  button is right there and a second one is just clutter. */}
              <button
                type="button"
                onClick={openCreate}
                className="stock stock-press active:stock-press-active text-muted-foreground mx-auto flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
              >
                <Plus className="size-4" /> Shared habit
              </button>
            </>
          ) : (
            <CircleHabitList
              entries={entries}
              myId={myId}
              myName={myName}
              onOpen={setDetail}
              onEdit={openEdit}
              onArchive={(entry) => archiveHabit(entry.habit)}
              onDelete={(entry) => removeSharedHabit(circle, entry.habit)}
            />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-muted-foreground px-1 text-xs font-semibold">Lately</h3>
          <ActivityFeed items={activity} reactions={reactions} onReact={react} />
        </section>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 pb-4 lg:hidden">
          <Button
            variant="ghost"
            onClick={leave}
            className="text-muted-foreground h-10 rounded-full text-sm"
          >
            <LogOut className="size-4" /> Leave circle
          </Button>
          {admin && (
            <Button
              variant="ghost"
              onClick={remove}
              className="text-destructive h-10 rounded-full text-sm"
            >
              <Trash2 className="size-4" /> Delete circle
            </Button>
          )}
        </div>

        <HabitForm
          key={`${editing?.habit.$jazz.id ?? "new"}-${formSeq}`}
          open={habitFormOpen}
          onOpenChange={setHabitFormOpen}
          habit={editing?.habit ?? null}
          defaultCircleId={circle.$jazz.id}
          onSubmit={submitHabit}
        />
        <CircleForm
          key={circle.name}
          open={editOpen}
          onOpenChange={setEditOpen}
          circle={circle}
          onSubmit={(input: CircleInput) => updateCircle(circle, input)}
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
