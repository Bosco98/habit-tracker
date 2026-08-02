import { useEffect, useState } from "react";
import type { Member } from "@/data/members";
import { isOnline, lastActiveLabel } from "@/lib/circle-social";

interface MemberListProps {
  members: Member[];
  lastActiveByMember: ReadonlyMap<string, number>;
}

export function MemberList({ members, lastActiveByMember }: MemberListProps) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground px-1 text-xs font-semibold">People</h3>
      <ul className="flex flex-col gap-2">
        {members.map((member) => {
          const lastActiveAt = lastActiveByMember.get(member.id) ?? null;
          const online = member.isMe || isOnline(lastActiveAt, now);
          return (
            <li
              key={member.id}
              className="stock-flat flex items-center gap-2 rounded-lg p-2 text-sm"
            >
              <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                {member.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {member.isMe ? "You" : member.name}
                </span>
                <span className="text-muted-foreground block truncate text-xs">
                  {member.isMe ? "Online" : lastActiveLabel(lastActiveAt, now)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`size-2.5 shrink-0 rounded-full border-2 border-[var(--line)] ${
                  online ? "bg-[var(--hue-lime)]" : "bg-muted"
                }`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
