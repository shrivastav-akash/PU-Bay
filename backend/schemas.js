import { z } from "zod";

// Every schema is strict: unknown keys are rejected, so clients can't set
// fields like password, userId or active by adding them to a request.

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const text = (max) => z.string().trim().max(max);
const required = (max, label) => text(max).min(1, `${label} is required`);
const email = z.string().trim().max(254).pipe(z.email("Enter a valid email"));
const username = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.]{3,30}$/, "Username must be 3 to 30 letters, numbers, dots or underscores");

// Auth
export const registerBody = z.strictObject({
  name: required(80, "Name"),
  username,
  email,
  // bcrypt only reads the first 72 bytes.
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginBody = z.strictObject({
  email,
  password: z.string().min(1, "Password is required").max(200),
});

// Account and profile
export const userUpdateBody = z
  .strictObject({
    name: required(80, "Name").optional(),
    username: username.optional(),
    email: email.optional(),
  })
  .refine((b) => Object.keys(b).length > 0, "Nothing to update");

// Stored entries come back with an _id; it is accepted and ignored.
const workItem = z.strictObject({
  _id: objectId.optional(),
  company: required(100, "Company"),
  position: required(100, "Position"),
  years: text(30).default(""),
});
const educationItem = z.strictObject({
  _id: objectId.optional(),
  school: required(120, "School"),
  degree: required(100, "Degree"),
  fieldOfStudy: text(100).default(""),
});

export const profileBody = z.strictObject({
  bio: text(500).optional(),
  currentPost: text(120).optional(),
  pastWork: z.array(workItem).max(20).optional(),
  education: z.array(educationItem).max(20).optional(),
});

export const resumeQuery = z.strictObject({ id: objectId });

// Posts and comments
export const postsQuery = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.coerce.date().optional(),
});
export const createPostBody = z.strictObject({ body: text(5000).default("") });
export const postIdBody = z.strictObject({ postId: objectId });
export const postIdQuery = z.strictObject({ postId: objectId });
export const commentBody = z.strictObject({
  postId: objectId,
  commentBody: required(1000, "Comment"),
});
export const commentIdBody = z.strictObject({ commentId: objectId });

// Connections
export const receiverBody = z.strictObject({ receiverId: objectId });
export const respondBody = z.strictObject({
  connectionId: objectId,
  action_type: z.enum(["accept", "reject"]),
});
