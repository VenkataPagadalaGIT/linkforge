// The page cache (next-cache-handler.cjs): K01 to K05 in docs/NO_DEPLOY_PUBLISHING.md.
// Runs Next.js's own file cache and ours side by side on a temporary folder.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ours = require("../../next-cache-handler.cjs");
const Stock = require("next/dist/server/lib/incremental-cache/file-system-cache").default;
const { nodeFs } = require("next/dist/server/lib/node-fs-methods");

const dist = join(mkdtempSync(join(tmpdir(), "vp-cache-")), "server");
const opts = { fs: nodeFs, flushToDisk: true, serverDistDir: dist, _appDir: true, revalidatedTags: [], experimental: {}, maxMemoryCacheSize: 0 };
const ours = new Ours(opts);
const stock = new Stock(opts);
const tick = () => new Promise((r) => setTimeout(r, 5));
const page = (text, tags) => ({
  kind: "PAGE", html: `<html>${text}</html>`, pageData: `rsc:${text}`, postponed: undefined,
  headers: { "x-next-cache-tags": tags.join(",") }, status: 200,
});

test("K01 a page whose tag was refreshed is served stale for a background re-render, where the stock cache drops it", async () => {
  await ours.set("/ai-contributors/abbeel", page("v1", ["seo", "news", "_N_T_/ai-contributors/abbeel"]), {});
  await tick();
  assert.equal((await ours.get("/ai-contributors/abbeel", { kindHint: "app" })).value.html, "<html>v1</html>", "fresh hit first");
  await ours.revalidateTag("seo");
  await tick();
  assert.equal(await stock.get("/ai-contributors/abbeel", { kindHint: "app" }), null, "stock: dropped, which 404s on dynamicParams = false");
  const stale = await ours.get("/ai-contributors/abbeel", { kindHint: "app" });
  assert.equal(stale.lastModified, -1, "marked for a background re-render");
  assert.equal(stale.value.html, "<html>v1</html>");
  assert.equal(stale.value.pageData, "rsc:v1");
  assert.equal(stale.value.headers["x-next-cache-tags"], "seo,news,_N_T_/ai-contributors/abbeel");
});

test("K02 a page that was never rendered is still a miss, so an unknown slug keeps its 404", async () => {
  assert.equal(await ours.get("/ai-contributors/nobody", { kindHint: "app" }), null);
});

test("K03 a data entry whose tag was refreshed is dropped at once, so the re-render reads the new content", async () => {
  const data = { kind: "FETCH", data: { headers: {}, body: "b64", url: "", status: 200 }, revalidate: 3600 };
  await ours.set("seo-data-key", data, { fetchCache: true, tags: ["seo"] });
  await tick();
  assert.ok(await ours.get("seo-data-key", { kindHint: "fetch", tags: ["seo"] }), "hit before the refresh");
  await ours.revalidateTag("seo");
  await tick();
  assert.equal(await ours.get("seo-data-key", { kindHint: "fetch", tags: ["seo"] }), null);
});

test("K04 a page re-rendered after the refresh is an ordinary fresh hit again", async () => {
  await ours.set("/guides/what-is-jev", page("old", ["seo"]), {});
  await tick();
  await ours.revalidateTag("seo");
  await tick();
  assert.equal((await ours.get("/guides/what-is-jev", { kindHint: "app" })).lastModified, -1);
  await ours.set("/guides/what-is-jev", page("new", ["seo"]), {});
  await tick();
  const hit = await ours.get("/guides/what-is-jev", { kindHint: "app" });
  assert.notEqual(hit.lastModified, -1);
  assert.equal(hit.value.html, "<html>new</html>");
});

test("K05 data entries over 2MB are not cached, as with the stock handler", async () => {
  const big = { kind: "FETCH", data: { headers: {}, body: "x".repeat(2 * 1024 * 1024 + 1), url: "", status: 200 }, revalidate: 60 };
  await ours.set("big-key", big, { fetchCache: true, tags: [] });
  assert.equal(await ours.get("big-key", { kindHint: "fetch", tags: [] }), null);
});
