<p align="center">
  <strong>nexora</strong><br/>
  <em>Your campus, one swipe at a time.</em>
</p>

---

# Nexora

**Nexora** (formerly PU-Bay) is a full-stack social networking platform built for **Presidency University** students. It combines a **swipeable card feed**, **résumé-style professional profiles**, and a **campus connection system** in a clean, modern interface: neutral zinc, one coral accent, Geist type, light and dark themes.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running the Full App](#running-the-full-app)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Authentication Flow](#authentication-flow)
  - [Data Flow](#data-flow)
- [API Endpoints Summary](#api-endpoints-summary)
- [Database Schema](#database-schema)
- [Frontend Components](#frontend-components)
- [Design System](#design-system)
- [Screenshots](#screenshots)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

---

## Overview

Nexora solves a common problem on university campuses: students lack a dedicated, student-only platform to share updates, showcase their work, build professional profiles, and connect with peers across departments.

**What makes Nexora different:**
- **Swipe-first feed** — Browse posts by dragging cards left (skip) or right (like), or use keyboard arrows.
- **Résumé profiles** — Every student gets a recruiter-ready profile with work experience, education, and a downloadable PDF résumé.
- **Connection requests** — Send, accept, or reject connection requests to build your campus network.
- **No distractions** — No ads, no algorithm, no infinite scroll — just your batch, one card at a time.

---

## Features

| Feature                         | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| 🃏 **Swipeable card feed**      | Spring-physics deck: drag, Skip/Like buttons or ← →, with a finite end     |
| 📝 **Rich posts**               | Text posts with image and video media attachments                          |
| ❤️ **Likes**                    | Like/unlike posts with optimistic UI updates and per-user tracking         |
| 💬 **Comments**                  | Side sheet (desktop) or drawer (phone); delete your own comments          |
| 📄 **Professional profiles**    | Bio, headline, work experience, education history                          |
| 📥 **PDF résumé export**        | Generate and download a PDF résumé from any profile                        |
| 🤝 **Campus connections**       | Send, accept, and reject connection requests                               |
| 👥 **People directory**         | Searchable people page plus "People you may know" suggestions            |
| 🌓 **Dark / Light / System**    | Follows the device by default, no flash on load                           |
| 📱 **Fully responsive**         | Bottom tab bar on phones, icon rail on tablets, full rails on desktop      |
| 🔐 **Secure authentication**    | bcrypt hashing, JWT in an httpOnly SameSite cookie, CSRF origin check      |
| 🎨 **Modern design system**     | Tailwind v4 + shadcn/ui tokens, documented in `DESIGN.md`                  |
| 🔔 **Toast notifications**      | Ephemeral feedback messages for user actions                               |
| 📸 **Profile picture upload**   | Custom avatar with camera-icon upload overlay                              |

---

## Tech Stack

### Frontend

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| React 19                | UI library                     |
| Vite 8                  | Build tool & dev server        |
| React Router 8          | Routes and deep links          |
| Tailwind CSS v4         | Styling and design tokens      |
| shadcn/ui (Radix)       | Accessible UI primitives       |
| Motion                  | Swipe deck physics             |
| next-themes, sonner     | Theme switching, toasts        |
| Lucide React            | Icon library                   |
| Geist + Geist Mono      | Self-hosted variable fonts     |
| Vitest                  | Unit tests                     |

### Backend

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| Node.js                 | Runtime (ES Modules)           |
| Express 5               | HTTP framework                 |
| MongoDB + Mongoose 9    | Database + ODM                 |
| JWT (jsonwebtoken)      | Authentication tokens          |
| bcrypt                  | Password hashing               |
| Multer                  | File upload handling           |
| PDFKit                  | Résumé PDF generation (streamed) |
| Zod                     | Env and request validation     |
| express-rate-limit      | Login/register throttling      |
| Vitest + Supertest      | API tests                      |

---

## Project Structure

```
PU-Bay/   (repository folder)
├── backend/                           # Express API server
│   ├── config/env.js                  # Zod-validated environment
│   ├── controllers/
│   │   ├── posts.controller.js        # Post CRUD, likes, comments
│   │   └── user.controller.js         # Auth, profile, connections, PDF
│   ├── lib/                           # HttpError, upload config
│   ├── middleware/                    # auth, validate, rate-limit, error
│   ├── models/
│   │   ├── comments.model.js          # Comment schema
│   │   ├── connections.model.js       # Connection request schema
│   │   ├── posts.model.js             # Post schema
│   │   ├── profile.model.js           # Professional profile schema
│   │   └── user.model.js              # Core user schema
│   ├── routes/
│   │   ├── posts.routes.js            # Post & comment routes
│   │   └── user.routes.js             # Auth, profile, connection routes
│   ├── schemas.js                     # Strict Zod request schemas
│   ├── tests/                         # Vitest + Supertest
│   ├── uploads/                       # File storage (git-ignored)
│   ├── app.js                         # Express app
│   ├── server.js                      # Connects to MongoDB, then listens
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                          # React SPA (Vite)
│   ├── public/favicon.svg             # Nexora mark
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui primitives (generated)
│   │   │   ├── brand/Logo.jsx         # Mark + wordmark
│   │   │   ├── layout/                # AppShell, RightRail, AuthLayout, SiteFooter
│   │   │   ├── feed/                  # SwipeDeck, PostCard, CommentsPanel, Composer
│   │   │   ├── people/ConnectButton.jsx
│   │   │   ├── UserAvatar.jsx, ErrorBoundary.jsx, LoadError.jsx
│   │   ├── context/                   # Session (auth + data) providers and hooks
│   │   ├── lib/                       # api, connections, format, swipe (+ tests)
│   │   ├── pages/                     # One file per route
│   │   ├── App.jsx                    # Routes and auth guards
│   │   ├── index.css                  # Tailwind + design tokens
│   │   └── main.jsx                   # Providers and mount
│   ├── components.json                # shadcn config
│   ├── vite.config.js
│   └── package.json
│
├── CLAUDE.md                          # Project spec for AI-assisted work
├── DESIGN.md                          # Design system
├── docs/HANDOVER.md                   # Current status and pending work
└── README.md                          # ← You are here
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **MongoDB** instance — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works)

### Backend Setup

```bash
# 1. Navigate to the backend
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env and fill in your values:
#    PORT=3000
#    MONGO_URI=mongodb+srv://...
#    JWT_SECRET=your_long_random_secret

# 5. Start the dev server
npm run dev
```

The API server starts at `http://localhost:3000`.

### Frontend Setup

```bash
# 1. Navigate to the frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# Tests, lint and production build
npm test
npm run lint
npm run build
```

The React app starts at `http://localhost:5173`. It automatically connects to the backend at `http://<hostname>:3000`.

### Running the Full App

Open **two terminals** and run both services simultaneously:

| Terminal 1 (Backend)         | Terminal 2 (Frontend)         |
| ---------------------------- | ----------------------------- |
| `cd backend && npm run dev`  | `cd frontend && npm run dev`  |

Then open `http://localhost:5173` in your browser.

---

## Architecture

### System Overview

```
┌─────────────────────┐        HTTP / JSON         ┌─────────────────────┐
│                     │ ◄──────────────────────────► │                     │
│   React Frontend    │    httpOnly session cookie   │   Express Backend   │
│   (Vite · :5173)    │    multipart/form-data       │   (Node.js · :3000) │
│                     │                              │                     │
└─────────────────────┘                              └──────────┬──────────┘
                                                                │
                                                                │ Mongoose
                                                                ▼
                                                     ┌─────────────────────┐
                                                     │   MongoDB Atlas     │
                                                     │                     │
                                                     │  Users              │
                                                     │  Profiles           │
                                                     │  Posts              │
                                                     │  Comments           │
                                                     │  ConnectionRequests │
                                                     └─────────────────────┘
```

### Authentication Flow

```
  Client                          Server                         Database
    │                               │                               │
    │  POST /register               │                               │
    │  {name, username, email, pw}  │                               │
    │ ─────────────────────────────►│                               │
    │                               │  bcrypt.hash(pw, 10)          │
    │                               │  Create User + Profile ──────►│
    │  201 "user created"           │                               │
    │ ◄─────────────────────────────│                               │
    │                               │                               │
    │  POST /login                  │                               │
    │  {email, password}            │                               │
    │ ─────────────────────────────►│                               │
    │                               │  bcrypt.compare()             │
    │                               │  jwt.sign({userId}, 7d)       │
    │  200 + Set-Cookie:            │                               │
    │  nexora_session (httpOnly,    │                               │
    │  SameSite=Lax, 7 days)        │                               │
    │ ◄─────────────────────────────│                               │
    │                               │                               │
    │  GET /get_user_and_profile    │                               │
    │  (cookie sent automatically,  │                               │
    │   fetch credentials:include)  │                               │
    │ ─────────────────────────────►│                               │
    │                               │  authMiddleware: verify cookie│
    │                               │  req.userId = payload.userId  │
    │  200 {user, profile}          │  Fetch user + profile ───────►│
    │ ◄─────────────────────────────│                               │
```

### Data Flow

1. **Feed** — The frontend calls `GET /get_all_posts` (public). Posts are sorted newest-first client-side.
2. **Interactions** — Likes, comments, and connection requests go through authenticated POST endpoints.
3. **Profile** — `GET /get_user_and_profile` fetches the current user. `GET /user/get_all_users` fetches all profiles for the suggestions engine.
4. **File uploads** — Profile pictures and post media are sent as `multipart/form-data` and stored on disk in `backend/uploads/`.
5. **Optimistic updates** — The frontend updates the UI immediately on likes and reverts if the API call fails.

---

## API Endpoints Summary

### Public Endpoints

| Method | Endpoint                  | Description                        |
| ------ | ------------------------- | ---------------------------------- |
| `POST` | `/register`               | Create a new account               |
| `POST` | `/login`                  | Sign in and get a JWT              |
| `GET`  | `/get_all_posts`          | Fetch all posts (feed)             |
| `GET`  | `/get_comment?postId=<id>`| Fetch comments for a post          |

### Authenticated Endpoints (🔒 session cookie required)

| Method | Endpoint                              | Description                            |
| ------ | ------------------------------------- | -------------------------------------- |
| `GET`  | `/get_user_and_profile`               | Get own user + profile                 |
| `POST` | `/user_update`                        | Update account (name, email, username) |
| `POST` | `/update_profile_data`                | Update professional profile            |
| `POST` | `/update_profile_picture`             | Upload profile picture                 |
| `GET`  | `/user/get_all_users`                 | Get all user profiles                  |
| `GET`  | `/user/download_resume?id=<id>`       | Generate PDF résumé                    |
| `POST` | `/post`                               | Create a new post (with media)         |
| `POST` | `/delete_post`                        | Delete own post                        |
| `POST` | `/increment_likes`                    | Like a post                            |
| `POST` | `/decrement_likes`                    | Unlike a post                          |
| `POST` | `/comment_post`                       | Add a comment                          |
| `POST` | `/delete_comment_of_user`             | Delete own comment                     |
| `POST` | `/user/send_connection_request`       | Send connection request                |
| `GET`  | `/user/get_connection_request`        | Get sent requests                      |
| `GET`  | `/user/user_connection_request`       | Get received requests                  |
| `POST` | `/user/accept_connection_request`     | Accept or reject a request             |

Errors from every endpoint share one shape: `{ "error": { "code": "...", "message": "..." } }`.

> For full request/response details, see the [Backend README](backend/README.md).

---

## Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User      │       │    Profile        │       │    Post     │
├──────────────┤       ├──────────────────┤       ├─────────────┤
│ name         │◄──────│ userId (ref)      │       │ userId (ref)│
│ username (u) │       │ bio              │       │ body        │
│ email (u)    │       │ currentPost      │       │ likes       │
│ password     │       │ pastWork []      │       │ likedBy []  │
│ profilePic   │       │ education []     │       │ media       │
│ active       │       └──────────────────┘       │ fileType    │
│ createdAt    │                                   │ createdAt   │
└──────┬───────┘                                   └──────┬──────┘
       │                                                  │
       │      ┌────────────────────┐              ┌───────┴──────┐
       │      │ ConnectionRequest  │              │   Comment    │
       │      ├────────────────────┤              ├──────────────┤
       ├─────►│ userId (sender)    │              │ userId (ref) │
       └─────►│ connectionId (recv)│              │ postId (ref) │
              │ status_accepted    │              │ body         │
              └────────────────────┘              └──────────────┘

(u) = unique index
```

---

## Frontend Components

| Route / component | File | Responsibility |
| --- | --- | --- |
| `/` | `src/pages/Landing.jsx` | Marketing page with a live sample swipe deck |
| `/login`, `/signup` | `src/pages/Login.jsx`, `Signup.jsx` | Auth forms; login returns you to the page that asked |
| `/feed` | `src/pages/Feed.jsx` | Swipe deck, comments, delete, share |
| `/people` | `src/pages/People.jsx` | Searchable directory with connect buttons |
| `/network` | `src/pages/Network.jsx` | Connections, invitations and sent requests |
| `/u/:username` | `src/pages/Profile.jsx` | Profile header, résumé, posts, PDF export |
| `/settings` | `src/pages/Settings.jsx` | Photo, account, résumé editor, theme, logout |
| `AppShell` | `src/components/layout/AppShell.jsx` | Rails, mobile tab bar, account menu, composer |
| `SwipeDeck` | `src/components/feed/SwipeDeck.jsx` | Drag/keyboard/button swiping with Motion |
| `SessionProvider` | `src/context/SessionProvider.jsx` | Token, user, profiles, requests, posts |

---

## Design System

Nexora uses a **Mono + Signal** system: the interface stays neutral so people's posts carry the colour.

- **Zinc neutrals** with a single **hot coral (`#FF5A36`)** accent for likes, active states, focus and the logo
- **Geist** for UI and headings, **Geist Mono** for handles, counts and timestamps
- **Pill buttons**, 16px cards, 1px hairline borders, shadows only where something floats
- **One signature motion**: the spring-physics swipe deck; everything else is short fades
- **Light, dark and system** themes, `prefers-reduced-motion` respected

Full rules, contrast notes and copy guidelines: [`DESIGN.md`](DESIGN.md).

---

## Screenshots

> _Coming soon — run the app locally to see the full experience._

---

## Environment Variables

The backend requires a `.env` file in `backend/`:

| Variable          | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `MONGO_URI`       | MongoDB connection string (required)                          |
| `JWT_SECRET`      | At least 32 characters (required)                             |
| `PORT`            | Server port (default `3000`)                                  |
| `CLIENT_ORIGIN`   | CORS allowlist, comma-separated (default the Vite dev server) |
| `UPLOAD_DIR`      | Upload folder (default `backend/uploads`)                     |
| `AUTH_RATE_LIMIT` | Login/register attempts per IP per 15 min (default `20`)      |

Copy `backend/.env.example` to `backend/.env`. The server validates these at startup and exits with a clear message if any are missing or invalid. Details: [Backend README](backend/README.md#environment-variables).

The frontend has **no environment variables** — it dynamically derives the API URL from the browser's hostname.

---

## Roadmap

- [ ] Real-time notifications with WebSocket
- [ ] Direct messaging between connections
- [ ] Image compression and CDN-backed media storage
- [ ] Post search and hashtag filtering
- [ ] Admin dashboard for content moderation
- [ ] Email verification on registration
- [ ] Password reset flow
- [ ] Deployment guides (Vercel + Railway / Render)

---

## Contributing

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a **Pull Request**

Please follow the existing code style and test your changes locally before submitting.

---

## Author

**Akash Shrivastav**

- Email: [shrivastav.work@gmail.com](mailto:shrivastav.work@gmail.com)
- LinkedIn: [shrivastavakash](https://www.linkedin.com/in/shrivastavakash/)
- X (Twitter): [@_akashrivastav_](https://x.com/_akashrivastav_)

---

## License

ISC
