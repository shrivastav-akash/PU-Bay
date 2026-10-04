import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import RevokedToken from "../models/revokedToken.model.js";
import Profile from "../models/profile.model.js";
import User from "../models/user.model.js";
import { app, PNG, request, sessionHeader, signUp, uploadedFiles } from "./helpers.js";

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

  it("sets an httpOnly SameSite=Lax session cookie and never returns the token", async () => {
    const { creds } = await signUp();
    const res = await request(app).post("/login").send({ email: creds.email, password: creds.password }).expect(200);
    const cookie = [res.headers["set-cookie"]].flat().find((c) => c.startsWith("nexora_session="));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);
    expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // no JWT anywhere in the body
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

  it("requires a valid session cookie", async () => {
    const none = await request(app).get("/get_user_and_profile").expect(401);
    expect(errorOf(none).code).toBe("UNAUTHENTICATED");
    await request(app).get("/get_user_and_profile").set("Cookie", "nexora_session=not-a-jwt").expect(401);
  });

  it("no longer accepts the token as a Bearer header", async () => {
    const { auth } = await signUp();
    const jwt = auth.Cookie.split("=")[1];
    await request(app).get("/get_user_and_profile").set("Authorization", `Bearer ${jwt}`).expect(401);
  });
});

describe("logout", () => {
  it("clears the session cookie, even without a session", async () => {
    const res = await request(app).post("/logout").expect(200);
    const cookie = [res.headers["set-cookie"]].flat().find((c) => c.startsWith("nexora_session="));
    expect(cookie).toMatch(/^nexora_session=;/);
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cookie).toMatch(/HttpOnly/);
  });

  it("revokes the token, so a copied cookie stops working", async () => {
    const { auth } = await signUp();
    await request(app).post("/logout").set(auth).expect(200);
    const reused = await request(app).get("/get_user_and_profile").set(auth).expect(401);
    expect(errorOf(reused).code).toBe("UNAUTHENTICATED");
  });

  it("only ends the session it was called from", async () => {
    const { auth: laptop, creds } = await signUp();
    const phone = sessionHeader(
      await request(app).post("/login").send({ email: creds.email, password: creds.password }).expect(200),
    );
    await request(app).post("/logout").set(laptop).expect(200);
    await request(app).get("/get_user_and_profile").set(laptop).expect(401);
    await request(app).get("/get_user_and_profile").set(phone).expect(200);
  });

  it("keeps a revocation only as long as the token would have lived", async () => {
    const { auth } = await signUp();
    const { jti, exp } = jwt.decode(auth.Cookie.split("=")[1]);
    await request(app).post("/logout").set(auth).expect(200);
    await request(app).post("/logout").set(auth).expect(200); // repeat is harmless

    const entries = await RevokedToken.find({ jti });
    expect(entries).toHaveLength(1);
    expect(entries[0].expiresAt.getTime()).toBe(exp * 1000);

    await RevokedToken.init();
    const ttl = (await RevokedToken.collection.indexes()).find((i) => i.key.expiresAt === 1);
    expect(ttl.expireAfterSeconds).toBe(0);
  });

  it("ignores a garbage cookie", async () => {
    await request(app).post("/logout").set("Cookie", "nexora_session=garbage").expect(200);
  });

  it("refuses tokens issued without a jti, which can't be revoked", async () => {
    const { user } = await signUp();
    const legacy = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    await request(app).get("/get_user_and_profile").set("Cookie", `nexora_session=${legacy}`).expect(401);
  });
});

describe("log out of all devices", () => {
  const loginAgain = async (creds) =>
    sessionHeader(await request(app).post("/login").send({ email: creds.email, password: creds.password }).expect(200));

  it("ends every session of the user and leaves others alone", async () => {
    const { auth: laptop, creds } = await signUp();
    const phone = await loginAgain(creds);
    const someoneElse = await signUp();

    const res = await request(app).post("/logout_all").set(laptop).expect(200);
    const cookie = [res.headers["set-cookie"]].flat().find((c) => c.startsWith("nexora_session="));
    expect(cookie).toMatch(/^nexora_session=;/);

    await request(app).get("/get_user_and_profile").set(laptop).expect(401);
    await request(app).get("/get_user_and_profile").set(phone).expect(401);
    await request(app).get("/get_user_and_profile").set(someoneElse.auth).expect(200);
  });

  it("lets you sign in again afterwards, and that new session works", async () => {
    const { auth, creds } = await signUp();
    await request(app).post("/logout_all").set(auth).expect(200);
    const fresh = await loginAgain(creds);
    await request(app).get("/get_user_and_profile").set(fresh).expect(200);
  });

  it("needs a session and keeps the version private", async () => {
    await request(app).post("/logout_all").expect(401);
    const { auth } = await signUp();
    const me = await request(app).get("/get_user_and_profile").set(auth).expect(200);
    expect(me.body.data.user).not.toHaveProperty("tokenVersion");
  });

  it("refuses tokens of a deleted account", async () => {
    const { auth, user } = await signUp();
    await Promise.all([User.deleteOne({ _id: user._id }), Profile.deleteOne({ userId: user._id })]);
    await request(app).get("/get_user_and_profile").set(auth).expect(401);
  });
});

describe("cross-origin protection", () => {
  it("rejects state-changing requests from other origins", async () => {
    const { auth } = await signUp();
    const res = await request(app)
      .post("/user_update")
      .set(auth)
      .set("Origin", "http://evil.test")
      .send({ name: "Hacked" })
      .expect(403);
    expect(errorOf(res).code).toBe("FORBIDDEN_ORIGIN");
    await request(app).post("/user_update").set(auth).set("Origin", "http://localhost:5173").send({ name: "Fine" }).expect(200);
  });

  it("lets the app origin send credentials, and nobody else", async () => {
    const preflight = (origin) =>
      request(app).options("/login").set("Origin", origin).set("Access-Control-Request-Method", "POST");
    const ok = await preflight("http://localhost:5173");
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(ok.headers["access-control-allow-credentials"]).toBe("true");
    const evil = await preflight("http://evil.test");
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
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
