import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { AchievementCelebration } from "@/components/achievement-celebration";
import { readAchievementEvents } from "@/data/achievements";
import { circleSaveEvents } from "@/data/circle-notifications";
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
  readCircleNotifications,
  requestNativeNotificationPermission,
  writeCircleNotifications,
} from "@/lib/circle-notification-settings";
import { initializeOpenAtLogin } from "@/lib/autostart";
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
const trophyObserverByAccount = new Map<string, ObserverState>();

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

/**
 * Runs once in the main webview. It keeps retention, durable achievements,
 * login startup, and raw Circle activity observing independent of the route.
 */
export function BackgroundServices() {
  const account = useAppAccount();
  const { circles } = useHabitEntries(account);
  const [trophyQueue, setTrophyQueue] = useState<TrophyAward[]>([]);
  useRetention(account);
  useAchievementEngine(account);

  const myId = account.$isLoaded ? account.$jazz.id : "";
  const events = useMemo(
    () => (account.$isLoaded ? circleSaveEvents(circles, myId) : []),
    [account, circles, myId],
  );
  const trophySignature = account.$isLoaded
    ? readAchievementEvents(account)
        .filter(isTrophyAward)
        .map((event) => event.key)
        .sort()
        .join("|")
    : "";
  const completeTrophy = useCallback(() => {
    setTrophyQueue((current) => current.slice(1));
  }, []);

  useEffect(() => {
    void initializeOpenAtLogin();
  }, []);

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
    if (!isDesktop() || !account.$isLoaded) return;
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
  }, [account, events, myId]);

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
    <AchievementCelebration
      award={trophyQueue[0] ?? null}
      onComplete={completeTrophy}
    />
  );
}
