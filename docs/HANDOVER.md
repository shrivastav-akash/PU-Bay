# Handover

_Last updated: 2026-10-03, branch `redesign/nexora`._

## Status

- Phase A (rebrand + frontend redesign): committed `1b9e2c5`.
- Phase B (backend security and bug fixes, items 1–25): committed `caf206f`.
- **httpOnly cookie sessions (item 26): done, uncommitted.**

## What changed: cookie sessions

Backend:
- `POST /login` sets `nexora_session` (JWT, httpOnly, `SameSite=Lax`, `Path=/`, 7 days, `Secure` when `NODE_ENV=production`). The token is no longer in the response body.
- New `POST /logout` clears the cookie. It is public, so it works even after expiry.
- `middleware/auth.js` reads only the cookie (`lib/session.js`). `Authorization: Bearer` is no longer accepted.
- CSRF: `middleware/origin.js` returns 403 `FORBIDDEN_ORIGIN` for non-GET requests whose `Origin` isn't in `CLIENT_ORIGIN`. CORS sends `credentials: true` for those origins only.
- New env var `NODE_ENV` (`development` / `test` / `production`).

Frontend:
- `lib/api.js`: every request uses `credentials: 'include'`; all token plumbing is removed. A 401 `UNAUTHENTICATED` while signed in triggers the session-expired handler.
- `SessionProvider`: session status comes from `/get_user_and_profile` (`checking` / `authenticated` / `anonymous` / `error`). Login, logout and expiry remount the data layer. The old `localStorage.token` is deleted on load.
- Route guards: a short session check on load; a retry screen if the API is unreachable (public pages still render); expiry sends you to `/login`, and you return to the same page after signing in.

## Verified

- Backend `npm test`: 39 passing. New tests cover:
  - the cookie flags
  - no token in the body
  - Bearer rejected
  - logout clearing the cookie
  - foreign Origin rejected with 403
  - CORS credentials for the app origin only
  - `Secure` in production
  - Disabling `httpOnly` or the Origin check makes tests fail (checked with injected bugs).
- Frontend lint, `npm test` (16) and build are clean.
- In the browser against the dev DB:
  - signup and login
  - cookie unreadable from JS, nothing in `localStorage`
  - session survives a reload
  - server-side cookie loss redirects to `/login` and back
  - logout lands on `/` and the API then answers 401
  - API down shows the retry screen
- The test user was removed afterwards.

## Known issues / deferred

- JWTs are stateless: logout removes the cookie, but a copied token stays valid until it expires (7 days). Add a denylist or token version if revocation is needed.
- In production, the API must be served over HTTPS (Secure cookie). Frontend and API must stay same-site (same registrable domain) for `SameSite=Lax`, or move to `SameSite=None; Secure` plus the existing Origin check.
- The rate limiter uses an in-memory store (single process).
- The frontend bundle is about 683 kB in one chunk; measure with Lighthouse before route-splitting.

## Next step

Review the diff and commit.
