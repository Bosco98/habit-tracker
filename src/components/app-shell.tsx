import { Outlet } from "react-router";
import { AccountMenu } from "@/components/account-menu";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { InviteListener } from "@/data/invite-listener";

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <InviteListener />
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Habits</h1>
        <div className="flex items-center">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>
      <main className="flex-1 px-4 pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
