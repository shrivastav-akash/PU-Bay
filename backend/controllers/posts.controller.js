import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";

export const createPost = async (req, res) => {
  try {
    const post = new Post({
      userId: req.userId,
      body: req.body.body,
      media: req.file != undefined ? req.file.filename : "",
      fileType: req.file != undefined ? req.file.mimetype.split("/")[1] : "",
    });

    await post.save();
    res
      .status(200)
      .json({ success: true, message: "post created successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate(
      "userId",
      "name username profilePicture",
    );
    res.status(200).json({ success: true, data: posts });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      res.status(404).json({ success: false, message: "post does not exist" });
      return;
    }
    if (post.userId.toString() !== req.userId) {
      res.status(401).json({ success: false, message: "unauthorized" });
      return;
    }
    await Post.deleteOne({ _id: postId });
    res
      .status(200)
      .json({ success: true, message: "post deleted successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const commentPost = async (req, res) => {
  try {
    const { postId, commentBody } = req.body;
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      res.status(404).json({ success: false, message: "post does not exist" });
      return;
    }
    const comment = new Comment({
      userId: req.userId,
      postId: post._id,
      body: commentBody,
    });
    await comment.save();
    res
      .status(200)
      .json({ success: true, message: "comment added successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const get_comment_by_post = async (req, res) => {
  try {
    const postId = req.query.postId || req.body.postId;
    const comments = await Comment.find({ postId }).populate(
      "userId",
      "name username profilePicture",
    );
    res.status(200).json({ success: true, data: comments });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const delete_comment_of_user = async (req, res) => {
  try {
    const { commentId } = req.body;
    const comment = await Comment.findOne({ _id: commentId });
    if (!comment) {
      res
        .status(404)
        .json({ success: false, message: "comment does not exist" });
      return;
    }
    if (comment.userId.toString() !== req.userId) {
      res.status(403).json({ success: false, message: "unauthorized" });
      return;
    }
    await Comment.deleteOne({ _id: commentId });
    res
      .status(200)
      .json({ success: true, message: "comment deleted successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const increment_likes = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      res.status(404).json({ success: false, message: "post does not exist" });
      return;
    }
    const alreadyLiked = post.likedBy.some(
      (id) => id.toString() === req.userId,
    );
    if (!alreadyLiked) {
      post.likedBy.push(req.userId);
      post.likes = post.likedBy.length;
      await post.save();
    }
    res.status(200).json({ success: true, message: "like added successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const decrement_likes = async (req, res) => {
  try {
    const { postId } = req.body;
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      res.status(404).json({ success: false, message: "post does not exist" });
      return;
    }
    const wasLiked = post.likedBy.some(
      (id) => id.toString() === req.userId,
    );
    if (wasLiked) {
      post.likedBy = post.likedBy.filter(
        (id) => id.toString() !== req.userId,
      );
      post.likes = post.likedBy.length;
      await post.save();
    }
    res
      .status(200)
      .json({ success: true, message: "like removed successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};
