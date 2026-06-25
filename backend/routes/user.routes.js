import { Router } from "express";
import {
  register,
  login,
  uploadProfilePicture,
  updateUserProfile,
  getUserAndProfile,
  updateProfileData,
  getAllUserProfile,
  downloadProfile,
  sendConnectionRequest,
  getMyConnectionsRequest,
  getUserGotConnectionRequest,
  acceptConnectionRequest,
} from "../controllers/user.controller.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

// Public
router.route("/register").post(register);
router.route("/login").post(login);

// Authenticated
router
  .route("/update_profile_picture")
  .post(authMiddleware, upload.single("profile_picture"), uploadProfilePicture);
router.route("/user_update").post(authMiddleware, updateUserProfile);
router.route("/update_profile_data").post(authMiddleware, updateProfileData);
router.route("/get_user_and_profile").get(authMiddleware, getUserAndProfile);
router.route("/user/get_all_users").get(authMiddleware, getAllUserProfile);
router.route("/user/download_resume").get(authMiddleware, downloadProfile);
router
  .route("/user/send_connection_request")
  .post(authMiddleware, sendConnectionRequest);
router
  .route("/user/get_connection_request")
  .get(authMiddleware, getMyConnectionsRequest);
router
  .route("/user/user_connection_request")
  .get(authMiddleware, getUserGotConnectionRequest);
router
  .route("/user/accept_connection_request")
  .post(authMiddleware, acceptConnectionRequest);

export default router;
