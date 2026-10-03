import os from "os";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Files share one throwaway database, so they run one at a time.
    fileParallelism: false,
    setupFiles: ["./tests/setup.js"],
    env: {
      // Needs a local mongod; never points at the dev database.
      MONGO_URI: "mongodb://127.0.0.1:27017/nexora_test",
      JWT_SECRET: "test-only-secret-that-is-at-least-32-characters",
      UPLOAD_DIR: path.join(os.tmpdir(), "nexora-test-uploads"),
      AUTH_RATE_LIMIT: "1000",
      CLIENT_ORIGIN: "http://localhost:5173",
    },
  },
});
