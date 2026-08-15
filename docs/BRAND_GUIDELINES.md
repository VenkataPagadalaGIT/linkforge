# venkatapagadala.com Brand & Accessibility Guidelines

One rule above all: **everyone can read everything, in both themes.** Every
other rule here exists to make that automatic rather than aspirational.
These rules are enforced by `scripts/check-brand.py`, which runs inside
`scripts/preflight-deploy.sh`. A violation fails the deploy.

## Color system

Tokens live in `app/globals.css` and are visually cataloged at `/brand`
(internal page, noindex). Components use tokens, never raw hex, so both
themes stay coherent.

| Role | Token | Notes |
|---|---|---|
| Body text | `text-foreground` | Full strength. |
| Secondary text | `text-muted-foreground` | Full strength. |
| Tertiary text | `text-muted-foreground/70` | **The floor for anything a person is meant to read.** Measured 5.0:1 on white, 7:1 on the dark background. |
| Decorative only | opacities below /70 | Borders, hairlines, backgrounds, watermarks. Never words that carry meaning. |

## Accent colors carry a theme pair, always

Pale accent shades (the `-200`/`-300` range) are dark-theme colors. On white
they measure as low as 1.4:1, which is invisible. The `-700` shade of every
hue clears 4.5:1 on white. So an accent on text is always written as a pair:

```
text-amber-700 dark:text-amber-300     (chokepoints, warnings)
text-sky-700   dark:text-sky-300       (dependency "feeds" direction)
text-emerald-700 dark:text-emerald-300 (success, free, live)
```

Never `text-amber-300` alone on a text element. The checker flags it.

## Contrast standards (WCAG 2.1 AA)

- Normal text: **4.5:1** minimum against its effective background.
- Large text (24px+, or 18.66px+ bold): **3:1** minimum.
- These apply per theme. A color that passes only in dark mode fails.

## Writing

- **No em dashes** in any copy, ever: page prose, notes, metadata, OKF files.
  Use a colon, a comma, or a new sentence.
- Numbers that describe the corpus are derived from data, never typed into
  copy. `scripts/okf_attest.py` fails the deploy when a stated count drifts.
- Labels say what a first-time visitor needs: "3 conferences, 91 talks"
  beats "Conference Notebook" alone.

## Badges

- `[3D]` marks the medium on menu items and cards. It is a badge next to the
  label, never a category of its own.
- `NEW` marks recent arrivals and comes off after a few weeks.

## Canvas and WebGL text

Text drawn into a canvas is invisible to DOM audits. Any change to canvas
copy or the counts feeding it gets a screenshot check, both themes, before
ship. (History: a shelf caption advertised "25 WEEKS" through a 35-marker
verification pass that could not see it.)

## Enforcement

- `scripts/check-brand.py` scans `src/` and `app/` for: pale accent text
  without a `dark:` partner, and readable text below the /70 floor.
  Exceptions require an entry in `scripts/brand-exceptions.txt` with a
  reason.
- `scripts/check-links.py` enforces that every named link lands on what it
  names (anchors present, no homepage no-ops, label matches destination).
- Both run in preflight; both fail the deploy on violation.
