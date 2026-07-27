import { useMemo } from "react";
import { useAccount } from "jazz-tools/react";
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
