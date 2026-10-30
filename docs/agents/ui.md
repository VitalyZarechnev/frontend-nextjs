# UI Layer

> Atomic-design conventions for `/src/ui/**`. Components here are presentational only — no business logic, no data fetching.

## TL;DR

- Six tiers under `/src/ui/`: `atoms/`, `molecules/`, `organisms/`, `layouts/`, `transitions/`, and `icons/` (see [icons.md](./icons.md)).
- One folder per component: `Component.tsx` + `Component.module.scss` when styled. `transitions/` and `icons/` are flat exceptions (see below).
- **No business logic, no datasource/use-case imports, no app state** in `/src/ui`. UI depends only on `/src/utils/` (and rarely Domain enums/models — justify in the PR). (A feature's own `ui/` segment _may_ hold business logic — that's not this layer; see [structure.md](./structure.md).)
- Class composition: `clsx`. SCSS modules everywhere — never global stylesheets or inline styles for layout.
- **Forms** follow one pattern — atom → molecule → `Form` → feature; feature and atom code never touch `useFormContext`. Full rules: [forms.md](./forms.md).
- **Features** and **views** live outside `/src/ui/`; they compose UI tiers and own business logic and route-specific screens (see [architecture.md](./architecture.md)).

## Atomic design tiers

Use the smallest tier that fits. Promote upward only when the piece is reused as a stable, presentational unit.

| Tier            | Path                     | Role                                                                                                                                                                                                                   | Examples in this repo                                                  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Icons**       | `icons/*.svg`            | Static SVG assets imported as React components via SVGR. No TSX wrapper per icon.                                                                                                                                      | `cross-small.svg`, `arrow-back.svg` — rules in [icons.md](./icons.md). |
| **Atoms**       | `atoms/<name>/`          | Single-purpose, indivisible controls and primitives. No composition of other UI tiers except icons.                                                                                                                    | `Button`, `TextField`, `Flex`, `Heading`, `IconButton`.                |
| **Molecules**   | `molecules/<name>/`      | Small compositions of atoms (and icons) with one focused interaction pattern. Still domain-agnostic.                                                                                                                   | `Form`, `FormTextField`, `FormPhoneTextField`.                         |
| **Organisms**   | `organisms/<name>/`      | Larger presentational sections: multiple molecules/atoms arranged into a recognizable UI block (toolbar, modal chrome, empty state shell, card header/footer). No stores, hooks that fetch/mutate, or route awareness. | _(add when a dumb section is reused across features)_                  |
| **Layouts**     | `layouts/<name>/`        | Reusable page **structure** only: regions, grids, slots (`children`), max-width, padding. No copy tied to a route, no feature imports.                                                                                 | _(add when the same shell is shared across views)_                     |
| **Transitions** | `transitions/<Name>.tsx` | Animation primitives (enter/exit, collapse). Wrap content; no layout opinions beyond `className`. Flat folder, no SCSS module unless needed.                                                                           | `Fade`, `Collapse` (Framer Motion).                                    |

### Icons

- All SVGs live in `/src/ui/icons/`. Import as components; `currentColor`, no fixed `width`/`height`.
- Atoms and molecules **use** icons; they do not live inside atom folders.
- Full rules: [icons.md](./icons.md).

### Atoms

- One concern per atom folder (e.g. `button/`, `text-field/`, `typography/`).
- Props express visual/behavioral variants only (`variant`, `disabled`, `loading`), not domain entities (`userId`, `orderStatus`).
- May use `'use client'` when interactivity or browser APIs require it; default to server components when possible.

### Molecules

- Compose atoms (and icons) into a reusable pattern (label + field + error, form provider + fields).
- May depend on a **generic** third-party UI hook/library only when the molecule’s job is to encapsulate it for the rest of the app (e.g. `Form` + `react-hook-form`). Features must not call `useFormContext` on raw atoms — use the form molecules.

### Overlays (modals, drawers)

- The base overlay (e.g. a `Modal`) is a **presentational UI component** — it renders backdrop + container + close affordance and knows nothing about any feature.
- **Visibility is controlled from outside.** It takes `open` (a boolean value) and `onClose` (a callback); the **owner** — a feature or view — holds that open state and passes both down. The overlay never owns whether it is shown.
- A feature builds its content _on top of_ the base overlay (e.g. a `CreatePost` feature renders its form inside `Modal`), but the `open`/`onClose` still come from whoever renders the feature.

### Organisms

- Group molecules and atoms into a section that could appear on multiple screens **unchanged** except via props/slots (`children`, `header`, `footer`).
- Still **no** business logic: no `createDatasource` / `createUsecase`, no MobX, no feature-specific copy baked in unless passed as props.
- If the block needs domain state, API calls, or use-cases → it belongs in `/src/features/`, not `/src/ui/organisms/`.

### Layouts

- Define **where** content sits (columns, centered auth card, sidebar + main), not **what** business data fills it.
- Prefer slot-style APIs (`children`, named optional regions) over importing features or views.
- Route-specific titles, wiring, and feature composition → `/src/views/` (a route view composing its feature(s) + atoms). Reuse the same `layouts/*` across views when the chrome matches.

### Transitions

- Shared motion wrappers used by atoms, molecules, organisms, features, or views.
- Keep animation timing/variants inside the transition component; callers pass `isVisible`, `className`, and children.
- Do not embed business rules or conditional copy in transitions.

### Boundary with features and views

| Layer        | Location             | Atomic analogue          | Owns                                                                 |
| ------------ | -------------------- | ------------------------ | -------------------------------------------------------------------- |
| UI organisms | `/src/ui/organisms/` | Organism (dumb)          | Reusable section chrome and layout of atoms/molecules                |
| Features     | `/src/features/`     | Smart organism/widget    | Business UI, hooks, stores, use-cases                                |
| UI layouts   | `/src/ui/layouts/`   | Template shell (generic) | Reusable structural grid/regions                                     |
| Views        | `/src/views/`        | Page instance            | One screen per route; composes features + UI; route copy and spacing |

## Folder layout

```
src/ui/
├── atoms/
│   ├── button/{Button.tsx, Button.module.scss}
│   ├── flex/{Flex.tsx, Flex.module.scss}
│   ├── text-field/{TextField.tsx, TextField.module.scss, PhoneTextField.tsx, ...}
│   ├── typography/{Heading.tsx, Content.tsx, ...}
│   └── ...
├── molecules/
│   └── form/{Form.tsx, FormTextField.tsx, FormPhoneTextField.tsx}
├── organisms/          # presentational sections (when shared)
│   └── <name>/{Component.tsx, Component.module.scss}
├── layouts/            # reusable structural shells (when shared)
│   └── <name>/{Layout.tsx, Layout.module.scss}
├── transitions/{Fade.tsx, Collapse.tsx}
└── icons/*.svg
```

## Anti-patterns

```tsx
// ❌ Business state inside any UI tier
import { useSession } from '@application/SessionProvider';

// ❌ Global stylesheet
import './styles.css';

// ❌ Organism or layout that fetches or mutates server state
import { postsDatasource } from '@data/...';

// ❌ Layout importing a feature or view
import LoginForm from '@features/login/LoginForm';

export default function Avatar() {
  const session = useSession();
  return <img src={session.avatarUrl} />;
}

// ❌ Inline styles for layout
<div style={{ display: 'flex', gap: 16 }}>...</div>;
// → use <Flex gap={16}> or a layout/organism with SCSS modules

// ❌ Pulling form context outside a Form molecule
function MyInput() {
  const { register } = useFormContext(); // couples atom to react-hook-form
}
```

## See also

- [code-style.md](./code-style.md) — component template and naming conventions.
- [structure.md](./structure.md) — slice/segment layout; global-UI vs feature-UI boundary.
- [forms.md](./forms.md) — the atom → molecule → `Form` → feature form pattern.
- [styling.md](./styling.md) — SCSS module conventions, `@assets/*` aliases.
- [icons.md](./icons.md) — SVG icons.
- [architecture.md](./architecture.md) — why UI must stay independent of Feature/Data layers.
