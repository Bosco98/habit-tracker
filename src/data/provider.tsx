import { JazzReactProvider } from "jazz-tools/react";
import { AppAccount } from "./schema";

const apiKey = import.meta.env.VITE_JAZZ_API_KEY ?? "bosco98123@gmail.com";
const syncPeer = `wss://cloud.jazz.tools/?key=${apiKey}` as const;

/**
 * Single entry point for the sync/persistence layer.
 * Anonymous-first: a local account is created on first visit and data stays
 * on-device (IndexedDB) until the user signs up — then sync turns on.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      sync={{ peer: syncPeer, when: "signedUp" }}
      AccountSchema={AppAccount}
    >
      {children}
    </JazzReactProvider>
  );
}
