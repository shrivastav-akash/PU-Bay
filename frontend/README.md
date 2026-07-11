# PU-Bay — Frontend

Single-page React application for the PU-Bay campus social network, featuring a **swipeable card feed**, **résumé-style profiles**, and a **campus connections** system. Built with **React 19**, **Vite 8**, and a custom **neo-brutalist design system**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Design System](#design-system)
  - [Colour Tokens](#colour-tokens)
  - [Typography](#typography)
  - [Interaction Classes](#interaction-classes)
- [Architecture](#architecture)
- [Components](#components)
  - [App](#app)
  - [Navbar](#navbar)
  - [Auth](#auth)
  - [PostCard](#postcard)
  - [ProfilePanel](#profilepanel)
  - [Avatar](#avatar)
- [Features](#features)
- [API Integration](#api-integration)
- [Scripts](#scripts)

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| UI Library       | React 19                                 |
| Build Tool       | Vite 8 + `@vitejs/plugin-react`          |
| Icons            | Lucide React                             |
| Styling          | Vanilla CSS (CSS custom properties)      |
| Fonts            | Bricolage Grotesque + Hanken Grotesk     |
| Linting          | ESLint 10 with React Hooks plugin        |

---

## Project Structure

```
frontend/
├── public/
│   ├── favicon.svg            # Custom app favicon
│   └── icons.svg              # Shared SVG icon sprite
├── src/
│   ├── assets/
│   │   ├── hero.png           # Landing page hero image
│   │   ├── react.svg          # React logo (Vite default)
│   │   └── vite.svg           # Vite logo (Vite default)
│   ├── components/
│   │   ├── Auth.jsx           # Login / Register form
│   │   ├── Avatar.jsx         # Reusable user avatar
│   │   ├── Navbar.jsx         # Top navigation bar
│   │   ├── PostCard.jsx       # Swipeable post card
│   │   └── ProfilePanel.jsx   # Slide-out profile panel
│   ├── App.css                # Cleared (styles in index.css)
│   ├── App.jsx                # Root component & app state
│   ├── config.js              # API base URL & auth helpers
│   ├── index.css              # Full design system & tokens
│   └── main.jsx               # React entry point
├── index.html                 # HTML shell with font preloads
├── vite.config.js             # Vite configuration
├── eslint.config.js           # ESLint configuration
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- The [backend server](../backend/README.md) running on port `3000` (or your chosen port)

### Installation

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Run the Dev Server

```bash
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. The frontend auto-detects the backend API URL as `http://<current-hostname>:3000`.

### Build for Production

```bash
npm run build
```

The output goes to `dist/`. Preview it locally with:

```bash
npm run preview
```

---

## Design System

The UI uses a custom **editorial / neo-brutalist** design system defined entirely through CSS custom properties in [`index.css`](src/index.css).

### Colour Tokens

The app supports **light** and **dark** themes, toggled via `data-theme="dark"` on `<html>`.

| Token            | Light             | Dark              | Purpose                            |
| ---------------- | ----------------- | ----------------- | ---------------------------------- |
| `--paper`        | `#F1ECDF`         | `#0E0C08`         | Page background                    |
| `--card`         | `#FFFFFF`         | `#1A1610`         | Card / surface background          |
| `--ink`          | `#1B160D`         | `#F4EEE1`         | Primary text                       |
| `--soft`         | `#766B57`         | `#9C9281`         | Secondary / muted text             |
| `--accent`       | `#EE4A12`         | `#FF5D29`         | Brand accent (buttons, links)      |
| `--accent-ink`   | `#FFF6F0`         | `#1A0E06`         | Text on accent backgrounds         |
| `--butter`       | `#FFB627`         | `#FFC54C`         | Avatar fallback background         |
| `--good`         | `#1B7A4B`         | `#37C77F`         | Success / connected state          |
| `--danger`       | `#CE3A24`         | `#F2664E`         | Destructive actions                |
| `--border`       | `#E0D8C6`         | `#2A2418`         | Subtle borders                     |
| `--line`         | `#1B160D`         | `#3A3324`         | Strong borders (cards, buttons)    |
| `--shadow`       | `#1B160D`         | `#000000`         | Offset box-shadow                  |
| `--pill`         | `#F4EFE2`         | `#221C12`         | Input / tag background             |

### Typography

| Font                   | Usage           | Loaded From      |
| ---------------------- | --------------- | ---------------- |
| **Bricolage Grotesque**| Headings, logos | Google Fonts     |
| **Hanken Grotesk**     | Body text, UI   | Google Fonts     |

### Interaction Classes

| Class            | Effect                                              |
| ---------------- | --------------------------------------------------- |
| `.pu-press`      | Hover lifts -1px, active pushes +2px (button feel)  |
| `.pu-lift`       | Hover lifts -1px (card hover)                       |
| `.pu-bd`         | Hover strengthens border colour                     |
| `.pu-bd-accent`  | Hover tints border & text to accent                 |
| `.pu-bd-danger`  | Hover tints border to danger red                    |
| `.pu-input`      | Focus border shifts to accent                       |
| `.pu-hov-accent` | Hover text colour → accent                          |
| `.pu-hov-ink`    | Hover text colour → ink                             |
| `.pu-rise`       | Entry animation (fade-in + slide-up)                |

### Animations

| Keyframe     | Usage                                |
| ------------ | ------------------------------------ |
| `pu-rise`    | Component mount fade-in + slide-up   |
| `pu-float`   | Landing page floating card effect    |
| `pu-toast`   | Toast notification entrance          |

---

## Architecture

The app follows a **single-page, state-lifted** architecture:

```
main.jsx
 └── App.jsx                    ← Central state (auth, feed, profile, connections)
      ├── Navbar                ← Navigation, theme toggle, post CTA
      ├── Auth                  ← Login / Register (when logged out)
      ├── Landing Section       ← Marketing hero + feature cards (when logged out)
      ├── Feed (PostCard deck)  ← Swipeable card stack (when logged in)
      ├── ProfilePanel (aside)  ← Slide-out résumé / network / edit panel
      ├── Create Post Modal     ← New post form with media upload
      ├── Privacy Modal         ← Privacy policy
      ├── Contact Modal         ← Creator contact info
      └── Toast                 ← Notification pop-up
```

**State management** is handled entirely with React hooks (`useState`, `useEffect`, `useCallback`, `useRef`). There is no external state library — all state lives in the root `App` component and flows down as props.

**Theme** is persisted in `localStorage` and applied via `data-theme` attribute on the document root.

**Authentication** tokens are stored in `localStorage` and sent via `Authorization: Bearer <token>` headers using the `authHeaders()` helper.

---

## Components

### App
**File:** [`src/App.jsx`](src/App.jsx)

The root component managing all application state including:
- **Authentication** — token, user data, login/logout flow
- **Feed** — posts array, current feed index, drag/swipe mechanics
- **Profile** — own profile, viewed profile, profile panel open/close state
- **Connections** — sent requests, received requests, all profiles
- **Modals** — create post, privacy, contact
- **Theme** — light/dark toggle with `localStorage` persistence

Key interactions:
- **Swipeable feed** — Pointer drag with gesture detection (> 110px = action). Cards stack in a deck with 3 layers visible.
- **Keyboard navigation** — Arrow left/right to skip/like posts.
- **Optimistic updates** — Likes update the UI immediately, reverting on API failure.

### Navbar
**File:** [`src/components/Navbar.jsx`](src/components/Navbar.jsx)

Sticky top navigation with:
- PU·Bay logo and branding
- **+ Post** button (logged in)
- User avatar pill (opens profile panel)
- **Sign in** button (logged out)
- Theme toggle (sun/moon icons)
- Logout button

### Auth
**File:** [`src/components/Auth.jsx`](src/components/Auth.jsx)

A card-based authentication form that toggles between:
- **Login** — email + password
- **Register** — name, username, email, password

Includes error display, loading states, and a "Back to landing" link.

### PostCard
**File:** [`src/components/PostCard.jsx`](src/components/PostCard.jsx)

A full-height card representing a single post in the swipeable deck:
- Author info (avatar, name, headline, time ago)
- Post body text with "read more" truncation (210 chars)
- Media (image or video)
- **Swipe stamps** — "LIKED" / "SKIP" overlays that appear during drag
- **Action footer** — Skip (✕), Heart/Like, Comment toggle, Share/Delete, Like & Next (❤)
- **Inline comments** — Expandable comment section with send form
- **Connection actions** — Connect / Pending / Connected status per author

### ProfilePanel
**File:** [`src/components/ProfilePanel.jsx`](src/components/ProfilePanel.jsx)

A slide-out side panel (desktop) or full-screen overlay (mobile) with four tabs:

| Tab         | Content                                                          |
| ----------- | ---------------------------------------------------------------- |
| **Résumé**  | Work experience, education, latest post, PDF download            |
| **Network** | Active connections, pending invitations, sent requests, suggestions |
| **Edit**    | Account details form, professional details, add work/education   |
| **Posts**   | All posts by this user                                           |

Features:
- Profile picture upload with camera icon overlay
- Connection actions (Accept / Ignore / Connect / Pending)
- PDF résumé generation via backend API
- Inline editing of work history & education entries

### Avatar
**File:** [`src/components/Avatar.jsx`](src/components/Avatar.jsx)

A shared component that renders:
- The user's uploaded profile picture (if set)
- A butter-coloured initial badge fallback (first letter of name)
- Configurable size, additional styles, and className

---

## Features

| Feature                   | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| 🃏 **Swipeable feed**     | Tinder-style card deck with drag gestures & keyboard navigation    |
| 🌓 **Dark / Light mode**  | Theme toggle with localStorage persistence                         |
| 📝 **Create posts**       | Text + media (image/video) upload with live preview                |
| 💬 **Comments**           | Inline comment thread on each post card                            |
| ❤️ **Likes**              | Optimistic like/unlike with user-specific tracking                 |
| 📄 **Résumé profiles**    | Work history, education, bio, downloadable PDF                     |
| 🤝 **Connections**        | Send, accept, reject connection requests                           |
| 👥 **People suggestions** | "People you may know" based on existing connections                |
| 📱 **Responsive**         | Adaptive layout for mobile (< 860px) and desktop                   |
| 🎨 **Neo-brutalist UI**   | Offset shadows, strong borders, bold typography                    |
| 🔔 **Toast notifications**| Ephemeral confirmation messages                                    |

---

## API Integration

All API calls go through the backend server. The base URL is dynamically built as:

```js
export const API_BASE_URL = `http://${window.location.hostname}:3000`;
```

The `authHeaders()` helper constructs the `Authorization` and optional `Content-Type` headers:

```js
export const authHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
```

---

## Scripts

| Script    | Command           | Description                         |
| --------- | ----------------- | ----------------------------------- |
| `dev`     | `npm run dev`     | Start Vite dev server with HMR      |
| `build`   | `npm run build`   | Production build to `dist/`         |
| `preview` | `npm run preview` | Preview production build locally    |
| `lint`    | `npm run lint`    | Run ESLint across the project       |

---

## Author

**Akash Shrivastav**
