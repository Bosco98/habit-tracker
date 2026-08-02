import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { isDueDay } from "@/lib/cadence";
import { todayKey } from "@/lib/days";
import { invokeDesktop } from "@/lib/platform";
import { useAppAccount, useHabitEntries, useRetention } from "@/data/hooks";
import { habitStats } from "@/data/stats";
import { WidgetRow } from "./widget-row";

/**
 * The tray popover. Today's due habits can be checked, counted, or timed here;
 * everything else lives in the main window. Same Jazz data, so changes sync.
 */
export function WidgetPanel() {
  const account = useAppAccount();
  const { personal, shared } = useHabitEntries(account);
  useRetention(account);

  const today = todayKey();
  const myId = account.$isLoaded ? account.$jazz.id : "";
  const myName = account.$isLoaded ? (account.profile.name ?? "You") : "You";

  const rows = useMemo(
    () =>
      [...personal, ...shared]
        .map((entry) => ({ entry, stats: habitStats(entry, myId, myName) }))
        .filter(({ stats }) => isDueDay(today, stats.createdDay, stats.cadence))
        .sort((a, b) => Number(a.stats.me.doneDays.has(today)) - Number(b.stats.me.doneDays.has(today))),
    [personal, shared, myId, myName, today],
  );

  const openApp = () => invokeDesktop("open_main");
  const done = rows.filter(({ stats }) => stats.me.doneDays.has(today)).length;
  if (!account.$isLoaded) return null;

  return (
    <div className="stock flex h-dvh flex-col gap-2 rounded-xl p-2.5">
      <header className="flex items-center gap-2 px-1">
        <h1 className="text-sm font-bold">Today</h1>
        <span className="tnum text-muted-foreground ml-auto text-xs">
          {done} / {rows.length}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="text-muted-foreground flex-1 px-1 py-6 text-center text-sm">
          Nothing due today.
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {rows.map(({ entry, stats }) => (
            <WidgetRow
              key={entry.habit.$jazz.id}
              entry={entry}
              stats={stats}
              today={today}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={openApp}
        className="tear text-muted-foreground flex items-center justify-center gap-1 pt-2 text-xs font-medium"
      >
        Open Habits <ArrowUpRight className="size-3.5" />
      </button>
    </div>
  );
}
