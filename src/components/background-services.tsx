import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { useSyncConnectionStatus } from "jazz-tools/react";
import { AchievementCelebration } from "@/components/achievement-celebration";
import { DesktopUpdateBanner } from "@/components/desktop-updater";
import { readAchievementEvents } from "@/data/achievements";
import { circleSaveEvents } from "@/data/circle-notifications";
import { cleanupExpiredCirclePhotos } from "@/data/photo-activities";
import { repairStoredAppIcons } from "@/data/icon-compatibility";
import {
  habitReminderSignature,
  pushAccountHabitReminders,
} from "@/data/reminders";
import {
  allCircleNudgeEvents,
  touchCirclePresence,
} from "@/data/circle-social";
import {
  useAchievementEngine,
  useAppAccount,
  useHabitEntries,
  useRetention,
} from "@/data/hooks";
import {
  notificationBody,
  unseenRemoteSaves,
} from "@/lib/circle-notifications";
import {
  PRESENCE_HEARTBEAT_MS,
  unseenRemoteNudges,
} from "@/lib/circle-social";
import {
  readCircleNotifications,
  requestNativeNotificationPermission,
  writeCircleNotifications,
} from "@/lib/circle-notification-settings";
import { initializeOpenAtLogin } from "@/lib/autostart";
import { startDesktopUpdater } from "@/lib/desktop-updater";
import { isDesktop } from "@/lib/platform";
import {
  collapseTrophyAwards,
  isTrophyAward,
  unseenTrophyAwards,
  type TrophyAward,
} from "@/lib/trophy-celebration";

interface ObserverState {
  initialized: boolean;
  seen: Set<string>;
}

const observerByAccount = new Map<string, ObserverState>();
const permissionBootstrapped = new Set<string>();
const reminderPermissionBootstrapped = new Set<string>();
const trophyObserverByAccount = new Map<string, ObserverState>();
const nudgeObserverByAccount = new Map<string, ObserverState>();

function trophyStorageKey(accountId: string): string {
  return `habits:trophy-celebrations:${accountId}`;
}

function readSeenTrophies(accountId: string): Set<string> {
  try {
    const stored = JSON.parse(
      localStorage.getItem(trophyStorageKey(accountId)) ?? "[]",
    );
    return new Set(
      Array.isArray(stored)
        ? stored.filter((key) => typeof key === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeSeenTrophies(accountId: string, seen: Set<string>): void {
  localStorage.setItem(trophyStorageKey(accountId), JSON.stringify([...seen]));
}

function nudgeStorageKey(accountId: string): string {
  return `habits:circle-nudges:${accountId}`;
}

function readSeenNudges(accountId: string): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(nudgeStorageKey(accountId)) ?? "[]");
    return new Set(
      Array.isArray(stored)
        ? stored.filter((key) => typeof key === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeSeenNudges(accountId: string, seen: Set<string>): void {
  localStorage.setItem(nudgeStorageKey(accountId), JSON.stringify([...seen]));
}

/**
 * Runs once in the main webview. It keeps retention, durable achievements,
 * ephemeral photo cleanup, login startup, and raw Circle activity observing
 * independent of the route.
 */
export function BackgroundServices() {
  const account = useAppAccount();
  const { circles } = useHabitEntries(account);
  const connected = useSyncConnectionStatus();
  const desktop = isDesktop();
  const circlesRef = useRef(circles);
  circlesRef.current = circles;
  const [trophyQueue, setTrophyQueue] = useState<TrophyAward[]>([]);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === "undefined" || document.visibilityState !== "hidden",
  );
  useRetention(account);
  useAchievementEngine(account);

  const myId = account.$isLoaded ? account.$jazz.id : "";
  const events = useMemo(
    () => (account.$isLoaded ? circleSaveEvents(circles, myId) : []),
    [account, circles, myId],
  );
  const nudgeEvents = useMemo(
    () => (account.$isLoaded ? allCircleNudgeEvents(circles, myId) : []),
    [account, circles, myId],
  );
  const circleSignature = circles.map((circle) => circle.$jazz.id).join("|");
  const trophySignature = account.$isLoaded
    ? readAchievementEvents(account)
        .filter(isTrophyAward)
        .map((event) => event.key)
        .sort()
        .join("|")
    : "";
  const reminderSignature = account.$isLoaded
    ? habitReminderSignature(account)
    : "";
  const completeTrophy = useCallback(() => {
    setTrophyQueue((current) => current.slice(1));
  }, []);

  useEffect(() => {
    void initializeOpenAtLogin();
  }, []);

  useEffect(() => startDesktopUpdater(), []);

  useEffect(() => {
    if (!account.$isLoaded) return;
    repairStoredAppIcons(account);
  }, [account]);

  useEffect(() => {
    if (!account.$isLoaded) return;
    pushAccountHabitReminders(account);

    // A reminder configured on the web reaches this desktop through Jazz. Ask
    // for OS permission here once, because that user never toggled it inside
    // the native shell and otherwise the schedule would fail silently.
    if (
      desktop &&
      reminderSignature !== "[]" &&
      !reminderPermissionBootstrapped.has(myId)
    ) {
      reminderPermissionBootstrapped.add(myId);
      void requestNativeNotificationPermission();
    }
  }, [account, desktop, myId, reminderSignature]);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!account.$isLoaded || !connected || (!desktop && !pageVisible)) return;

    const heartbeat = () => {
      const now = Date.now();
      for (const circle of circlesRef.current) touchCirclePresence(circle, now);
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [account.$isLoaded, circleSignature, connected, desktop, pageVisible]);

  useEffect(() => {
    if (!account.$isLoaded || !connected || (!desktop && !pageVisible)) return;
    const cleanup = () => {
      void cleanupExpiredCirclePhotos(circlesRef.current);
    };
    cleanup();
    const timer = window.setInterval(cleanup, 60_000);
    return () => window.clearInterval(timer);
  }, [account.$isLoaded, circleSignature, connected, desktop, pageVisible]);

  useEffect(() => {
    if (
      !isDesktop() ||
      !account.$isLoaded ||
      circles.length === 0 ||
      permissionBootstrapped.has(myId)
    ) {
      return;
    }
    permissionBootstrapped.add(myId);
    const enabledCircles = circles.filter((circle) =>
      readCircleNotifications(myId, circle.$jazz.id),
    );
    if (enabledCircles.length === 0) return;
    void requestNativeNotificationPermission().then((granted) => {
      if (granted) return;
      for (const circle of enabledCircles) {
        writeCircleNotifications(myId, circle.$jazz.id, false);
      }
    });
  }, [account, circles, myId]);

  useEffect(() => {
    if (!desktop || !account.$isLoaded) return;
    const state = observerByAccount.get(myId) ?? {
      initialized: false,
      seen: new Set<string>(),
    };
    observerByAccount.set(myId, state);

    if (!state.initialized) {
      for (const event of events) state.seen.add(event.id);
      state.initialized = true;
      return;
    }

    const fresh = unseenRemoteSaves(events, state.seen, myId);
    if (fresh.length === 0) return;
    void isPermissionGranted().then((granted) => {
      if (!granted) return;
      for (const event of fresh) {
        if (!readCircleNotifications(myId, event.circleId)) continue;
        sendNotification({
          title: event.circleName,
          body: notificationBody(event),
          // A built-in macOS sound: no bundled audio file and no web fallback.
          sound: "Ping",
        });
      }
    });
  }, [account, desktop, events, myId]);

  useEffect(() => {
    if (!desktop || !account.$isLoaded) return;
    const state = nudgeObserverByAccount.get(myId) ?? {
      initialized: true,
      seen: readSeenNudges(myId),
    };
    nudgeObserverByAccount.set(myId, state);

    const fresh = unseenRemoteNudges(nudgeEvents, state.seen, myId);
    writeSeenNudges(myId, state.seen);
    if (fresh.length === 0) return;

    void isPermissionGranted().then((granted) => {
      if (!granted) return;
      for (const event of fresh) {
        if (!readCircleNotifications(myId, event.circleId)) continue;
        sendNotification({
          title: event.circleName,
          body: `${event.memberName} nudged the group.`,
          sound: "Ping",
        });
      }
    });
  }, [account, desktop, myId, nudgeEvents]);

  useEffect(() => {
    if (!account.$isLoaded) return;
    const achievementEvents = readAchievementEvents(account);
    const state = trophyObserverByAccount.get(myId) ?? {
      initialized: false,
      seen: readSeenTrophies(myId),
    };
    trophyObserverByAccount.set(myId, state);

    if (!state.initialized) {
      for (const event of achievementEvents) {
        if (isTrophyAward(event)) state.seen.add(event.key);
      }
      state.initialized = true;
      writeSeenTrophies(myId, state.seen);
      setTrophyQueue([]);
      return;
    }

    const fresh = collapseTrophyAwards(
      unseenTrophyAwards(achievementEvents, state.seen),
    );
    writeSeenTrophies(myId, state.seen);
    if (fresh.length === 0) return;
    setTrophyQueue((current) => {
      const queued = new Set(current.map((award) => award.key));
      return [...current, ...fresh.filter((award) => !queued.has(award.key))];
    });
  }, [account, myId, trophySignature]);

  return (
    <>
      <AchievementCelebration
        award={trophyQueue[0] ?? null}
        onComplete={completeTrophy}
      />
      <DesktopUpdateBanner />
    </>
  );
}
