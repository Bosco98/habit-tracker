import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppAccount } from "@/data/hooks";
import { habitReminder, setHabitReminder } from "@/data/reminders";
import { requestNativeNotificationPermission } from "@/lib/circle-notification-settings";
import { formatTime, parseTime, type ReminderTime } from "@/lib/reminder";
import { isDesktop } from "@/lib/platform";

interface HabitReminderSettingProps {
  habitId: string;
}

export function HabitReminderSetting({ habitId }: HabitReminderSettingProps) {
  const account = useAppAccount();
  const [reminder, setReminder] = useState<ReminderTime>({
    enabled: false,
    hour: 20,
    minute: 0,
  });
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (account.$isLoaded) setReminder(habitReminder(account, habitId));
  }, [account, habitId]);

  if (!account.$isLoaded) return null;

  const update = (next: ReminderTime) => {
    setReminder(next);
    setHabitReminder(account, habitId, next);
  };

  const toggle = async (enabled: boolean) => {
    setPermissionError(false);
    if (enabled && isDesktop()) {
      const granted = await requestNativeNotificationPermission();
      if (!granted) {
        setPermissionError(true);
        return;
      }
    }
    update({ ...reminder, enabled });
  };

  return (
    <section className="stock-flat flex flex-col gap-3 rounded-lg p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label="Daily alarm for this habit"
          checked={reminder.enabled}
          onChange={(event) => void toggle(event.target.checked)}
          className="border-line size-4 shrink-0 rounded-[3px] border-2 accent-[var(--hue-blue)]"
        />
        {reminder.enabled ? (
          <BellRing className="size-4 shrink-0" />
        ) : (
          <Bell className="size-4 shrink-0" />
        )}
        <span className="flex-1 text-sm font-semibold">Daily alarm</span>
        <span className="text-muted-foreground text-[11px]">Just for you</span>
      </label>

      {reminder.enabled && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`habit-reminder-${habitId}`} className="text-muted-foreground text-sm">
            At
          </Label>
          <Input
            id={`habit-reminder-${habitId}`}
            type="time"
            value={formatTime(reminder)}
            onChange={(event) => {
              const parsed = parseTime(event.target.value);
              if (parsed) update({ ...reminder, ...parsed });
            }}
            className="stock-flat bg-card tnum w-32 rounded-lg shadow-none"
          />
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        {isDesktop()
          ? "Your signed-in desktop apps will notify you at this time."
          : "Saved here and synced when signed in. Only the desktop app sends the notification."}
      </p>
      {permissionError && (
        <p role="alert" className="text-destructive text-xs">
          Notifications are blocked for Habits. Enable them in system settings first.
        </p>
      )}
    </section>
  );
}
