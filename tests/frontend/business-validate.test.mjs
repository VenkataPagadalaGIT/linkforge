// The Business Notebook checks (src/lib/business-validate.ts): B01 to B08 in docs/NO_DEPLOY_PUBLISHING.md.
// Run: node --test "tests/frontend/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseInline, plainText, validateBusiness } from "../../src/lib/business-validate.ts";

const FILE = () => JSON.parse(readFileSync(new URL("../../content/business.json", import.meta.url), "utf8"));
const blocks = (r) => r.issues.filter((i) => i.level === "block").map((i) => i.message);
const EM_DASH = "\u2014";

test("B01 the committed file passes: one article, Costco, two people, every citation and link resolving", () => {
  const f = FILE();
  const r = validateBusiness(f, f);
  assert.equal(r.ok, true, blocks(r).join("; "));
  assert.deepEqual(r.changed, []);
  assert.equal(f.articles.length, 1);
  assert.deepEqual(f.people.map((p) => p.slug).sort(), ["gary-millerchip", "ron-vachris"]);
});

test("B02 structure problems block", () => {
  const cases = {
    "not an object": () => 7,
    "no people list": (f) => { delete f.people; return f; },
    "unknown top-level key": (f) => ({ ...f, extra: 1 }),
    "bad slug": (f) => { f.people[0].slug = "Ron Vachris"; return f; },
    "duplicate slug": (f) => { f.people[1].slug = f.people[0].slug; return f; },
    "reserved article slug": (f) => { f.articles[0].slug = "people"; return f; },
    "missing title": (f) => { delete f.articles[0].title; return f; },
    "bad date": (f) => { f.articles[0].eventDate = "Sept 24"; return f; },
    "source not https": (f) => { f.articles[0].sources[0].url = "http://example.com"; return f; },
    "empty section": (f) => { f.articles[0].sections[0].blocks = []; return f; },
  };
  for (const [name, mutate] of Object.entries(cases)) {
    assert.equal(validateBusiness(mutate(FILE()), undefined, false).ok, false, name);
  }
});

test("B03 references must resolve: citations, entity links, companies and people of an article", () => {
  const cases = {
    "citation to a missing source": (f) => { f.articles[0].sections[0].blocks[0].text += " [^9]"; return f; },
    "fact citing a missing source": (f) => { f.companies[0].facts[0].cite = 9; return f; },
    "link to a missing person": (f) => { f.articles[0].summary += " [[person:nobody]]"; return f; },
    "link to a bad page path": (f) => { f.articles[0].summary += " [[page:not-a-path|x]]"; return f; },
    "article company not in the file": (f) => { f.articles[0].company = "walmart"; return f; },
    "article person not in the file": (f) => { f.articles[0].people.push("nobody"); return f; },
    "unclosed highlight": (f) => { f.articles[0].summary += " ==never closed"; return f; },
    "outside link not https": (f) => { f.articles[0].summary += " [[url:http://example.com|x]]"; return f; },
    "outside link without a label": (f) => { f.articles[0].summary += " [[url:https://example.com]]"; return f; },
  };
  for (const [name, mutate] of Object.entries(cases)) {
    const r = validateBusiness(mutate(FILE()), undefined, false);
    assert.equal(r.ok, false, name);
  }
});

test("B04 < or > anywhere blocks, at runtime too", () => {
  const f = FILE();
  f.people[0].summary = "Hello <script>alert(1)</script>";
  assert.equal(validateBusiness(f, undefined, false).ok, false);
  const g = FILE();
  g.articles[0].sources[0].title = "a <b>bold</b> title";
  assert.equal(validateBusiness(g, undefined, false).ok, false);
});

test("B05 an em dash blocks a new or changed item and is not a runtime check", () => {
  const before = FILE();
  const f = FILE();
  f.people[0].summary += ` ${EM_DASH} more`;
  assert.equal(validateBusiness(f, before).ok, false, "changed item");
  assert.equal(validateBusiness(f, undefined, false).ok, true, "runtime ignores house rules");
});

test("B06 SEO title and description lengths warn but do not block", () => {
  const before = FILE();
  const f = FILE();
  f.people[0].seoTitle = "T".repeat(61);
  f.people[0].description = "short";
  const r = validateBusiness(f, before);
  assert.equal(r.ok, true);
  assert.equal(r.issues.filter((i) => i.level === "warn").length, 2);
});

test("B07 the inline markup parses into highlights, citations and links; plain text drops it", () => {
  const segs = parseInline("Before ==AI search grew [^2] at [[company:costco|Costco]]== after [[person:gary-millerchip]].");
  assert.deepEqual(segs.map((s) => [s.kind, s.highlight]), [
    ["text", false], ["text", true], ["cite", true], ["text", true], ["link", true], ["text", false], ["link", false], ["text", false],
  ]);
  assert.equal(segs.find((s) => s.kind === "cite").id, 2);
  assert.throws(() => parseInline("==open"), /not closed/);
  const names = (t, ref) => ({ person: { "gary-millerchip": "Gary Millerchip" } }[t]?.[ref]);
  assert.equal(plainText("CFO [[person:gary-millerchip]] said ==AI== grew.[^2]", names), "CFO Gary Millerchip said AI grew.");
});

test("B08 changed and removed items are reported by type and slug, for the refresh message", () => {
  const before = FILE();
  const f = FILE();
  f.people[0].role = "Changed role";
  f.people.pop();
  const r = validateBusiness(f, before, false);
  assert.deepEqual(r.changed, ["person:ron-vachris"]);
  assert.deepEqual(r.removed.length, 1);
});
