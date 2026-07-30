import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import {
  applyPlatformClasses,
  isDesktop,
  isWidget,
  registerServiceWorker,
} from "@/lib/platform";
import { pushReminder, readReminder } from "@/lib/reminder";
import { DataProvider } from "@/data/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { WidgetPanel } from "@/components/widget/widget-panel";
import { AppRoutes } from "@/app-routes";
import { InstallGuide } from "@/routes/install";
import { Landing } from "@/routes/landing";

applyPlatformClasses();
registerServiceWorker();
// The shell forgets the schedule when it exits; the window hands it back on
// every launch, before any route mounts.
pushReminder(readReminder());

const desktop = isDesktop();
const widget = isWidget();
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const appBase = base ? `${base}/app` : "/app";
const webAppPath =
  window.location.pathname === appBase ||
  window.location.pathname.startsWith(`${appBase}/`);
const installBase = base ? `${base}/install` : "/install";
const installPath =
  window.location.pathname === installBase ||
  window.location.pathname.startsWith(`${installBase}/`);

if (installPath) {
  document.title = "How to Install Habits on Mac or Windows — Habits";
}

// Old invite links were rooted at the site apex. Preserve their fragments as
// the public root becomes a landing page.
if (!desktop && !widget && !webAppPath && window.location.hash.length > 1) {
  window.history.replaceState(
    null,
    "",
    `${appBase}/${window.location.search}${window.location.hash}`,
  );
}

if (desktop || widget || webAppPath || window.location.hash.length > 1) {
  document.title = widget ? "Habits — Today" : "Habits";
  if (!desktop) {
    document
      .querySelector('meta[name="robots"]')
      ?.setAttribute("content", "noindex, nofollow");
  }
}

// The desktop shell remains the app at "/", while the public site keeps its
// marketing page light and initializes Jazz only after someone opens /app.
const appView = (
  <DataProvider>
    <BrowserRouter basename={desktop ? import.meta.env.BASE_URL : appBase}>
      <AppRoutes />
    </BrowserRouter>
  </DataProvider>
);
const view = widget ? (
  <DataProvider>
    <WidgetPanel />
  </DataProvider>
) : desktop || webAppPath || window.location.hash.length > 1 ? (
  appView
) : installPath ? (
  <InstallGuide />
) : (
  <Landing />
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {view}
    </ThemeProvider>
  </StrictMode>,
);
