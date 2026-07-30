import { useState } from "react";
import { ShieldCheck } from "lucide-react";
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
import { PassphraseDisplay } from "./passphrase-display";
import { useAuth } from "@/data/auth";
import { cn } from "@/lib/utils";

interface SignUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputStyle = "stock-flat rounded-lg bg-card shadow-none";

/**
 * Two beats: name the account, then save the phrase. The phrase is the
 * only way back in, so confirming you saved it is a deliberate gate.
 */
export function SignUpSheet({ open, onOpenChange }: SignUpSheetProps) {
  const { signUp, passphrase } = useAuth();
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await signUp(name.trim() || undefined);
      setPhrase(result || passphrase);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setPhrase(null);
    setSaved(false);
    setName("");
  };

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle>{phrase ? "Save your recovery phrase" : "Create your account"}</SheetTitle>
          <SheetDescription>
            {phrase
              ? `These ${phrase.split(" ").length} words are your account. Anyone with them can read your data — and without them, nobody can recover it. Not even us.`
              : "No email, no password. Your account is a key on this device, and your habits so far come with you."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-8">
          {phrase ? (
            <>
              <PassphraseDisplay passphrase={phrase} />
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={saved}
                  onChange={(e) => setSaved(e.target.checked)}
                  className="accent-primary-strong mt-0.5 size-4"
                />
                <span>I've saved these words somewhere safe.</span>
              </label>
              <Button
                onClick={close}
                disabled={!saved}
                className="stock h-12 rounded-lg text-base"
              >
                Done
              </Button>
            </>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="account-name">Display name</Label>
                <Input
                  id="account-name"
                  placeholder="What should friends call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputStyle}
                  autoFocus
                />
              </div>
              <p className="text-muted-foreground flex items-start gap-2 text-xs">
                <ShieldCheck className="text-primary-strong mt-px size-4 shrink-0" />
                Your data stays encrypted end-to-end. The sync server only ever sees ciphertext.
              </p>
              <Button
                type="submit"
                disabled={busy}
                className={cn("stock h-12 rounded-lg text-base", busy && "opacity-70")}
              >
                {busy ? "Creating…" : "Create account"}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
