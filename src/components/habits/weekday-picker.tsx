import { cn } from "@/lib/utils";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface WeekdayPickerProps {
  days: number[];
  onChange: (days: number[]) => void;
}

export function WeekdayPicker({ days, onChange }: WeekdayPickerProps) {
  const toggle = (day: number) =>
    onChange(days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort());

  return (
    <div className="flex gap-1.5" role="group" aria-label="Days of the week">
      {LETTERS.map((letter, day) => (
        <button
          key={day}
          type="button"
          aria-pressed={days.includes(day)}
          aria-label={NAMES[day]}
          onClick={() => toggle(day)}
          className={cn(
            "flex size-10 flex-1 items-center justify-center rounded-full text-sm transition-shadow duration-200",
            days.includes(day)
              ? "neu-pressed text-primary-strong font-semibold"
              : "neu-raised text-muted-foreground",
          )}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}
