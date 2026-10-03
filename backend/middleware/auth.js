import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { readSession } from "../lib/session.js";

// Central authentication: verifies the JWT in the httpOnly session cookie and
// attaches the authenticated user id to req.userId. Headers, bodies and query
// strings are never accepted as a source of credentials.
const authMiddleware = (req, res, next) => {
  const token = readSession(req);
  if (!token) {
    return next(new HttpError(401, "UNAUTHENTICATED", "Authentication required"));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    req.userId = payload.userId;
    next();
  } catch {
    next(new HttpError(401, "UNAUTHENTICATED", "Invalid or expired session"));
  }
};

export default authMiddleware;
