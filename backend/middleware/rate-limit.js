import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

// Brute-force guard for /login and /register, counted per IP.
// ponytail: in-memory store, per process; use a shared store (Redis) if the API ever runs on several instances.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(new HttpError(429, "RATE_LIMITED", "Too many attempts. Try again in a few minutes.")),
});
