import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { shareCirclePhoto } from "@/data/photo-activities";
import type { LoadedCircle } from "@/data/types";

interface PhotoShareControlProps {
  circle: LoadedCircle;
  myId: string;
  onShared: () => void;
}

export function PhotoShareControl({ circle, myId, onShared }: PhotoShareControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choosePhoto = () => {
    setError(null);
    inputRef.current?.click();
  };

  const share = async (file: File | undefined) => {
    if (!file) return;
    setSharing(true);
    setError(null);
    try {
      await shareCirclePhoto(circle, myId, file);
      onShared();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That photo could not be shared.");
    } finally {
      setSharing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void share(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={sharing}
        onClick={choosePhoto}
        className="stock stock-press active:stock-press-active flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold disabled:pointer-events-none disabled:opacity-60"
      >
        {sharing ? (
          <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
        ) : (
          <ImagePlus className="size-3.5" />
        )}
        {sharing ? "Sharing…" : "Photo"}
      </button>
      {error && (
        <p role="alert" className="text-destructive max-w-48 text-right text-[11px]">
          {error}
        </p>
      )}
    </div>
  );
}
