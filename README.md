# Habits

A local-first, end-to-end encrypted habit tracker you can share with your people.

No accounts on a server, no password, no analytics. Your identity is a keypair on your
device; your data lives in IndexedDB and syncs as ciphertext. Track alone, or share
habits with a partner or a small circle and let the weekly duel sort out who buys coffee.

## How it works

- **Identity** — an account is a keypair generated on-device. The recovery phrase is its
  human-carryable form; it's the only way in, and nobody else has a copy.
- **Sync** — [Jazz](https://classic.jazz.tools) CoValues over Jazz Cloud. The sync server
  only ever sees encrypted blobs. Works fully offline; changes reconcile on reconnect.
- **Sharing** — a *circle* is a CoMap owned by its own Jazz Group. Membership in the group
  *is* membership in the circle. Invite links carry the secret in the URL fragment, so it
  never reaches a server.
- **Shared habits** — one habit, one `CoFeed` of check-ins, one stream per member. Personal
  and shared habits are the same shape; only the owner differs.

## Habits

Three kinds — **check**, **count** (8 glasses), **timer** (20 minutes) — each on a schedule:
daily, specific weekdays, or N times a week.

Streaks are **strict**: miss a scheduled day and it's gone. Unscheduled days aren't misses,
and a still-pending today is graced rather than counted against you. Shared habits also
carry a *combined* streak that survives only while **everyone** delivers.

There's no verification and no policing. Check-ins carry honest metadata instead —
`backfilled`, `edited`, `late night` — shown as quiet chips. Trust is the mechanic.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # unit tests (day math, streaks, duels, insights)
pnpm build        # typecheck + production build + service worker
pnpm e2e          # browser walkthrough against a running dev server
pnpm desktop      # Electron desktop app (Vite + Electron, one command)
pnpm desktop:build # package .dmg / .exe / AppImage
```

`pnpm e2e` drives two independent accounts through sign-up, invite, shared check-ins,
reactions and phrase-based device restore. `pnpm e2e:desktop` boots the packaged
Electron app and checks data survives a restart. Both write to `e2e-shots/`.

### Desktop notes

The shell serves the build over a custom `app://` scheme rather than `file://` — an
opaque `file://` origin makes IndexedDB evictable, and for a local-first app that is
data loss. It runs a strict CSP (no `unsafe-inline`; `wasm-unsafe-eval` for Jazz's
crypto core), with `contextIsolation` on and `nodeIntegration` off.

If you launch from a VS Code terminal, note that it exports `ELECTRON_RUN_AS_NODE=1`;
`electron/dev.js` strips it, otherwise Electron boots as plain Node and no window opens.

### Stack

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · GSAP · `jazz-tools` · Electron

### Layout

```
src/
  data/        the only place jazz-tools is imported — schema, mutations, derivations
  lib/         pure logic, fully unit-tested (days, streaks, duels, insights)
  components/  atoms → molecules → organisms
  routes/      home · circles · circle detail · insights
```

Product intent lives in [PRODUCT.md](PRODUCT.md); the visual system in [DESIGN.md](DESIGN.md).

## Deploy

Pushing to `main` builds and publishes to GitHub Pages. Set `VITE_JAZZ_API_KEY` to your own
[Jazz Cloud](https://dashboard.jazz.tools) key, or point `syncPeer` at a self-hosted
`npx jazz-run sync` — the sync layer is MIT and replaceable.
