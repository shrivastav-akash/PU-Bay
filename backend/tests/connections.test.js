import { describe, expect, it } from "vitest";
import { app, request, signUp } from "./helpers.js";

const send = (from, to) =>
  request(app).post("/user/send_connection_request").set(from.auth).send({ receiverId: to.user._id });
const respond = (who, requestId, action) =>
  request(app)
    .post("/user/accept_connection_request")
    .set(who.auth)
    .send({ connectionId: requestId, action_type: action });
const incoming = async (who) =>
  (await request(app).get("/user/user_connection_request").set(who.auth).expect(200)).body.data;

describe("sending requests", () => {
  it("refuses yourself and unknown users", async () => {
    const a = await signUp();
    const self = await send(a, a).expect(400);
    expect(self.body.error.code).toBe("INVALID_REQUEST");
    await request(app)
      .post("/user/send_connection_request")
      .set(a.auth)
      .send({ receiverId: "0123456789abcdef01234567" })
      .expect(404);
  });

  it("refuses duplicates, and asking back connects you", async () => {
    const a = await signUp();
    const b = await signUp();
    await send(a, b).expect(201);
    const dup = await send(a, b).expect(409);
    expect(dup.body.error.code).toBe("REQUEST_EXISTS");

    await send(b, a).expect(200);
    const [req] = await incoming(b);
    expect(req.status_accepted).toBe(true);
    expect(req.userId).not.toHaveProperty("email");

    const again = await send(a, b).expect(409);
    expect(again.body.error.code).toBe("ALREADY_CONNECTED");
  });
});

describe("responding", () => {
  it("is recipient-only and happens once", async () => {
    const a = await signUp();
    const c = await signUp();
    await send(c, a).expect(201);
    const [req] = await incoming(a);

    await respond(c, req._id, "accept").expect(403);
    await respond(a, req._id, "maybe").expect(400);
    await respond(a, req._id, "reject").expect(200);
    const twice = await respond(a, req._id, "accept").expect(409);
    expect(twice.body.error.code).toBe("ALREADY_RESPONDED");
  });

  it("lets you connect later with someone you ignored", async () => {
    const a = await signUp();
    const c = await signUp();
    await send(c, a).expect(201);
    const [req] = await incoming(a);
    await respond(a, req._id, "reject").expect(200);

    await send(a, c).expect(200);
    const [updated] = await incoming(a);
    expect(updated.status_accepted).toBe(true);
  });
});
