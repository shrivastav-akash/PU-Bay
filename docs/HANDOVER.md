# Handover

_Last updated: 2026-10-03, branch `redesign/nexora`._

## What changed (Phase A: rebrand and redesign, frontend only)

- Rebranded PU-Bay to **Nexora**: new logo mark (two offset cards, coral front card), wordmark, favicon, title and meta tags, and all UI copy.
- Rebuilt the frontend on Tailwind v4 + shadcn/ui (Radix, JS) + Motion + React Router 8 + next-themes. Design rules are in `DESIGN.md`.
- Replaced the single 645-line `App.jsx` with routed pages: Landing, Login, Signup, Feed, People, Network, Profile (`/u/:username`), Settings, NotFound.
- New: a spring-physics swipe deck with a finite end state, a comments sheet/drawer (with delete own comment), a composer dialog with media preview, a delete confirmation dialog, People search, Network tabs, dark/light/system theme, deep links, and skeleton/empty/error states everywhere.
- Fixed in passing (frontend): the "Panjab University" headline fallback, placeholder-only labels, modals without focus management, the JS `isMobile` listener, and the share action that claimed to copy a link.
- Added Vitest with tests for `lib/connections.js`, `lib/format.js` and `lib/swipe.js` (`npm test`).
- `backend/` is untouched.

## Verified

- `npm run lint`, `npm test` (16 passing), `npm run build` all clean.
- Driven in the browser against the local API: sign up, login and redirect back to a deep link, logout, swipe by drag, buttons and keys, like/unlike, comment add/delete, composer with an image, post delete, accept a connection, People, Profile tabs, Settings save, light/dark, and the 375 / 768 / 1024 / 1440 widths.

## Known issues

- JS bundle is about 683 kB (212 kB gzip) in one chunk. Not optimised yet: measure with Lighthouse first, then route-split with `React.lazy` if the numbers call for it.
- Résumé PDF fails for users without a profile photo (backend bug, item 12 below). The UI shows an error toast.
- Media-only posts are blocked in the composer because the backend requires text (item 13).
- The comment count is not shown on cards: the API does not return it (item 20).

## Pending: Phase B (backend and security fixes)

Do **not** start until the user says so. New backend dependencies need approval at that time (zod, express-rate-limit, vitest, supertest).

Security:
1. Password hash returned by `/get_user_and_profile`.
2. Mass assignment in `updateUserProfile` / `updateProfileData` (`Object.assign(req.body)`).
3. No input validation; NoSQL operator injection possible. Add Zod + `sanitizeFilter`.
4. Login reveals whether an account exists (404 vs 401).
5. No rate limiting on auth routes.
6. Multer keeps `originalname`: uploads overwrite each other; no size/type limits.
7. Résumé PDFs land in public `uploads/` with emails and are never deleted. Stream them instead.
8. `/user/get_all_users` exposes every email.
9. CORS open to all origins.
10. User uploads committed to git (~18 MB in `backend/uploads/`).
11. No env validation; server keeps running when the DB connection fails.

Bugs:
12. PDF: crashes on `default.jpg`, prints `[object Object]`, 500 instead of 404 on a bad id.
13. Media-only posts fail (`body` is required).
14. `fileType` stores the MIME subtype (`.mov` becomes `quicktime`).
15. Avatar upload without a file throws 500.
16. Duplicate username on register gives 500 instead of 409.
17. Self connection requests and duplicate reverse requests allowed.
18. `deletePost` leaves comments and media behind; returns 401 instead of 403 for non-owners.
19. `get_comment` reads `req.body` on GET.
20. No server sort, pagination or comment counts on posts.
21. `uploads` path depends on the working directory.
22. No central error middleware; inconsistent error shape.

Hygiene:
23. Unused `crypto` and `pdf-creator-node` deps (most audit vulnerabilities); `nodemon` belongs in devDependencies.
24. Dead `activeCheck` export; duplicate model import alias.
25. No backend tests.
26. JWT lives in localStorage (noted; httpOnly cookies deferred).

## Next step

User reviews the redesign on `redesign/nexora` and commits. Then, on request, start Phase B from item 1.
