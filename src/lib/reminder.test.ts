import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatTime,
  parseTime,
  pushHabitReminders,
  validReminderTime,
} from "./reminder";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("habit reminder times", () => {
  it("round-trips local wall-clock input", () => {
    expect(parseTime("07:05")).toEqual({ hour: 7, minute: 5 });
    expect(formatTime({ hour: 7, minute: 5 })).toBe("07:05");
  });

  it("rejects malformed and out-of-range times", () => {
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("10:60")).toBeNull();
    expect(parseTime("breakfast")).toBeNull();
  });

  it("repairs invalid synced values with the default time", () => {
    expect(validReminderTime({ hour: -1, minute: 90 })).toEqual({
      hour: 20,
      minute: 0,
    });
  });
});

describe("desktop habit reminders", () => {
  it("sends the complete named schedule to the native shell", () => {
    const invoke = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", { __TAURI_INTERNALS__: { invoke } });
    const reminders = [
      { id: "account:habit", habitName: "Morning run", hour: 7, minute: 30 },
    ];

    pushHabitReminders(reminders);

    expect(invoke).toHaveBeenCalledWith("set_habit_reminders", { reminders });
  });

  it("does nothing in the browser", () => {
    vi.stubGlobal("window", {});
    pushHabitReminders([
      { id: "account:habit", habitName: "Morning run", hour: 7, minute: 30 },
    ]);
    expect(Object.keys(window)).toEqual([]);
  });
});
