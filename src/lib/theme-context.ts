import { createContext, useContext } from "react";

export type Theme = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "habit-tracker-theme";

export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", setTheme: () => null });

export function useTheme() {
  return useContext(ThemeContext);
}
