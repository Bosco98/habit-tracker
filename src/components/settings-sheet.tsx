import { useState } from "react";
import { Eye, EyeOff, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PassphraseDisplay } from "@/components/auth/passphrase-display";
import { OpenAtLoginSetting } from "@/components/open-at-login-setting";
import { DesktopUpdateSetting } from "@/components/desktop-updater";
import { SyncBadge } from "@/components/sync-badge";
import { useAuth } from "@/data/auth";
import { useAppAccount } from "@/data/hooks";
import { setDisplayName } from "@/data/mutations";
import { RETENTION_DAYS } from "@/lib/retention";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
  onLogIn: () => void;
}

const inputStyle = "stock-flat rounded-lg bg-card shadow-none";

export function SettingsSheet({ open, onOpenChange, onSignUp, onLogIn }: SettingsSheetProps) {
  const account = useAppAccount();
  const { isAuthenticated, passphrase, logOut } = useAuth();
  const [revealed, setRevealed] = useState(false);

  if (!account.$isLoaded) return null;

  const name = account.profile.name ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="settings-dialog mx-auto max-w-xl overflow-hidden rounded-t-xl border-x-0 border-b-0 bg-background"
      >
        <SheetHeader className="border-line shrink-0 border-b-2 px-5 py-4">
          <SheetTitle className="text-lg font-extrabold">Settings</SheetTitle>
          <SheetDescription className="sr-only">
            Account, sync and display preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6 sm:px-5">
          <section className="flex flex-col gap-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              placeholder="Your name"
              onChange={(e) => setDisplayName(account, e.target.value)}
              className={inputStyle}
            />
            <SyncBadge />
          </section>

          <div className="grid items-start gap-5 sm:grid-cols-2">
            <section className="flex flex-col gap-3">
              <div>
                <p className="font-semibold">Account</p>
                <p className="text-muted-foreground text-sm">
                  {isAuthenticated
                    ? "Your habits sync to every device with this phrase."
                    : "This device only. Create an account to sync and share."}
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setRevealed((prev) => !prev)}
                    className="stock stock-press active:stock-press-active h-11 justify-start rounded-lg"
                  >
                    {revealed ? <EyeOff /> : <Eye />}
                    {revealed ? "Hide recovery phrase" : "Show recovery phrase"}
                  </Button>
                  {revealed && passphrase && <PassphraseDisplay passphrase={passphrase} />}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logOut();
                      onOpenChange(false);
                    }}
                    className="text-destructive stock stock-press active:stock-press-active h-11 justify-start rounded-lg"
                  >
                    <LogOut /> Log out
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onSignUp();
                    }}
                    className="stock h-11 rounded-lg"
                  >
                    Create account
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onOpenChange(false);
                      onLogIn();
                    }}
                    className="stock stock-press active:stock-press-active h-11 rounded-lg"
                  >
                    Log in
                  </Button>
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3">
              <OpenAtLoginSetting />
              <DesktopUpdateSetting />
              <section className="stock-flat flex flex-col gap-1 rounded-lg p-3">
                <p className="text-sm font-semibold">History</p>
                <p className="text-muted-foreground text-sm">
                  The last {RETENTION_DAYS} days are kept. Older days roll into your
                  streak totals before the raw log is removed.
                </p>
              </section>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
