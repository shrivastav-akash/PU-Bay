import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import RevokedToken from "../models/revokedToken.model.js";
import User from "../models/user.model.js";

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

// `user` must be loaded with +tokenVersion.
export function startSession(res, user) {
  // jti identifies this one session so logout can revoke it without
  // touching the same user's other devices; ver ties it to the user's
  // current tokenVersion so "log out everywhere" can revoke them all.
  const token = jwt.sign({ userId: user._id, ver: user.tokenVersion ?? 0 }, env.JWT_SECRET, {
    expiresIn: `${SESSION_DAYS}d`,
    jwtid: crypto.randomUUID(),
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export function readSession(req) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join("="));
  }
  return null;
}

// Returns the payload of a valid, unrevoked session token, or null.
export async function verifySession(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
  // Tokens from before revocation existed carry no jti and can't be revoked,
  // so they are refused; those users simply sign in again.
  if (!payload.jti) return null;
  const [revoked, user] = await Promise.all([
    RevokedToken.exists({ jti: payload.jti }),
    User.findById(payload.userId).select("+tokenVersion").lean(),
  ]);
  // A deleted account, or one that logged out everywhere since, ends here.
  if (revoked || !user || (user.tokenVersion ?? 0) !== (payload.ver ?? 0)) return null;
  return payload;
}

// Invalidates every session of the user, on every device.
export async function endAllSessions(userId, res) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

// Revokes the request's session (if it has a valid one) and clears the cookie.
export async function endSession(req, res) {
  const token = readSession(req);
  const payload = token && (await verifySession(token));
  if (payload) {
    // Upsert: logging out twice with the same cookie is harmless.
    await RevokedToken.updateOne(
      { jti: payload.jti },
      { $setOnInsert: { expiresAt: new Date(payload.exp * 1000) } },
      { upsert: true },
    );
  }
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}
