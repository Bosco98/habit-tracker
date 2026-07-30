import { useState } from "react";
import { EmojiPicker } from "@/components/emoji-picker";
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
import type { LoadedCircle } from "@/data/types";
import { CIRCLE_EMOJI } from "@/lib/habit-emoji";

export interface CircleInput {
  name: string;
  emoji: string;
}

interface CircleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circle: LoadedCircle | null;
  onSubmit: (input: CircleInput) => void;
}

export function CircleForm({ open, onOpenChange, circle, onSubmit }: CircleFormProps) {
  const [name, setName] = useState(circle?.name ?? "");
  const [emoji, setEmoji] = useState(circle?.emoji ?? CIRCLE_EMOJI[0]);

  const valid = name.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle>{circle ? "Edit circle" : "New circle"}</SheetTitle>
          <SheetDescription>
            A shared shelf. Habits you put here, everyone here can keep.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-5 px-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSubmit({ name: name.trim(), emoji });
            onOpenChange(false);
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="circle-name">Name</Label>
            <Input
              id="circle-name"
              placeholder="Weeknights"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="stock-flat bg-card rounded-lg shadow-none"
              autoFocus={!circle}
            />
          </div>

          <EmojiPicker value={emoji} onChange={setEmoji} options={CIRCLE_EMOJI} />

          <Button type="submit" disabled={!valid} className="stock h-12 rounded-lg text-base">
            {circle ? "Save changes" : "Create circle"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
