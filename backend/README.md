# PU-Bay — Backend

REST API server for the PU-Bay campus social network, built with **Express 5**, **MongoDB** (Mongoose), and **JWT authentication**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [User & Profile](#user--profile)
  - [Posts](#posts)
  - [Comments](#comments)
  - [Connections](#connections)
- [Database Models](#database-models)
- [Authentication Flow](#authentication-flow)
- [File Uploads](#file-uploads)
- [Scripts](#scripts)

---

## Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js (ES Modules)             |
| Framework        | Express 5                        |
| Database         | MongoDB Atlas via Mongoose 9     |
| Authentication   | JWT (`jsonwebtoken`) + bcrypt    |
| File Uploads     | Multer (disk storage)            |
| PDF Generation   | PDFKit                           |
| Dev Server       | Nodemon                          |

---

## Project Structure

```
backend/
├── controllers/
│   ├── posts.controller.js    # Post CRUD, likes, comments
│   └── user.controller.js     # Auth, profile, connections, PDF resume
├── middleware/
│   └── auth.js                # JWT verification middleware
├── models/
│   ├── comments.model.js      # Comment schema
│   ├── connections.model.js   # Connection request schema
│   ├── posts.model.js         # Post schema (with likes, media)
│   ├── profile.model.js       # Extended profile (work, education)
│   └── user.model.js          # Core user schema
├── routes/
│   ├── posts.routes.js        # Post & comment endpoints
│   └── user.routes.js         # Auth, profile, connection endpoints
├── uploads/                   # Multer file storage directory
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Template for required env vars
├── .gitignore
├── package.json
└── server.js                  # Application entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

### Configuration

Create a `.env` file based on the provided example:

```bash
cp .env.example .env
```

Fill in the required values (see [Environment Variables](#environment-variables) below).

### Run the Server

```bash
# Development (with hot-reload via Nodemon)
npm run dev
```

The server starts on the port defined in your `.env` file (default: `3000`).

---

## Environment Variables

| Variable     | Description                                    | Example                              |
| ------------ | ---------------------------------------------- | ------------------------------------ |
| `PORT`       | Port the server listens on                     | `3000`                               |
| `MONGO_URI`  | MongoDB connection string                      | `mongodb+srv://user:pass@host/db`    |
| `JWT_SECRET` | Secret key for signing/verifying JWT tokens    | A long random string                 |

---

## API Reference

All responses follow a consistent shape:

```json
{
  "success": true | false,
  "message": "...",
  "data": { ... }      // present on success where applicable
}
```

### Authentication

#### `POST /register`

Create a new user account. A blank profile is automatically created alongside the user.

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `name`     | string | ✅       |
| `username` | string | ✅       |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Responses:** `200` success · `400` missing fields · `409` user already exists

#### `POST /login`

Authenticate and receive a JWT token (valid for 7 days).

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Response data:**
```json
{ "message": "login successful", "token": "<jwt>" }
```

**Responses:** `200` success · `400` missing fields · `404` user not found · `401` wrong password

---

### User & Profile

> 🔒 All endpoints below require the `Authorization: Bearer <token>` header.

#### `GET /get_user_and_profile`

Returns the authenticated user's account details and full profile.

#### `POST /user_update`

Update account fields (name, username, email). Validates uniqueness of username/email.

| Field      | Type   |
| ---------- | ------ |
| `name`     | string |
| `username` | string |
| `email`    | string |

#### `POST /update_profile_data`

Update professional profile (bio, headline, work history, education).

| Field         | Type     |
| ------------- | -------- |
| `bio`         | string   |
| `currentPost` | string   |
| `pastWork`    | array    |
| `education`   | array    |

#### `POST /update_profile_picture`

Upload a profile picture. Send as `multipart/form-data` with a `profile_picture` file field.

#### `GET /user/get_all_users`

Returns all user profiles (used for the connections/suggestions feature).

#### `GET /user/download_resume?id=<profileId>`

Generates a PDF résumé from the user's profile data and returns the download path.

---

### Posts

#### `GET /get_all_posts` *(public)*

Returns all posts, populated with author info (`name`, `username`, `profilePicture`).

#### `POST /post` 🔒

Create a new post. Send as `multipart/form-data`.

| Field   | Type   | Required | Description                  |
| ------- | ------ | -------- | ---------------------------- |
| `body`  | string | ✅       | Post text content            |
| `media` | file   | ❌       | Image or video attachment    |

#### `POST /delete_post` 🔒

Delete a post (only the author can delete their own post).

| Field    | Type   | Required |
| -------- | ------ | -------- |
| `postId` | string | ✅       |

#### `POST /increment_likes` 🔒

Like a post (idempotent — won't double-like).

| Field    | Type   | Required |
| -------- | ------ | -------- |
| `postId` | string | ✅       |

#### `POST /decrement_likes` 🔒

Remove a like from a post.

| Field    | Type   | Required |
| -------- | ------ | -------- |
| `postId` | string | ✅       |

---

### Comments

#### `GET /get_comment?postId=<id>` *(public)*

Returns all comments for a specific post, populated with author info.

#### `POST /comment_post` 🔒

Add a comment to a post.

| Field         | Type   | Required |
| ------------- | ------ | -------- |
| `postId`      | string | ✅       |
| `commentBody` | string | ✅       |

#### `POST /delete_comment_of_user` 🔒

Delete a comment (only the comment author can delete it).

| Field       | Type   | Required |
| ----------- | ------ | -------- |
| `commentId` | string | ✅       |

---

### Connections

#### `POST /user/send_connection_request` 🔒

Send a connection request to another user.

| Field        | Type   | Required |
| ------------ | ------ | -------- |
| `receiverId` | string | ✅       |

#### `GET /user/get_connection_request` 🔒

Returns all connection requests **sent by** the authenticated user.

#### `GET /user/user_connection_request` 🔒

Returns all connection requests **received by** the authenticated user.

#### `POST /user/accept_connection_request` 🔒

Accept or reject a received connection request (only the recipient can act).

| Field          | Type   | Required | Values              |
| -------------- | ------ | -------- | ------------------- |
| `connectionId` | string | ✅       | The request `_id`   |
| `action_type`  | string | ✅       | `"accept"` or `"reject"` |

---

## Database Models

### User

| Field            | Type     | Notes                    |
| ---------------- | -------- | ------------------------ |
| `name`           | String   | Required                 |
| `username`       | String   | Required, unique         |
| `email`          | String   | Required, unique         |
| `password`       | String   | Hashed with bcrypt       |
| `profilePicture` | String   | Defaults to `default.jpg`|
| `active`         | Boolean  | Defaults to `true`       |
| `createdAt`      | Date     | Auto-generated           |

### Profile

| Field         | Type       | Notes                           |
| ------------- | ---------- | ------------------------------- |
| `userId`      | ObjectId   | References `User`               |
| `bio`         | String     | Short biography                 |
| `currentPost` | String     | Current job title / headline    |
| `pastWork`    | [Object]   | `{ company, position, years }`  |
| `education`   | [Object]   | `{ school, degree, fieldOfStudy }` |

### Post

| Field       | Type       | Notes                                |
| ----------- | ---------- | ------------------------------------ |
| `userId`    | ObjectId   | References `User`                    |
| `body`      | String     | Required                             |
| `likes`     | Number     | Derived from `likedBy.length`        |
| `likedBy`   | [ObjectId] | Users who liked the post             |
| `media`     | String     | Uploaded file name                   |
| `fileType`  | String     | MIME subtype (e.g., `jpeg`, `mp4`)   |
| `active`    | Boolean    | Soft-delete flag                     |
| `createdAt` | Date       | Auto-generated                       |

### Comment

| Field    | Type     | Notes             |
| -------- | -------- | ----------------- |
| `userId` | ObjectId | References `User` |
| `postId` | ObjectId | References `Post` |
| `body`   | String   | Required          |

### ConnectionRequest

| Field             | Type     | Notes                                    |
| ----------------- | -------- | ---------------------------------------- |
| `userId`          | ObjectId | Sender — references `User`               |
| `connectionId`    | ObjectId | Receiver — references `User`             |
| `status_accepted` | Boolean  | `null` = pending, `true` = accepted, `false` = rejected |

---

## Authentication Flow

1. User registers via `POST /register` → password is hashed with **bcrypt** (10 salt rounds).
2. User logs in via `POST /login` → server returns a **JWT** signed with `JWT_SECRET`, valid for **7 days**.
3. For protected routes, the client sends `Authorization: Bearer <token>`.
4. The `authMiddleware` verifies the token and injects `req.userId` for downstream handlers.
5. Tokens are **never** read from query strings or request bodies — only from the `Authorization` header.

---

## File Uploads

- All uploads are stored in the `uploads/` directory using **Multer disk storage**.
- The `uploads/` folder is served as a static directory, so files are accessible at `http://localhost:<PORT>/<filename>`.
- Supported for: profile pictures (`image/*`) and post media (`image/*`, `video/*`).
- Files are saved with their **original filename**.

---

## Scripts

| Script      | Command            | Description                       |
| ----------- | ------------------ | --------------------------------- |
| `dev`       | `npm run dev`      | Start dev server with Nodemon     |
| `test`      | `npm test`         | Placeholder (not yet configured)  |

---

## Author

**Akash Shrivastav**

---

## License

ISC
