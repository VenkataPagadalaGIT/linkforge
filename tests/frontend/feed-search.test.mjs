import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, search, tokens } from "../../src/lib/feed-search.ts";

const docs = [
  { id: "t1", kind: "topic", title: "Transformers and Attention", sub: "Phase 5: NLP & LLMs", href: "/t1" },
  { id: "v1", kind: "video", title: "Attention in transformers, visually explained", sub: "3Blue1Brown", href: "/v1" },
  { id: "c1", kind: "course", title: "Machine Learning Specialization", sub: "Coursera", href: "/c1" },
  { id: "b1", kind: "book", title: "Python for Data Analysis", sub: "Wes McKinney", href: "/b1" },
  { id: "r1", kind: "repo", title: "Retrieval Augmented Generation examples", sub: "langchain-ai/rag", href: "/r1" },
  { id: "p1", kind: "post", title: "Binance says your money is safe", sub: "News", text: "withdrawals paused", href: "/p1" },
];
const index = buildIndex(docs);
const ids = (q) => search(index, q).map((h) => h.doc.id);

test("a word finds its document, and the title beats everything else", () => {
  assert.equal(ids("transformers")[0], "t1");
  assert.ok(ids("transformers").includes("v1"));
  assert.deepEqual(ids("coursera"), ["c1"]);
});

test("a prefix finds the word", () => {
  assert.ok(ids("transform").includes("t1"));
  assert.ok(ids("pyth").includes("b1"));
});

test("one typo still finds it", () => {
  assert.deepEqual(ids("pyton"), ["b1"]);
  assert.ok(ids("atention").includes("v1"));
});

test("the field's short forms expand", () => {
  assert.ok(ids("ml").includes("c1"));
  assert.ok(ids("rag").includes("r1"));
});

test("every word must match, so a query narrows instead of widening", () => {
  assert.deepEqual(ids("python coursera"), []);
  assert.deepEqual(ids("attention 3blue1brown"), ["v1"]);
});

test("text that is searched but not shown still matches", () => {
  assert.deepEqual(ids("withdrawals"), ["p1"]);
});

test("short words never fuzzy match, so noise stays out", () => {
  assert.deepEqual(ids("zz"), []);
  assert.deepEqual(ids("cat"), []);
});

test("nothing typed, nothing found; stop words alone still search", () => {
  assert.deepEqual(search(index, "   "), []);
  assert.deepEqual(ids("the"), []);
  assert.deepEqual(tokens("C++ & Python!"), ["c++", "python"]);
});
