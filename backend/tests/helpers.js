import fs from "fs";
import request from "supertest";
import app from "../app.js";

export { app, request };

// 1x1 transparent PNG.
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

let count = 0;

// Registers and logs in a fresh user. Returns the token, an auth header and
// the user/profile as the API reports them.
export async function signUp(overrides = {}) {
  count += 1;
  const id = `${Date.now().toString(36)}${count}`;
  const creds = {
    name: `Test User ${count}`,
    username: `u_${id}`,
    email: `u_${id}@nexora.test`,
    password: "correct-horse-1",
    ...overrides,
  };
  await request(app).post("/register").send(creds).expect(201);
  const login = await request(app)
    .post("/login")
    .send({ email: creds.email, password: creds.password })
    .expect(200);
  const auth = { Authorization: `Bearer ${login.body.data.token}` };
  const me = await request(app).get("/get_user_and_profile").set(auth).expect(200);
  return { creds, auth, user: me.body.data.user, profile: me.body.data.profile };
}

export const uploadedFiles = () => fs.readdirSync(process.env.UPLOAD_DIR);
