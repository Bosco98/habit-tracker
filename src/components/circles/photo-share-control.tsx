import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { shareCirclePhoto } from "@/data/photo-activities";
import type { LoadedCircle } from "@/data/types";

interface PhotoShareControlProps {
  circle: LoadedCircle;
  myId: string;
  onShared: () => void;
}

export function PhotoShareControl({ circle, myId, onShared }: PhotoShareControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "camera">("choose");
  const [cameraReady, setCameraReady] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || mode !== "camera") return;
    let cancelled = false;
    setCameraReady(false);
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This device does not expose a camera to Habits.");
      return;
    }

    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((cause: unknown) => {
        const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
        setError(
          denied
            ? "Camera access was blocked. Allow Habits in System Settings, then try again."
            : "No available camera was found on this device.",
        );
      });

    return () => {
      cancelled = true;
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [mode, open]);

  const share = async (file: File | undefined): Promise<boolean> => {
    if (!file) return false;
    setSharing(true);
    setError(null);
    try {
      await shareCirclePhoto(circle, myId, file);
      onShared();
      setOpen(false);
      setMode("choose");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That photo could not be shared.");
      return false;
    } finally {
      setSharing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("The camera is still starting. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setError("The camera frame could not be captured.");
      return;
    }
    await share(
      new File([blob], `habits-camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      }),
    );
  };

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setMode("choose");
      setCameraReady(false);
      setError(null);
    }
  };

  return (
    <>
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
        onClick={() => changeOpen(true)}
        className="stock stock-press active:stock-press-active flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold disabled:pointer-events-none disabled:opacity-60"
      >
        {sharing ? (
          <LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" />
        ) : (
          <ImagePlus className="size-3.5" />
        )}
        {sharing ? "Sharing…" : "Photo"}
      </button>

      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-w-lg rounded-t-2xl border-x-0 border-b-0 bg-background"
        >
          <SheetHeader>
            <SheetTitle>Share a photo</SheetTitle>
            <SheetDescription>
              Upload one or take it now. It stays in Lately for 24 hours.
            </SheetDescription>
          </SheetHeader>

          {mode === "choose" ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              <Button
                type="button"
                variant="ghost"
                className="stock stock-press active:stock-press-active h-24 flex-col rounded-xl"
                onClick={() => {
                  setError(null);
                  inputRef.current?.click();
                }}
              >
                <ImagePlus className="size-6" />
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="stock stock-press active:stock-press-active h-24 flex-col rounded-xl"
                onClick={() => setMode("camera")}
              >
                <Camera className="size-6" />
                Camera
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-8">
              <div className="stock-flat bg-muted relative aspect-video overflow-hidden rounded-xl">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  onCanPlay={() => setCameraReady(true)}
                  className="size-full object-cover"
                  aria-label="Camera preview"
                />
                {!cameraReady && !error && (
                  <div className="text-muted-foreground absolute inset-0 flex items-center justify-center gap-2 text-sm">
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                    Starting camera…
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-[auto_1fr] gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="stock stock-press active:stock-press-active h-11 rounded-lg"
                  disabled={sharing}
                  onClick={() => setMode("choose")}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="stock h-11 rounded-lg"
                  disabled={!cameraReady || sharing}
                  onClick={() => void capturePhoto()}
                >
                  {sharing ? (
                    <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  {sharing ? "Sharing…" : "Take photo"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
