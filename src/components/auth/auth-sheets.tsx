import { useMemo, useState, type ReactNode } from "react";
import { LogInSheet } from "@/components/auth/log-in-sheet";
import { SignUpSheet } from "@/components/auth/sign-up-sheet";
import { AuthSheetsContext } from "@/lib/auth-sheets-context";

/**
 * Owns the sign-up / log-in sheets for the whole app. They used to live in
 * the account menu, which meant nothing else could ask for an account —
 * and circles, which are useless without one, had no way to prompt.
 */
export function AuthSheetsProvider({ children }: { children: ReactNode }) {
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [logInOpen, setLogInOpen] = useState(false);

  const value = useMemo(
    () => ({
      openSignUp: () => setSignUpOpen(true),
      openLogIn: () => setLogInOpen(true),
    }),
    [],
  );

  return (
    <AuthSheetsContext value={value}>
      {children}
      <SignUpSheet open={signUpOpen} onOpenChange={setSignUpOpen} />
      <LogInSheet open={logInOpen} onOpenChange={setLogInOpen} />
    </AuthSheetsContext>
  );
}
