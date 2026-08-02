import { beforeEach, describe, expect, it } from "vitest";
import { Group } from "jazz-tools";
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing";
import { ACTIVITY_RETENTION_MS } from "@/lib/activity-retention";
import { Circle } from "./schema";
import {
  cleanupExpiredCirclePhotos,
  MAX_PHOTO_BYTES,
  shareCirclePhoto,
  validatePhoto,
} from "./photo-activities";
import type { LoadedCircle } from "./types";

beforeEach(async () => {
  await setupJazzTestSync();
  await createJazzTestAccount({ isCurrentActiveAccount: true });
});

describe("Circle photo activities", () => {
  it("rejects non-images and files above the upload cap", () => {
    expect(validatePhoto(new File(["hello"], "note.txt", { type: "text/plain" })))
      .toBe("Choose an image file.");
    expect(
      validatePhoto(
        new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "huge.png", {
          type: "image/png",
        }),
      ),
    ).toBe("Choose a photo smaller than 10 MB.");
  });

  it("deletes the expired activity and its FileStream", async () => {
    const circle = Circle.create(
      {
        name: "Friends",
        emoji: "users",
        habits: [],
        reactions: [],
        nudges: [],
        presence: [],
        photoActivities: [],
        createdAt: Date.now(),
      },
      { owner: Group.create() },
    ) as LoadedCircle;

    await shareCirclePhoto(
      circle,
      "co_zAuthor",
      new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" }),
    );

    const activity = circle.photoActivities?.[0];
    expect(activity?.$isLoaded).toBe(true);
    if (!activity?.$isLoaded) throw new Error("photo activity did not load");
    const file = activity.file;
    expect(file.$isLoaded).toBe(true);
    if (!file.$isLoaded) throw new Error("photo file did not load");

    const deleted = await cleanupExpiredCirclePhotos(
      [circle],
      activity.createdAt + ACTIVITY_RETENTION_MS,
    );

    expect(deleted).toBe(1);
    expect(activity.$jazz.raw.core.isDeleted).toBe(true);
    expect(file.$jazz.raw.core.isDeleted).toBe(true);
    expect(circle.photoActivities).toHaveLength(0);
  });
});
