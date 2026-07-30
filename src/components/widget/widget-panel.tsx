import { useMemo, useState } from "react";
import { ArrowUpRight, Bell, BellRing } from "lucide-react";
import { isDueDay } from "@/lib/cadence";
import { todayKey } from "@/lib/days";
import { invokeDesktop } from "@/lib/platform";
import {
  formatTime,
  parseTime,
  readReminder,
  writeReminder,
  type Reminder,
} from "@/lib/reminder";
import { useAppAccount, useHabitEntries, useRetention } from "@/data/hooks";
import { habitStats } from "@/data/stats";
import { cn } from "@/lib/utils";
import { WidgetRow } from "./widget-row";

/**
 * The tray popover. Today's due habits can be checked, counted, or timed here;
 * everything else lives in the main window. Same Jazz data, so changes sync.
 */
export function WidgetPanel() {
  const account = useAppAccount();
  const { personal, shared } = useHabitEntries(account);
  const [reminder, setReminder] = useState<Reminder>(readReminder);
  const [reminderOpen, setReminderOpen] = useState(false);
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
  const updateReminder = (next: Reminder) => {
    setReminder(next);
    writeReminder(next);
  };

  if (!account.$isLoaded) return null;

  return (
    <div className="stock flex h-dvh flex-col gap-2 rounded-xl p-2.5">
      <header className="flex items-center gap-2 px-1">
        <h1 className="text-sm font-bold">Today</h1>
        <span className="tnum text-muted-foreground ml-auto text-xs">
          {done} / {rows.length}
        </span>
        <button
          type="button"
          aria-expanded={reminderOpen}
          aria-controls="widget-reminder"
          aria-label={`Daily reminder settings. Reminder is ${reminder.enabled ? `on at ${formatTime(reminder)}` : "off"}.`}
          title="Daily reminder"
          onClick={() => setReminderOpen((open) => !open)}
          className={cn(
            "stock stock-press active:stock-press-active",
            "flex size-7 items-center justify-center rounded-md",
            reminder.enabled && "bg-primary text-primary-foreground",
          )}
        >
          {reminder.enabled ? (
            <BellRing className="size-3.5" strokeWidth={2.5} />
          ) : (
            <Bell className="size-3.5" strokeWidth={2.5} />
          )}
        </button>
      </header>

      {reminderOpen && (
        <section
          id="widget-reminder"
          aria-label="Daily reminder"
          className="stock-flat flex items-center gap-2 rounded-lg p-2"
        >
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={reminder.enabled}
              onChange={(event) =>
                updateReminder({ ...reminder, enabled: event.target.checked })
              }
              className="border-line size-4 shrink-0 rounded-[3px] border-2 accent-[var(--hue-blue)]"
            />
            Remind me
          </label>
          <input
            type="time"
            aria-label="Reminder time"
            disabled={!reminder.enabled}
            value={formatTime(reminder)}
            onChange={(event) => {
              const parsed = parseTime(event.target.value);
              if (parsed) updateReminder({ ...reminder, ...parsed });
            }}
            className="stock-flat bg-card tnum h-8 w-[6.5rem] rounded-md px-1.5 text-xs disabled:opacity-45"
          />
        </section>
      )}

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
