import mongoose from "mongoose";

const connectionRequest = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  connectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status_accepted: {
    type: Boolean,
    default: null,
  },
});

// Queried by sender (outgoing) and by receiver (incoming).
connectionRequest.index({ userId: 1, connectionId: 1 });
connectionRequest.index({ connectionId: 1 });

const ConnectionRequest = mongoose.model(
  "ConnectionRequest",
  connectionRequest,
);

export default ConnectionRequest;
