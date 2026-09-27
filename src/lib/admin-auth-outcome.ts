/**
 * The admin sign-in decisions, as pure functions with no imports, so they
 * are tested directly (tests/frontend/admin-auth-outcome.test.mjs, run by
 * the preflight) instead of only by clicking through a browser.
 */

export type AuthOutcome =
  | "authed" // the server accepted the session
  | "not-allowlisted" // 403: signed in with Clerk, but not an allowlisted admin
  | "session-refused" // 401 after a Clerk token was sent: the server did not accept it
  | "signed-out" // 401 with no Clerk token: go to the login page
  | "unavailable"; // no answer, a 5xx, a 429, or Clerk could not give a token: retry, never loop

export function outcomeOf(r: {
  status?: number; // HTTP status of /auth/me, undefined when there was no response
  sentClerkToken: boolean; // the request carried a Clerk session token
  clerkTokenError?: boolean; // Clerk failed to produce a token at all
}): AuthOutcome {
  if (r.clerkTokenError) return "unavailable";
  if (r.status === undefined) return "unavailable";
  if (r.status >= 200 && r.status < 300) return "authed";
  if (r.status === 403) return "not-allowlisted";
  if (r.status === 401) return r.sentClerkToken ? "session-refused" : "signed-out";
  return "unavailable";
}

/**
 * Where to send the visitor after signing in: the path they asked for, but
 * only a same-site path, never another site (open-redirect guard).
 */
export function safeRedirect(search: string, fallback = "/admin"): string {
  let target: string | null = null;
  try {
    target = new URLSearchParams(search).get("redirect_url");
  } catch {
    return fallback;
  }
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//") || target.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(target)) return fallback;
  return target;
}

/** The login URL that brings the visitor back to `path` afterwards. */
export function loginUrlFor(path: string): string {
  return `/admin/login?redirect_url=${encodeURIComponent(path)}`;
}
