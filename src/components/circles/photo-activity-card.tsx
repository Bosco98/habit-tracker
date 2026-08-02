import { useEffect, useState } from "react";
import { Camera, ImageOff } from "lucide-react";
import type { PhotoActivityItem } from "@/data/activity";
import { PhotoFile } from "@/data/schema";
import {
  activityAgeLabel,
  activityTimeLeftLabel,
} from "@/lib/activity-retention";
import { cn } from "@/lib/utils";

interface PhotoActivityCardProps {
  item: PhotoActivityItem;
  now: number;
}

export function PhotoActivityCard({ item, now }: PhotoActivityCardProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setUrl(null);
    setFailed(false);

    void PhotoFile.loadAsBlob(item.fileId)
      .then((blob) => {
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.fileId]);

  return (
    <li className="stock overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 p-3">
        <Camera className="size-4 shrink-0" strokeWidth={2.4} />
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className={cn("font-semibold", item.isMe && "text-primary-strong")}>
            {item.isMe ? "You" : item.memberName}
          </span>{" "}
          <span className="text-muted-foreground">shared a photo</span>
        </p>
        <span className="text-muted-foreground tnum shrink-0 text-[11px]">
          {activityAgeLabel(item.occurredAt, now)} · {activityTimeLeftLabel(item.expiresAt, now)}
        </span>
      </div>

      {url ? (
        <img
          src={url}
          alt={`${item.isMe ? "Your" : `${item.memberName}'s`} shared photo`}
          className="max-h-96 w-full border-t-2 border-[var(--line)] bg-black object-contain"
        />
      ) : failed ? (
        <div className="text-muted-foreground flex h-40 flex-col items-center justify-center gap-2 border-t-2 border-[var(--line)] text-sm">
          <ImageOff className="size-5" />
          Photo unavailable
        </div>
      ) : (
        <div
          aria-label="Loading photo"
          className="bg-muted h-48 animate-pulse border-t-2 border-[var(--line)] motion-reduce:animate-none"
        />
      )}
    </li>
  );
}
