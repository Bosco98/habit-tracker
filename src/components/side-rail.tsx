import { NavLink } from "react-router";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The desktop navigation. Below `md` the bottom pill takes over — a rail this
 * wide on a phone would eat a third of the screen.
 *
 * On macOS the window is frameless, so the traffic lights land in the rail's
 * top-left; `.side-rail` reserves that strip and makes it a drag region.
 */
export function SideRail() {
  return (
    <nav
      data-tauri-drag-region
      aria-label="Main"
      className="side-rail border-line bg-card sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r-2 px-3 py-4 md:flex"
    >
      <p
        data-tauri-drag-region
        className="mb-4 px-2 text-lg leading-none font-extrabold tracking-[-0.02em] uppercase"
      >
        Habits
      </p>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold uppercase",
              isActive
                ? "stock bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          <Icon className="size-4" strokeWidth={2.5} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
