import type { Member } from "@/data/members";

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {members.map((member) => (
        <li
          key={member.id}
          className="neu-raised flex items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-1.5 text-sm"
        >
          <span className="neu-well flex size-7 items-center justify-center rounded-full text-[11px] font-semibold">
            {member.name.slice(0, 2).toUpperCase()}
          </span>
          {member.isMe ? "You" : member.name}
        </li>
      ))}
    </ul>
  );
}
