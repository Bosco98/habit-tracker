import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { normalizePassphrase, unknownWords, useAuth } from "@/data/auth";

interface LogInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogInSheet({ open, onOpenChange }: LogInSheetProps) {
  const { logIn } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const phrase = normalizePassphrase(value);
    const bad = unknownWords(phrase);
    if (bad.length > 0) {
      setError(`Not in the wordlist: ${bad.slice(0, 3).join(", ")}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await logIn(phrase);
      onOpenChange(false);
      setValue("");
    } catch {
      setError("That phrase didn't unlock an account. Check the word order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle>Log in with your phrase</SheetTitle>
          <SheetDescription>
            Enter the recovery phrase from another device. This replaces what's on this device.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="passphrase">Recovery phrase</Label>
            <textarea
              id="passphrase"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="your words, separated by spaces"
              className="stock-flat placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-lg p-3 text-sm outline-none focus-visible:ring-2"
            />
          </div>
          {error && (
            <p role="alert" className="text-destructive flex items-start gap-2 text-sm">
              <AlertCircle className="mt-px size-4 shrink-0" />
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy || value.trim().length === 0}
            className="stock h-12 rounded-lg text-base"
          >
            {busy ? "Unlocking…" : "Log in"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
