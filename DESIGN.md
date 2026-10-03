# Nexora design system

Source of truth for the Nexora frontend. Tokens live in `frontend/src/index.css`; shadcn/ui components in `frontend/src/components/ui/` read them.

## Direction

**Mono + Signal.** The interface is neutral zinc so that people's posts carry the color. One accent, hot coral, marks actions, likes, focus and the brand mark. Patterns drawn from Peerlist, Threads, Bluesky and BeReal: a quiet chrome, one ownable signature moment (the swipe deck), and honest positioning ("No ads. No algorithm. Just your campus.").

## Color

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | zinc-50 | zinc-950 | Page |
| `--card` | white | zinc-900 | Cards, sheets, dialogs |
| `--foreground` | zinc-950 | zinc-50 | Body text |
| `--muted-foreground` | zinc-500 | zinc-400 | Secondary text (4.6:1 on zinc-50) |
| `--primary` | zinc-900 | zinc-50 | Primary buttons (ink pills) |
| `--border` | zinc-200 | white / 10% | Hairlines |
| `--brand` | `#FF5A36` | `#FF5A36` | Likes, active nav icon, focus ring, logo, fills |
| `--brand-foreground` | zinc-950 | zinc-950 | Text on a coral fill (6.4:1) |
| `--brand-strong` | `#D63A17` | `#FF5A36` | Coral **text** (4.7:1 on white) |

Rules:
- Coral never sits behind small white text (white on `#FF5A36` is only 3.1:1). Use `variant="brand"` (dark text) or an ink pill.
- No other accent colors. Status uses the shadcn semantic tokens (`destructive`, `secondary`).
- Components use semantic classes (`bg-card`, `text-muted-foreground`), never raw palette classes.

## Type

- Geist Variable for everything; headings 600 with `tracking-[-0.02em]` (hero `-0.04em`).
- Geist Mono for metadata: handles, counts, timestamps, the feed position counter.
- Fonts are self-hosted via `@fontsource-variable/geist` and `geist-mono`.

## Shape and depth

- `--radius: 0.75rem`. Inputs `rounded-md` (about 10px), cards `rounded-xl`/`rounded-2xl` (16 to 20px), buttons and chips are full pills.
- Borders are 1px hairlines. Shadows only on the top card of the deck and on overlays.

## Motion

- The swipe deck is the signature: Motion `drag="x"` with spring settle, rotate and LIKE/SKIP stamps driven by motion values, fly-out on commit (`frontend/src/components/feed/SwipeDeck.jsx`).
- Everything else is 150 to 200ms fades and slides from shadcn.
- `prefers-reduced-motion`: Motion's `useReducedMotion` skips fly-outs and springs; a global CSS rule collapses transitions.

## Layout

- App shell (`components/layout/AppShell.jsx`): left rail from `md` (icons only until `lg`), right rail from `xl`, top bar plus bottom tab bar below `md`.
- Breakpoints are CSS only; the only JS media query picks Sheet (desktop) vs Drawer (phone) for comments.
- Content column max 6xl; the feed column is 440px.

## Copy

- No em-dashes or en-dashes anywhere in the UI.
- At most one eyebrow-style label per three sections (landing has one).
- One label per intent: "Join Nexora" for sign-up, "Sign in" for sign-in.
- Labels sit above inputs; placeholders are examples, never the label.

## Accessibility checklist

- Every icon-only button has an `aria-label`; dialogs and sheets always have a title.
- Focus is visible (`ring-ring/50`, coral) on buttons, inputs and nav links.
- Drag is never the only way: Skip/Like buttons and ← → keys do the same thing.
- Cards behind the top of the deck are `inert` and `aria-hidden`.
