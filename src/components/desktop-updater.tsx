import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  checkForDesktopUpdate,
  getDesktopUpdateState,
  installDesktopUpdate,
  subscribeDesktopUpdate,
} from "@/lib/desktop-updater";
import { isDesktop } from "@/lib/platform";

function useDesktopUpdate() {
  return useSyncExternalStore(
    subscribeDesktopUpdate,
    getDesktopUpdateState,
    getDesktopUpdateState,
  );
}

function statusCopy(state: ReturnType<typeof useDesktopUpdate>): string {
  switch (state.phase) {
    case "checking":
      return "Checking for a newer version…";
    case "up-to-date":
      return "You have the latest version.";
    case "downloading":
      return state.progress === null
        ? `Downloading Habits ${state.version}…`
        : `Downloading Habits ${state.version} — ${state.progress}%`;
    case "ready":
      return `Habits ${state.version} is downloaded and ready.`;
    case "installing":
      return `Installing Habits ${state.version}…`;
    case "error":
      return state.message;
    default:
      return "Updates download automatically. Restart from here when one is ready.";
  }
}

export function DesktopUpdateSetting() {
  const state = useDesktopUpdate();
  const [version, setVersion] = useState<string>();

  useEffect(() => {
    if (!isDesktop()) return;
    void import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then(setVersion)
      .catch(() => undefined);
  }, []);

  if (!isDesktop()) return null;

  const busy = state.phase === "checking" || state.phase === "downloading";
  const ready = state.phase === "ready" || state.phase === "installing";

  return (
    <section className="stock-flat flex flex-col gap-3 rounded-lg p-3">
      <div>
        <p className="text-sm font-semibold">
          Desktop updates{version ? ` · v${version}` : ""}
        </p>
        <p
          className={state.phase === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}
          aria-live="polite"
        >
          {statusCopy(state)}
        </p>
      </div>

      {ready ? (
        <Button
          onClick={() => void installDesktopUpdate()}
          disabled={state.phase === "installing"}
          className="stock stock-press active:stock-press-active h-9 rounded-lg"
        >
          <Download />
          {state.phase === "installing" ? "Restarting…" : "Restart to update"}
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={() => void checkForDesktopUpdate()}
          disabled={busy}
          className="stock stock-press active:stock-press-active h-9 rounded-lg"
        >
          <RefreshCw className={busy ? "animate-spin" : ""} />
          {state.phase === "checking"
            ? "Checking…"
            : state.phase === "downloading"
              ? "Downloading…"
              : "Check now"}
        </Button>
      )}
    </section>
  );
}

export function DesktopUpdateBanner() {
  const state = useDesktopUpdate();
  const [dismissedVersion, setDismissedVersion] = useState<string>();
  const visible = state.phase === "ready" || state.phase === "installing";

  if (
    !isDesktop() ||
    !visible ||
    (state.phase === "ready" && dismissedVersion === state.version)
  ) {
    return null;
  }

  return (
    <aside
      className="stock fixed right-4 bottom-20 left-4 z-50 flex items-center gap-3 rounded-xl p-3 md:right-6 md:bottom-6 md:left-auto md:w-96"
      aria-live="polite"
    >
      <Download className="size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">
          {state.phase === "installing"
            ? `INSTALLING HABITS ${state.version}`
            : `HABITS ${state.version} IS READY`}
        </p>
        <p className="text-muted-foreground text-xs">
          {state.phase === "installing"
            ? "The app will reopen when installation finishes."
            : "Restart when you’re ready to install it."}
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => void installDesktopUpdate()}
        disabled={state.phase === "installing"}
        className="stock stock-press active:stock-press-active"
      >
        {state.phase === "installing" ? "Restarting…" : "Restart"}
      </Button>
      {state.phase === "ready" && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss update message"
          onClick={() => setDismissedVersion(state.version)}
        >
          <X />
        </Button>
      )}
    </aside>
  );
}
