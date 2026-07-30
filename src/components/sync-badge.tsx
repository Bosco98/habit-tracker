import { Cloud, CloudOff, HardDrive } from "lucide-react";
import { useSyncConnectionStatus } from "jazz-tools/react";
import { useAuth } from "@/data/auth";

/**
 * Sync state as a quiet fact, never a modal. Local-only is a valid,
 * deliberate state — not an error.
 */
export function SyncBadge() {
  const { isAuthenticated } = useAuth();
  const connected = useSyncConnectionStatus();

  const { Icon, label } = !isAuthenticated
    ? { Icon: HardDrive, label: "On this device only" }
    : connected
      ? { Icon: Cloud, label: "Synced" }
      : { Icon: CloudOff, label: "Offline — will sync later" };

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
