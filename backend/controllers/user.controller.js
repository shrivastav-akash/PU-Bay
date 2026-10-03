import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { endSession, startSession } from "../lib/session.js";
import { removeUpload } from "../lib/uploads.js";
import ConnectionRequest from "../models/connections.model.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";

// Express 5 forwards rejected promises to the error middleware, so handlers
// throw HttpError instead of wrapping themselves in try/catch.

// Fields other users may see. Email stays private to its owner.
const PUBLIC_USER = "name username profilePicture";
const SELF_USER = "name username email profilePicture";

// Compared against when the email is unknown, so a missing account takes as
// long to reject as a wrong password and can't be detected by timing.
const DUMMY_HASH = bcrypt.hashSync("nexora-timing-equaliser", 10);

const notFound = (what) => new HttpError(404, "NOT_FOUND", `${what} does not exist`);
const inUse = () => new HttpError(409, "ACCOUNT_EXISTS", "Email or username already in use");

export const register = async (req, res) => {
  const { name, username, email, password } = req.valid.body;
  if (await User.exists({ $or: [{ email }, { username }] })) throw inUse();
  const user = await User.create({
    name,
    username,
    email,
    password: await bcrypt.hash(password, 10),
  });
  await Profile.create({ userId: user._id });
  res.status(201).json({ success: true, message: "user created successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select("+password");
  const matches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  // Same answer for unknown email and wrong password: accounts can't be enumerated.
  if (!user || !matches) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  // The token goes only into the httpOnly cookie, never into the response body.
  startSession(res, user._id);
  res.status(200).json({ success: true, message: "login successful" });
};

// Public: clearing the cookie must work even when the session already expired.
export const logout = (req, res) => {
  endSession(res);
  res.status(200).json({ success: true, message: "logged out" });
};

export const uploadProfilePicture = async (req, res) => {
  if (!req.file) throw new HttpError(400, "FILE_REQUIRED", "Choose an image to upload");
  const user = await User.findById(req.userId);
  if (!user) throw notFound("User");
  const previous = user.profilePicture;
  user.profilePicture = req.file.filename;
  await user.save();
  removeUpload(previous);
  res.status(200).json({ success: true, message: "profile picture uploaded successfully" });
};

export const updateUserProfile = async (req, res) => {
  const updates = req.valid.body;
  const user = await User.findById(req.userId);
  if (!user) throw notFound("User");

  const unique = ["email", "username"].filter((k) => updates[k]).map((k) => ({ [k]: updates[k] }));
  if (unique.length) {
    const owners = await User.find({ $or: unique }, "_id");
    if (owners.some((u) => !u._id.equals(user._id))) throw inUse();
  }

  // Safe: the strict schema only lets name, username and email through.
  Object.assign(user, updates);
  await user.save();
  res.status(200).json({ success: true, message: "user updated successfully" });
};

export const getUserAndProfile = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw notFound("User");
  const profile = await Profile.findOne({ userId: user._id }).populate("userId", SELF_USER);
  res.status(200).json({ success: true, data: { user, profile } });
};

export const updateProfileData = async (req, res) => {
  const { pastWork, education, ...about } = req.valid.body;
  const profile = await Profile.findOne({ userId: req.userId });
  if (!profile) throw notFound("Profile");

  Object.assign(profile, about);
  if (pastWork) {
    profile.pastWork = pastWork.map(({ company, position, years }) => ({ company, position, years }));
  }
  if (education) {
    profile.education = education.map(({ school, degree, fieldOfStudy }) => ({ school, degree, fieldOfStudy }));
  }
  await profile.save();
  res.status(200).json({ success: true, message: "profile updated successfully" });
};

export const getAllUserProfile = async (req, res) => {
  const profiles = await Profile.find().populate("userId", PUBLIC_USER);
  res.status(200).json({ success: true, data: profiles });
};

// Streams the PDF straight to the client: nothing is written to the public
// uploads folder. The email is printed only on your own résumé.
export const downloadProfile = async (req, res) => {
  const profile = await Profile.findById(req.valid.query.id).populate("userId", SELF_USER);
  if (!profile?.userId) throw notFound("Profile");

  const owner = profile.userId;
  const filename = `${owner.username.replace(/[^\w.-]/g, "_")}-resume.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 56 });
  doc.pipe(res);
  renderResume(doc, profile, { includeEmail: owner._id.equals(req.userId) });
  doc.end();
};

function renderResume(doc, profile, { includeEmail }) {
  const user = profile.userId;
  const picture = user.profilePicture && path.join(env.UPLOAD_DIR, path.basename(user.profilePicture));
  if (picture && user.profilePicture !== "default.jpg" && fs.existsSync(picture)) {
    try {
      doc.image(picture, { fit: [80, 80] }).moveDown();
    } catch {
      // PDFKit reads only JPEG and PNG; other formats are left out.
    }
  }

  doc.fillColor("#111").fontSize(22).text(user.name);
  doc.fillColor("#555").fontSize(11).text(includeEmail ? `@${user.username} | ${user.email}` : `@${user.username}`);
  if (profile.currentPost) doc.moveDown(0.6).fillColor("#111").fontSize(13).text(profile.currentPost);
  if (profile.bio) doc.moveDown(0.4).fillColor("#333").fontSize(11).text(profile.bio);

  section(doc, "Experience", profile.pastWork, (w) => [`${w.position}, ${w.company}`, w.years]);
  section(doc, "Education", profile.education, (e) => [
    e.school,
    [e.degree, e.fieldOfStudy].filter(Boolean).join(", "),
  ]);
}

function section(doc, title, items, lines) {
  if (!items?.length) return;
  doc.moveDown(1.2).fillColor("#111").fontSize(15).text(title);
  for (const item of items) {
    const [main, detail] = lines(item);
    doc.moveDown(0.4).fillColor("#111").fontSize(12).text(main);
    if (detail) doc.fillColor("#555").fontSize(10).text(detail);
  }
}

export const sendConnectionRequest = async (req, res) => {
  const { receiverId } = req.valid.body;
  if (receiverId === req.userId) {
    throw new HttpError(400, "INVALID_REQUEST", "You can't connect with yourself");
  }
  if (!(await User.exists({ _id: receiverId }))) throw notFound("User");

  const existing = await ConnectionRequest.findOne({
    $or: [
      { userId: req.userId, connectionId: receiverId },
      { userId: receiverId, connectionId: req.userId },
    ],
  });

  if (existing?.status_accepted === true) {
    throw new HttpError(409, "ALREADY_CONNECTED", "You're already connected");
  }
  if (existing?.userId.equals(req.userId)) {
    throw new HttpError(409, "REQUEST_EXISTS", "Connection request already sent");
  }
  if (existing) {
    // They asked first (pending, or ignored earlier): asking back connects you.
    existing.status_accepted = true;
    await existing.save();
    return res.status(200).json({ success: true, message: "connected" });
  }

  await ConnectionRequest.create({ userId: req.userId, connectionId: receiverId });
  res.status(201).json({ success: true, message: "connection request sent successfully" });
};

export const getMyConnectionsRequest = async (req, res) => {
  const connections = await ConnectionRequest.find({ userId: req.userId }).populate("connectionId", PUBLIC_USER);
  res.status(200).json({ success: true, data: connections });
};

export const getUserGotConnectionRequest = async (req, res) => {
  const requests = await ConnectionRequest.find({ connectionId: req.userId }).populate("userId", PUBLIC_USER);
  res.status(200).json({ success: true, data: requests });
};

export const acceptConnectionRequest = async (req, res) => {
  const { connectionId, action_type } = req.valid.body;
  const request = await ConnectionRequest.findById(connectionId);
  if (!request) throw notFound("Connection request");
  // Only the recipient of the request may accept or reject it.
  if (!request.connectionId.equals(req.userId)) {
    throw new HttpError(403, "FORBIDDEN", "Only the recipient can respond to this request");
  }
  if (request.status_accepted !== null) {
    throw new HttpError(409, "ALREADY_RESPONDED", "This request was already answered");
  }
  request.status_accepted = action_type === "accept";
  await request.save();
  res.status(200).json({ success: true, message: "connection request updated successfully" });
};
