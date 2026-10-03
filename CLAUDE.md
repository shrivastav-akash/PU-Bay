# Nexora (formerly PU-Bay)

Tier: light

Campus social network for Presidency University students: a swipe-card feed, résumé-style profiles and connection requests. The project CLAUDE.md is the spec; see `DESIGN.md` for the visual system and `docs/HANDOVER.md` for current status.

## Stack

- `backend/`: Node (ES modules), Express 5, Mongoose 9, JWT auth, Zod validation, express-rate-limit, Multer uploads to `UPLOAD_DIR`, PDFKit résumés streamed to the client. Env validated in `config/env.js`. Tests: Vitest + Supertest against local mongod (`nexora_test` DB).
- `frontend/`: React 19 + Vite 8, JavaScript (no TS). Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (Radix base, JS mode, files in `src/components/ui/`), Motion (`motion/react`), React Router 8 (declarative `BrowserRouter`), next-themes, sonner, lucide-react. Tests: Vitest (`npm test`).

## Frontend map

- `src/App.jsx`: routes and auth guards. `/`, `/login`, `/signup` are public-only; `/feed`, `/people`, `/network`, `/u/:username`, `/settings` need a token.
- `src/context/`: `SessionProvider.jsx` (token + data layer keyed by token), `session.js` (`useAuth`, `useData`).
- `src/lib/`: `api.js` (fetch wrapper, `mediaUrl`), `connections.js` (request status logic), `format.js`, `swipe.js`, `use-loader.js`.
- `src/components/`: `layout/` (AppShell, RightRail, AuthLayout, SiteFooter), `feed/` (SwipeDeck, PostCard, CommentsPanel, Composer), `people/ConnectButton.jsx`, `brand/Logo.jsx`.
- `src/pages/`: one file per route.

## Backend map

- `app.js` builds the Express app (tests import it); `server.js` connects to MongoDB and listens.
- Every route: `authMiddleware` (if protected) → multer (if upload) → `validate({ body|query: schema })` from `schemas.js` → controller. Controllers read only `req.valid.*`.
- Controllers throw `HttpError(status, code, message)`; `middleware/error.js` is the only place that writes error responses: `{ error: { code, message } }`. No try/catch in handlers (Express 5 forwards rejections).
- `mongoose.set('sanitizeFilter', true)`: intentional query operators need `mongoose.trusted(...)`.

## Rules for this project

- Keep endpoint paths and the success shape `{ success, message?, data? }` stable; the frontend depends on them. Errors use `{ error: { code, message } }` and `frontend/src/lib/api.js` reads that.
- New request fields must be added to the strict schema in `backend/schemas.js`, or they will be rejected.
- Keep shadcn files as generated; customise via tokens in `src/index.css`. Exception: `button.jsx` (pill shape, sizes, `brand` variant), `input.jsx`/`input-group.jsx` (h-10), `tabs.jsx` (h-10) were adjusted on purpose.
- Every data-fetching view owns loading (Skeleton), empty (Empty) and error (`LoadError`) states.
- Follow `DESIGN.md` for colour, type and copy rules (no em-dashes in UI copy).

## Run

```bash
cd backend && npm run dev            # http://localhost:3000
cd frontend && npm run dev           # http://localhost:5173
cd backend && npm test               # needs local mongod
cd frontend && npm test && npm run lint && npm run build
```
