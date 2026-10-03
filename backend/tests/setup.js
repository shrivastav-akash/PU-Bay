import fs from "fs";
import mongoose from "mongoose";
import { afterAll, beforeAll } from "vitest";

// Runs before each test file is imported, i.e. before lib/uploads.js creates the folder.
fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
