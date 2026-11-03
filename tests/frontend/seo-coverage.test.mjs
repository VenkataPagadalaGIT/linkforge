// Every public page can take a published SEO override: C01 in docs/NO_DEPLOY_PUBLISHING.md.
// A new page that exports its own metadata directly would silently ignore the
// overrides file; this test names it.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const APP = fileURLToPath(new URL("../../app", import.meta.url));

function pages(dir = APP, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (name === "page.tsx") out.push(p);
  }
  return out;
}

const routeOf = (file) => {
  const segs = relative(APP, file).split(sep).slice(0, -1).filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  return `/${segs.join("/")}`;
};

test("C01 every public page wraps its metadata in withSeoOverrides with its own route", () => {
  const all = pages().filter((f) => !["admin", "api"].includes(relative(APP, f).split(sep)[0]));
  assert.ok(all.length >= 50, `found only ${all.length} pages`);
  const problems = [];
  for (const f of all) {
    const src = readFileSync(f, "utf8");
    const route = routeOf(f);
    const wraps = [...src.matchAll(/export const generateMetadata = withSeoOverrides\("([^"]*)",/g)].map((m) => m[1]);
    if (wraps.length !== 1) problems.push(`${route}: expected one withSeoOverrides export, found ${wraps.length}`);
    else if (wraps[0] !== route) problems.push(`${route}: wrapped as "${wraps[0]}"`);
    if (/export const metadata\b|export (async )?function generateMetadata\b/.test(src)) {
      problems.push(`${route}: exports metadata directly, so an override would not reach it`);
    }
  }
  assert.deepEqual(problems, []);
});
