import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { applyPlatformClasses, registerServiceWorker } from "@/lib/platform";
import { DataProvider } from "@/data/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppRoutes } from "@/app-routes";

applyPlatformClasses();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppRoutes />
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  </StrictMode>,
);
