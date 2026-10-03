import request from "supertest";
import { describe, expect, it, vi } from "vitest";

describe("session cookie in production", () => {
  it("is marked Secure so it only travels over HTTPS", async () => {
    // Set before the app is imported; each test file gets fresh modules.
    vi.stubEnv("NODE_ENV", "production");
    const { default: app } = await import("../app.js");
    const creds = { name: "Prod", username: "prod_user", email: "prod@nexora.test", password: "correct-horse-1" };
    await request(app).post("/register").send(creds).expect(201);
    const res = await request(app).post("/login").send({ email: creds.email, password: creds.password }).expect(200);
    const cookie = [res.headers["set-cookie"]].flat().find((c) => c.startsWith("nexora_session="));
    expect(cookie).toMatch(/; Secure/);
  });
});
