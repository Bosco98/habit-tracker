import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogInSheet } from "@/components/auth/log-in-sheet";
import { SignUpSheet } from "@/components/auth/sign-up-sheet";
import { SettingsSheet } from "@/components/settings-sheet";

/** Owns the account surfaces so the shell stays a layout concern only. */
export function AccountMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [logInOpen, setLogInOpen] = useState(false);

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
        onSignUp={() => setSignUpOpen(true)}
        onLogIn={() => setLogInOpen(true)}
      />
      <SignUpSheet open={signUpOpen} onOpenChange={setSignUpOpen} />
      <LogInSheet open={logInOpen} onOpenChange={setLogInOpen} />
    </>
  );
}
