// The admin sign-in decisions (src/lib/admin-auth-outcome.ts), tested directly.
// Run: node --test tests/frontend/   (Node 22.18+ runs the .ts import as-is)
import { test } from "node:test";
import assert from "node:assert/strict";
import { loginUrlFor, outcomeOf, safeRedirect } from "../../src/lib/admin-auth-outcome.ts";

test("200 is signed in", () => {
  assert.equal(outcomeOf({ status: 200, sentClerkToken: true }), "authed");
  assert.equal(outcomeOf({ status: 200, sentClerkToken: false }), "authed");
});

test("403 is the not-allowlisted screen, never the login page", () => {
  assert.equal(outcomeOf({ status: 403, sentClerkToken: true }), "not-allowlisted");
});

test("401 after sending a Clerk token is the refusal screen, not a login loop", () => {
  assert.equal(outcomeOf({ status: 401, sentClerkToken: true }), "session-refused");
});

test("401 without a Clerk token means signed out: go to the login page", () => {
  assert.equal(outcomeOf({ status: 401, sentClerkToken: false }), "signed-out");
});

test("no response, 5xx, 429 and a failed Clerk token are a retry screen, never a login loop", () => {
  for (const status of [undefined, 500, 502, 503, 504, 429]) {
    assert.equal(outcomeOf({ status, sentClerkToken: true }), "unavailable", String(status));
    assert.equal(outcomeOf({ status, sentClerkToken: false }), "unavailable", String(status));
  }
  assert.equal(outcomeOf({ status: 401, sentClerkToken: false, clerkTokenError: true }), "unavailable");
});

test("redirect after sign-in: same-site paths only", () => {
  assert.equal(safeRedirect("?redirect_url=%2Fnotebook%2Fconference%2Fseo-week"), "/notebook/conference/seo-week");
  assert.equal(safeRedirect("?redirect_url=%2Fadmin%2Fcms%2Fposts%3Fq%3D1"), "/admin/cms/posts?q=1");
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", "evil"]) {
    assert.equal(safeRedirect("?redirect_url=" + encodeURIComponent(bad)), "/admin", bad);
  }
  assert.equal(safeRedirect(""), "/admin");
  assert.equal(safeRedirect("?redirect_url=%2Fok%0Aevil"), "/admin");
});

test("the login link round-trips through safeRedirect", () => {
  const path = "/notebook/conference/seo-week/sessions/s1?tab=notes";
  const url = loginUrlFor(path);
  assert.equal(safeRedirect(url.slice(url.indexOf("?"))), path);
});
