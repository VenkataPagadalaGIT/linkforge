// The signed refresh message (src/lib/content-signature.ts): S01 to S03 in docs/NO_DEPLOY_PUBLISHING.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { signContent, verifyContentSignature } from "../../src/lib/content-signature.ts";

const SECRET = "a".repeat(64);
const BODY = JSON.stringify({ tags: ["news"] });
const NOW = 1_790_000_000_000;
const verify = (over = {}) => verifyContentSignature({ secret: SECRET, header: signContent(SECRET, BODY, NOW), body: BODY, nowMs: NOW, ...over });

test("S01 a correctly signed refresh is accepted, within the 5 minute window", () => {
  assert.deepEqual(verify(), { ok: true });
  assert.deepEqual(verify({ nowMs: NOW + 299_000 }), { ok: true });
});

test("S02 wrong secret, tampered body, stale or future time, and bad headers are refused", () => {
  assert.equal(verify({ header: signContent("b".repeat(64), BODY, NOW) }).reason, "bad-signature");
  assert.equal(verify({ body: JSON.stringify({ tags: ["news", "other"] }) }).reason, "bad-signature");
  assert.equal(verify({ nowMs: NOW + 301_000 }).reason, "stale");
  assert.equal(verify({ nowMs: NOW - 301_000 }).reason, "stale");
  assert.equal(verify({ header: null }).reason, "missing");
  assert.equal(verify({ header: "" }).reason, "missing");
  for (const header of ["garbage", "t=abc,v1=00", `t=${NOW / 1000},v1=${"g".repeat(64)}`, `v1=${"0".repeat(64)},t=1`]) {
    assert.equal(verify({ header }).reason, "malformed", header);
  }
});

test("S03 with no secret (or a short one) configured, every refresh is refused", () => {
  assert.equal(verify({ secret: undefined }).reason, "not-configured");
  assert.equal(verify({ secret: "" }).reason, "not-configured");
  assert.equal(verify({ secret: "short-secret" }).reason, "not-configured");
});
