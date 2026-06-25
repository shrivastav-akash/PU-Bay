import { Router } from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
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
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Public reads (feed and comments are viewable on the landing page)
router.route("/get_all_posts").get(getAllPosts);
router.route("/get_comment").get(get_comment_by_post);

// Authenticated writes
router.route("/post").post(authMiddleware, upload.single("media"), createPost);
router.route("/delete_post").post(authMiddleware, deletePost);
router.route("/comment_post").post(authMiddleware, commentPost);
router
  .route("/delete_comment_of_user")
  .post(authMiddleware, delete_comment_of_user);
router.route("/increment_likes").post(authMiddleware, increment_likes);
router.route("/decrement_likes").post(authMiddleware, decrement_likes);

export default router;
