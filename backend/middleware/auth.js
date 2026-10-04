import { HttpError } from "../lib/http-error.js";
import { readSession, verifySession } from "../lib/session.js";

// Central authentication: verifies the JWT in the httpOnly session cookie,
// refuses revoked sessions, and attaches the user id to req.userId. Headers,
// bodies and query strings are never accepted as a source of credentials.
const authMiddleware = async (req, res, next) => {
  const token = readSession(req);
  if (!token) {
    return next(new HttpError(401, "UNAUTHENTICATED", "Authentication required"));
  }
  const payload = await verifySession(token);
  if (!payload) {
    return next(new HttpError(401, "UNAUTHENTICATED", "Invalid or expired session"));
  }
  req.userId = payload.userId;
  next();
};

export default authMiddleware;
