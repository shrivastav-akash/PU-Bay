import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import ConnectionRequest from "../models/connections.model.js";
import Connection from "../models/connections.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";

function convertUserDataToPDF(userProfile) {
  const doc = new PDFDocument();

  const outputPath = crypto.randomBytes(16).toString("hex") + ".pdf";
  const writeStream = fs.createWriteStream("uploads/" + outputPath);
  doc.pipe(writeStream);

  doc.image(`uploads/${userProfile.userId.profilePicture}`, {
    align: "center",
    width: 100,
  });
  doc.fontSize(14).text(`Name: ${userProfile.userId.name}`);
  doc.fontSize(14).text(`Username: ${userProfile.userId.username}`);
  doc.fontSize(14).text(`Email: ${userProfile.userId.email}`);
  doc.fontSize(14).text(`Bio: ${userProfile.bio}`);
  doc.fontSize(14).text(`Current Post: ${userProfile.currentPost}`);
  doc.fontSize(14).text(`Past Work: ${userProfile.pastWork}`);
  userProfile.pastWork.forEach((work) => {
    doc.fontSize(14).text(`Company: ${work.company}`);
    doc.fontSize(14).text(`Position: ${work.position}`);
    doc.fontSize(14).text(`Years: ${work.years}`);
  });
  doc.fontSize(14).text(`Education: ${userProfile.education}`);
  doc.end();
  return outputPath;
}

export const activeCheck = async (req, res) => {
  res.status(200).json({ success: true, message: "running" });
  return;
};

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      res
        .status(400)
        .json({ success: false, message: "all field are required" });
      return;
    }
    const user = await User.findOne({ email });
    if (user) {
      res.status(409).json({ success: false, message: "user already exists" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    const profile = new Profile({ userId: newUser._id });
    await profile.save();
    res.status(200).json({ success: true, message: "user created successful" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "all field are required" });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ success: false, message: "incorrect password" });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne({ _id: user._id }, { token });
    res.status(200).json({
      success: true,
      data: { message: "login successful", token: token },
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    user.profilePicture = req.file.filename;
    await user.save();
    res.status(200).json({
      success: true,
      message: "profile picture uploaded successfully",
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const { username, email } = newUserData;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        res
          .status(409)
          .json({ success: false, message: "user already exists" });
        return;
      }
    }

    Object.assign(user, newUserData);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "user updated successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const profile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture",
    );
    res.status(200).json({ success: true, data: { user, profile } });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      res
        .status(404)
        .json({ success: false, message: "profile does not exist" });
      return;
    }
    Object.assign(profile, newProfileData);
    await profile.save();
    res
      .status(200)
      .json({ success: true, message: "profile updated successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const getAllUserProfile = async (req, res) => {
  try {
    const profiles = await Profile.find().populate(
      "userId",
      "name username email profilePicture",
    );
    res.status(200).json({ success: true, data: profiles });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const downloadProfile = async (req, res) => {
  const userId = req.query.id;
  try {
    const userProfile = await Profile.findById(userId).populate(
      "userId",
      "name username email profilePicture",
    );
    let resumeOutputPath = convertUserDataToPDF(userProfile);
    res.status(200).json({ success: true, data: resumeOutputPath });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const { token, receiverId } = req.body;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const receiver = await User.findById({ _id: receiverId });
    if (!receiver) {
      res
        .status(404)
        .json({ success: false, message: "receiver user does not exist" });
      return;
    }
    const existingConnection = await Connection.findOne({
      userId: user._id,
      connectionId: receiver._id,
    });
    if (existingConnection) {
      res
        .status(409)
        .json({ success: false, message: "connection already exists" });
      return;
    }
    const connection = new ConnectionRequest({
      userId: user._id,
      connectionId: receiver._id,
    });
    await connection.save();
    res
      .status(200)
      .json({ success: true, message: "connection request sent successfully" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const getMyConnectionsRequest = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const connections = await Connection.find({ userId: user._id }).populate(
      "connectionId",
      "name username email profilePicture",
    );
    res.status(200).json({ success: true, data: connections });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const getUserGotConnectionRequest = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const connectionRequest = await ConnectionRequest.find({
      connectionId: user._id,
    }).populate("userId", "name username email profilePicture");
    res.status(200).json({ success: true, data: connectionRequest });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { token, connectionId, action_type } = req.body;
    const user = await User.findOne({ token });
    if (!user) {
      res.status(404).json({ success: false, message: "user does not exist" });
      return;
    }
    const connection = await ConnectionRequest.findOne({ _id: connectionId });
    if (!connection) {
      res
        .status(404)
        .json({ success: false, message: "connection request does not exist" });
      return;
    }

    if (action_type === "accept") {
      connection.status_accepted = true;
    } else {
      connection.status_accepted = false;
    }

    await connection.save();
    res.status(200).json({
      success: true,
      message: "connection request updated successfully",
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "something went wrong" });
    return;
  }
};
