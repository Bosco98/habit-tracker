import { co, z } from "jazz-tools";

/** When a habit is expected to be done. */
export const Schedule = co.map({
  type: z.enum(["daily", "weekdays", "timesPerWeek"]),
  /** For "weekdays": 0–6 (Sunday = 0). */
  days: z.optional(z.array(z.number())),
  /** For "timesPerWeek". */
  perWeek: z.optional(z.number()),
});

/** One log entry. `loggedAt`/`editedAt` are soft-signal metadata. */
export const CheckIn = co.map({
  /** Local day key it counts toward, e.g. "2026-07-27". */
  forDay: z.string(),
  /** Wall-clock ms when it was actually logged (backfill signal). */
  loggedAt: z.number(),
  editedAt: z.optional(z.number()),
  /** binary: 1 · count: units · timer: seconds. */
  value: z.number(),
  note: z.optional(z.string()),
});

export const Habit = co.map({
  name: z.string(),
  emoji: z.string(),
  kind: z.enum(["binary", "count", "timer"]),
  /** count goal / timer seconds. */
  target: z.optional(z.number()),
  schedule: Schedule,
  /** CoFeed keeps each member's check-ins in their own per-account stream. */
  checkIns: co.feed(CheckIn),
  createdAt: z.number(),
  archivedAt: z.optional(z.number()),
});

export const HabitList = co.list(Habit);

/** A one-tap emoji on someone's day of a shared habit. */
export const Reaction = co.map({
  habitId: z.string(),
  /** Whose check-in is being cheered. */
  targetAccountId: z.string(),
  forDay: z.string(),
  emoji: z.string(),
  createdAt: z.number(),
});

/** The stake ledger: who owes what for losing a week. */
export const Forfeit = co.map({
  title: z.string(),
  /** Day key of the week's first day. */
  weekKey: z.string(),
  habitId: z.string(),
  loserAccountId: z.string(),
  status: z.enum(["open", "paid", "waived"]),
  createdAt: z.number(),
});

export const ForfeitList = co.list(Forfeit);

/** A sharing circle — owned by a Jazz Group; members are the Group's members. */
export const Circle = co.map({
  name: z.string(),
  emoji: z.string(),
  /** What the weekly duel loser owes, e.g. "buys coffee". */
  stake: z.optional(z.string()),
  habits: HabitList,
  reactions: co.feed(Reaction),
  forfeits: ForfeitList,
  createdAt: z.number(),
});

export const CircleList = co.list(Circle);

export const Settings = co.map({
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn: z.number(),
});

export const AccountRoot = co.map({
  habits: HabitList,
  circles: CircleList,
  settings: Settings,
});

export const AppAccount = co
  .account({ root: AccountRoot, profile: co.profile() })
  .withMigration(async (account) => {
    if (account.root === undefined) {
      account.$jazz.set("root", {
        habits: [],
        circles: [],
        settings: { weekStartsOn: 1 },
      });
      return;
    }
    // Forward-compat for roots created before circles existed.
    const { root } = await account.$jazz.ensureLoaded({ resolve: { root: true } });
    if (root.circles === undefined) root.$jazz.set("circles", []);
  });

export type AppAccountType = co.loaded<typeof AppAccount>;
