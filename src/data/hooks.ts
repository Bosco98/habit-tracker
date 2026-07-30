import { useEffect, useMemo } from "react";
import { useAccount } from "jazz-tools/react";
import { todayKey } from "@/lib/days";
import {
  appendAchievementEvents,
  deriveMissingAchievementEvents,
} from "./achievements";
import { compactAll } from "./compaction";
import { AppAccount } from "./schema";
import { accountResolve, type HabitEntry, type LoadedCircle, type LoadedHabit } from "./types";

/**
 * The one hook UI code uses to reach account data.
 * Returns the deeply-loaded account, or an unloaded placeholder
 * (check `.$isLoaded`) during the first local read.
 */
export function useAppAccount() {
  return useAccount(AppAccount, { resolve: accountResolve });
}

const isLive = (habit: LoadedHabit | null | undefined): habit is LoadedHabit =>
  Boolean(habit?.$isLoaded) && !habit!.archivedAt;

/**
 * Personal and shared habits as one list — the home screen's "minimal
 * separation" model. Each entry carries the circle it came from (or null).
 */
export function useHabitEntries(
  account: ReturnType<typeof useAppAccount>,
): { personal: HabitEntry[]; shared: HabitEntry[]; circles: LoadedCircle[] } {
  return useMemo(() => {
    if (!account.$isLoaded) return { personal: [], shared: [], circles: [] };

    const personal = account.root.habits
      .filter(isLive)
      .map((habit) => ({ habit, circle: null }));

    const circles = account.root.circles.filter(
      (circle): circle is LoadedCircle => Boolean(circle?.$isLoaded),
    );

    const shared = circles.flatMap((circle) =>
      circle.habits.filter(isLive).map((habit) => ({ habit, circle })),
    );

    return { personal, shared, circles };
  }, [account]);
}

/**
 * Enforce the 30-day window. Runs once per day-key change per session; the
 * job is idempotent, so a second device doing the same work costs nothing.
 * Archived habits are compacted too — they still show a final streak.
 */
export function useRetention(account: ReturnType<typeof useAppAccount>): void {
  const today = todayKey();

  useEffect(() => {
    if (!account.$isLoaded) return;
    const habits: LoadedHabit[] = [
      ...account.root.habits.filter((h): h is LoadedHabit => Boolean(h?.$isLoaded)),
      ...account.root.circles.flatMap((circle) =>
        circle?.$isLoaded
          ? circle.habits.filter((h): h is LoadedHabit => Boolean(h?.$isLoaded))
          : [],
      ),
    ];
    compactAll(habits, account.$jazz.id, today);
  }, [account, today]);
}

/**
 * Persist compact receipts for anything visible inside the retained window.
 * Deterministic keys make this safe on every device and after every sync.
 */
export function useAchievementEngine(
  account: ReturnType<typeof useAppAccount>,
): void {
  const today = todayKey();

  useEffect(() => {
    if (!account.$isLoaded) return;
    const missing = deriveMissingAchievementEvents(account, today);
    if (missing.length > 0) appendAchievementEvents(account, missing);
  }, [account, today]);
}
