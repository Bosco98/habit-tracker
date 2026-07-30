import { useState } from "react";
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
import { Segmented } from "@/components/segmented";
import type { HabitInput } from "@/data/mutations";
import type { LoadedCircle, LoadedHabit } from "@/data/types";
import { normalizeCadence } from "@/lib/cadence";
import type { HabitKind } from "@/lib/completion";
import { cn } from "@/lib/utils";
import { CadencePicker } from "./cadence-picker";
import { HABIT_EMOJI } from "@/lib/habit-emoji";
import { EmojiPicker } from "@/components/emoji-picker";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: LoadedHabit | null;
  /** Offer a personal/circle destination when creating. Omit to keep it fixed. */
  circles?: LoadedCircle[];
  defaultCircleId?: string | null;
  onSubmit: (input: HabitInput, circleId: string | null) => void;
}

const inputStyle = "stock-flat rounded-lg bg-card shadow-none";

export function HabitForm({
  open,
  onOpenChange,
  habit,
  circles = [],
  defaultCircleId = null,
  onSubmit,
}: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? HABIT_EMOJI[0]);
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? "binary");
  const [target, setTarget] = useState(() =>
    habit?.kind === "timer"
      ? String(Math.round((habit.target ?? 600) / 60))
      : String(habit?.target ?? 3),
  );
  const [everyDays, setEveryDays] = useState(
    () => normalizeCadence(habit?.everyDays).everyDays,
  );
  const [circleId, setCircleId] = useState<string | null>(defaultCircleId);

  const showTargets = !habit && circles.length > 0;
  const valid = name.trim().length > 0 && (kind === "binary" || Number(target) >= 1);

  const submit = () => {
    if (!valid) return;
    onSubmit(
      {
        name: name.trim(),
        emoji,
        kind,
        target:
          kind === "binary"
            ? undefined
            : kind === "timer"
              ? Number(target) * 60
              : Number(target),
        cadence: normalizeCadence(everyDays),
      },
      showTargets ? circleId : defaultCircleId,
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-w-lg rounded-t-2xl border-x-0 border-b-0 bg-background"
      >
        <SheetHeader>
          <SheetTitle>{habit ? "Edit habit" : "New habit"}</SheetTitle>
          <SheetDescription className="sr-only">
            {habit ? "Change this habit's details." : "Create a habit to track."}
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto px-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="habit-name" className="sr-only">
              Name
            </Label>
            <Input
              id="habit-name"
              placeholder="Habit name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
              autoFocus={!habit}
            />
          </div>

          <EmojiPicker value={emoji} onChange={setEmoji} />

          {showTargets && (
            <div className="flex flex-col gap-2">
              <Label>Track it</Label>
              <Segmented<string>
                label="Where this habit lives"
                value={circleId ?? "personal"}
                onChange={(value) => setCircleId(value === "personal" ? null : value)}
                options={[
                  { value: "personal", label: "Just me" },
                  ...circles.map((circle) => ({
                    value: circle.$jazz.id,
                    label: `${circle.emoji} ${circle.name}`,
                  })),
                ]}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Segmented<HabitKind>
              label="Habit type"
              value={kind}
              onChange={setKind}
              options={[
                { value: "binary", label: "Check" },
                { value: "count", label: "Count" },
                { value: "timer", label: "Timer" },
              ]}
            />
            {kind !== "binary" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={cn(inputStyle, "tnum w-24 text-center")}
                  aria-label={kind === "timer" ? "Minutes per day" : "Times per day"}
                />
                <span className="text-muted-foreground text-sm">
                  {kind === "timer" ? "minutes each time" : "times each time"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>How often</Label>
            <CadencePicker
              everyDays={everyDays}
              onChange={setEveryDays}
              inputClassName={inputStyle}
            />
          </div>

          <Button type="submit" disabled={!valid} className="stock mt-1 h-12 rounded-lg text-base">
            {habit ? "Save changes" : "Create habit"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
