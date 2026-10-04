import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  // Never loaded unless a query asks for "+password" (login only).
  password: {
    type: String,
    required: true,
    select: false,
  },
  profilePicture: {
    type: String,
    default: "default.jpg",
  },
  // Stamped into every session token. "Log out of all devices" increments it,
  // which invalidates every token issued before. Missing on older users = 0.
  tokenVersion: {
    type: Number,
    default: 0,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// email and username are already indexed via `unique: true` above.

// Belt and braces: even a document loaded with +password never serialises it.
UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.tokenVersion;
    return ret;
  },
});

const User = mongoose.model("User", UserSchema);
export default User;
