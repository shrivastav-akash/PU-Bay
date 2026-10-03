import mongoose from "mongoose";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import { HttpError } from "../lib/http-error.js";
import { removeUpload } from "../lib/uploads.js";

// Express 5 forwards rejected promises to the error middleware, so handlers
// throw HttpError instead of wrapping themselves in try/catch.

const PUBLIC_USER = "name username profilePicture";

async function findPostOr404(postId) {
  const post = await Post.findById(postId);
  if (!post) throw new HttpError(404, "NOT_FOUND", "Post does not exist");
  return post;
}

export const createPost = async (req, res) => {
  const { body } = req.valid.body;
  if (!body && !req.file) {
    throw new HttpError(400, "EMPTY_POST", "Write something or attach a photo or video");
  }
  await Post.create({
    userId: req.userId,
    body,
    media: req.file?.filename ?? "",
    fileType: req.file?.mimetype ?? "",
  });
  res.status(201).json({ success: true, message: "post created successfully" });
};

// Newest first. Without `limit` every post is returned (the feed deck needs
// them all today); `limit` + `before` give cursor pagination when needed.
export const getAllPosts = async (req, res) => {
  const { limit, before } = req.valid.query;
  const filter = before ? { createdAt: mongoose.trusted({ $lt: before }) } : {};
  let query = Post.find(filter).sort({ createdAt: -1 }).populate("userId", PUBLIC_USER).lean();
  if (limit) query = query.limit(limit);
  const posts = await query;

  // One grouped count for the whole page instead of a query per post.
  const counts = await Comment.aggregate([
    { $match: { postId: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);
  const byPost = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = posts.map((p) => ({ ...p, commentCount: byPost.get(String(p._id)) ?? 0 }));
  res.status(200).json({ success: true, data });
};

export const deletePost = async (req, res) => {
  const post = await findPostOr404(req.valid.body.postId);
  if (!post.userId.equals(req.userId)) {
    throw new HttpError(403, "FORBIDDEN", "You can only delete your own posts");
  }
  await Promise.all([
    Post.deleteOne({ _id: post._id }),
    Comment.deleteMany({ postId: post._id }),
  ]);
  removeUpload(post.media);
  res.status(200).json({ success: true, message: "post deleted successfully" });
};

export const commentPost = async (req, res) => {
  const { postId, commentBody } = req.valid.body;
  const post = await findPostOr404(postId);
  await Comment.create({ userId: req.userId, postId: post._id, body: commentBody });
  res.status(201).json({ success: true, message: "comment added successfully" });
};

export const get_comment_by_post = async (req, res) => {
  const comments = await Comment.find({ postId: req.valid.query.postId })
    .sort({ _id: 1 })
    .populate("userId", PUBLIC_USER);
  res.status(200).json({ success: true, data: comments });
};

export const delete_comment_of_user = async (req, res) => {
  const comment = await Comment.findById(req.valid.body.commentId);
  if (!comment) throw new HttpError(404, "NOT_FOUND", "Comment does not exist");
  if (!comment.userId.equals(req.userId)) {
    throw new HttpError(403, "FORBIDDEN", "You can only delete your own comments");
  }
  await Comment.deleteOne({ _id: comment._id });
  res.status(200).json({ success: true, message: "comment deleted successfully" });
};

export const increment_likes = async (req, res) => {
  const post = await findPostOr404(req.valid.body.postId);
  if (!post.likedBy.some((id) => id.equals(req.userId))) {
    post.likedBy.push(req.userId);
    post.likes = post.likedBy.length;
    await post.save();
  }
  res.status(200).json({ success: true, message: "like added successfully" });
};

export const decrement_likes = async (req, res) => {
  const post = await findPostOr404(req.valid.body.postId);
  if (post.likedBy.some((id) => id.equals(req.userId))) {
    post.likedBy = post.likedBy.filter((id) => !id.equals(req.userId));
    post.likes = post.likedBy.length;
    await post.save();
  }
  res.status(200).json({ success: true, message: "like removed successfully" });
};
