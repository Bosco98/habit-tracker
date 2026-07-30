interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="stock flex flex-col gap-0.5 rounded-xl p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold tnum">{value}</span>
      {hint && <span className="text-muted-foreground text-[11px]">{hint}</span>}
    </div>
  );
}
