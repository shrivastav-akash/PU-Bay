import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "nexora_session";
const SESSION_DAYS = 7;

// httpOnly: page scripts (and any injected script) can't read the token.
// SameSite=Lax: browsers don't attach it to cross-site POSTs, the CSRF vector.
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
};

export function startSession(res, userId) {
  const token = jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

// ponytail: stateless JWT, so logout removes the cookie but a copied token stays valid until it expires; add a denylist or token version if that matters.
export function endSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

export function readSession(req) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join("="));
  }
  return null;
}
