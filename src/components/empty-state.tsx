import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  emoji: string;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <div className="neu-well flex size-20 items-center justify-center rounded-full text-4xl">
        {emoji}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 max-w-60 text-sm">{hint}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="neu-raised mt-2 rounded-full">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
