# Nexora: Frontend

Single-page React app for Nexora, the Presidency University student network: a swipe-card feed, résumé-style profiles and campus connections. Visual rules live in [`../DESIGN.md`](../DESIGN.md).

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19 |
| Build | Vite 8 + `@vitejs/plugin-react` |
| Routing | React Router 8 (declarative `BrowserRouter`) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, tokens in `src/index.css` |
| Components | shadcn/ui (Radix base, JavaScript mode) in `src/components/ui/` |
| Motion | `motion/react` (swipe deck) |
| Theme / toasts | next-themes, sonner |
| Icons | lucide-react |
| Fonts | Geist + Geist Mono, self-hosted via `@fontsource-variable/*` |
| Tests | Vitest |
| Lint | ESLint 10 with React Hooks and React Refresh plugins |

## Getting started

Requires Node 18+ and the backend running on port 3000 (see `../backend`).

```bash
npm install
npm run dev        # http://localhost:5173
```

The API base URL is derived from the page host: `http://<hostname>:3000` (`src/lib/api.js`). There are no frontend environment variables.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint (generated `src/components/ui/` has two rules relaxed) |
| `npm test` | Vitest unit tests for `src/lib/` |

## Structure

```
src/
├── App.jsx                 # Routes + RequireAuth / PublicOnly guards
├── main.jsx                # ThemeProvider, BrowserRouter, Tooltip, Session, Toaster
├── index.css               # Tailwind, shadcn tokens, Nexora coral, fonts
├── context/
│   ├── SessionProvider.jsx # Session status from the API; data layer remounts per session
│   └── session.js          # useAuth(), useData()
├── lib/
│   ├── api.js              # fetch wrapper (cookies), downloadFile(), mediaUrl()
│   ├── connections.js      # connection status / suggestions logic
│   ├── format.js           # timeAgo, fmtDate, initials, isVideo
│   ├── swipe.js            # swipe commit decision
│   ├── use-loader.js       # fetch-on-mount with status + reload
│   └── *.test.js
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── brand/Logo.jsx
│   ├── layout/             # AppShell, RightRail, AuthLayout, SiteFooter
│   ├── feed/               # SwipeDeck, PostCard, CommentsPanel, Composer
│   ├── people/ConnectButton.jsx
│   └── UserAvatar.jsx, ErrorBoundary.jsx, LoadError.jsx
└── pages/                  # Landing, Login, Signup, Feed, People, Network, Profile, Settings, NotFound
```

## How data flows

- The session is an httpOnly cookie the page can't read. `api()` sends every request with `credentials: 'include'`, and `SessionProvider` learns who is signed in from `/get_user_and_profile` (`checking` / `authenticated` / `anonymous` / `error`). Login, logout and expiry remount the `DataProvider`, so no state from the previous account survives.
- Shared resources (`me`, `profiles`, `requests`, `posts`) load once through `useLoader` and expose `status` (`loading` / `ready` / `error`), `reload()` and `setData()`.
- Likes are optimistic and roll back on failure. Connection actions and posting reload the affected resource.
- `api()` throws an `Error` carrying the server's `message`, `code` and HTTP `status`. A `401 UNAUTHENTICATED` on any request while signed in ends the session and sends you to `/login`, which returns you to the page afterwards.

## Adding UI

- Add primitives with `npx shadcn@latest add <name>`; compose them rather than hand-building markup.
- Use semantic classes (`bg-card`, `text-muted-foreground`, `text-brand-strong`) and the `brand` button variant for coral actions.
- Every data-fetching view needs loading (`Skeleton`), empty (`Empty`) and error (`LoadError`) states.

## Author

**Akash Shrivastav**
