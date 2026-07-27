import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import { applyPlatformClasses, registerServiceWorker } from "@/lib/platform";
import { DataProvider } from "@/data/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { CircleDetail } from "@/routes/circle-detail";
import { Circles } from "@/routes/circles";
import { Home } from "@/routes/home";
import { Insights } from "@/routes/insights";

applyPlatformClasses();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Home />} />
              <Route path="circles" element={<Circles />} />
              <Route path="circle/:circleId" element={<CircleDetail />} />
              <Route path="insights" element={<Insights />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  </StrictMode>,
);
