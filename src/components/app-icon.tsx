import { appIconDefinition, type AppIconKind } from "@/lib/app-icons";
import { cn } from "@/lib/utils";

interface AppIconProps {
  value: string | undefined;
  kind?: AppIconKind;
  className?: string;
  strokeWidth?: number;
}

export function AppIcon({
  value,
  kind = "habit",
  className,
  strokeWidth = 2,
}: AppIconProps) {
  const definition = appIconDefinition(value, kind);
  const Icon = definition.icon;
  return <Icon aria-hidden className={cn("size-4", className)} strokeWidth={strokeWidth} />;
}
