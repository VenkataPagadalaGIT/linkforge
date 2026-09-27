// The news checks (src/lib/news-validate.ts): N01 to N05 in docs/NO_DEPLOY_PUBLISHING.md.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateNews } from "../../src/lib/news-validate.ts";

const FILE = new URL("../../content/ai-updates.json", import.meta.url);
const news = () => JSON.parse(readFileSync(FILE, "utf8"));
const blocks = (r) => r.issues.filter((i) => i.level === "block").map((i) => i.message);
const good = () => ({
  id: "t1", slug: "test-article", title: "A test article", company: "Example", category: "research",
  date: "2026-09-27", summary: "S".repeat(150), body: "<p>Body with a <a href=\"https://example.com\">link</a>.</p>",
  sourceUrl: "https://example.com/source", takeaways: ["one"], tocSections: ["Intro"], tags: ["ai"], relatedLinks: [],
});

test("N01 the migrated file passes: 14 articles, same slugs as the old code", () => {
  const data = news();
  assert.equal(data.length, 14);
  const r = validateNews(data, data);
  assert.equal(r.ok, true, blocks(r).join("; "));
  assert.deepEqual(r.changed, []);
  assert.equal(new Set(data.map((u) => u.slug)).size, 14);
});

test("N02 structure problems each block", () => {
  const cases = {
    "missing title": (a) => { delete a.title; },
    "title not text": (a) => { a.title = 7; },
    "bad slug": (a) => { a.slug = "Not A Slug"; },
    "bad category": (a) => { a.category = "gossip"; },
    "bad date": (a) => { a.date = "27/09/2026"; },
    "tags not a list": (a) => { a.tags = "ai"; },
    "source not a link": (a) => { a.sourceUrl = "example.com"; },
  };
  for (const [name, mutate] of Object.entries(cases)) {
    const a = good();
    mutate(a);
    assert.equal(validateNews([a]).ok, false, name);
  }
  assert.equal(validateNews([good(), good()]).ok, false, "duplicate slug");
  assert.equal(validateNews({ not: "a list" }).ok, false, "not a list");
  assert.equal(validateNews([good()]).ok, true, "the good article passes");
});

test("N03 unsafe HTML in the body blocks, at runtime too", () => {
  const bad = [
    "<script>alert(1)</script>", "<SCRIPT src=x>", "<iframe src=https://x>", "<object data=x>", "<embed src=x>",
    "<form action=x>", "<style>p{}</style>", "<link rel=stylesheet href=x>", "<meta http-equiv=refresh>", "<base href=x>",
    "<img src=x onerror=alert(1)>", "<a href=\"javascript:alert(1)\">x</a>", "<a href='vbscript:x'>x</a>", "<img src=\"data:text/html,x\">",
  ];
  for (const body of bad) {
    const a = { ...good(), body };
    assert.equal(validateNews([a], undefined, false).ok, false, body);
    assert.equal(validateNews([a]).ok, false, body);
  }
  // Ordinary words that look alike are fine.
  assert.equal(validateNews([{ ...good(), body: "<p>The data: 5 models; javascript skills; the onboarding flow.</p>" }]).ok, true);
});

test("N04 an em dash blocks in a new or changed article, and only warns in an unchanged one", () => {
  const published = [good()];
  const withDash = { ...good(), summary: "S".repeat(140) + " — more" };
  assert.equal(validateNews([withDash], published).ok, false, "changed article with a dash");
  const fresh = { ...good(), slug: "new-one", id: "t2", title: "New — article" };
  assert.equal(validateNews([good(), fresh], published).ok, false, "new article with a dash");
  const legacy = [{ ...good(), title: "Old — article" }];
  const r = validateNews(legacy, legacy);
  assert.equal(r.ok, true, "unchanged article keeps publishing");
  assert.ok(r.issues.some((i) => i.level === "warn" && /em dash/.test(i.message)));
  assert.equal(validateNews(legacy, legacy, false).ok, true, "runtime ignores house rules");
});

test("N05 length problems warn but do not block", () => {
  const long = { ...good(), title: "T".repeat(80), summary: "short" };
  const r = validateNews([long], [good()]);
  assert.equal(r.ok, true);
  assert.equal(r.issues.filter((i) => i.level === "warn").length, 2);
});

test("changed and removed are reported for the publish message", () => {
  const a = good(), b = { ...good(), slug: "second", id: "t2" };
  const r = validateNews([{ ...a, title: "Edited" }], [a, b]);
  assert.deepEqual(r.changed, ["test-article"]);
  assert.deepEqual(r.removed, ["second"]);
});
