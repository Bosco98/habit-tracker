# Design

Mood: **neobrutalist punch card** — pure white stock, a hard black rule, a row
of bars you fill in by hand. Loud, flat, physical. The app counts days; the
card *is* the count.

Three attempts were rejected before this one. Neumorphism (too soft, too
generic), then the same neobrutalist material in a clay/amber palette — twice —
which read as brown and yellow. The material was never the problem; the colour
was.

## Color

**Pure black on white, electric accents.** Every neutral is chroma 0.

The clay/amber scheme from the first three attempts was rejected outright — a
warm-tinted background plus an amber primary reads as **brown and yellow**, not
neobrutalism. Do not reintroduce warm neutrals or yellow anywhere.

### Light (default)

```css
--background: oklch(0.96 0 0);   /* off-white field */
--card:       oklch(1 0 0);      /* pure white stock */
--foreground: oklch(0.15 0 0);
--muted-foreground: oklch(0.45 0 0);
--line:       oklch(0 0 0);      /* pure black rule / card edge */
--stock-shadow: oklch(0 0 0);    /* hard offset, no blur */
--hole:       oklch(0.92 0 0);
```

### Dark

```css
--background: oklch(0.17 0 0);
--card:       oklch(0.24 0 0);   /* clearly lifted, so black shadow reads */
--foreground: oklch(0.97 0 0);
--line:       oklch(1 0 0);      /* pure white rule */
--stock-shadow: oklch(0 0 0);    /* stays black in both themes */
--hole:       oklch(0.14 0 0);
```

### Habit hues

Colour blocking is the style, not an accent. Six flat, electric hues, identical
in both themes; each habit takes one **by list position** (a hash collides, and
two neighbouring cards in one colour reads as a bug).

```css
--hue-blue:   oklch(0.72 0.17 250);
--hue-pink:   oklch(0.75 0.19 350);
--hue-lime:   oklch(0.87 0.22 130);
--hue-violet: oklch(0.72 0.18 300);
--hue-red:    oklch(0.70 0.20 25);
--hue-cyan:   oklch(0.82 0.14 200);
--on-hue:     oklch(0.12 0 0);
```

All six sit at L ≥ 0.70 so they always carry `--on-hue` near-black ink — text
contrast never depends on which colour a habit drew. A habit's hue drives its
header band, streak numeral, filled bars, today marker and done button.

Rules:
- The ink rule is the edge. No element relies on a shadow to be legible.
- Anything on a colour band **inherits** its ink; `text-muted-foreground` on a
  band vanishes in dark mode.
- Errors are `--destructive` text and icon, never a coloured glow.

## Material

Neobrutalist: three primitives, all flat, none blurred.

```css
/* stock — a card sitting on the table */
.stock      { background: var(--card); border: 2px solid var(--line);
              box-shadow: 4px 4px 0 var(--stock-shadow); }
/* pressing it down onto its own shadow is the interaction */
.stock-press-active { transform: translate(4px, 4px); box-shadow: 0 0 0; }
/* tear — the dashed rule across a ticket */
.tear       { border-top: 2px dashed var(--line-soft); }
```

- **Blur is 0 everywhere.** Depth is a second sheet behind the first, not fog.
- Radius: cards 12px, chips/pills full, holes full. Nothing above 16px.
- Every card carries a **2px ink border** — never a border plus a soft shadow.

- Cards get a **±0.5° tilt** derived from their position, so a list reads as
  cards dropped on a table rather than rows in a grid. Tilt is suppressed on
  hover and for `prefers-reduced-motion`.
- Focus-visible: 2px ring in `--primary-strong`, offset 2px.

### Dark mode is the same material, not a muted one

Shipped wrong once: a mid-grey border with a shadow barely darker than the
background makes the hard offset **invisible** and the edges soft — generic dark
UI, not neobrutalism. In dark the line goes **pure white** and the shadow stays
**pure black**, which only reads because `--card` (0.24) sits clearly above
`--background` (0.17). Never soften either to make dark "calmer".

## The punch strip

The signature element, and the reason the material fits the product.

A habit shows **30 bars — one per retained day**, oldest left, today right.
The 30-day retention window isn't a setting buried in preferences; it's the
literal width of the card.

These were 10px circles at 0.3 opacity in the first cut and read as a dotted
divider. They only became data as full-height bars (`h-7`) with 2px rings.

| State | Rendering |
|---|---|
| Done | filled in the habit's hue, 2px ink ring |
| Partial (count/timer under goal) | hue mixed 50% toward `--hole` |
| Due, not done | `--hole` fill, 2px ink ring |
| Not due (off-cadence) | ink ring only, `--line-soft` |
| Before the habit existed | a baseline tick (`scaleY(0.14)`), not an empty cell |
| Today | extra 2px ring in the habit's hue |

A logged day always shows as filled, even off-cadence — bonus effort is a fact,
and hiding it made the strip look broken.

## Typography

One family: **Geist Variable**.

- Scale: 11 / 14 (base) / 17 / 20 / 28 / 52 (streak numerals).
- Streak numbers: weight 900, `tabular-nums`, tracking −0.03em. Never tighter
  than −0.04em.
- Card titles and buttons: **uppercase, weight 800**. Labels: 600. Body: 400.
- Body copy capped at 65ch.

## Language

No dates, ever. Days are named relatively — "Today", "Yesterday", "4 days ago" —
and cadence reads as "Every 3 days". A streak is a count of **due days**, not a
count of calendar days.

## Motion (GSAP)

Motion conveys state; 140–260ms; `expo.out` / `power3.out`. No bounce.

- **The punch**: the button translates onto its shadow (140ms) while the day's
  bar fills. The signature interaction.
- **Streak tick**: the numeral rolls up (GSAP counter). Milestones (7/30/100)
  get one confetti-free stamp pulse — the only celebration.
- **Card entry**: staggered ≤40ms, translate 8px + fade. Content is visible by
  default; motion never gates it.
- `prefers-reduced-motion`: all of the above collapse to instant state swaps.
