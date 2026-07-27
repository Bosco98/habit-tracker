import { useRef } from "react";
import { HabitCard } from "./habit-card";
import type { HabitEntry } from "@/data/types";
import type { DayKey } from "@/lib/days";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/motion";

interface HabitListProps {
  label?: string;
  entries: HabitEntry[];
  myId: string;
  myName: string;
  day: DayKey;
  weekStartsOn: number;
  onOpen: (entry: HabitEntry) => void;
  onEdit: (entry: HabitEntry) => void;
  onArchive: (entry: HabitEntry) => void;
  onDelete: (entry: HabitEntry) => void;
}

export function HabitList({
  label,
  entries,
  myId,
  myName,
  day,
  weekStartsOn,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: HabitListProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from(".habit-card", {
        y: 12,
        opacity: 0,
        duration: 0.25,
        ease: "power3.out",
        stagger: 0.04,
        clearProps: "all",
      });
    },
    { scope: ref },
  );

  if (entries.length === 0) return null;

  return (
    <section ref={ref} className="flex flex-col gap-2.5">
      {label && (
        <h2 className="text-muted-foreground px-1 text-xs font-medium tracking-wide">{label}</h2>
      )}
      {entries.map((entry) => (
        <HabitCard
          key={entry.habit.$jazz.id}
          entry={entry}
          myId={myId}
          myName={myName}
          day={day}
          weekStartsOn={weekStartsOn}
          onOpen={() => onOpen(entry)}
          onEdit={() => onEdit(entry)}
          onArchive={() => onArchive(entry)}
          onDelete={() => onDelete(entry)}
        />
      ))}
    </section>
  );
}
