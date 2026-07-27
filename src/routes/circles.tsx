import { useState } from "react";
import { Plus } from "lucide-react";
import { CircleCard } from "@/components/circles/circle-card";
import { CircleForm, type CircleInput } from "@/components/circles/circle-form";
import { EmptyState } from "@/components/empty-state";
import { createCircle } from "@/data/circles";
import { useAppAccount } from "@/data/hooks";
import { circleMembers } from "@/data/members";
import type { LoadedCircle } from "@/data/types";
import { useAuth } from "@/data/auth";

export function Circles() {
  const account = useAppAccount();
  const { isAuthenticated } = useAuth();
  const [formOpen, setFormOpen] = useState(false);

  if (!account.$isLoaded) return null;

  const circles = account.root.circles.filter(
    (circle): circle is LoadedCircle => Boolean(circle?.$isLoaded),
  );

  const submit = (input: CircleInput) => createCircle(account, input);

  return (
    <div className="flex flex-col gap-5">
      {!isAuthenticated && (
        <p className="neu-well text-muted-foreground rounded-2xl bg-well p-3 text-sm">
          Circles need an account so your partner can reach your data. Create one in settings —
          your habits come with you.
        </p>
      )}

      {circles.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="No circles yet"
          hint="A circle is you plus the people who'll notice when you skip."
          actionLabel="Create a circle"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {circles.map((circle) => (
            <CircleCard
              key={circle.$jazz.id}
              circle={circle}
              memberCount={circleMembers(circle, account.$jazz.id).length}
              habitCount={circle.habits.filter((habit) => habit?.$isLoaded).length}
            />
          ))}
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="neu-raised text-muted-foreground mx-auto mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-shadow active:neu-pressed"
          >
            <Plus className="size-4" /> New circle
          </button>
        </div>
      )}

      <CircleForm open={formOpen} onOpenChange={setFormOpen} circle={null} onSubmit={submit} />
    </div>
  );
}
