import { ChartNoAxesColumn, House, Users } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: House },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/insights", label: "Insights", icon: ChartNoAxesColumn },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="mx-auto w-fit">
        <div className="neu-raised flex gap-1 rounded-full bg-background p-1.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-shadow duration-200",
                  isActive
                    ? "neu-pressed text-primary-strong font-medium"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
