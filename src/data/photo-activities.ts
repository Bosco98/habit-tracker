import { Group, deleteCoValues } from "jazz-tools";
import { activityExpiresAt, isActivityActive } from "@/lib/activity-retention";
import { syncDesktopPeers } from "@/lib/platform";
import { PhotoActivity, PhotoFile } from "./schema";
import type { LoadedCircle, LoadedPhotoActivity } from "./types";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const deleting = new Set<string>();

export function validatePhoto(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Choose an image file.";
  if (file.size > MAX_PHOTO_BYTES) return "Choose a photo smaller than 10 MB.";
  return null;
}

export async function shareCirclePhoto(
  circle: LoadedCircle,
  authorId: string,
  source: File,
): Promise<void> {
  const error = validatePhoto(source);
  if (error) throw new Error(error);

  const circleGroup = circle.$jazz.owner;
  if (!(circleGroup instanceof Group)) throw new Error("This circle cannot share photos.");

  // This group owns one post only. Making the Circle group an admin lets any
  // online member purge its bytes after expiry without widening Circle roles.
  const photoGroup = Group.create();
  photoGroup.addMember(circleGroup, "admin");

  const file = await PhotoFile.createFromBlob(source, {
    owner: photoGroup,
  });
  const createdAt = Date.now();
  const activity = PhotoActivity.create(
    {
      authorId,
      file,
      fileId: file.$jazz.id,
      createdAt,
      expiresAt: activityExpiresAt(createdAt),
    },
    { owner: photoGroup },
  );

  if (!circle.photoActivities?.$isLoaded) {
    circle.$jazz.set("photoActivities", []);
  }
  circle.photoActivities?.$jazz.push(activity);
  syncDesktopPeers();
}

function removePhotoReference(circle: LoadedCircle, id: string): void {
  const list = circle.photoActivities;
  if (!list?.$isLoaded) return;
  const index = list.findIndex((item) => item?.$jazz.id === id);
  if (index >= 0) list.$jazz.splice(index, 1);
}

async function deletePhotoActivity(
  circle: LoadedCircle,
  activity: LoadedPhotoActivity,
): Promise<boolean> {
  const id = activity.$jazz.id;
  if (deleting.has(id)) return false;
  deleting.add(id);
  try {
    await deleteCoValues(PhotoActivity, id, { resolve: { file: true } });
    removePhotoReference(circle, id);
    return true;
  } catch (error) {
    console.warn("Could not purge expired Circle photo", error);
    return false;
  } finally {
    deleting.delete(id);
  }
}

/** Purge expired posts and their nested FileStreams. Safe to run on every client. */
export async function cleanupExpiredCirclePhotos(
  circles: readonly LoadedCircle[],
  now = Date.now(),
): Promise<number> {
  const expired = circles.flatMap((circle) => {
    const list = circle.photoActivities;
    if (!list?.$isLoaded) return [];
    return list.flatMap((activity) =>
      activity?.$isLoaded && !isActivityActive(activity.createdAt, now)
        ? [{ circle, activity }]
        : [],
    );
  });

  const deleted = await Promise.all(
    expired.map(({ circle, activity }) => deletePhotoActivity(circle, activity)),
  );
  if (deleted.some(Boolean)) syncDesktopPeers();
  return deleted.filter(Boolean).length;
}
