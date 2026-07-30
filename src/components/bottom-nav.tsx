import { NavLink } from "react-router";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Phone navigation. The desktop rail replaces it from `md` up. */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden"
    >
      <div className="mx-2 sm:mx-auto sm:max-w-md">
        <div className="stock grid grid-cols-4 gap-1 rounded-xl p-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-bold transition-shadow duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )
              }
            >
              <Icon className="size-4" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
