# Handover

_Last updated: 2026-10-03, branch `redesign/nexora`._

## Status

- **Phase A (rebrand + frontend redesign)** is committed as `1b9e2c5`. Design rules are in `DESIGN.md`.
- **Phase B (backend security and bug fixes)** is done but **uncommitted**. Details below.

## What changed in Phase B

Backend structure:
- `app.js` (Express app) split from `server.js` (connect, then listen; exit if MongoDB is unreachable).
- `config/env.js` validates env with Zod at startup.
- `schemas.js` holds strict Zod schemas for every body and query; `middleware/validate.js` puts parsed values in `req.valid`.
- `middleware/error.js` is the single error handler: `{ error: { code, message } }`, no stack traces, deletes a just-uploaded file if the request fails.
- `lib/uploads.js` holds the multer configs; `middleware/rate-limit.js` the auth limiter.

Fixed (numbers match the old catalog):
1. Password hash never returned (`select: false` + `toJSON` transform).
2. Mass assignment closed: strict schemas whitelist fields.
3. Zod on every input + `sanitizeFilter`.
4. Login gives a generic 401 with timing equalised by a dummy hash. Register keeps `409 "Email or username already in use"` (your choice).
5. `/login` and `/register` rate limited (20 per IP per 15 min, `AUTH_RATE_LIMIT`).
6. Uploads get server-side UUID names, a MIME allowlist, and size limits (5 MB avatars, 25 MB post media); served with `nosniff`.
7. Résumé PDF streamed in the response; nothing is written to `uploads/`. Email is printed only on your own résumé.
8. Other users' emails removed from every list endpoint.
9. CORS restricted to `CLIENT_ORIGIN` (default: Vite dev server).
10. `uploads/*` git-ignored (`.gitkeep` kept). **You still need to run** `git rm -r --cached backend/uploads` and then `git add backend/uploads/.gitkeep`.
11. Env validated at startup; server exits when the DB is unreachable.
12. PDF works without a photo, lists work/education properly, and returns 400/404 for bad ids.
13. Media-only posts allowed (text or media required).
14. `fileType` stores the full MIME type; frontend `isVideo` handles both formats.
15. Avatar upload without a file returns 400.
16. Duplicate username returns 409 (and any E11000 maps to 409).
17. No self requests or duplicates; asking someone who asked you first connects you.
18. Deleting a post removes its comments and media file; non-owners get 403.
19. `get_comment` reads only the query string.
20. Feed sorted on the server, with `commentCount` (one aggregate query) and opt-in `limit`/`before` paging.
21. Upload path no longer depends on the working directory (`UPLOAD_DIR`).
22. One error middleware and shape; `frontend/src/lib/api.js` updated.
23. Removed unused `crypto` and `pdf-creator-node`; replaced `nodemon` with `node --watch`. `npm audit`: 0 vulnerabilities.
24. Dead `activeCheck` export and duplicate model import removed.
25. 33 backend tests (Vitest + Supertest), checked with injected bugs to confirm they fail.

Frontend follow-ups:
- `api.js`: reads the new error shape; `downloadFile()` for the streamed PDF.
- Composer: media-only posts.
- Comment counts on cards, kept in step when you comment or delete.
- Connect toast says "connected" when asking back.

## Verified

- Backend `npm test`: 33 passing. `npm audit`: 0 vulnerabilities.
- Frontend `npm run lint`, `npm test` (16), `npm run build` all clean.
- Manual end-to-end against the dev DB:
  - duplicate signup and wrong-password messages
  - media-only post
  - comment count update
  - PDF download for a user with no photo
  - CORS blocks foreign origins
- The temporary test user was removed afterwards.

## Known issues / deferred

- 26: the JWT is kept in `localStorage` (readable by XSS). Moving to httpOnly cookies needs auth changes on both sides; not started.
- Rate limiter uses an in-memory store (single process). Needs a shared store if the API ever runs on several instances.
- The frontend bundle is about 683 kB in one chunk; measure with Lighthouse before route-splitting.
- Legacy uploads (original filenames) are never auto-deleted, since several users may share one file.

## Next step

Review the Phase B diff, untrack `backend/uploads` (command in item 10), and commit.
