import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { app, PNG, request, signUp, uploadedFiles } from "./helpers.js";

const errorOf = (res) => res.body.error;

describe("errors", () => {
  it("uses one shape for unknown routes and bad JSON", async () => {
    const missing = await request(app).get("/nope").expect(404);
    expect(missing.body).toEqual({ error: { code: "NOT_FOUND", message: "Route not found" } });

    const bad = await request(app)
      .post("/login")
      .set("Content-Type", "application/json")
      .send("{bad json")
      .expect(400);
    expect(errorOf(bad).code).toBe("INVALID_JSON");
  });
});

describe("register", () => {
  it("creates an account and rejects duplicate email or username", async () => {
    const { creds } = await signUp();
    const dupEmail = await request(app)
      .post("/register")
      .send({ ...creds, username: `${creds.username}x` })
      .expect(409);
    expect(errorOf(dupEmail)).toEqual({ code: "ACCOUNT_EXISTS", message: "Email or username already in use" });
    await request(app)
      .post("/register")
      .send({ ...creds, email: `x${creds.email}` })
      .expect(409);
  });

  it("rejects unknown fields and weak passwords", async () => {
    const base = { name: "Ana", username: "ana_x", email: "ana@nexora.test", password: "correct-horse-1" };
    const extra = await request(app).post("/register").send({ ...base, active: false }).expect(400);
    expect(errorOf(extra).code).toBe("VALIDATION_ERROR");
    await request(app).post("/register").send({ ...base, password: "short" }).expect(400);
  });
});

describe("login", () => {
  it("gives the same answer for an unknown email and a wrong password", async () => {
    const { creds } = await signUp();
    const wrong = await request(app).post("/login").send({ email: creds.email, password: "nope-nope" }).expect(401);
    const unknown = await request(app).post("/login").send({ email: "ghost@nexora.test", password: "nope-nope" }).expect(401);
    expect(errorOf(wrong)).toEqual(errorOf(unknown));
  });

  it("refuses query operators in place of values", async () => {
    await request(app).post("/login").send({ email: { $ne: null }, password: "x" }).expect(400);
  });
});

describe("current user", () => {
  it("never returns the password hash", async () => {
    const { user, profile } = await signUp();
    expect(user).not.toHaveProperty("password");
    expect(profile.userId).not.toHaveProperty("password");
  });

  it("requires a valid token", async () => {
    const none = await request(app).get("/get_user_and_profile").expect(401);
    expect(errorOf(none).code).toBe("UNAUTHENTICATED");
    await request(app).get("/get_user_and_profile").set("Authorization", "Bearer not-a-jwt").expect(401);
  });
});

describe("account updates", () => {
  it("only accepts name, username and email", async () => {
    const { auth, creds } = await signUp();
    // A legitimate field must not smuggle a forbidden one through.
    await request(app).post("/user_update").set(auth).send({ name: "X", password: "plaintext" }).expect(400);
    await request(app).post("/user_update").set(auth).send({ name: "X", active: false }).expect(400);
    await request(app).post("/user_update").set(auth).send({ name: "New Name", email: creds.email }).expect(200);

    // Saving without the password loaded must not wipe or replace it.
    await request(app).post("/login").send({ email: creds.email, password: creds.password }).expect(200);
    const me = await request(app).get("/get_user_and_profile").set(auth);
    expect(me.body.data.user.name).toBe("New Name");
  });

  it("refuses a username that belongs to someone else", async () => {
    const a = await signUp();
    const b = await signUp();
    await request(app).post("/user_update").set(b.auth).send({ username: a.creds.username }).expect(409);
  });

  it("saves profile details but not ownership", async () => {
    const { auth, profile } = await signUp();
    await request(app).post("/update_profile_data").set(auth).send({ userId: profile._id }).expect(400);
    await request(app)
      .post("/update_profile_data")
      .set(auth)
      .send({
        currentPost: "B.Tech CSE",
        pastWork: [{ _id: profile._id, company: "Dept. of CSE", position: "TA", years: "2025" }],
      })
      .expect(200);
    const me = await request(app).get("/get_user_and_profile").set(auth);
    expect(me.body.data.profile.currentPost).toBe("B.Tech CSE");
    expect(me.body.data.profile.pastWork[0]).toMatchObject({ company: "Dept. of CSE", position: "TA" });
  });
});

describe("directory", () => {
  it("does not expose other people's emails", async () => {
    const { auth } = await signUp();
    const res = await request(app).get("/user/get_all_users").set(auth).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const p of res.body.data) expect(p.userId).not.toHaveProperty("email");
  });
});

describe("profile picture", () => {
  it("needs an image file", async () => {
    const { auth } = await signUp();
    const missing = await request(app).post("/update_profile_picture").set(auth).expect(400);
    expect(errorOf(missing).code).toBe("FILE_REQUIRED");

    const before = uploadedFiles().length;
    const wrongType = await request(app)
      .post("/update_profile_picture")
      .set(auth)
      .attach("profile_picture", Buffer.from("<html>"), { filename: "x.png", contentType: "text/html" })
      .expect(400);
    expect(errorOf(wrongType).code).toBe("UNSUPPORTED_FILE");
    expect(uploadedFiles().length).toBe(before);
  });

  it("stores under a server-chosen name and removes the previous picture", async () => {
    const { auth } = await signUp();
    const upload = () =>
      request(app)
        .post("/update_profile_picture")
        .set(auth)
        .attach("profile_picture", PNG, { filename: "../../evil.png", contentType: "image/png" })
        .expect(200);

    await upload();
    const first = (await request(app).get("/get_user_and_profile").set(auth)).body.data.user.profilePicture;
    expect(first).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(uploadedFiles()).toContain(first);

    await upload();
    await vi.waitFor(() => expect(uploadedFiles()).not.toContain(first));
  });
});

describe("résumé PDF", () => {
  it("streams a PDF, even without a profile picture", async () => {
    const { auth, profile } = await signUp();
    const res = await request(app)
      .get(`/user/download_resume?id=${profile._id}`)
      .set(auth)
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on("data", (c) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.subarray(0, 4).toString()).toBe("%PDF");
    // Nothing is written to the public uploads folder.
    expect(uploadedFiles().some((f) => f.endsWith(".pdf"))).toBe(false);
  });

  it("validates the profile id", async () => {
    const { auth } = await signUp();
    await request(app).get("/user/download_resume?id=nope").set(auth).expect(400);
    await request(app).get("/user/download_resume?id=0123456789abcdef01234567").set(auth).expect(404);
  });
});

describe("uploads folder", () => {
  it("lives where UPLOAD_DIR points, independent of the working directory", () => {
    expect(path.isAbsolute(process.env.UPLOAD_DIR)).toBe(true);
    expect(fs.existsSync(process.env.UPLOAD_DIR)).toBe(true);
  });
});
