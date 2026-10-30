# `docs/agents/` — Project Spec Details

Topic-scoped documents for both humans and AI agents.
**Entry point is [`/AGENTS.md`](../../AGENTS.md)** — read it first.

| Topic                                                  | When to read                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [architecture.md](./architecture.md)                   | Touching anything in `/src` — layers, dependency rules, data flow.                 |
| [structure.md](./structure.md)                         | Adding/organising a slice or segment — public API, decomposition, no barrels.      |
| [data-fetching.md](./data-fetching.md)                 | Writing/changing datasources, use-cases, or hooks that pull/push server state.     |
| [ui.md](./ui.md)                                       | UI layer in `/src/ui` — tiers, layout, anti-patterns.                              |
| [forms.md](./forms.md)                                 | Building any form — the atom → molecule → `Form` → feature pattern.                |
| [figma.md](./figma.md)                                 | Implementing a design / working from Figma — precision, assets, tokens.            |
| [event-bus.md](./event-bus.md)                         | Making two distant features talk imperatively without a global store.              |
| [code-style.md](./code-style.md)                       | Any `*.{ts,tsx}` — naming, imports, props order, functions, domain models.         |
| [styling.md](./styling.md)                             | Editing any `.scss` file — module conventions, `@assets/*` aliases, CSS variables. |
| [icons.md](./icons.md)                                 | Adding or modifying SVGs in `/src/ui/icons`.                                       |
| [testing.md](./testing.md)                             | Writing/changing `*.test.{ts,tsx}` files.                                          |
| [testing-pixel-perfect.md](./testing-pixel-perfect.md) | Playwright screenshot tests and `/screenshots` baselines.                          |
| [errors.md](./errors.md)                               | Throwing/handling errors                                                           |

## Conventions for files in this folder

Each file follows the same structure so both humans and agents know where to look:

1. **Title + one-line purpose** (`> blockquote`).
2. **TL;DR** — 3–5 bullets with the absolute must-know rules.
3. **Why** — rationale; alternatives considered and rejected.
4. **Pattern** — the canonical example (real code from this repo).
5. **Anti-patterns** — concrete ❌ examples that will fail review or lint.
6. **See also** — links to related topic files.

Files should stay ≤ 400 lines. If a topic grows beyond that, split it.
