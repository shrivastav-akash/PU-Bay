import request from "supertest";
import { describe, expect, it, vi } from "vitest";

describe("auth rate limit", () => {
  it("answers 429 once the attempts per window are used up", async () => {
    // Set before the app (and its limiter) is imported; each test file gets fresh modules.
    vi.stubEnv("AUTH_RATE_LIMIT", "3");
    const { default: app } = await import("../app.js");
    const attempt = () => request(app).post("/login").send({ email: "ghost@nexora.test", password: "nope" });

    for (let i = 0; i < 3; i++) await attempt().expect(401);
    const blocked = await attempt().expect(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
    expect(blocked.headers).toHaveProperty("ratelimit");
  });
});
