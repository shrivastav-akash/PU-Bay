# Nexora (formerly PU-Bay)

Tier: light

Campus social network for Presidency University students: a swipe-card feed, résumé-style profiles and connection requests. The project CLAUDE.md is the spec; see `DESIGN.md` for the visual system and `docs/HANDOVER.md` for current status.

## Stack

- `backend/`: Node (ES modules), Express 5, Mongoose 9, JWT auth, Multer uploads to `backend/uploads/`, PDFKit résumés. Runs on `PORT` (3000) from `backend/.env`.
- `frontend/`: React 19 + Vite 8, JavaScript (no TS). Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (Radix base, JS mode, files in `src/components/ui/`), Motion (`motion/react`), React Router 8 (declarative `BrowserRouter`), next-themes, sonner, lucide-react. Tests: Vitest (`npm test`).

## Frontend map

- `src/App.jsx`: routes and auth guards. `/`, `/login`, `/signup` are public-only; `/feed`, `/people`, `/network`, `/u/:username`, `/settings` need a token.
- `src/context/`: `SessionProvider.jsx` (token + data layer keyed by token), `session.js` (`useAuth`, `useData`).
- `src/lib/`: `api.js` (fetch wrapper, `mediaUrl`), `connections.js` (request status logic), `format.js`, `swipe.js`, `use-loader.js`.
- `src/components/`: `layout/` (AppShell, RightRail, AuthLayout, SiteFooter), `feed/` (SwipeDeck, PostCard, CommentsPanel, Composer), `people/ConnectButton.jsx`, `brand/Logo.jsx`.
- `src/pages/`: one file per route.

## Rules for this project

- The backend API contract (paths, `{ success, message, data }` shape) is unchanged by the redesign. Do not touch `backend/` until the user explicitly starts the problem-fix phase (see `docs/HANDOVER.md`).
- Keep shadcn files as generated; customise via tokens in `src/index.css`. Exception: `button.jsx` (pill shape, sizes, `brand` variant), `input.jsx`/`input-group.jsx` (h-10), `tabs.jsx` (h-10) were adjusted on purpose.
- Every data-fetching view owns loading (Skeleton), empty (Empty) and error (`LoadError`) states.
- Follow `DESIGN.md` for colour, type and copy rules (no em-dashes in UI copy).

## Run

```bash
cd backend && npm run dev
cd frontend && npm run dev   # http://localhost:5173
cd frontend && npm test && npm run lint && npm run build
```
