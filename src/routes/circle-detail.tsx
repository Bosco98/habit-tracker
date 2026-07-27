import { useMemo, useState } from "react";
import { ArrowLeft, LogOut, Pencil, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { ActivityFeed } from "@/components/circles/activity-feed";
import { CircleForm, type CircleInput } from "@/components/circles/circle-form";
import { DuelCard } from "@/components/circles/duel-card";
import { ForfeitLedger } from "@/components/circles/forfeit-ledger";
import { InvitePanel } from "@/components/circles/invite-panel";
import { MemberList } from "@/components/circles/member-list";
import { HabitForm } from "@/components/habits/habit-form";
import { Button } from "@/components/ui/button";
import { circleActivity, summarizeReactions, type ActivityItem } from "@/data/activity";
import {
  addReaction,
  createSharedHabit,
  leaveCircle,
  recordForfeit,
  updateCircle,
} from "@/data/circles";
import { circleDuels, hasForfeit } from "@/data/duel-view";
import { useAppAccount } from "@/data/hooks";
import { circleMembers } from "@/data/members";
import type { LoadedCircle, LoadedForfeit } from "@/data/types";
import type { HabitInput } from "@/data/mutations";

export function CircleDetail() {
  const { circleId } = useParams();
  const account = useAppAccount();
  const navigate = useNavigate();
  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const circle = account.$isLoaded
    ? (account.root.circles.find(
        (c): c is LoadedCircle => Boolean(c?.$isLoaded) && c.$jazz.id === circleId,
      ) ?? null)
    : null;

  const myId = account.$isLoaded ? account.$jazz.id : "";
  const myName = account.$isLoaded ? (account.profile.name ?? "You") : "You";
  const weekStartsOn = account.$isLoaded ? account.root.settings.weekStartsOn : 1;

  const members = useMemo(
    () => (circle ? circleMembers(circle, myId) : []),
    [circle, myId],
  );
  const duels = useMemo(
    () => (circle ? circleDuels(circle, myId, myName, weekStartsOn) : []),
    [circle, myId, myName, weekStartsOn],
  );
  const activity = useMemo(
    () => (circle ? circleActivity(circle, myId) : []),
    [circle, myId],
  );
  const reactions = useMemo(
    () => (circle ? summarizeReactions(circle, myId) : { counts: new Map(), mine: new Set<string>() }),
    [circle, myId],
  );

  if (!account.$isLoaded) return null;

  if (!circle) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground text-sm">This circle isn't on this device.</p>
        <Link to="/circles" className="neu-raised rounded-full px-5 py-2.5 text-sm">
          Back to circles
        </Link>
      </div>
    );
  }

  const forfeits = circle.forfeits.filter((f): f is LoadedForfeit => Boolean(f?.$isLoaded));

  const react = (item: ActivityItem, emoji: string) =>
    addReaction(circle, {
      habitId: item.habitId,
      targetAccountId: item.accountId,
      forDay: item.forDay,
      emoji,
    });

  const submitHabit = (input: HabitInput) => createSharedHabit(circle, input);
  const submitEdit = (input: CircleInput) => updateCircle(circle, input);

  const leave = () => {
    leaveCircle(account, circle);
    void navigate("/circles");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          to="/circles"
          aria-label="Back to circles"
          className="text-muted-foreground flex size-9 items-center justify-center rounded-full"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="neu-well flex size-10 items-center justify-center rounded-full text-lg">
          {circle.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{circle.name}</h2>
          {circle.stake && (
            <p className="text-muted-foreground truncate text-xs">Stake: {circle.stake}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit circle"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <MemberList members={members} />
        <InvitePanel circle={circle} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-muted-foreground px-1 text-xs font-medium">This week</h3>
        {duels.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No shared habits yet. Add one you'll both do.
          </p>
        ) : (
          duels.map((duel) => (
            <DuelCard
              key={duel.habit.$jazz.id}
              duel={duel}
              members={members}
              myId={myId}
              stake={circle.stake}
              onLogForfeit={
                duel.lastWeekLosers.length > 0 &&
                !hasForfeit(circle, duel.habit.$jazz.id, duel.lastWeekKey)
                  ? () =>
                      duel.lastWeekLosers.forEach((loserAccountId) =>
                        recordForfeit(circle, {
                          title: circle.stake ?? "a forfeit",
                          weekKey: duel.lastWeekKey,
                          habitId: duel.habit.$jazz.id,
                          loserAccountId,
                        }),
                      )
                  : null
              }
            />
          ))
        )}
        <button
          type="button"
          onClick={() => setHabitFormOpen(true)}
          className="neu-raised text-muted-foreground mx-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-shadow active:neu-pressed"
        >
          <Plus className="size-4" /> Shared habit
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-muted-foreground px-1 text-xs font-medium">Ledger</h3>
        <ForfeitLedger forfeits={forfeits} members={members} myId={myId} />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-muted-foreground px-1 text-xs font-medium">Activity</h3>
        <ActivityFeed items={activity} reactions={reactions} onReact={react} />
      </section>

      <Button
        variant="ghost"
        onClick={leave}
        className="text-muted-foreground mx-auto h-10 rounded-full text-sm"
      >
        <LogOut className="size-4" /> Leave circle
      </Button>

      <HabitForm
        open={habitFormOpen}
        onOpenChange={setHabitFormOpen}
        habit={null}
        defaultCircleId={circle.$jazz.id}
        onSubmit={submitHabit}
      />
      <CircleForm
        key={circle.name}
        open={editOpen}
        onOpenChange={setEditOpen}
        circle={circle}
        onSubmit={submitEdit}
      />
    </div>
  );
}
