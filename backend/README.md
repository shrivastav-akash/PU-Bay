# Nexora: Backend

REST API for the Nexora campus social network (formerly PU-Bay), built with **Express 5**, **MongoDB** (Mongoose 9) and **JWT authentication**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Responses and Errors](#responses-and-errors)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Security](#security)
- [File Uploads](#file-uploads)
- [Testing](#testing)
- [Scripts](#scripts)

---

## Tech Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Runtime        | Node.js 18+ (ES Modules)                     |
| Framework      | Express 5                                    |
| Database       | MongoDB via Mongoose 9                       |
| Validation     | Zod 4 (env, body, query)                     |
| Authentication | JWT (`jsonwebtoken`) + bcrypt                |
| Rate limiting  | express-rate-limit (login and register)      |
| File uploads   | Multer (disk storage)                        |
| PDF            | PDFKit (streamed)                            |
| Tests          | Vitest + Supertest                           |
| Dev server     | `node --watch`                               |

---

## Project Structure

```
backend/
├── config/env.js              # Zod-validated environment, fails fast on startup
├── controllers/
│   ├── posts.controller.js    # Posts, likes, comments
│   └── user.controller.js     # Auth, profile, connections, résumé PDF
├── lib/
│   ├── http-error.js          # HttpError(status, code, message)
│   └── uploads.js             # Multer configs, removeUpload()
├── middleware/
│   ├── auth.js                # JWT verification
│   ├── error.js               # 404 + the single error handler
│   ├── rate-limit.js          # Auth brute-force limiter
│   └── validate.js            # Strict Zod parsing into req.valid
├── models/                    # User, Profile, Post, Comment, ConnectionRequest
├── routes/                    # posts.routes.js, user.routes.js
├── schemas.js                 # Every request schema
├── tests/                     # Vitest + Supertest suites
├── uploads/                   # Runtime file storage (git-ignored)
├── app.js                     # Express app (imported by tests)
└── server.js                  # Connects to MongoDB, then listens
```

---

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev            # http://localhost:3000, restarts on file changes
```

The server refuses to start if the environment is invalid or MongoDB is unreachable.

---

## Environment Variables

Empty values fall back to the defaults.

| Variable          | Required | Default                                         | Description |
| ----------------- | -------- | ----------------------------------------------- | ----------- |
| `MONGO_URI`       | yes      |                                                 | MongoDB connection string |
| `JWT_SECRET`      | yes      |                                                 | At least 32 characters |
| `PORT`            | no       | `3000`                                          | Listen port |
| `CLIENT_ORIGIN`   | no       | `http://localhost:5173,http://127.0.0.1:5173`   | Comma-separated origins allowed by CORS. Add your LAN URL to test on a phone. |
| `UPLOAD_DIR`      | no       | `backend/uploads`                               | Where uploads are stored and served from |
| `AUTH_RATE_LIMIT` | no       | `20`                                            | Login/register attempts per IP per 15 minutes |

---

## Responses and Errors

Success responses keep the original shape:

```json
{ "success": true, "message": "...", "data": { } }
```

Every error, from any route, has one shape and never includes stack traces:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "email: Enter a valid email" } }
```

| Status | Codes |
| ------ | ----- |
| 400 | `VALIDATION_ERROR`, `INVALID_JSON`, `EMPTY_POST`, `FILE_REQUIRED`, `UNSUPPORTED_FILE`, `UPLOAD_ERROR`, `INVALID_REQUEST` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `ACCOUNT_EXISTS`, `REQUEST_EXISTS`, `ALREADY_CONNECTED`, `ALREADY_RESPONDED`, `CONFLICT` |
| 413 | `FILE_TOO_LARGE`, `PAYLOAD_TOO_LARGE` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL_ERROR` |

All bodies and query strings are validated with **strict** schemas (`schemas.js`): unknown keys are rejected with `400`.

---

## API Reference

🔒 = requires `Authorization: Bearer <token>`.

### Authentication

| Endpoint | Body | Success | Notes |
| --- | --- | --- | --- |
| `POST /register` | `name`, `username` (3–30 of `A-Z a-z 0-9 _ .`), `email`, `password` (8–72) | `201` | `409 ACCOUNT_EXISTS` if the email or username is taken. Rate limited. |
| `POST /login` | `email`, `password` | `200`, `data.token` (JWT, 7 days) | Same `401 INVALID_CREDENTIALS` for an unknown email or a wrong password. Rate limited. |

### User and profile

| Endpoint | Input | Notes |
| --- | --- | --- |
| `GET /get_user_and_profile` 🔒 | | Your user and profile, including your email. Never the password. |
| `POST /user_update` 🔒 | any of `name`, `username`, `email` | `409` if the username or email belongs to someone else. |
| `POST /update_profile_data` 🔒 | any of `bio`, `currentPost`, `pastWork[]`, `education[]` | Array items: `{ company, position, years }` / `{ school, degree, fieldOfStudy }`. |
| `POST /update_profile_picture` 🔒 | multipart `profile_picture` (JPEG, PNG, WebP, GIF, max 5 MB) | Replaces and deletes the previous picture. |
| `GET /user/get_all_users` 🔒 | | All profiles with `name`, `username`, `profilePicture`. No emails. |
| `GET /user/download_resume?id=<profileId>` 🔒 | | Streams `application/pdf` as an attachment. Your email appears only on your own résumé. |

### Posts

| Endpoint | Input | Notes |
| --- | --- | --- |
| `GET /get_all_posts` | optional `limit` (1–100), `before` (ISO date) | Newest first, with `commentCount`. Without `limit`, returns every post. |
| `POST /post` 🔒 | multipart `body` (max 5000) and/or `media` (images, MP4, WebM, MOV, max 25 MB) | `201`. Text or media is required. `fileType` stores the full MIME type. |
| `POST /delete_post` 🔒 | `postId` | Owner only (`403` otherwise). Also deletes its comments and media file. |
| `POST /increment_likes` 🔒 | `postId` | Idempotent. |
| `POST /decrement_likes` 🔒 | `postId` | |

### Comments

| Endpoint | Input | Notes |
| --- | --- | --- |
| `GET /get_comment?postId=<id>` | | Oldest first, with author `name`, `username`, `profilePicture`. |
| `POST /comment_post` 🔒 | `postId`, `commentBody` (max 1000) | `201`. |
| `POST /delete_comment_of_user` 🔒 | `commentId` | Author only. |

### Connections

| Endpoint | Input | Notes |
| --- | --- | --- |
| `POST /user/send_connection_request` 🔒 | `receiverId` | `201` new request. If they already asked you (pending or ignored), you're connected instead (`200`, `message: "connected"`). `400` for yourself, `409` duplicates. |
| `GET /user/get_connection_request` 🔒 | | Requests you sent. |
| `GET /user/user_connection_request` 🔒 | | Requests you received. |
| `POST /user/accept_connection_request` 🔒 | `connectionId`, `action_type` (`accept` / `reject`) | Recipient only, once (`409 ALREADY_RESPONDED`). |

---

## Database Models

| Model | Fields |
| --- | --- |
| User | `name`, `username` (unique), `email` (unique), `password` (bcrypt, `select: false`), `profilePicture`, `active`, `createdAt` |
| Profile | `userId`, `bio`, `currentPost`, `pastWork[]`, `education[]` |
| Post | `userId`, `body` (optional), `likes`, `likedBy[]`, `media`, `fileType` (full MIME type; older posts hold only the subtype), `active`, `createdAt` |
| Comment | `userId`, `postId`, `body` |
| ConnectionRequest | `userId` (sender), `connectionId` (receiver), `status_accepted` (`null` pending, `true` accepted, `false` ignored) |

---

## Security

- Passwords are hashed with bcrypt and excluded from every query and every JSON response.
- Login compares against a dummy hash for unknown emails, so response timing doesn't reveal accounts.
- Strict Zod validation on every input, plus Mongoose `sanitizeFilter` as a second layer against operator injection.
- `/login` and `/register` are rate limited per IP.
- CORS only allows `CLIENT_ORIGIN`.
- JWTs are verified with HS256 only and read only from the `Authorization` header.
- Known gap: the frontend keeps the JWT in `localStorage`. Moving to httpOnly cookies is deferred.

---

## File Uploads

- Stored in `UPLOAD_DIR` under server-generated names (`<uuid>.<ext>`). The extension comes from the allowed MIME type, never from the client's filename.
- Served statically with `X-Content-Type-Options: nosniff`.
- A failed request deletes the file it uploaded. Replaced avatars and deleted posts delete their files. Files from before this change (original names) are never auto-deleted, since several users may share one.

---

## Testing

Tests need a local `mongod`. They use the `nexora_test` database and a temp upload folder, and drop both afterwards; your dev data is never touched.

```bash
npm test
```

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with `node --watch` |
| `npm start` | Start once |
| `npm test` | Vitest + Supertest suite |

---

## Author

**Akash Shrivastav**

## License

ISC
