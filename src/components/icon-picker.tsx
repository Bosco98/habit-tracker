import { useId } from "react";
import {
  appIconLabel,
  HABIT_ICON_OPTIONS,
  normalizeAppIcon,
  type AppIconKind,
} from "@/lib/app-icons";
import { AppIcon } from "@/components/app-icon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  options?: readonly string[];
  kind?: AppIconKind;
  label?: string;
}

export function IconPicker({
  value,
  onChange,
  options = HABIT_ICON_OPTIONS,
  kind = "habit",
  label = "Icon",
}: IconPickerProps) {
  const labelId = useId();
  const normalizedValue = normalizeAppIcon(value, kind);

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{label}</Label>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="stock-flat grid grid-cols-6 gap-1 rounded-lg p-1.5 sm:grid-cols-9"
      >
        {options.map((icon) => {
          const selected = normalizedValue === icon;
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={appIconLabel(icon, kind)}
              onClick={() => onChange(icon)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md transition-transform",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1",
                "active:scale-90",
                selected && "border-line border-2",
              )}
              style={selected ? { backgroundColor: "var(--hue-blue)" } : undefined}
            >
              <AppIcon value={icon} kind={kind} className="size-4" strokeWidth={2.4} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
