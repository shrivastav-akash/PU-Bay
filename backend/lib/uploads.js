import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";
import { HttpError } from "./http-error.js";

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const VIDEO_TYPES = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const upload = (types, maxBytes, label) =>
  multer({
    storage: multer.diskStorage({
      destination: env.UPLOAD_DIR,
      // Server-chosen names: clients can't pick a path or overwrite another
      // user's file, and the extension always matches an allowed type.
      filename: (req, file, cb) => cb(null, crypto.randomUUID() + types[file.mimetype]),
    }),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (req, file, cb) =>
      types[file.mimetype]
        ? cb(null, true)
        : cb(new HttpError(400, "UNSUPPORTED_FILE", `Only ${label} files are allowed`)),
  });

export const postMedia = upload(
  { ...IMAGE_TYPES, ...VIDEO_TYPES },
  25 * 1024 * 1024,
  "JPEG, PNG, WebP, GIF, MP4, WebM or MOV",
).single("media");

export const avatarImage = upload(
  IMAGE_TYPES,
  5 * 1024 * 1024,
  "JPEG, PNG, WebP or GIF",
).single("profile_picture");

const MANAGED = /^[0-9a-f-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/;

// Only deletes files this server named. Legacy uploads kept their original
// names and may be shared between users, so they are never removed.
export function removeUpload(name) {
  if (!name || !MANAGED.test(name)) return;
  fs.rm(path.join(env.UPLOAD_DIR, name), { force: true }, () => {});
}
