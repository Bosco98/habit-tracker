import { lazy, Suspense, type ReactNode } from "react";
import { Route, Routes } from "react-router";
import { AppShell } from "@/components/app-shell";
import { Home } from "@/routes/home";

// Home is the cold-start screen, so it ships in the entry chunk. The rest —
// charts, QR encoding, peer comparison — loads when someone actually navigates.
const Circles = lazy(() => import("@/routes/circles").then((m) => ({ default: m.Circles })));
const CircleDetail = lazy(() =>
  import("@/routes/circle-detail").then((m) => ({ default: m.CircleDetail })),
);
const Insights = lazy(() => import("@/routes/insights").then((m) => ({ default: m.Insights })));
const You = lazy(() => import("@/routes/you").then((m) => ({ default: m.You })));

/** Chunks are small and local-first, so a blank frame beats a spinner. */
const deferred = (node: ReactNode) => <Suspense>{node}</Suspense>;

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="circles" element={deferred(<Circles />)} />
        <Route path="circle/:circleId" element={deferred(<CircleDetail />)} />
        <Route path="insights" element={deferred(<Insights />)} />
        <Route path="you" element={deferred(<You />)} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
