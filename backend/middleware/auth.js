import jwt from "jsonwebtoken";

// Central authentication: verifies a JWT from the Authorization header and
// attaches the authenticated user id to req.userId. Tokens are never read from
// the request body or query string (they would leak into logs/history).
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "authentication required" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "invalid or expired token" });
  }
};

export default authMiddleware;
