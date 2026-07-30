import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassphraseDisplayProps {
  passphrase: string;
}

const FILENAME = "habits-recovery-phrase.txt";

/** The recovery phrase, shown as numbered words so it can be copied by hand. */
export function PassphraseDisplay({ passphrase }: PassphraseDisplayProps) {
  const [copied, setCopied] = useState(false);
  const words = passphrase.split(" ");

  const copy = async () => {
    await navigator.clipboard.writeText(passphrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * A clipboard survives until the next copy. This is the only key to the
   * account, so it needs a form that outlives the session — a plain text file
   * the user can put wherever they keep such things.
   */
  const download = () => {
    const body = [
      "Habits — account recovery phrase",
      "",
      "These words ARE your account. Anyone holding them can read your data,",
      "and nobody can recover it for you if they are lost.",
      "",
      ...words.map((word, index) => `${String(index + 1).padStart(2, " ")}. ${word}`),
      "",
      passphrase,
      "",
    ].join("\n");

    const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = FILENAME;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="stock-flat grid grid-cols-3 gap-x-2 gap-y-1.5 rounded-lg p-3">
        {words.map((word, index) => (
          <li key={`${word}-${index}`} className="flex items-baseline gap-1.5 text-sm">
            <span className="text-muted-foreground tnum w-4 shrink-0 text-right text-[11px]">
              {index + 1}
            </span>
            <span className="truncate font-medium">{word}</span>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={copy}
          className="stock stock-press active:stock-press-active h-10 flex-1 rounded-lg text-xs font-extrabold uppercase"
        >
          {copied ? <Check className="text-primary-strong" /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={download}
          className="stock stock-press active:stock-press-active h-10 flex-1 rounded-lg text-xs font-extrabold uppercase"
        >
          <Download /> Download
        </Button>
      </div>
    </div>
  );
}
