import { describe, expect, it, vi } from "vitest";
import { app, PNG, request, signUp, uploadedFiles } from "./helpers.js";

const createPost = (auth, body, file) => {
  const req = request(app).post("/post").set(auth);
  if (body !== undefined) req.field("body", body);
  if (file) req.attach("media", file.buffer, { filename: file.name, contentType: file.type });
  return req;
};
const feed = async (query = "") => (await request(app).get(`/get_all_posts${query}`).expect(200)).body.data;

describe("creating posts", () => {
  it("needs text or media", async () => {
    const { auth } = await signUp();
    const res = await createPost(auth).expect(400);
    expect(res.body.error.code).toBe("EMPTY_POST");
    await createPost(auth, "   ").expect(400);
  });

  it("accepts media-only posts and stores the full MIME type under a random name", async () => {
    const { auth } = await signUp();
    await createPost(auth, undefined, { buffer: PNG, name: "my photo.png", type: "image/png" }).expect(201);
    const [post] = await feed("?limit=1");
    expect(post.body).toBe("");
    expect(post.fileType).toBe("image/png");
    expect(post.media).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(uploadedFiles()).toContain(post.media);
  });

  it("rejects unsupported files without leaving them on disk", async () => {
    const { auth } = await signUp();
    const before = uploadedFiles().length;
    const res = await createPost(auth, "hi", { buffer: Buffer.from("MZ"), name: "a.exe", type: "application/x-msdownload" }).expect(400);
    expect(res.body.error.code).toBe("UNSUPPORTED_FILE");
    expect(uploadedFiles().length).toBe(before);
  });

  it("cleans up the upload when validation fails after it", async () => {
    const { auth } = await signUp();
    const before = uploadedFiles().length;
    await request(app)
      .post("/post")
      .set(auth)
      .field("body", "hi")
      .field("userId", "someone-else")
      .attach("media", PNG, { filename: "a.png", contentType: "image/png" })
      .expect(400);
    await vi.waitFor(() => expect(uploadedFiles().length).toBe(before));
  });
});

describe("the feed", () => {
  it("is sorted newest first with comment counts", async () => {
    const { auth } = await signUp();
    await createPost(auth, "older").expect(201);
    await new Promise((r) => setTimeout(r, 5));
    await createPost(auth, "newer").expect(201);
    const [newest, older] = await feed("?limit=2");
    expect(newest.body).toBe("newer");
    expect(older.body).toBe("older");

    await request(app).post("/comment_post").set(auth).send({ postId: newest._id, commentBody: "nice" }).expect(201);
    const [again] = await feed("?limit=1");
    expect(again.commentCount).toBe(1);
    expect(again.userId).not.toHaveProperty("email");
  });

  it("pages with limit and before", async () => {
    const all = await feed();
    const page = await feed(`?limit=1&before=${encodeURIComponent(all[0].createdAt)}`);
    expect(page).toHaveLength(1);
    expect(page[0]._id).toBe(all[1]._id);
  });

  it("validates query parameters", async () => {
    await request(app).get("/get_all_posts?limit=0").expect(400);
    await request(app).get("/get_all_posts?sort=-1").expect(400);
  });
});

describe("comments", () => {
  it("reads by post id from the query string only", async () => {
    await request(app).get("/get_comment?postId=nope").expect(400);
    await request(app).get("/get_comment").expect(400);
  });

  it("can only be deleted by their author", async () => {
    const author = await signUp();
    const other = await signUp();
    await createPost(author.auth, "post").expect(201);
    const [post] = await feed("?limit=1");
    await request(app).post("/comment_post").set(author.auth).send({ postId: post._id, commentBody: "mine" }).expect(201);
    const [comment] = (await request(app).get(`/get_comment?postId=${post._id}`).expect(200)).body.data;
    expect(comment.userId).not.toHaveProperty("email");

    await request(app).post("/delete_comment_of_user").set(other.auth).send({ commentId: comment._id }).expect(403);
    await request(app).post("/delete_comment_of_user").set(author.auth).send({ commentId: comment._id }).expect(200);
  });
});

describe("deleting posts", () => {
  it("is owner-only and removes comments and media", async () => {
    const owner = await signUp();
    const other = await signUp();
    await createPost(owner.auth, "bye", { buffer: PNG, name: "a.png", type: "image/png" }).expect(201);
    const [post] = await feed("?limit=1");
    await request(app).post("/comment_post").set(other.auth).send({ postId: post._id, commentBody: "wait" }).expect(201);

    const forbidden = await request(app).post("/delete_post").set(other.auth).send({ postId: post._id }).expect(403);
    expect(forbidden.body.error.code).toBe("FORBIDDEN");

    await request(app).post("/delete_post").set(owner.auth).send({ postId: post._id }).expect(200);
    const comments = (await request(app).get(`/get_comment?postId=${post._id}`).expect(200)).body.data;
    expect(comments).toEqual([]);
    await vi.waitFor(() => expect(uploadedFiles()).not.toContain(post.media));
  });

  it("404s for a post that doesn't exist", async () => {
    const { auth } = await signUp();
    await request(app).post("/delete_post").set(auth).send({ postId: "0123456789abcdef01234567" }).expect(404);
  });
});

describe("likes", () => {
  it("count each user once", async () => {
    const { auth } = await signUp();
    await createPost(auth, "like me").expect(201);
    const [post] = await feed("?limit=1");
    await request(app).post("/increment_likes").set(auth).send({ postId: post._id }).expect(200);
    await request(app).post("/increment_likes").set(auth).send({ postId: post._id }).expect(200);
    expect((await feed("?limit=1"))[0].likes).toBe(1);
    await request(app).post("/decrement_likes").set(auth).send({ postId: post._id }).expect(200);
    expect((await feed("?limit=1"))[0].likes).toBe(0);
  });
});
