import { Router } from "express";
import authMiddleware from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { postMedia } from "../lib/uploads.js";
import {
  createPost,
  getAllPosts,
  deletePost,
  commentPost,
  get_comment_by_post,
  delete_comment_of_user,
  increment_likes,
  decrement_likes,
} from "../controllers/posts.controller.js";
import {
  commentBody,
  commentIdBody,
  createPostBody,
  postIdBody,
  postIdQuery,
  postsQuery,
} from "../schemas.js";

const router = Router();

// Public reads (feed and comments are viewable on the landing page)
router.route("/get_all_posts").get(validate({ query: postsQuery }), getAllPosts);
router.route("/get_comment").get(validate({ query: postIdQuery }), get_comment_by_post);

// Authenticated writes. Multer runs before validation so multipart fields exist.
router
  .route("/post")
  .post(authMiddleware, postMedia, validate({ body: createPostBody }), createPost);
router.route("/delete_post").post(authMiddleware, validate({ body: postIdBody }), deletePost);
router.route("/comment_post").post(authMiddleware, validate({ body: commentBody }), commentPost);
router
  .route("/delete_comment_of_user")
  .post(authMiddleware, validate({ body: commentIdBody }), delete_comment_of_user);
router
  .route("/increment_likes")
  .post(authMiddleware, validate({ body: postIdBody }), increment_likes);
router
  .route("/decrement_likes")
  .post(authMiddleware, validate({ body: postIdBody }), decrement_likes);

export default router;
