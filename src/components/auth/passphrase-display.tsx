import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassphraseDisplayProps {
  passphrase: string;
}

/** The recovery phrase, shown as numbered words so it can be copied by hand. */
export function PassphraseDisplay({ passphrase }: PassphraseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const words = passphrase.split(" ");

  const copy = async () => {
    await navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="neu-well grid grid-cols-3 gap-x-2 gap-y-1.5 rounded-xl bg-well p-3">
        {words.map((word, index) => (
          <li key={`${word}-${index}`} className="flex items-baseline gap-1.5 text-sm">
            <span className="text-muted-foreground w-4 shrink-0 text-right text-[11px] tabular-nums">
              {index + 1}
            </span>
            <span className="truncate font-medium">{word}</span>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="ghost"
        onClick={copy}
        className="neu-raised h-10 rounded-full active:neu-pressed"
      >
        {copied ? <Check className="text-primary-strong" /> : <Copy />}
        {copied ? "Copied" : "Copy phrase"}
      </Button>
    </div>
  );
}
