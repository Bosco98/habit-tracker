import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeCadence, MAX_EVERY_DAYS, normalizeCadence } from "@/lib/cadence";
import { cn } from "@/lib/utils";

interface CadencePickerProps {
  everyDays: number;
  onChange: (everyDays: number) => void;
  inputClassName?: string;
}

const PRESETS = [1, 2, 3, 7];

/**
 * Cadence in days and nothing else — no weekday grid, no "times per week".
 * The presets cover the common cases; the field handles the rest.
 */
export function CadencePicker({ everyDays, onChange, inputClassName }: CadencePickerProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2" role="group" aria-label="How often">
        {PRESETS.map((preset) => {
          const selected = everyDays === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              aria-pressed={selected}
              className={cn(
                "stock stock-press flex-1 rounded-lg px-2 py-2 text-sm font-medium",
                "active:stock-press-active",
                selected && "bg-primary text-primary-foreground",
              )}
            >
              {preset === 1 ? "Daily" : `${preset}d`}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="habit-every" className="text-muted-foreground text-sm">
          Every
        </Label>
        <Input
          id="habit-every"
          type="number"
          min={1}
          max={MAX_EVERY_DAYS}
          value={everyDays}
          onChange={(e) => onChange(normalizeCadence(Number(e.target.value)).everyDays)}
          className={cn("tnum w-20 text-center", inputClassName)}
        />
        <span className="text-muted-foreground text-sm">
          days — {describeCadence({ everyDays }).toLowerCase()}
        </span>
      </div>
    </div>
  );
}
