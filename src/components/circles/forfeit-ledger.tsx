import { Check, X } from "lucide-react";
import { setForfeitStatus } from "@/data/circles";
import { memberName, type Member } from "@/data/members";
import type { LoadedForfeit } from "@/data/types";
import { formatDay } from "@/lib/days";
import { cn } from "@/lib/utils";

interface ForfeitLedgerProps {
  forfeits: LoadedForfeit[];
  members: Member[];
  myId: string;
}

export function ForfeitLedger({ forfeits, members, myId }: ForfeitLedgerProps) {
  if (forfeits.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        Nothing owed. Keep it that way.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {[...forfeits]
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((forfeit) => {
          const settled = forfeit.status !== "open";
          const isMine = forfeit.loserAccountId === myId;
          return (
            <li
              key={forfeit.$jazz.id}
              className={cn(
                "flex items-center gap-2 rounded-2xl bg-card p-3",
                settled ? "neu-well opacity-70" : "neu-raised",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", settled && "line-through")}>
                  <span className="font-medium">{isMine ? "You" : memberName(members, forfeit.loserAccountId)}</span>{" "}
                  <span className="text-muted-foreground">owe{isMine ? "" : "s"} {forfeit.title}</span>
                </p>
                <p className="text-muted-foreground text-[11px]">
                  week of {formatDay(forfeit.weekKey, { month: "short", day: "numeric" })}
                  {settled && ` · ${forfeit.status}`}
                </p>
              </div>
              {!settled && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setForfeitStatus(forfeit, "paid")}
                    aria-label="Mark paid"
                    className="neu-raised text-primary-strong flex size-8 items-center justify-center rounded-full transition-shadow active:neu-pressed"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForfeitStatus(forfeit, "waived")}
                    aria-label="Waive"
                    className="neu-raised text-muted-foreground flex size-8 items-center justify-center rounded-full transition-shadow active:neu-pressed"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
    </ul>
  );
}
