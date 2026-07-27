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
import type { HabitKind } from "@/lib/completion";
import { cn } from "@/lib/utils";
import { WeekdayPicker } from "./weekday-picker";

type ScheduleType = "daily" | "weekdays" | "timesPerWeek";

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: LoadedHabit | null;
  /** Offer a personal/circle destination when creating. Omit to keep it fixed. */
  circles?: LoadedCircle[];
  defaultCircleId?: string | null;
  onSubmit: (input: HabitInput, circleId: string | null) => void;
}

const inputStyle = "neu-well rounded-xl border-0 bg-well shadow-none dark:bg-well";

export function HabitForm({
  open,
  onOpenChange,
  habit,
  circles = [],
  defaultCircleId = null,
  onSubmit,
}: HabitFormProps) {
  const [name, setName] = useState(habit?.name ?? "");
  const [emoji, setEmoji] = useState(habit?.emoji ?? "🌱");
  const [kind, setKind] = useState<HabitKind>(habit?.kind ?? "binary");
  const [target, setTarget] = useState(() =>
    habit?.kind === "timer"
      ? String(Math.round((habit.target ?? 600) / 60))
      : String(habit?.target ?? 3),
  );
  const [scheduleType, setScheduleType] = useState<ScheduleType>(habit?.schedule.type ?? "daily");
  const [days, setDays] = useState<number[]>(habit?.schedule.days ?? [1, 2, 3, 4, 5]);
  const [perWeek, setPerWeek] = useState(String(habit?.schedule.perWeek ?? 3));
  const [circleId, setCircleId] = useState<string | null>(defaultCircleId);

  const showTargets = !habit && circles.length > 0;

  const valid =
    name.trim().length > 0 &&
    (scheduleType !== "weekdays" || days.length > 0) &&
    (kind === "binary" || Number(target) >= 1);

  const submit = () => {
    if (!valid) return;
    onSubmit(
      {
        name: name.trim(),
        emoji: emoji.trim() || "🌱",
        kind,
        target:
          kind === "binary" ? undefined : kind === "timer" ? Number(target) * 60 : Number(target),
        schedule:
          scheduleType === "daily"
            ? { type: "daily" }
            : scheduleType === "weekdays"
              ? { type: "weekdays", days }
              : { type: "timesPerWeek", perWeek: Math.min(7, Math.max(1, Number(perWeek))) },
      },
      showTargets ? circleId : defaultCircleId,
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
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
          <div className="flex gap-2">
            <div className="w-16">
              <Label htmlFor="habit-emoji" className="sr-only">Emoji</Label>
              <Input
                id="habit-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className={cn(inputStyle, "text-center text-xl")}
                aria-label="Emoji"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="habit-name" className="sr-only">Name</Label>
              <Input
                id="habit-name"
                placeholder="Habit name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                autoFocus={!habit}
              />
            </div>
          </div>

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
                  className={cn(inputStyle, "w-24 text-center tabular-nums")}
                  aria-label={kind === "timer" ? "Minutes per day" : "Times per day"}
                />
                <span className="text-muted-foreground text-sm">
                  {kind === "timer" ? "minutes a day" : "times a day"}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Schedule</Label>
            <Segmented<ScheduleType>
              label="Schedule"
              value={scheduleType}
              onChange={setScheduleType}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekdays", label: "Days" },
                { value: "timesPerWeek", label: "Weekly" },
              ]}
            />
            {scheduleType === "weekdays" && <WeekdayPicker days={days} onChange={setDays} />}
            {scheduleType === "timesPerWeek" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={perWeek}
                  onChange={(e) => setPerWeek(e.target.value)}
                  className={cn(inputStyle, "w-24 text-center tabular-nums")}
                  aria-label="Times per week"
                />
                <span className="text-muted-foreground text-sm">times a week</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!valid}
            className="neu-raised mt-1 h-12 rounded-full text-base"
          >
            {habit ? "Save changes" : "Create habit"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
