import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSheet } from "@/components/settings-sheet";
import { useAuthSheets } from "@/lib/auth-sheets-context";

/** Owns the settings surface; the auth sheets live above, in AuthSheetsProvider. */
export function AccountMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { openSignUp, openLogIn } = useAuthSheets();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Settings"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings className="size-4" />
      </Button>
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSignUp={openSignUp}
        onLogIn={openLogIn}
      />
    </>
  );
}
