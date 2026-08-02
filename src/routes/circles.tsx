import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router";
import { AppIcon } from "@/components/app-icon";
import { CircleCard } from "@/components/circles/circle-card";
import { CircleForm, type CircleInput } from "@/components/circles/circle-form";
import { EmptyState } from "@/components/empty-state";
import { TopBar } from "@/components/top-bar";
import { atCircleLimit, createCircle, MAX_CIRCLES } from "@/data/circles";
import { useAppAccount } from "@/data/hooks";
import { circleMembers } from "@/data/members";
import type { LoadedCircle } from "@/data/types";
import { useAuth } from "@/data/auth";
import { useAuthSheets } from "@/lib/auth-sheets-context";

export function Circles() {
  const account = useAppAccount();
  const { isAuthenticated } = useAuth();
  const { openSignUp } = useAuthSheets();
  const { state } = useLocation();
  const [formOpen, setFormOpen] = useState(false);

  if (!account.$isLoaded) return null;

  const circles = account.root.circles.filter(
    (circle): circle is LoadedCircle => Boolean(circle?.$isLoaded),
  );
  const full = atCircleLimit(account);
  const refused = Boolean((state as { inviteRefused?: boolean } | null)?.inviteRefused);

  const submit = (input: CircleInput) => createCircle(account, input);

  /**
   * Anonymous accounts never reach the sync relay (`sync.when: "signedUp"`),
   * so a circle made without one is a group nobody else can ever load — the
   * invite link would point at data that never left the device. Gate it.
   */
  if (!isAuthenticated) {
    return (
      <>
        <TopBar title="Circles" progress={null} />
        <div className="px-4 pt-4">
          <EmptyState
            icon={<AppIcon value="heart-handshake" kind="circle" className="size-6" strokeWidth={2.5} />}
            title="Circles need an account"
            hint="Sharing works by syncing encrypted data to your people. Without an account nothing leaves this device, so an invite would lead nowhere. Your habits come with you when you sign up."
            actionLabel="Create an account"
            onAction={openSignUp}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Circles"
        progress={null}
        onCreate={full ? undefined : () => setFormOpen(true)}
        createLabel="New circle"
      />
      <div className="flex flex-col gap-5 px-4 pt-4">
        {refused && (
          <p className="stock border-destructive rounded-lg p-3 text-sm">
            That invite couldn't be accepted — you're already in {MAX_CIRCLES} circles. Leave one
            to make room.
          </p>
        )}

        {circles.length === 0 ? (
          <EmptyState
            icon={<AppIcon value="heart-handshake" kind="circle" className="size-6" strokeWidth={2.5} />}
            title="No circles yet"
            hint="A circle is a shared shelf: put a habit on it and everyone in the circle keeps it with you."
            actionLabel="Create a circle"
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <>
            <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {circles.map((circle) => (
                <CircleCard
                  key={circle.$jazz.id}
                  circle={circle}
                  memberCount={circleMembers(circle, account.$jazz.id).length}
                  habitCount={circle.habits.filter((habit) => habit?.$isLoaded).length}
                />
              ))}
            </div>
            {full ? (
              <p className="text-muted-foreground mt-1 text-center text-xs">
                {MAX_CIRCLES} circles is the limit — enough people to notice, few enough to
                matter.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="stock stock-press active:stock-press-active text-muted-foreground mx-auto mt-2 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
              >
                <Plus className="size-4" /> New circle
              </button>
            )}
          </>
        )}

        <CircleForm open={formOpen} onOpenChange={setFormOpen} circle={null} onSubmit={submit} />
      </div>
    </>
  );
}
