import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string({ error: "MONGO_URI is required" }).min(1),
  JWT_SECRET: z
    .string({ error: "JWT_SECRET is required" })
    .min(32, "JWT_SECRET must be at least 32 characters"),
  // Comma-separated list of browser origins allowed by CORS.
  CLIENT_ORIGIN: z
    .string()
    .default(DEFAULT_ORIGINS)
    .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),
  UPLOAD_DIR: z
    .string()
    .default(fileURLToPath(new URL("../uploads", import.meta.url)))
    .transform((dir) => path.resolve(dir)),
  // Attempts per IP per 15 minutes on /login and /register.
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
});

// `KEY=` in .env means "use the default", not "empty string".
const provided = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== ""),
);
const parsed = schema.safeParse(provided);

if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
