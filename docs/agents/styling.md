# Styling

> SCSS module conventions, shared partials, and how `@assets/*` resolution works.

## TL;DR

- **SCSS modules everywhere.** One `*.module.scss` next to each component. No global stylesheets.
- **One module per component — never a shared "kitchen-sink" module.** A component imports only its own `*.module.scss`; it must not reach into a sibling's or a parent's module for classes.
- Shared partials live under `/src/assets/` (`styles/`, `mixins/`) and are imported via the `@assets/*` alias.
- Use `@use '@assets/...' as *;` — never `@import`. `@import` is deprecated in Dart Sass and namespaces conflict.
- Theme colors and dimensions come from CSS variables / tokens (`var(--bg-message-input)`, `var(--text-secondary)`, …) defined globally — don't hardcode hex codes. When implementing a design, always map its colors to tokens; if a color has **no token**, flag it (the palette may need one) rather than pasting a raw hex. See [figma.md](./figma.md).

## `@assets/*` alias

SCSS doesn't understand TS path aliases natively. Resolution is wired in `next.config.ts`:

- **Webpack** (`npm run build` on the server side) — via `config.resolve.alias['@assets']`.
- **Turbopack** (`npm run dev`) — via `turbopack.resolveAlias['@assets']`.
- **Legacy `loadPaths`** — `sassOptions.includePaths` points at `src/` as a fallback.

If you add another alias, mirror it across both `webpack` and `turbopack` blocks — otherwise dev and prod diverge.

## File anatomy

```scss
// src/ui/atoms/text-field/TextField.module.scss
@use '@assets/mixins/hover' as *;
@use '@assets/styles/breakpoints' as *;

.text_field {
  &__container {
    position: relative;
  }

  &__input {
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-message-input);
    border: 1px solid var(--bg-message-input);

    @include hover {
      border-color: var(--accent);
    }

    @include media-sm {
      padding: 10px 14px;
    }
  }
}
```

Conventions:

- **BEM-like** class names: `block`, `block__element`, `block_modifier_value`. Combined via `clsx` in the TSX.
- **Snake_case** for both blocks and elements (not kebab) — matches the SCSS module accessor style (`classes.text_field__input`).
- One `block` root per file; nested elements use `&__...`, modifiers use `&_..._...`.

## One module per component

Each component owns exactly one `*.module.scss` sitting next to it, and imports only that file. Do **not** collect the styles of several components into one module and have each of them import it — the module stops being co-located with its markup, class names collide, and dead classes accumulate unnoticed.

```
✅  features/bank/Home.tsx      → import './Home.module.scss'
    features/bank/Card.tsx      → import './Card.module.scss'
    features/bank/ui/Badge.tsx  → import './Badge.module.scss'

❌  features/bank/Home.tsx      ┐
    features/bank/Card.tsx      ├→ all import './Bank.module.scss'
    features/bank/Analytics.tsx ┘
```

A parent/shell module (e.g. `Bank.module.scss`) holds only the layout of the shell itself (the frame, tab bar, screen stage) — never the styles of the screens it renders. Genuinely shared, reusable styling belongs in a shared UI component with its own module, or in an `@assets/*` partial — not in a grab-bag module that unrelated components import.

## Anti-patterns

```scss
/* ❌ Global selectors leak across components */
button {
  background: red;
}

/* ❌ @import — deprecated; namespaces collide */
@import '@assets/mixins/hover';

/* ❌ Hardcoded colors instead of CSS variables */
.input {
  background: #f5f5f5;
}

/* ❌ Mixing CSS-in-JS / inline-styles for layout */
/* (see ui.md anti-patterns) */
```

## See also

- [code-style.md](./code-style.md) — how SCSS modules pair with TSX components.
- `next.config.ts` — the resolver wiring.
- `/src/assets/` — actual shared partials (`mixins/hover.scss`, `styles/breakpoints.scss`, etc.).
