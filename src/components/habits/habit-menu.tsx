import { Archive, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HabitMenuProps {
  habitName: string;
  /** Shared habits are removed from the circle, not archived personally. */
  shared?: boolean;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function HabitMenu({
  habitName,
  shared = false,
  onEdit,
  onArchive,
  onDelete,
}: HabitMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Options for ${habitName}`}
          className="text-muted-foreground -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:text-foreground"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil /> Edit
        </DropdownMenuItem>
        {!shared && (
          <DropdownMenuItem onClick={onArchive}>
            <Archive /> Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 /> {shared ? "Remove from circle" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
