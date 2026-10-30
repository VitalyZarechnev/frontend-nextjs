# Event bus

> How two features that don't (and shouldn't) know each other's internals talk to each other: a small, typed, imperative event bus owned by the target feature — instead of a global store.

## TL;DR

- Reach for the event bus when **two features far apart in the tree** must interact and neither should own a shared store for it.
- **State ownership stays local:** only the target feature holds the state its events drive. Other features just fire intent; they never hold that state.
- The generic base class lives in **`@utils/EventBus`**. Each concern gets its own **typed instance placed at the root of the owning feature** (`features/<owner>/eventBus.ts`) — so it's part of that feature's public API (see [structure.md](./structure.md)).
- **The owner subscribes** (on mount) and **unsubscribes** (on unmount, via the returned cleanup). **Other features publish.**
- Events are an `enum` of dotted names; payloads are a typed map keyed by the enum values.

## Why (not a global store)

For a one-to-one, imperative interaction between two distant features, a global store is the wrong tool:

- **Avoids a global store** created solely so feature A can poke feature B — that would scatter B's concern into shared global space.
- **Keeps state where it belongs** — the target feature is the single owner of its state; callers only send a signal, they don't mirror or sync it.
- **A direct, explicit, imperative relationship** — the only thing shared between the two features is the small event-contract file at the owner's root; no reaching into internals, no structural coupling.

Not a replacement for other mechanisms — pick the right one:

| Need                                                         | Use                                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Parent ↔ child, or within one feature                        | props / callbacks                                                             |
| Server state                                                 | `createDatasource` / `createUsecase` ([data-fetching.md](./data-fetching.md)) |
| Shared **reactive** domain state many features read          | a MobX domain store ([architecture.md](./architecture.md))                    |
| A one-off **imperative signal** between two distant features | **the event bus (this doc)**                                                  |

## The base class (`@utils/EventBus`)

`EventBus<Events>` wraps a native `EventTarget`. `publish(name, payload?)` fires an event; `subscribe(name, handler)` registers a listener and **returns an unsubscribe function**. `Events` is a record mapping each event name to its payload type.

## Pattern

### 1. Define the bus at the owning feature's root

The feature that owns the concern (here `sidebar` owns its open/closed state) declares the event contract and the instance in `eventBus.ts` at its **root** — that file is the feature's public API for this interaction.

```ts
// src/features/sidebar/eventBus.ts
import { EventBus } from '@utils/EventBus';

export enum SidebarEvent {
  TOGGLE = 'event.sidebar.toggle',
}

// Record<…> forces every event to have a typed payload (exhaustive);
// then pin the specific ones. Use `void` for events with no payload.
type TSidebarEventPayloads = Record<`${SidebarEvent}`, object | void> & {
  [SidebarEvent.TOGGLE]: { open: boolean };
};

export const sidebarEventBus = new EventBus<TSidebarEventPayloads>();
```

### 2. The owner subscribes on mount, unsubscribes on unmount

`subscribe` returns its own cleanup, so return it straight from the effect. The state lives **here**, in the owner.

```tsx
// src/features/sidebar/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';

import { SidebarEvent, sidebarEventBus } from '@features/sidebar/eventBus';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return sidebarEventBus.subscribe(SidebarEvent.TOGGLE, ({ open }) => setIsOpen(open));
  }, []);

  return isOpen ? <aside>…</aside> : null;
}
```

(If the subscription grows, extract it to a `hooks/` segment hook — e.g. `useSidebarToggle` — per [structure.md](./structure.md).)

### 3. Another feature publishes

A distant feature imports only the owner's root `eventBus` file and fires the event — it holds none of the sidebar's state.

```tsx
// src/features/header/Header.tsx
'use client';

import { SidebarEvent, sidebarEventBus } from '@features/sidebar/eventBus';

import Button from '@ui/atoms/button/Button';

export default function Header() {
  const openSidebar = () => sidebarEventBus.publish(SidebarEvent.TOGGLE, { open: true });

  return (
    <Button variant='main' onClick={openSidebar}>
      Menu
    </Button>
  );
}
```

Importing `@features/sidebar/eventBus` is a **root** import, which encapsulation allows; reaching into the sidebar's segments would not.

## Anti-patterns

```ts
// ❌ A global store spun up just so one feature can poke another
export const uiStore = new UiStore(); // put the state in the owning feature + a bus

// ❌ Bus placed in a shared/global location when one feature owns the concern
// src/utils/sidebarEventBus.ts  → belongs at features/sidebar/eventBus.ts (the owner's root)

// ❌ Both features holding the "open" state and syncing it
// Only the owner (sidebar) holds it; others just publish intent.

// ❌ Subscribing without unsubscribing (leak) — always return the cleanup
useEffect(() => {
  sidebarEventBus.subscribe(SidebarEvent.TOGGLE, handler); // missing `return`
}, []);

// ❌ Using the bus for data flow that should be props / query / store
```

## See also

- [structure.md](./structure.md) — a feature's public API can be an event bus at its root.
- [architecture.md](./architecture.md) — MobX domain stores vs the event bus.
- [data-fetching.md](./data-fetching.md) — server state (not a bus concern).
