<p align="center">
  <strong>PU·Bay</strong><br/>
  <em>Your campus, one swipe at a time.</em>
</p>

---

# PU-Bay

**PU-Bay** is a full-stack social networking platform built for **Presidency University** students. It combines a **swipeable card feed** (inspired by Tinder's UX), **résumé-style professional profiles**, and a **campus connection system** — all wrapped in a distinctive **neo-brutalist** design language.

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

PU-Bay solves a common problem on university campuses: students lack a dedicated, student-only platform to share updates, showcase their work, build professional profiles, and connect with peers across departments.

**What makes PU-Bay different:**
- **Swipe-first feed** — Browse posts by dragging cards left (skip) or right (like), or use keyboard arrows.
- **Résumé profiles** — Every student gets a recruiter-ready profile with work experience, education, and a downloadable PDF résumé.
- **Connection requests** — Send, accept, or reject connection requests to build your campus network.
- **No distractions** — No ads, no algorithm, no infinite scroll — just your batch, one card at a time.

---

## Features

| Feature                         | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| 🃏 **Swipeable card feed**      | Tinder-style deck with drag gestures, keyboard arrows, and stacked cards   |
| 📝 **Rich posts**               | Text posts with image and video media attachments                          |
| ❤️ **Likes**                    | Like/unlike posts with optimistic UI updates and per-user tracking         |
| 💬 **Comments**                  | Inline comment threads on each post                                        |
| 📄 **Professional profiles**    | Bio, headline, work experience, education history                          |
| 📥 **PDF résumé export**        | Generate and download a PDF résumé from any profile                        |
| 🤝 **Campus connections**       | Send, accept, and reject connection requests                               |
| 👥 **People suggestions**       | "People you may know" recommendations                                      |
| 🌓 **Dark / Light mode**        | Theme toggle with localStorage persistence                                 |
| 📱 **Fully responsive**         | Adaptive layouts for mobile (< 860px) and desktop                          |
| 🔐 **Secure authentication**    | bcrypt password hashing + JWT tokens in Authorization headers              |
| 🎨 **Neo-brutalist design**     | Offset shadows, bold borders, editorial typography                         |
| 🔔 **Toast notifications**      | Ephemeral feedback messages for user actions                               |
| 📸 **Profile picture upload**   | Custom avatar with camera-icon upload overlay                              |

---

## Tech Stack

### Frontend

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| React 19                | UI library                     |
| Vite 8                  | Build tool & dev server        |
| Lucide React            | Icon library                   |
| Vanilla CSS             | Custom design system (tokens)  |
| Google Fonts            | Bricolage Grotesque + Hanken Grotesk |

### Backend

| Technology              | Purpose                        |
| ----------------------- | ------------------------------ |
| Node.js                 | Runtime (ES Modules)           |
| Express 5               | HTTP framework                 |
| MongoDB + Mongoose 9    | Database + ODM                 |
| JWT (jsonwebtoken)      | Authentication tokens          |
| bcrypt                  | Password hashing               |
| Multer                  | File upload handling           |
| PDFKit                  | Résumé PDF generation          |
| Nodemon                 | Dev server hot-reload          |

---

## Project Structure

```
PU-Bay/
├── backend/                           # Express API server
│   ├── controllers/
│   │   ├── posts.controller.js        # Post CRUD, likes, comments
│   │   └── user.controller.js         # Auth, profile, connections, PDF
│   ├── middleware/
│   │   └── auth.js                    # JWT verification middleware
│   ├── models/
│   │   ├── comments.model.js          # Comment schema
│   │   ├── connections.model.js       # Connection request schema
│   │   ├── posts.model.js             # Post schema
│   │   ├── profile.model.js           # Professional profile schema
│   │   └── user.model.js              # Core user schema
│   ├── routes/
│   │   ├── posts.routes.js            # Post & comment routes
│   │   └── user.routes.js             # Auth, profile, connection routes
│   ├── uploads/                       # File storage (Multer)
│   ├── server.js                      # Entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                          # React SPA (Vite)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx               # Login / Register
│   │   │   ├── Avatar.jsx             # User avatar (image or initial)
│   │   │   ├── Navbar.jsx             # Top navigation bar
│   │   │   ├── PostCard.jsx           # Swipeable post card
│   │   │   └── ProfilePanel.jsx       # Profile side panel
│   │   ├── App.jsx                    # Root component
│   │   ├── config.js                  # API URL & auth helpers
│   │   ├── index.css                  # Design system (tokens + utilities)
│   │   └── main.jsx                   # React mount point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .gitignore
│
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
│   React Frontend    │    Authorization: Bearer     │   Express Backend   │
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
    │  200 "user created"           │                               │
    │ ◄─────────────────────────────│                               │
    │                               │                               │
    │  POST /login                  │                               │
    │  {email, password}            │                               │
    │ ─────────────────────────────►│                               │
    │                               │  bcrypt.compare()             │
    │                               │  jwt.sign({userId}, 7d)       │
    │  200 {token: "<jwt>"}         │                               │
    │ ◄─────────────────────────────│                               │
    │                               │                               │
    │  GET /get_user_and_profile    │                               │
    │  Authorization: Bearer <jwt>  │                               │
    │ ─────────────────────────────►│                               │
    │                               │  authMiddleware: verify JWT   │
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

### Authenticated Endpoints (🔒 Bearer token required)

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

| Component      | File                           | Responsibility                                           |
| -------------- | ------------------------------ | -------------------------------------------------------- |
| `App`          | `src/App.jsx`                  | Root state, feed logic, routing, modals, theme           |
| `Navbar`       | `src/components/Navbar.jsx`    | Sticky header, branding, navigation actions              |
| `Auth`         | `src/components/Auth.jsx`      | Login / Register card with form validation               |
| `PostCard`     | `src/components/PostCard.jsx`  | Swipeable card with media, comments, connections         |
| `ProfilePanel` | `src/components/ProfilePanel.jsx` | Side panel with résumé, network, edit, and posts tabs |
| `Avatar`       | `src/components/Avatar.jsx`    | User avatar with image or initial fallback               |

---

## Design System

PU-Bay uses a custom **editorial / neo-brutalist** aesthetic:

- **Bold, offset shadows** on all cards and buttons
- **Strong black borders** for clear component separation
- **Warm, earthy tones** — cream paper, burnt orange accent, golden butter
- **Bricolage Grotesque** for headings — tight letter-spacing, heavy weight
- **Hanken Grotesk** for body text — clean and highly legible
- **Micro-animations** — press effects, lift hovers, rise entries, float loops
- **Dot-grid background** — subtle, editorial-style pattern

Both light and dark themes maintain the same bold aesthetic while adapting colours for readability.

---

## Screenshots

> _Coming soon — run the app locally to see the full experience._

---

## Environment Variables

The backend requires a `.env` file in `backend/`:

| Variable     | Description                                 |
| ------------ | ------------------------------------------- |
| `PORT`       | Server port (default: `3000`)               |
| `MONGO_URI`  | MongoDB connection string                   |
| `JWT_SECRET` | Secret key for JWT signing & verification   |

A `.env.example` template is provided:

```env
MONGO_URI=
PORT=
JWT_SECRET=replace_with_a_long_random_secret
```

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
