import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";

// Central authentication: verifies a JWT from the Authorization header and
// attaches the authenticated user id to req.userId. Tokens are never read from
// the request body or query string (they would leak into logs/history).
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return next(new HttpError(401, "UNAUTHENTICATED", "Authentication required"));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    req.userId = payload.userId;
    next();
  } catch {
    next(new HttpError(401, "UNAUTHENTICATED", "Invalid or expired token"));
  }
};

export default authMiddleware;
