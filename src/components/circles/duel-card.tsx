import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HabitDuel } from "@/data/duel-view";
import { memberName, type Member } from "@/data/members";
import { formatDay } from "@/lib/days";
import { cn } from "@/lib/utils";

interface DuelCardProps {
  duel: HabitDuel;
  members: Member[];
  myId: string;
  stake?: string;
  /** Null when last week's forfeit is already on the ledger or nobody lost. */
  onLogForfeit: (() => void) | null;
}

/** The week's standings for one shared habit — the screenshot-worthy surface. */
export function DuelCard({ duel, members, myId, stake, onLogForfeit }: DuelCardProps) {
  const leader = duel.thisWeek.ranked[0];
  const iLead = duel.thisWeek.winnerIds.includes(myId);

  return (
    <div className="neu-raised flex flex-col gap-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">{duel.habit.emoji}</span>
        <p className="min-w-0 flex-1 truncate font-medium">{duel.habit.name}</p>
        <span className="text-muted-foreground text-xs tabular-nums">
          {duel.record.wins}W · {duel.record.losses}L
          {duel.record.draws > 0 && ` · ${duel.record.draws}D`}
        </span>
      </div>

      <ol className="flex flex-col gap-1.5">
        {duel.thisWeek.ranked.map((score, index) => {
          const isMe = score.accountId === myId;
          const winning = duel.thisWeek.winnerIds.includes(score.accountId);
          return (
            <li key={score.accountId} className="flex items-center gap-2">
              <span className="text-muted-foreground w-4 text-xs tabular-nums">{index + 1}</span>
              <span className={cn("min-w-0 flex-1 truncate text-sm", isMe && "font-medium")}>
                {isMe ? "You" : memberName(members, score.accountId)}
              </span>
              <div className="neu-well h-2 w-24 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", winning ? "bg-social" : "bg-primary")}
                  style={{ width: `${Math.max(score.completion * 100, score.done > 0 ? 6 : 0)}%` }}
                />
              </div>
              <span className="text-muted-foreground w-9 shrink-0 text-right text-xs tabular-nums">
                {Math.round(score.completion * 100)}%
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Trophy className={cn("size-3.5", iLead && "text-social")} />
        {duel.thisWeek.winnerIds.length === 0
          ? "Week's wide open — nobody has logged yet"
          : duel.thisWeek.isDraw
            ? "Dead even so far"
            : iLead
              ? "You're ahead this week"
              : `${memberName(members, duel.thisWeek.winnerIds[0])} is ahead`}
        {leader && leader.scheduled > 0 && ` · week of ${formatDay(duel.weekKey, { month: "short", day: "numeric" })}`}
      </p>

      {onLogForfeit && (
        <div className="neu-well flex items-center gap-2 rounded-xl bg-well p-2.5">
          <p className="flex-1 text-xs">
            Last week:{" "}
            <span className="font-medium">
              {duel.lastWeekLosers.map((id) => memberName(members, id)).join(", ")}
            </span>{" "}
            owes {stake ?? "a forfeit"}.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={onLogForfeit}
            className="neu-raised h-8 shrink-0 rounded-full bg-background text-xs active:neu-pressed"
          >
            Add to ledger
          </Button>
        </div>
      )}
    </div>
  );
}
