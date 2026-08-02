import { co, z } from "jazz-tools";

/** One log entry. `loggedAt`/`editedAt` are soft-signal metadata. */
export const CheckIn = co.map({
  /** Opaque local day key it counts toward — never shown as a date. */
  forDay: z.string(),
  /** Wall-clock ms when it was actually logged (backfill signal). */
  loggedAt: z.number(),
  editedAt: z.optional(z.number()),
  /** binary/note: 1 · count: units · timer: seconds. */
  value: z.number(),
  note: z.optional(z.string()),
});

/**
 * Frozen summary of the days that have aged out of the 30-day window.
 * CoFeeds can't be pruned, so retention is a read-side rule; this keeps the
 * numbers honest across the cut. One entry per account, latest wins.
 */
export const Carry = co.map({
  throughDay: z.string(),
  streak: z.number(),
  best: z.number(),
  totalDone: z.number(),
  /** When this summary was written — latest-wins resolution. */
  writtenAt: z.number(),
});

export const Habit = co.map({
  name: z.string(),
  emoji: z.string(),
  kind: z.enum(["binary", "note", "count", "timer"]),
  /** count goal / timer seconds. */
  target: z.optional(z.number()),
  /**
   * Cadence: due every N days from `createdAt`, on a grid that never shifts.
   * Absent means daily — which is also how habits written before cadences read.
   */
  everyDays: z.optional(z.number()),
  /** CoFeed keeps each member's check-ins in their own per-account stream. */
  checkIns: co.feed(CheckIn),
  /** Same per-account trick for the retention summary. */
  carry: co.optional(co.feed(Carry)),
  createdAt: z.number(),
  archivedAt: z.optional(z.number()),
});

export const HabitList = co.list(Habit);

/** One user's private alarm preference for a habit. Never owned by a Circle. */
export const HabitReminder = co.map({
  habitId: z.string(),
  enabled: z.boolean(),
  hour: z.number(),
  minute: z.number(),
  updatedAt: z.number(),
});

export const HabitReminderList = co.list(HabitReminder);

/** A one-tap emoji on someone's day of a shared habit. */
export const Reaction = co.map({
  habitId: z.string(),
  /** Whose check-in is being cheered. */
  targetAccountId: z.string(),
  forDay: z.string(),
  emoji: z.string(),
  createdAt: z.number(),
});

/** A single circle-wide poke. Authorship and time come from its feed entry. */
export const Nudge = co.map({
  /** UTC day bucket: every member shares the same once-a-day boundary. */
  day: z.number(),
});

/** Latest activity for one app session. The map is updated in place. */
export const Presence = co.map({
  lastActiveAt: z.number(),
});

export const PhotoFile = co.fileStream();

/** A photo shared to the Circle's 24-hour activity timeline. */
export const PhotoActivity = co.map({
  authorId: z.string(),
  file: PhotoFile,
  /** Kept separately so the file can stay lazy until the card is visible. */
  fileId: z.string(),
  createdAt: z.number(),
  expiresAt: z.number(),
});

export const PhotoActivityList = co.list(PhotoActivity);

/**
 * A circle — owned by a Jazz Group; members are the Group's members.
 *
 * It is a shared shelf, not a scoreboard: a place a few people keep habits
 * together. There is no scoring, no round, and nothing to win.
 */
export const Circle = co.map({
  name: z.string(),
  emoji: z.string(),
  habits: HabitList,
  reactions: co.feed(Reaction),
  nudges: co.feed(Nudge),
  presence: co.feed(Presence),
  /** Optional for circles created before photo sharing shipped. */
  photoActivities: co.optional(PhotoActivityList),
  createdAt: z.number(),
});

export const CircleList = co.list(Circle);

/**
 * Permanent, compact achievement history. Raw check-ins still age out after
 * 30 days; these deterministic credits and awards are the durable receipt.
 */
export const AchievementEvent = co.map({
  key: z.string(),
  track: z.enum(["consistency", "teamwork", "encouragement", "leadership"]),
  kind: z.enum(["credit", "trackLevel", "circleHonor"]),
  eventType: z.string(),
  level: z.optional(z.number()),
  honor: z.optional(z.enum(["consistency", "allIn", "earlyFinisher"])),
  circleId: z.optional(z.string()),
  circleName: z.optional(z.string()),
  circleEmoji: z.optional(z.string()),
  metricValue: z.number(),
  awardedAt: z.number(),
});

export const AchievementFeed = co.feed(AchievementEvent);

export const AccountRoot = co.map({
  habits: HabitList,
  circles: CircleList,
  achievements: AchievementFeed,
  reminders: co.optional(HabitReminderList),
});

export const AppAccount = co
  .account({ root: AccountRoot, profile: co.profile() })
  .withMigration(async (account) => {
    if (account.root === undefined) {
      account.$jazz.set("root", {
        habits: [],
        circles: [],
        achievements: [],
        reminders: [],
      });
      return;
    }
    // Forward-compat for roots created before these collections existed.
    const { root } = await account.$jazz.ensureLoaded({ resolve: { root: true } });
    if (root.circles === undefined) root.$jazz.set("circles", []);
    if (root.achievements === undefined) root.$jazz.set("achievements", []);
    if (root.reminders === undefined) root.$jazz.set("reminders", []);
  });

export type AppAccountType = co.loaded<typeof AppAccount>;
