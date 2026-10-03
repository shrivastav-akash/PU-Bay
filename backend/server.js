import mongoose from "mongoose";
import { env } from "./config/env.js";
import app from "./app.js";

// Fail fast: an API that can't reach its database shouldn't accept requests.
try {
  await mongoose.connect(env.MONGO_URI);
  console.log("db connected");
} catch (error) {
  console.error(`Could not connect to MongoDB: ${error.message}`);
  process.exit(1);
}

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
