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
pnpm e2e          # two-account walkthrough against a running dev server
pnpm e2e:webkit   # production build in WebKit under the real desktop CSP
pnpm desktop      # Tauri desktop app (needs Rust)
pnpm desktop:build # package .dmg / .msi / AppImage
```

`pnpm e2e` drives two independent accounts through sign-up, invite, shared check-ins,
reactions and phrase-based device restore. `pnpm e2e:webkit` covers what Chromium
can't: it serves `dist/` with the CSP read straight out of `tauri.conf.json` into
Playwright's WebKit — the same engine family as the WKWebView the desktop app runs in.
Both write screenshots to `e2e-shots/`.

### Desktop

Tauri v2, so the app uses the OS webview instead of bundling a browser: the macOS
build is a **4 MB DMG**. Electron was built first and dropped — its runtime alone is
297 MB, which is indefensible for an app this size.

The one non-obvious constraint: Jazz fetches its WASM crypto core from a `data:` URL,
so the CSP needs `data:` in **connect-src**, not just `wasm-unsafe-eval` in
`script-src`. Without it the window renders blank. There's no `unsafe-inline`
anywhere — the theme-flash script lives in `public/theme-init.js` for that reason.

### Bundle

`build/externalize-wasm.ts` swaps cojson's base64 `data:` WASM module for the real
`.wasm` binary it ships alongside. The loader only does `fetch(data)`, so a real
asset URL is a drop-in — and it takes the sync chunk from 1,176 KB to 583 KB
(420 → 153 KB gzipped), streams to the WASM compiler, and caches on its own.
Routes past Home are lazy-loaded.

### Stack

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui · GSAP · `jazz-tools` · Tauri v2

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
