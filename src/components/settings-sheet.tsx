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
import { Segmented } from "@/components/segmented";
import { SyncBadge } from "@/components/sync-badge";
import { useAuth } from "@/data/auth";
import { useAppAccount } from "@/data/hooks";
import { setDisplayName, setWeekStart } from "@/data/mutations";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignUp: () => void;
  onLogIn: () => void;
}

const inputStyle = "neu-well rounded-xl border-0 bg-well shadow-none dark:bg-well";

export function SettingsSheet({ open, onOpenChange, onSignUp, onLogIn }: SettingsSheetProps) {
  const account = useAppAccount();
  const { isAuthenticated, passphrase, logOut } = useAuth();
  const [revealed, setRevealed] = useState(false);

  if (!account.$isLoaded) return null;

  const name = account.profile.name ?? "";
  const weekStartsOn = account.root.settings.weekStartsOn;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription className="sr-only">
            Account, sync and display preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="flex max-h-[70dvh] flex-col gap-6 overflow-y-auto px-4 pb-8">
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

          <section className="flex flex-col gap-2">
            <Label>Week starts on</Label>
            <Segmented<string>
              label="Week starts on"
              value={String(weekStartsOn)}
              onChange={(value) => setWeekStart(account, Number(value))}
              options={[
                { value: "1", label: "Monday" },
                { value: "0", label: "Sunday" },
              ]}
            />
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <p className="font-medium">Account</p>
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
                  className="neu-raised h-11 justify-start rounded-full active:neu-pressed"
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
                  className="text-destructive neu-raised h-11 justify-start rounded-full active:neu-pressed"
                >
                  <LogOut /> Log out
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onSignUp();
                  }}
                  className="neu-raised h-11 flex-1 rounded-full"
                >
                  Create account
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onOpenChange(false);
                    onLogIn();
                  }}
                  className="neu-raised h-11 flex-1 rounded-full active:neu-pressed"
                >
                  Log in
                </Button>
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
