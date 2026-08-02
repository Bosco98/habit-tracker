import { useEffect, useState } from "react";
import { Check, MessageSquareText, Pencil, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteCheckInProps {
  note?: string;
  done: boolean;
  disabled?: boolean;
  compact?: boolean;
  hue?: string;
  label: string;
  onSave: (note: string) => void;
  onClear: () => void;
}

/** A binary check-in with the useful bit attached: what actually happened. */
export function NoteCheckIn({
  note,
  done,
  disabled = false,
  compact = false,
  hue,
  label,
  onSave,
  onClear,
}: NoteCheckInProps) {
  const [draft, setDraft] = useState(note ?? "");
  const [editing, setEditing] = useState(!done);

  useEffect(() => {
    setDraft(note ?? "");
    if (!done) setEditing(true);
  }, [note, done]);

  const save = () => {
    const next = draft.trim();
    if (!next || disabled) return;
    onSave(next);
    setEditing(false);
  };

  if (done && !editing) {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-lg",
          compact ? "bg-muted px-2 py-1.5" : "stock-flat px-2.5 py-2",
        )}
      >
        <MessageSquareText className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-xs font-semibold" title={note}>
          {note || "Checked in"}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={disabled}
          aria-label={`Edit note for ${label}`}
          className="text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md disabled:opacity-40"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setEditing(true);
            onClear();
          }}
          disabled={disabled}
          aria-label={`Clear today's check-in for ${label}`}
          className="text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <form
      className="flex min-w-0 items-stretch gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {compact ? (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          maxLength={280}
          aria-label={`Note for ${label}`}
          placeholder="What did you do?"
          className="stock-flat bg-card min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      ) : (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={disabled}
          maxLength={280}
          rows={2}
          aria-label={`Note for ${label}`}
          placeholder="What did you do?"
          className="stock-flat bg-card min-w-0 flex-1 resize-none rounded-lg px-2.5 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      )}
      <button
        type="submit"
        disabled={disabled || draft.trim().length === 0}
        aria-label={`${done ? "Save" : "Check in with"} note for ${label}`}
        style={hue ? { backgroundColor: hue, color: "var(--on-hue)" } : undefined}
        className={cn(
          "stock stock-press active:stock-press-active",
          "flex shrink-0 items-center justify-center gap-1 rounded-lg font-extrabold uppercase",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-0",
          compact ? "size-8" : "px-3 text-xs",
        )}
      >
        <Check className="size-4" strokeWidth={3} />
        {!compact && (done ? "Save" : "Check in")}
      </button>
      {done && (
        <button
          type="button"
          onClick={() => {
            setDraft(note ?? "");
            setEditing(false);
          }}
          aria-label={`Cancel editing note for ${label}`}
          className={cn(
            "text-muted-foreground shrink-0 font-semibold",
            compact
              ? "flex size-8 items-center justify-center rounded-md"
              : "px-1 text-xs",
          )}
        >
          {compact ? <X className="size-4" /> : "Cancel"}
        </button>
      )}
    </form>
  );
}
