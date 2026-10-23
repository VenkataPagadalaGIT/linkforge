// The shared reader of published content (src/lib/content-github.ts): G01 to G05 in docs/NO_DEPLOY_PUBLISHING.md.
// Run: node --test "tests/frontend/*.test.mjs"
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { forgetReads, readPublished } from "../../src/lib/content-github.ts";

let server, base, hits = 0, reply = { status: 200, body: { pages: {} } };
before(async () => {
  server = createServer((req, res) => {
    hits += 1;
    res.writeHead(reply.status, { "content-type": "application/json" });
    res.end(typeof reply.body === "string" ? reply.body : JSON.stringify(reply.body));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const ok = () => null;
const noPages = (d) => (d && typeof d === "object" && "pages" in d ? null : "no pages");
const read = (file, problem = noPages, reuse = 60_000) => readPublished(file, `${base}/${file}`, problem, reuse);

test("G01 one read serves every page for the period: a second read in the window does not ask again", async () => {
  forgetReads();
  hits = 0;
  reply = { status: 200, body: { pages: { "/a": { title: "A" } } } };
  const [one, two] = await Promise.all([read("g01.json"), read("g01.json")]);
  assert.deepEqual(one, { pages: { "/a": { title: "A" } } });
  assert.deepEqual(two, one);
  await read("g01.json");
  assert.equal(hits, 1);
});

test("G02 the refresh message's forgetReads makes the next read ask again and see the new copy", async () => {
  forgetReads();
  reply = { status: 200, body: { pages: { "/a": { title: "Old" } } } };
  await read("g02.json");
  reply = { status: 200, body: { pages: { "/a": { title: "New" } } } };
  assert.equal((await read("g02.json")).pages["/a"].title, "Old", "still shared before the refresh");
  forgetReads();
  assert.equal((await read("g02.json")).pages["/a"].title, "New");
});

test("G03 GitHub down, slow or answering an error: the last good copy keeps serving, or null before any", async () => {
  forgetReads();
  reply = { status: 500, body: "{}" };
  assert.equal(await read("g03.json"), null, "no good copy yet: the caller serves the built-in copy");
  forgetReads();
  reply = { status: 200, body: { pages: { "/a": { title: "Good" } } } };
  await read("g03.json");
  forgetReads();
  reply = { status: 500, body: "{}" };
  assert.equal((await read("g03.json")).pages["/a"].title, "Good");
  forgetReads();
  reply = { status: 200, body: "{ not json" };
  assert.equal((await read("g03.json")).pages["/a"].title, "Good");
});

test("G04 a copy that fails the checks is refused and the last good copy keeps serving", async () => {
  forgetReads();
  reply = { status: 200, body: { pages: { "/a": { title: "Good" } } } };
  await read("g04.json");
  forgetReads();
  reply = { status: 200, body: { nothing: true } };
  assert.equal((await read("g04.json")).pages["/a"].title, "Good");
  assert.equal(await readPublished("g04.json", "off", ok, 1000), null, '"off" reads nothing');
});

test("G05 the fetch passes no cache option (an explicit no-store breaks static pages in Next.js 14.2)", async () => {
  forgetReads();
  const real = globalThis.fetch;
  let init;
  globalThis.fetch = (url, i) => { init = i; return real(url, i); };
  try {
    reply = { status: 200, body: { pages: {} } };
    await read("g05.json");
  } finally {
    globalThis.fetch = real;
  }
  assert.equal(init.cache, undefined);
  assert.equal(init.next, undefined);
});
