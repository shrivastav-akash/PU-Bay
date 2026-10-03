import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// CSRF guard for cookie sessions. SameSite=Lax already keeps the cookie off
// cross-site POSTs; this also blocks same-site pages on other origins (another
// port or subdomain). Browsers always send Origin on POST; requests without
// one (curl, scripts) aren't carrying a victim's browser cookie.
export const checkOrigin = (req, res, next) => {
  const origin = req.get("origin");
  if (SAFE_METHODS.has(req.method) || !origin || env.CLIENT_ORIGIN.includes(origin)) return next();
  next(new HttpError(403, "FORBIDDEN_ORIGIN", "Request origin not allowed"));
};
