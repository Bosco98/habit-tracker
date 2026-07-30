# Product

## Register

product

## Users

Individuals building daily habits **together** — pairs (partners, best friends, siblings) and small circles who hold each other accountable. They open the app for ~30 seconds, 1–3× a day (morning coffee, post-gym, before bed), usually on a phone. Secondary surface: desktop (Tauri) for the always-on tray peer and deeper insights. They chose this app because their data is theirs: local-first, E2E-encrypted, no server reading their life.

## Product Purpose

A local-first, E2E-encrypted habit tracker with two habit types — personal and shared (mirrored across a circle). Accounts are keypairs with recovery phrases; sync rides encrypted through Jazz. Success = the daily check-in feels *physically satisfying*, partner data is always fresh, and keeping a habit alongside people you know keeps you coming back for months. A circle is a shared shelf of habits, **not a competition**: no scoring, no rounds, nobody wins.

## Brand Personality

**Tactile · Honest · Companionable.** The UI is soft molded material you press — checking in feels like pushing a real button that stays pressed. Numbers never lie (strict streaks, soft-signal metadata instead of policing). Between friends it's company, not rivalry — you see what everyone is doing and cheer it, and the app never declares a winner.

## Anti-references

- Generic SaaS dashboard: KPI tile grids, gradient heroes, card-grid-of-identical-cards.
- Duolingo's guilt machine: no nagging mascots, no manipulative streaks-anxiety popups.
- Crypto/web3 aesthetic: we use keypairs, but never look like a wallet.
- Classic 2020 neumorphism-gone-wrong: low-contrast gray-on-gray where nothing is readable.

## Design Principles

1. **Press it in.** State is physical: done = pressed-in surface, not a green checkmark slapped on. Every interactive element has a tactile depth state.
2. **Soft surfaces, hard contrast.** Neumorphic depth lives in shadows only; text and icons always hit WCAG AA. Readability is never sacrificed to the material.
3. **The number never lies.** Strict streaks, honest metadata (backfilled/edited chips). Trust is the product; the UI never fudges.
4. **Friends are the feature.** Shared surfaces (the circle shelf, the activity feed, reactions) get first-class craft. Comparison shows what everyone is doing; it never ranks them.
5. **Sync is invisible.** Local-first means zero spinners for your own data; partner freshness shows quietly (relative timestamps), never modally.

## Accessibility & Inclusion

WCAG 2.1 AA: body text ≥4.5:1, large text ≥3:1, full keyboard navigation, visible focus rings (never removed for aesthetics). Every animation has a `prefers-reduced-motion` alternative (crossfade or instant). Depth states are never the only signal — pressed states pair with an icon/label change. No color-only meaning (streak and cadence states carry icons + text).
