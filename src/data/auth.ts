import { useIsAuthenticated, useLogOut, usePassphraseAuth } from "jazz-tools/react";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Identity is a keypair; the passphrase is its human-carryable form.
 * Sign-up upgrades the anonymous local account in place — nothing is lost.
 */
export function useAuth() {
  const auth = usePassphraseAuth({ wordlist });
  const isAuthenticated = useIsAuthenticated();
  const logOut = useLogOut();
  return { ...auth, isAuthenticated, logOut };
}

export function normalizePassphrase(input: string): string {
  return input.trim().toLowerCase().split(/\s+/).join(" ");
}

/** Word-level validation so we can reject a typo before Jazz throws. */
export function unknownWords(passphrase: string): string[] {
  const known = new Set(wordlist);
  return normalizePassphrase(passphrase)
    .split(" ")
    .filter((word) => word.length > 0 && !known.has(word));
}
