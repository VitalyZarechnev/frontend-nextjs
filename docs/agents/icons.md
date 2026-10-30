# SVG Icons

> Conventions for storing and using inline SVG icons across the UI.

## TL;DR

- All SVG files live in `/src/ui/icons/`.
- A **static, reusable glyph** (chevron, arrow, logo) → an asset in `/src/ui/icons`, imported via SVGR. Never define it as an inline `function XIcon() { return <svg>…</svg> }` inside a `.tsx`, and never duplicate the same glyph across components — extract it to one `.svg`.
- Rotate/animate it from the consumer via a CSS class (e.g. a `_open` modifier that applies `transform: rotate(180deg)`), not by editing the asset.
- SVGs are imported as React components via `@svgr/webpack` (configured in `next.config.ts` + `turbopack.rules`).
- No fixed `width`/`height` — scale from the parent. Use `currentColor` in the asset; set the **actual color on the icon's class at the usage site** (the consuming component's SCSS), never baked into the SVG.
- **Prefer vector (SVG).** Raster formats (PNG/JPG/WebP/…) are a last resort, only when the asset genuinely isn't vector (e.g. a photograph). See [figma.md](./figma.md).
- A **composite SVG visualization** that computes geometry/animation from props is a genuine component and stays in the UI layer. Keep its path data / geometry utils in a co-located `*.ts` (see [structure.md](./structure.md)), not inline in the component.

## Pattern

```tsx
import CrossSmallIcon from '@ui/icons/cross-small.svg';

<CrossSmallIcon />              // sized by parent
<CrossSmallIcon className='…' /> // styled via parent class
```

The SVG file must:

```xml
<!-- ✅ Good -->
<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="..." stroke="currentColor" fill="currentColor" />
</svg>
```

```xml
<!-- ❌ Bad -->
<svg width="24" height="24">                  <!-- fixed size, won't scale -->
  <path d="..." stroke="#000000" />            <!-- hardcoded color -->
</svg>
```

## Why these constraints

- `currentColor` + variable sizing makes one SVG asset reusable across themes, states (hover/disabled), and contexts (buttons, badges, headers).
- `viewBox` without fixed `width`/`height` lets the parent CSS control sizing — keeps icon sizing in the styling layer, not the asset.
- SVGR's `removeViewBox: false` (set in `next.config.ts`) ensures `viewBox` survives optimization. Don't remove that option.

## Anti-patterns

```tsx
// ❌ Don't load SVGs as <img src='...'> — loses color/animation control
<img src='/icons/cross.svg' alt='close' />;

// ❌ Don't inline SVG markup in TSX — breaks reuse and bloats components
return <svg viewBox='0 0 24 24'>...</svg>;

// ❌ Don't add a per-icon wrapper component — SVGR already gives you one
function CrossIcon() {
  return <CrossSmallIcon />;
} // pointless
```

## See also

- [ui.md](./ui.md) — icons tier in atomic design and how atoms/molecules consume them.
- [figma.md](./figma.md) — exporting assets from Figma (SVG over raster).
- `next.config.ts` — SVGR loader config for webpack and Turbopack.
