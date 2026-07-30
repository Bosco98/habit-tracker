import { ChartNoAxesColumn, House, UserRound, Users } from "lucide-react";

/** One definition of where you can go, rendered as a rail or a pill. */
export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: House },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/insights", label: "Insights", icon: ChartNoAxesColumn },
  { to: "/you", label: "You", icon: UserRound },
] as const;
