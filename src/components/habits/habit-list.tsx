import { useRef } from "react";
import { HabitCard } from "./habit-card";
import type { HabitEntry } from "@/data/types";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

interface HabitListProps {
  label?: string;
  entries: HabitEntry[];
  /** Shifts the colour cycle so a second list doesn't restart on blue. */
  indexOffset?: number;
  myId: string;
  myName: string;
  onOpen: (entry: HabitEntry) => void;
  onEdit: (entry: HabitEntry) => void;
  onArchive: (entry: HabitEntry) => void;
  onDelete: (entry: HabitEntry) => void;
}

export function HabitList({
  label,
  entries,
  indexOffset = 0,
  myId,
  myName,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: HabitListProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = ref.current?.querySelectorAll(".habit-card");
      if (prefersReducedMotion() || !cards?.length) return;
      gsap.from(cards, {
        y: 10,
        opacity: 0,
        duration: 0.26,
        ease: "expo.out",
        stagger: 0.04,
        clearProps: "y,opacity",
      });
    },
    { dependencies: [entries.length], revertOnUpdate: true },
  );

  if (entries.length === 0) return null;

  return (
    <section ref={ref} className="flex flex-col gap-3">
      {label && (
        <h2 className="text-muted-foreground px-1 text-xs font-semibold">{label}</h2>
      )}
      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <HabitCard
            key={entry.habit.$jazz.id}
            entry={entry}
            myId={myId}
            myName={myName}
            index={indexOffset + index}
            onOpen={() => onOpen(entry)}
            onEdit={() => onEdit(entry)}
            onArchive={() => onArchive(entry)}
            onDelete={() => onDelete(entry)}
          />
        ))}
      </div>
    </section>
  );
}
