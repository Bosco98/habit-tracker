# Design

Mood: **"morning sun on soft clay"** — a molded, tactile surface warmed by amber light; optimistic, calm, physical. Neumorphic soft-UI done with discipline: depth in shadows, contrast in ink.

## Color

Strategy: **Restrained** (product register) — clay-neutral surfaces + amber primary ≤10% of the surface + aubergine accent for social/competitive moments.

All colors OKLCH. The surface is tinted because the material IS the brand (neumorphism), earning the tinted-bg exception.

### Light (default)

```css
--background: oklch(0.945 0.008 91);   /* soft clay */
--well:       oklch(0.915 0.010 91);   /* recessed wells (inputs, tracks) */
--foreground: oklch(0.24 0.012 91);    /* ink — ≥10:1 on bg */
--muted-foreground: oklch(0.47 0.014 91); /* ≥4.5:1 on bg */
--primary:    oklch(0.80 0.155 88);    /* amber/honey — dark ink text on fills */
--primary-strong: oklch(0.68 0.14 80); /* deep honey for icons/strokes on bg */
--accent:     oklch(0.42 0.115 320);   /* aubergine — white text on fills */
--destructive: oklch(0.55 0.19 25);
--shadow-dark:  oklch(0.78 0.025 91);  /* neu shadow, lower-right */
--shadow-light: oklch(1 0 0);          /* neu highlight, upper-left */
```

### Dark

```css
--background: oklch(0.235 0.010 91);   /* charcoal clay */
--well:       oklch(0.205 0.010 91);
--foreground: oklch(0.93 0.008 91);
--muted-foreground: oklch(0.70 0.010 91);
--primary:    oklch(0.80 0.155 88);    /* amber stays amber */
--primary-strong: oklch(0.82 0.15 88);
--accent:     oklch(0.72 0.11 320);    /* lifted aubergine */
--shadow-dark:  oklch(0.15 0.010 91);
--shadow-light: oklch(0.32 0.012 91);
```

Rules:
- Amber fills (pale, L 0.80) carry **dark ink text**; aubergine fills carry **white text**.
- Depth is never the only affordance — pressed states pair with icon/label change.
- Semantic states: success = pressed-in + primary-strong check; error = `--destructive` text + icon, never a red glow.

## Material (the neumorphic system)

Three elevations, one material. Elements share the background color; depth comes only from dual shadows.

```css
/* raised — resting interactive elements (cards, buttons) */
.neu-raised  { box-shadow: -5px -5px 12px var(--shadow-light), 5px 5px 12px var(--shadow-dark); }
/* pressed — active/done states (checked-in habit, active tab) */
.neu-pressed { box-shadow: inset -4px -4px 8px var(--shadow-light), inset 4px 4px 8px var(--shadow-dark); }
/* well — recessed containers (inputs, progress tracks, day strip) */
.neu-well    { box-shadow: inset -2px -2px 5px var(--shadow-light), inset 2px 2px 5px var(--shadow-dark); }
```

- Blur ≤ 12px, offset ≤ 6px — soft but crisp; never the 30px mush of 2020 neumorphism.
- Cards radius 16px; circular check buttons; pills for chips/tags. Nothing above 16px on rectangles.
- No borders on neumorphic elements (shadows are the edge); 1px hairline `--shadow-dark` allowed on flat lists only.
- Focus-visible: 2px ring in `--primary-strong`, offset 2px — always visible, never replaced by depth.

## Typography

One family: **Geist Variable** (installed) for everything — headings, labels, data, body.

- Fixed rem scale, ratio ~1.2: 12 / 14 (base) / 17 / 20 / 24 / 34 (streak numbers, tabular-nums).
- Streak/duel numbers: weight 650, `font-variant-numeric: tabular-nums`.
- Labels: weight 500; body: 400; no letter-spacing tricks below 20px.

## Motion (GSAP)

Motion conveys state; 150–250ms; `ease-out` exponential family (`power3.out`/`expo.out`). No bounce, no elastic.

- **The press**: check-in transitions raised→pressed, ~180ms, with a 0.97 scale dip. The signature interaction.
- **Streak tick**: number rolls up (GSAP counter) + a single flame pulse ≤400ms. Milestones (7/30/100) get a one-shot particle burst — the only celebration moment.
- **List changes**: FLIP-style reorder/enter, 200ms, stagger ≤40ms.
- No page-load choreography. Content is visible by default; motion enhances, never gates.
- `prefers-reduced-motion`: all of the above become instant state swaps or ≤120ms crossfades.

## Layout

- Mobile-first single column, max-w-lg centered; bottom nav (Home · Insights · Circle) as a raised neu bar.
- Day strip: horizontal well with 7 pressable day pucks.
- Density: comfortable on Home (thumb targets ≥44px), denser on Insights.
- Spacing rhythm: 4-based scale; sections separated by space, not dividers.

## Components

- **Habit card** (molecule): raised pill-card — emoji puck, name, streak flame + tabular number, kind-specific control on the right (check puck / stepper / timer).
- **Check puck** (atom): 52px circle, raised→pressed on done; icon swaps ○→✓.
- **Day puck** (atom): date in the day strip; today ringed in primary-strong; selected = pressed.
- **Chips** (atom): soft-signal metadata (`backfilled`, `edited`, `11:58pm`) — muted pill, never red.
- **Recap card** (organism, M4): screenshot-worthy weekly duel summary — the one place accent aubergine gets to be Committed.
- Skeletons for remote/partner data; personal data never shows loading states.
