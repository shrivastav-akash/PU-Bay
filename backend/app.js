import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { checkOrigin } from "./middleware/origin.js";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";

// Defence in depth behind Zod: operator objects such as { $ne: null } in
// query filters are treated as literal values. Intentional operators use
// mongoose.trusted().
mongoose.set("sanitizeFilter", true);

const app = express();

// credentials: the session cookie travels with requests from the allowed origins only.
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(checkOrigin);
app.use(express.json());

app.use(userRoutes);
app.use(postRoutes);
app.use(
  express.static(env.UPLOAD_DIR, {
    // Uploads are served by extension; never let a browser sniff them into HTML.
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "root is working" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
