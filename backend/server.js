import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/posts.routes.js";

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());

app.use(userRoutes);
app.use(postRoutes);
app.use(express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "root is working" });
});

const start = async () => {
  await mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("db connected"))
    .catch((e) => console.log(e));

  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
  });
};

start();
