import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  readCircleNotifications,
  onCircleNotificationPreferenceChange,
  requestNativeNotificationPermission,
  writeCircleNotifications,
} from "@/lib/circle-notification-settings";
import { isDesktop } from "@/lib/platform";

interface CircleNotificationToggleProps {
  accountId: string;
  circleId: string;
}

export function CircleNotificationToggle({
  accountId,
  circleId,
}: CircleNotificationToggleProps) {
  const [enabled, setEnabled] = useState(() =>
    readCircleNotifications(accountId, circleId),
  );
  const [guidance, setGuidance] = useState("");

  useEffect(
    () =>
      onCircleNotificationPreferenceChange(() =>
        setEnabled(readCircleNotifications(accountId, circleId)),
      ),
    [accountId, circleId],
  );

  if (!isDesktop()) return null;

  const change = async (next: boolean) => {
    if (!next) {
      writeCircleNotifications(accountId, circleId, false);
      setEnabled(false);
      setGuidance("");
      return;
    }
    const granted = await requestNativeNotificationPermission();
    writeCircleNotifications(accountId, circleId, granted);
    setEnabled(granted);
    setGuidance(
      granted
        ? ""
        : "Notifications are blocked. Allow Habits in System Settings, then try again.",
    );
  };

  return (
    <section className="stock-flat rounded-lg p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => void change(event.target.checked)}
          className="border-line size-4 shrink-0 rounded-[3px] border-2 accent-[var(--hue-blue)]"
        />
        {enabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        <span className="flex-1 text-sm font-semibold">Circle notifications</span>
      </label>
      <p className="text-muted-foreground mt-1 text-xs">
        Native alerts when someone checks in or nudges the group.
      </p>
      {guidance && <p className="text-destructive mt-2 text-xs font-semibold">{guidance}</p>}
    </section>
  );
}
