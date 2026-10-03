import { Router } from "express";
import {
  register,
  login,
  logout,
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
import authMiddleware from "../middleware/auth.js";
import { authLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { avatarImage } from "../lib/uploads.js";
import {
  loginBody,
  profileBody,
  receiverBody,
  registerBody,
  respondBody,
  resumeQuery,
  userUpdateBody,
} from "../schemas.js";

const router = Router();

// Public
router.route("/register").post(authLimiter, validate({ body: registerBody }), register);
router.route("/login").post(authLimiter, validate({ body: loginBody }), login);
router.route("/logout").post(logout);

// Authenticated
router
  .route("/update_profile_picture")
  .post(authMiddleware, avatarImage, uploadProfilePicture);
router
  .route("/user_update")
  .post(authMiddleware, validate({ body: userUpdateBody }), updateUserProfile);
router
  .route("/update_profile_data")
  .post(authMiddleware, validate({ body: profileBody }), updateProfileData);
router.route("/get_user_and_profile").get(authMiddleware, getUserAndProfile);
router.route("/user/get_all_users").get(authMiddleware, getAllUserProfile);
router
  .route("/user/download_resume")
  .get(authMiddleware, validate({ query: resumeQuery }), downloadProfile);
router
  .route("/user/send_connection_request")
  .post(authMiddleware, validate({ body: receiverBody }), sendConnectionRequest);
router
  .route("/user/get_connection_request")
  .get(authMiddleware, getMyConnectionsRequest);
router
  .route("/user/user_connection_request")
  .get(authMiddleware, getUserGotConnectionRequest);
router
  .route("/user/accept_connection_request")
  .post(authMiddleware, validate({ body: respondBody }), acceptConnectionRequest);

export default router;
