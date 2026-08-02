import { useEffect, useState } from "react";
import { Laptop } from "lucide-react";
import { isDesktop } from "@/lib/platform";
import { readOpenAtLogin, writeOpenAtLogin } from "@/lib/autostart";

export function OpenAtLoginSetting() {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void readOpenAtLogin().then(setEnabled).catch(() => setError("Could not read this setting."));
  }, []);

  if (!isDesktop()) return null;

  const change = async (next: boolean) => {
    try {
      await writeOpenAtLogin(next);
      setEnabled(next);
      setError("");
    } catch {
      setError("The system could not update the login item. Try again.");
    }
  };

  return (
    <section className="stock-flat rounded-lg p-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => void change(event.target.checked)}
          className="border-line size-4 shrink-0 rounded-[3px] border-2 accent-[var(--hue-blue)]"
        />
        <Laptop className="size-4" />
        <span className="flex-1 text-sm font-semibold">Open at login</span>
      </label>
      <p className="text-muted-foreground mt-1 text-xs">
        Starts quietly with the window hidden, while the tray and Circle alerts stay active.
      </p>
      {error && <p className="text-destructive mt-2 text-xs font-semibold">{error}</p>}
    </section>
  );
}
