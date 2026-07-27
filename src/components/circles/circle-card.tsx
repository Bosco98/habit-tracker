import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { LoadedCircle } from "@/data/types";

interface CircleCardProps {
  circle: LoadedCircle;
  memberCount: number;
  habitCount: number;
}

export function CircleCard({ circle, memberCount, habitCount }: CircleCardProps) {
  return (
    <Link
      to={`/circle/${circle.$jazz.id}`}
      className="neu-raised flex items-center gap-3 rounded-2xl bg-card p-3 transition-shadow active:neu-pressed"
    >
      <span className="neu-well flex size-11 shrink-0 items-center justify-center rounded-full text-xl">
        {circle.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{circle.name}</p>
        <p className="text-muted-foreground text-xs">
          {memberCount} {memberCount === 1 ? "member" : "members"} · {habitCount}{" "}
          {habitCount === 1 ? "habit" : "habits"}
          {circle.stake && ` · ${circle.stake}`}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground size-4 shrink-0" />
    </Link>
  );
}
