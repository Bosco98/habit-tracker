import { useId } from "react";
import { Label } from "@/components/ui/label";
import { HABIT_EMOJI } from "@/lib/habit-emoji";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  /** The shelf to choose from — habits and circles use different ones. */
  options?: readonly string[];
  label?: string;
}

export function EmojiPicker({
  value,
  onChange,
  options = HABIT_EMOJI,
  label = "Icon",
}: EmojiPickerProps) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{label}</Label>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="stock-flat grid grid-cols-9 gap-1 rounded-lg p-1.5"
      >
        {options.map((emoji) => {
          const selected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={emoji}
              onClick={() => onChange(emoji)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md text-lg",
                "transition-transform active:scale-90",
                selected && "border-line border-2",
              )}
              style={selected ? { backgroundColor: "var(--hue-blue)" } : undefined}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
