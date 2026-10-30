# Design-to-code (Figma)

> How to translate a Figma design into code: match it precisely, put reusable pieces in the right layer, reuse the design system, and use tokens. When in doubt, ask.

## TL;DR

- **Be precise.** Every gap, padding, size, radius, font weight/size, line-height, and color must match the design. Don't approximate.
- **Ask when the design is ambiguous or incomplete** — missing states (hover/disabled/empty/error), unclear responsive behavior, or values you can't read. A quick question beats a wrong guess.
- **Reusable, business-agnostic pieces go to `/src/ui`** (Button, Modal, Card, Table, …). Business-specific composition goes to `/src/features`.
- **Reuse the design system.** If a base component already exists, use it. If the design needs a variant it doesn't have, **don't fork it inside a feature** — ask, then add the variant to (or update) the base component.
- **Use color tokens.** If tokens/CSS variables exist for a color, always use them — never hardcode hex. If the design uses raw colors with no token, **flag it** rather than hardcoding silently.
- **Export SVG.** Vector assets come out as SVG (see [icons.md](./icons.md)). Raster formats (PNG/JPG/WebP/…) are a last resort, only when the asset is genuinely not vector (e.g. a photograph).

## Precision

Transfer the layout exactly:

- Spacing: gaps, paddings, margins — use the design's actual pixel values (via `Flex gap`, SCSS, tokens).
- Sizing: widths, heights, min/max, border radius.
- Typography: family, weight, size, line-height, letter-spacing — prefer existing typography atoms.
- Color: fills, strokes, shadows — via tokens (see below).
- States: build every state the design shows (default, hover, active, disabled, loading, empty, error).

If any of these is missing from the design or unreadable, ask before inventing a value.

## Where a component belongs

| The piece is…                                                    | Put it in…                         |
| ---------------------------------------------------------------- | ---------------------------------- |
| Reusable and free of business logic (Button, Modal, Card, Tabs)  | `/src/ui` (atom/molecule/organism) |
| Reusable **structure** only (grid, centered card, sidebar shell) | `/src/ui/layouts`                  |
| Tied to a domain entity or use-case (a specific form, a widget)  | `/src/features`                    |
| A whole route/screen composition                                 | `/src/views`                       |

Rule of thumb: **if it doesn't depend on business logic, it belongs in `/src/ui`.** Make reusable components global rather than trapping them inside one feature. See [ui.md](./ui.md) and [structure.md](./structure.md).

## Base-component mismatch

When a Figma component looks like an existing base component but has styles/variants the code version lacks (e.g. a new Button color, a new size):

- **Do not** reimplement the component from scratch inside the feature.
- **Do** ask — then either add a new `variant` to the existing base component, or update it to cover the new design.

```tsx
// ❌ Figma shows a new "danger" button → new bespoke button inside a feature
function DeleteButton() {
  return <button className={styles.myDangerButton}>Delete</button>;
}

// ✅ Add the variant to the base atom, then use it
<Button variant='danger'>Delete</Button>;
```

This keeps one source of truth per component and prevents divergent copies.

## Color tokens

- Colors are theme CSS variables (`var(--…)`) defined globally; see [styling.md](./styling.md).
- If the Figma color maps to a token, use the token. Never paste a hex value.
- If the design has no token for a color (raw hex not in the palette), **flag it** — the palette may need a new token, or the design may be off. Don't hardcode to move on.

```scss
/* ✅ */
background: var(--bg-modal);
/* ❌ */
background: #222731;
```

## See also

- [ui.md](./ui.md) — tiers and the reusable-vs-feature boundary.
- [styling.md](./styling.md) — CSS variables / tokens, SCSS modules.
- [icons.md](./icons.md) — SVG import pipeline and `currentColor`.
- [structure.md](./structure.md) — where reusable pieces live vs feature-local ones.
