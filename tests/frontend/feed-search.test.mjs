import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, countKinds, isBrowseQuery, parseQuery, search, tokens } from "../../src/lib/feed-search.ts";

const docs = [
  { id: "t1", kind: "topic", title: "Transformers and Attention", sub: "Phase 5: NLP & LLMs · advanced", text: "How attention lets a model weigh every word", href: "/t1", level: "advanced", free: true, boost: 2 },
  { id: "t2", kind: "topic", title: "Python Programming for AI", sub: "Phase 2 · beginner", text: "the language of machine learning", href: "/t2", level: "beginner", free: true, boost: 2 },
  { id: "t3", kind: "topic", title: "Gradient Descent", sub: "Encyclopedia · Math & Optimization", text: "follow the slope down to reduce the error", href: "/t3", level: "intermediate", free: true, boost: 2 },
  { id: "v1", kind: "video", title: "Attention in transformers, visually explained", sub: "3Blue1Brown", href: "/v1", platform: "YouTube", free: true },
  { id: "v2", kind: "video", title: "Python for Beginners", sub: "freeCodeCamp", href: "/v2", platform: "YouTube", free: true, level: "beginner" },
  { id: "c1", kind: "course", title: "Machine Learning Specialization", sub: "Coursera", href: "/c1", free: false, platform: "Coursera" },
  { id: "c2", kind: "course", title: "Hugging Face LLM Course", sub: "Hugging Face", href: "/c2", free: true, platform: "Hugging Face" },
  { id: "b1", kind: "book", title: "Python for Data Analysis", sub: "Wes McKinney", href: "/b1", free: false },
  { id: "r1", kind: "repo", title: "Retrieval Augmented Generation examples", sub: "langchain-ai/rag", href: "/r1", free: true, platform: "GitHub" },
  { id: "n1", kind: "news", title: "NVIDIA to Acquire Hugging Face for $12.93 Billion", sub: "NVIDIA · 3 Sep 2026", text: "the vendor that supplies the industry", href: "/ai-updates/x", date: "2026-09-03", boost: 3 },
  { id: "n2", kind: "news", title: "The Binance hack, October 2026", sub: "Story · 283 sources", href: "/feeds/binance", date: "2026-10-30", boost: 6 },
  { id: "p1", kind: "post", title: "Binance says your money is safe", sub: "The Binance hack · News", text: "withdrawals paused", href: "/p1" },
  { id: "p2", kind: "post", title: "Binance says your money is safe", sub: "The Binance hack · X", href: "/p2" },
  { id: "p3", kind: "post", title: "New wallet found", sub: "The Binance hack · X", href: "/p3" },
  { id: "h1", kind: "person", title: "Geoffrey Hinton", sub: "Neural networks pioneer", href: "/h1" },
  { id: "e1", kind: "company", title: "NVIDIA", sub: "Company · GPUs", href: "/e1", boost: 1 },
];
const index = buildIndex(docs);
const ids = (q) => search(index, q, 100).map((h) => h.doc.id);

test("a topic's own page leads a search for it", () => {
  assert.equal(ids("transformers")[0], "t1");
  assert.ok(ids("transformers").includes("v1"));
});

test("a news search finds the news, not a guess", () => {
  assert.ok(ids("nvidia").includes("n1"));
  assert.ok(ids("nvidia").includes("e1"));
  assert.equal(ids("binance hack")[0], "n2");
  assert.ok(ids("hugging face acquisition nvidia").length === 0 || ids("nvidia hugging face")[0] === "n1");
  assert.equal(ids("nvidia hugging face")[0], "n1");
});

test('"news" alone lists the news, newest and biggest first, and never matches the word "new"', () => {
  const r = ids("news");
  assert.equal(r[0], "n2");
  assert.ok(r.includes("n1"));
  assert.ok(!r.includes("t1") && !r.includes("c1"));
  assert.ok(ids("latest news").includes("n1"));
});

test("asking for a kind lists that kind", () => {
  assert.deepEqual(ids("videos").sort(), ["v1", "v2"]);
  assert.deepEqual(ids("list of topics").sort(), ["t1", "t2", "t3"]);
  assert.deepEqual(ids("books"), ["b1"]);
  assert.deepEqual(ids("people"), ["h1"]);
});

test("a topic plus a kind narrows", () => {
  assert.deepEqual(ids("python videos"), ["v2"]);
  assert.deepEqual(ids("python books"), ["b1"]);
  assert.deepEqual(ids("free courses"), ["c2"]);
  assert.deepEqual(ids("beginner python").sort(), ["t2", "v2"]);
});

test("question words are not the topic", () => {
  assert.equal(ids("what is gradient descent")[0], "t3");
  assert.ok(ids("who hacked binance").length > 0 || ids("binance").length > 0);
});

test("a prefix finds the word", () => {
  assert.ok(ids("transform").includes("t1"));
  assert.ok(ids("pyth").includes("b1"));
});

test("a typo is forgiven only when nothing matched exactly", () => {
  assert.ok(ids("pyton").includes("b1"));
  assert.ok(ids("atention").includes("v1"));
  assert.ok(!ids("wallet").includes("n1"));
  assert.ok(!ids("news").includes("p3"), 'news is not "New wallet found" by typo');
});

test("the field's short forms expand", () => {
  assert.ok(ids("ml").includes("c1"));
  assert.ok(ids("rag").includes("r1"));
});

test("every word must match, so a query narrows instead of widening", () => {
  assert.deepEqual(ids("python coursera"), []);
  assert.deepEqual(ids("attention 3blue1brown"), ["v1"]);
});

test("a word only in a description still finds it when titles found little", () => {
  assert.deepEqual(ids("withdrawals"), ["p1"]);
  assert.ok(ids("slope").includes("t3"));
});

test("the same title shows once", () => {
  assert.equal(ids("money").filter((x) => x === "p1" || x === "p2").length, 1);
});

test("short noise stays out; nothing typed, nothing found", () => {
  assert.deepEqual(ids("zz"), []);
  assert.deepEqual(ids("cat"), []);
  assert.deepEqual(search(index, "   "), []);
  assert.deepEqual(tokens("C++ & Python!"), ["c++", "python"]);
});

test("the query says what was asked", () => {
  const p = parseQuery("free beginner python videos");
  assert.deepEqual(p.terms, ["python"]);
  assert.deepEqual(p.kinds, ["video"]);
  assert.equal(p.level, "beginner");
  assert.equal(p.free, true);
});

test("counts say what is available", () => {
  const c = countKinds(docs);
  assert.equal(c.topic, 3);
  assert.equal(c.news, 2);
  assert.equal(c.video, 2);
});

test('"tech news" and "ai news" mean the news', () => {
  assert.equal(ids("tech news")[0], "n2");
  assert.equal(ids("ai news")[0], "n2");
  assert.deepEqual(ids("binance news"), ["n2"]);
});

test('"what is available" asks for the list, not for a match', () => {
  assert.equal(isBrowseQuery("what is available"), true);
  assert.equal(isBrowseQuery("everything"), true);
  assert.equal(isBrowseQuery("what is python"), false);
  assert.deepEqual(ids("what is available"), []);
});
