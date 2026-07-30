import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDesktop } from "@/lib/platform";
import {
  formatTime,
  parseTime,
  readReminder,
  writeReminder,
  type Reminder,
} from "@/lib/reminder";

/**
 * Desktop only. In a browser tab there is nothing to ring: a page that isn't
 * open can't fire anything, and a Notification permission that only works
 * while the tab is alive isn't an alarm.
 */
export function ReminderSetting() {
  const [reminder, setReminder] = useState<Reminder>(readReminder);

  useEffect(() => {
    writeReminder(reminder);
  }, [reminder]);

  if (!isDesktop()) return null;

  return (
    <section className="stock-flat flex flex-col gap-3 rounded-lg p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={reminder.enabled}
          onChange={(e) => setReminder({ ...reminder, enabled: e.target.checked })}
          className="border-line size-4 shrink-0 rounded-[3px] border-2 accent-[var(--hue-blue)]"
        />
        <Bell className="size-4 shrink-0" />
        <span className="flex-1 text-sm font-semibold">Daily reminder</span>
      </label>

      {reminder.enabled && (
        <div className="flex items-center gap-2">
          <Label htmlFor="reminder-time" className="text-muted-foreground text-sm">
            At
          </Label>
          <Input
            id="reminder-time"
            type="time"
            value={formatTime(reminder)}
            onChange={(e) => {
              const parsed = parseTime(e.target.value);
              if (parsed) setReminder({ ...reminder, ...parsed });
            }}
            className="stock-flat bg-card w-32 rounded-lg shadow-none"
          />
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Rings once a day at the time you set, whether or not you're behind. It doesn't read
        your habits — the desktop shell can't see them.
      </p>
    </section>
  );
}
