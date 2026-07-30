import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { AuthSheetsProvider } from "@/components/auth/auth-sheets";
import { BottomNav } from "@/components/bottom-nav";
import { BackgroundServices } from "@/components/background-services";
import { SideRail } from "@/components/side-rail";
import { InviteListener } from "@/data/invite-listener";

/**
 * Frame only. Each route renders its own <TopBar> so the bar can carry that
 * screen's primary action and stay sticky above its own content — one route
 * mounts at a time, so there is never more than one bar.
 *
 * Two shapes, not one scaled: a phone gets a single column and a bottom pill,
 * a desktop gets a rail and a column wide enough for habits to sit side by
 * side. The old single `max-w-lg` made the desktop app a phone in a window.
 */
export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <AuthSheetsProvider>
      <div className="flex min-h-dvh w-full">
        <BackgroundServices />
        <SideRail />
        <div className="flex min-w-0 flex-1 flex-col">
          <InviteListener />
          <main className="mx-auto w-full max-w-lg flex-1 pb-32 md:max-w-5xl md:pb-10">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthSheetsProvider>
  );
}
