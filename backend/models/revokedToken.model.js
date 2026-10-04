import mongoose from "mongoose";

// Denylist of logged-out sessions, keyed by the JWT's jti.
const RevokedTokenSchema = new mongoose.Schema({
  jti: {
    type: String,
    required: true,
    unique: true,
  },
  // When the token would have expired anyway; the TTL index deletes the
  // entry then, so the collection only ever holds still-valid tokens.
  expiresAt: {
    type: Date,
    required: true,
  },
});

RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RevokedToken = mongoose.model("RevokedToken", RevokedTokenSchema);
export default RevokedToken;
