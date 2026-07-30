import type { MemberStats } from "@/data/stats";
import type { DayKey } from "@/lib/days";
import { cn } from "@/lib/utils";

interface MemberAvatarsProps {
  members: MemberStats[];
  day: DayKey;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";

/** Who has delivered today — pressed-in means done, same material language. */
export function MemberAvatars({ members, day }: MemberAvatarsProps) {
  return (
    <span className="flex -space-x-1.5">
      {members.map((stats) => {
        const done = stats.doneDays.has(day);
        return (
          <span
            key={stats.member.id}
            title={`${stats.member.name}: ${done ? "done" : "not yet"}`}
            className={cn(
              "flex size-6 items-center justify-center rounded-full bg-background text-[10px] font-semibold",
              done ? "bg-primary text-primary-foreground" : "stock-flat text-muted-foreground",
            )}
          >
            {initials(stats.member.name)}
          </span>
        );
      })}
    </span>
  );
}
