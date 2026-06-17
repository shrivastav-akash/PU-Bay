import { Router } from "express";
import multer from "multer";
import {
  createPost,
  getAllPosts,
  deletePost,
  commentPost,
  get_comment_by_post,
  delete_comment_of_user,
  increment_likes,
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

router.route("/post").post(upload.single("media"), createPost);
router.route("/get_all_posts").get(getAllPosts);
router.route("/delete_post").post(deletePost);
router.route("/comment_post").post(commentPost);
router.route("/get_comment").get(get_comment_by_post);
router.route("/delete_comment_of_user").post(delete_comment_of_user);
router.route("/increment_likes").post(increment_likes);

export default router;
