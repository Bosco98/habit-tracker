import { createContext, use } from "react";

export interface AuthSheets {
  openSignUp: () => void;
  openLogIn: () => void;
}

export const AuthSheetsContext = createContext<AuthSheets | null>(null);

/** Anything that needs to push someone toward an account reaches it through here. */
export function useAuthSheets(): AuthSheets {
  const value = use(AuthSheetsContext);
  if (!value) throw new Error("useAuthSheets must be used inside <AuthSheetsProvider>");
  return value;
}
