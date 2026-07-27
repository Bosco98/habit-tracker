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
import type { LoadedCircle } from "@/data/types";
import { cn } from "@/lib/utils";

export interface CircleInput {
  name: string;
  emoji: string;
  stake?: string;
}

interface CircleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  circle: LoadedCircle | null;
  onSubmit: (input: CircleInput) => void;
}

const inputStyle = "neu-well rounded-xl border-0 bg-well shadow-none dark:bg-well";

export function CircleForm({ open, onOpenChange, circle, onSubmit }: CircleFormProps) {
  const [name, setName] = useState(circle?.name ?? "");
  const [emoji, setEmoji] = useState(circle?.emoji ?? "🤝");
  const [stake, setStake] = useState(circle?.stake ?? "");

  const valid = name.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl border-0 bg-background">
        <SheetHeader>
          <SheetTitle>{circle ? "Edit circle" : "New circle"}</SheetTitle>
          <SheetDescription>
            A circle is a private space you share with one person or a few.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-5 px-4 pb-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSubmit({
              name: name.trim(),
              emoji: emoji.trim() || "🤝",
              stake: stake.trim() || undefined,
            });
            onOpenChange(false);
          }}
        >
          <div className="flex gap-2">
            <div className="w-16">
              <Label htmlFor="circle-emoji" className="sr-only">Emoji</Label>
              <Input
                id="circle-emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className={cn(inputStyle, "text-center text-xl")}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="circle-name" className="sr-only">Name</Label>
              <Input
                id="circle-name"
                placeholder="Circle name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                autoFocus={!circle}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="circle-stake">Weekly stake (optional)</Label>
            <Input
              id="circle-stake"
              placeholder="Loser buys coffee"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className={inputStyle}
            />
            <p className="text-muted-foreground text-xs">
              What the loser of a week owes. The app only remembers it — you settle it.
            </p>
          </div>

          <Button type="submit" disabled={!valid} className="neu-raised h-12 rounded-full text-base">
            {circle ? "Save changes" : "Create circle"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
