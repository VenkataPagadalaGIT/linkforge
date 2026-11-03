import { test } from "node:test";
import assert from "node:assert/strict";
import { rankReasons, rankScore, rankStories } from "../../src/lib/news-rank.ts";

const today = "2026-11-03";
const story = (over) => ({ title: "A", date: today, sources: 0, documents: 0, claims: 0, live: false, ...over });

test("newer beats older when the evidence is the same", () => {
  assert.ok(rankScore(story({ date: "2026-11-02" }), today) > rankScore(story({ date: "2026-09-02" }), today));
});

test("a deeply evidenced story holds above a thin newer one for a while, then gives way", () => {
  const deep = story({ date: "2026-10-27", sources: 283, claims: 10 });
  assert.ok(rankScore(deep, today) > rankScore(story({ date: "2026-11-02" }), today));
  const old = story({ date: "2026-03-01", sources: 283, claims: 10 });
  assert.ok(rankScore(old, today) < rankScore(story({ date: "2026-11-02", sources: 5 }), today));
});

test("a live story sits above a finished one of the same age and evidence", () => {
  assert.ok(rankScore(story({ live: true }), today) > rankScore(story({}), today));
});

test("a date in the future never scores above today", () => {
  assert.equal(rankScore(story({ date: "2027-01-01" }), today), rankScore(story({}), today));
});

test("the order is stable: same inputs, same order, whatever order they arrive in", () => {
  const a = story({ title: "A", date: "2026-10-01" });
  const b = story({ title: "B", date: "2026-10-01" });
  const c = story({ title: "C", date: "2026-11-01" });
  const one = rankStories([a, b, c], today).map((s) => s.title);
  const two = rankStories([c, b, a], today).map((s) => s.title);
  assert.deepEqual(one, ["C", "A", "B"]);
  assert.deepEqual(two, one);
});

test("10,000 stories rank in well under a second", () => {
  const many = Array.from({ length: 10_000 }, (_, i) => story({ title: `S${i}`, date: `2026-${String(1 + (i % 10)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`, sources: i % 300, claims: i % 12 }));
  const t = Date.now();
  const out = rankStories(many, today);
  assert.equal(out.length, 10_000);
  assert.ok(Date.now() - t < 1000);
});

test("the reasons on the card say why, in words", () => {
  assert.deepEqual(rankReasons(story({ date: "2026-10-30", sources: 283, claims: 10, live: true }), today), ["Live", "4 days ago", "283 sources", "10 claims checked"]);
  assert.deepEqual(rankReasons(story({}), today), ["today"]);
});
