import { isStoredAppIconId, storedAppIcon } from "@/lib/app-icons";
import { syncDesktopPeers } from "@/lib/platform";
import type { LoadedAccount, LoadedHabit } from "./types";

function repairHabitIcon(habit: LoadedHabit): boolean {
  if (!isStoredAppIconId(habit.emoji, "habit")) return false;
  habit.$jazz.set("emoji", storedAppIcon(habit.emoji, "habit"));
  return true;
}

/**
 * Repair icon ids written by v2.0-v2.2 so older Windows clients that render
 * the synced field directly receive a Unicode fallback. Safe to run whenever
 * the account loads: repaired values no longer match an icon id.
 */
export function repairStoredAppIcons(account: LoadedAccount): number {
  let repaired = 0;

  for (const habit of account.root.habits) {
    if (habit?.$isLoaded && repairHabitIcon(habit)) repaired += 1;
  }

  for (const circle of account.root.circles) {
    if (!circle?.$isLoaded) continue;
    if (isStoredAppIconId(circle.emoji, "circle")) {
      circle.$jazz.set("emoji", storedAppIcon(circle.emoji, "circle"));
      repaired += 1;
    }
    for (const habit of circle.habits) {
      if (habit?.$isLoaded && repairHabitIcon(habit)) repaired += 1;
    }
  }

  if (repaired > 0) syncDesktopPeers();
  return repaired;
}
