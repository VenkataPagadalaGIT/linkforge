// The page SEO checks (src/lib/seo-validate.ts): V01 to V09 in docs/NO_DEPLOY_PUBLISHING.md.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSeo } from "../../src/lib/seo-validate.ts";

const read = (p) => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const RULES = read("cms/rules.json");
const EM_DASH = "\u2014";
const file = (pages) => ({ pages });
const check = (pages, opts) => validateSeo(file(pages), RULES, opts);
const blocks = (r) => r.issues.filter((i) => i.level === "block").map((i) => i.message);
const warns = (r) => r.issues.filter((i) => i.level === "warn").map((i) => i.message);
const good = () => ({
  title: "About Venkata Pagadala, AI systems architect",
  description: "D".repeat(150),
  canonical: "/about",
  robots: "index, follow",
});

test("V01 the committed file passes, and a full good entry passes", () => {
  const committed = read("content/seo-overrides.json");
  const r = validateSeo(committed, RULES, { published: committed });
  assert.equal(r.ok, true, blocks(r).join("; "));
  assert.deepEqual(r.changed, []);
  assert.equal(check({ "/about": good() }).ok, true, blocks(check({ "/about": good() })).join("; "));
  assert.equal(check({ "/": { title: "Home" }, "/guides/what-is-jev": { robots: "noindex, follow" } }).ok, true);
});

test("V02 structure problems each block, with a message that says what to do", () => {
  const bad = {
    "not an object": 7,
    "no pages": {},
    "pages is a list": { pages: [] },
    "unknown top-level key": { pages: {}, extra: 1 },
    "note not text": { pages: {}, note: 5 },
  };
  for (const [name, data] of Object.entries(bad)) assert.equal(validateSeo(data, RULES).ok, false, name);
  assert.equal(check({ "/about": "a title" }).ok, false, "entry not an object");
  assert.equal(check({ "/about": {} }).ok, false, "entry sets nothing");
  assert.equal(check({ "/about": { title: 7 } }).ok, false, "value not text");
  assert.equal(check({ "/about": { title: "   " } }).ok, false, "blank value");
  assert.equal(check({ "/about": { keywords: "x" } }).ok, false, "unknown field");
  const h1 = check({ "/about": { h1: "New H1" } });
  assert.equal(h1.ok, false, "h1 is not settable here");
  assert.match(blocks(h1).join(" "), /H1 is part of the page's code/);
  for (const path of ["about", "/about/", "/about?x=1", "/about#x", "/a/../b", "/a/./b", "//about", "/about page"]) {
    assert.equal(check({ [path]: { title: "T" } }).ok, false, `bad path ${path}`);
  }
  for (const path of ["/admin", "/admin/cms/posts", "/api/revalidate", "/_next/static"]) {
    assert.equal(check({ [path]: { title: "T" } }).ok, false, `closed path ${path}`);
  }
});

test("V03 a canonical must stay on this site as a clean page address", () => {
  for (const canonical of ["/about", "/", "https://venkatapagadala.com/about", "https://venkatapagadala.com"]) {
    assert.equal(check({ "/about": { canonical } }).ok, true, canonical);
  }
  for (const canonical of [
    "https://evil.example/about", "http://venkatapagadala.com/about", "https://www.venkatapagadala.com/about",
    "//evil.example/about", "https://venkatapagadala.com/about?x=1", "https://venkatapagadala.com/about#top",
    "https://venkatapagadala.com/about?", "/about/", "about", "javascript:alert(1)",
  ]) {
    assert.equal(check({ "/about": { canonical } }).ok, false, canonical);
    assert.equal(check({ "/about": { canonical } }, { houseRules: false }).ok, false, `${canonical} at runtime too`);
  }
});

test("V04 robots must be one of the allowed values, exactly", () => {
  for (const robots of RULES.fields.robots.allowed) assert.equal(check({ "/about": { robots } }).ok, true, robots);
  for (const robots of ["noindex", "none", "NOINDEX, FOLLOW", "noindex,follow", "index, follow, noarchive"]) {
    assert.equal(check({ "/about": { robots } }).ok, false, robots);
  }
});

test("V05 < or > in any field blocks, at runtime too", () => {
  for (const f of ["title", "description"]) {
    const entry = { [f]: `Nice <script>alert(1)</script>` };
    assert.equal(check({ "/about": entry }).ok, false, f);
    assert.equal(check({ "/about": entry }, { houseRules: false }).ok, false, `${f} at runtime`);
  }
});

test("V06 an em dash blocks a new or changed entry, warns in an unchanged one, and is not a runtime check", () => {
  const dashed = { "/about": { title: `About ${EM_DASH} Venkata` } };
  assert.equal(check(dashed).ok, false, "new entry");
  assert.equal(check(dashed, { published: file({ "/about": { title: "Old" } }) }).ok, false, "changed entry");
  const r = check(dashed, { published: file(dashed) });
  assert.equal(r.ok, true, "unchanged entry keeps publishing");
  assert.ok(warns(r).some((w) => /house-rule/.test(w)));
  assert.equal(check(dashed, { houseRules: false }).ok, true, "runtime ignores house rules");
});

test("V07 title and description lengths warn but do not block, for changed entries only", () => {
  const long = { "/about": { title: "T".repeat(61), description: "short" } };
  const r = check(long);
  assert.equal(r.ok, true);
  assert.equal(warns(r).length, 2);
  assert.equal(warns(check({ "/about": { title: "T".repeat(60), description: "D".repeat(140) } })).length, 0, "at the limits");
  assert.equal(warns(check(long, { published: file(long) })).length, 0, "unchanged entries do not warn");
});

test("V08 changed and removed pages are reported for the refresh message", () => {
  const before = file({ "/about": { title: "Old" }, "/contact": { title: "Contact" }, "/research": { title: "R" } });
  const r = check({ "/about": { title: "New" }, "/research": { title: "R" }, "/guides": { title: "G" } }, { published: before });
  assert.deepEqual(r.changed.sort(), ["/about", "/guides"]);
  assert.deepEqual(r.removed, ["/contact"]);
});

test("V09 the numbers come from cms/rules.json, not from the checker", () => {
  assert.equal(typeof RULES.site, "string");
  assert.equal(typeof RULES.fields.title.max, "number");
  assert.ok(Array.isArray(RULES.fields.robots.allowed) && RULES.fields.robots.allowed.length);
  const strict = structuredClone(RULES);
  strict.fields.title.max = 10;
  strict.fields.robots.allowed = ["noindex, nofollow"];
  const r = validateSeo(file({ "/about": { title: "T".repeat(20) } }), strict);
  assert.equal(warns(r).length, 1, "title limit from the rules");
  assert.equal(validateSeo(file({ "/about": { robots: "index, follow" } }), strict).ok, false, "robots list from the rules");
  const moved = { ...structuredClone(RULES), site: "https://example.org" };
  assert.equal(validateSeo(file({ "/about": { canonical: "https://example.org/about" } }), moved).ok, true, "site from the rules");
});
