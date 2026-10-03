import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Optional: a post needs text or media (enforced in createPost).
  body: {
    type: String,
    default: "",
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  media: {
    type: String,
    default: "",
  },
  active: {
    type: Boolean,
    default: true,
  },
  // Full MIME type, e.g. "video/mp4". Older posts hold only the subtype.
  fileType: {
    type: String,
    default: "",
  },
});

// Feed loads newest-first; profile views filter by author.
PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });

const Post = mongoose.model("Post", PostSchema);
export default Post;
