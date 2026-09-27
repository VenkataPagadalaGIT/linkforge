"use client";

import * as React from "react";
import axios, { AxiosInstance } from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/site";
import { clerkEnabled } from "@/lib/clerk";
import { loginUrlFor, outcomeOf } from "@/lib/admin-auth-outcome";

const TOKEN_KEY = "mm_admin_token";

/**
 * With Clerk enabled, each request asks the Clerk session for a fresh,
 * short-lived token instead of reading a long-lived one from localStorage.
 * The provider (mounted in the admin layout) registers this getter; the
 * indirection keeps this module importable outside the ClerkProvider tree.
 */
let clerkTokenGetter: (() => Promise<string | null>) | null = null;
export function registerClerkTokenGetter(fn: (() => Promise<string | null>) | null) {
  clerkTokenGetter = fn;
}
/** True once a signed-in Clerk session has registered its token getter. */
export function clerkSignedIn(): boolean {
  return clerkTokenGetter !== null;
}

/**
 * Clerk loads in the browser after the page. Deciding "signed out" before it
 * has loaded bounced every hard refresh through /admin/login, so the bridge
 * reports when Clerk is ready and the checks below wait for it.
 */
let clerkLoaded = false;
const clerkWaiters: Array<(ok: boolean) => void> = [];
export function markClerkLoaded() {
  if (clerkLoaded) return;
  clerkLoaded = true;
  clerkWaiters.splice(0).forEach((w) => w(true));
}
export function waitForClerk(timeoutMs = 10000): Promise<boolean> {
  if (!clerkEnabled || clerkLoaded) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    clerkWaiters.push((ok) => {
      clearTimeout(timer);
      resolve(ok);
    });
  });
}

/**
 * "Owner device": this browser has signed in to the admin with Clerk. Only
 * then do the public conference pages load Clerk (for the notebook), so
 * ordinary visitors never download it.
 */
const OWNER_DEVICE_KEY = "mm_owner_device";
export function isOwnerDevice(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(OWNER_DEVICE_KEY) === "1";
  } catch {
    return false;
  }
}
export function markOwnerDevice() {
  try {
    localStorage.setItem(OWNER_DEVICE_KEY, "1");
  } catch { /* storage blocked: the notebook just asks to sign in again */ }
}
export function clearOwnerDevice() {
  try {
    localStorage.removeItem(OWNER_DEVICE_KEY);
  } catch { /* nothing to clear */ }
}

/** Could this browser hold an admin session? Cheap, no network. */
export function mightBeSignedIn(): boolean {
  return !!getToken() || (clerkEnabled && isOwnerDevice());
}
/** Before an authenticated call on a public page, let Clerk finish loading. */
export async function ensureAuthReady(): Promise<void> {
  if (clerkEnabled && isOwnerDevice()) await waitForClerk();
}

/** Registered by the bridge so sign-out ends the Clerk session, not just
 *  the legacy cookie. No-op when Clerk is off. */
let clerkSignOut: (() => Promise<void>) | null = null;
export function registerClerkSignOut(fn: (() => Promise<void>) | null) {
  clerkSignOut = fn;
}
export async function signOutEverywhere(): Promise<void> {
  try {
    await adminApi.post("/auth/logout");
  } catch { /* legacy cookie may not exist under Clerk */ }
  clearToken();
  clearOwnerDevice();
  if (clerkSignOut) {
    try { await clerkSignOut(); } catch { /* already signed out */ }
  }
}

export const adminApi: AxiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

/**
 * A laptop must not write to production by accident. `.env.local` has pointed
 * the local admin at the production backend, so a test click on localhost
 * changed the live site. Reads stay allowed; writes from a local page to a
 * non-local backend need NEXT_PUBLIC_ALLOW_LOCAL_TO_PROD_WRITES=1, set on
 * purpose for that session.
 */
export function blocksLocalWriteToRemote(method: string | undefined, hostname: string, backend: string): boolean {
  const write = !["get", "head", "options"].includes((method || "get").toLowerCase());
  const localPage = ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
  const localBackend = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(backend);
  const allowed = process.env.NEXT_PUBLIC_ALLOW_LOCAL_TO_PROD_WRITES === "1";
  return write && localPage && !localBackend && !allowed;
}

adminApi.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;
  if (blocksLocalWriteToRemote(config.method, window.location.hostname, BACKEND_URL)) {
    throw new Error(
      `Blocked: this local admin would write to ${BACKEND_URL}. ` +
        "Point NEXT_PUBLIC_BACKEND_URL at a local backend, or set NEXT_PUBLIC_ALLOW_LOCAL_TO_PROD_WRITES=1 deliberately.",
    );
  }
  if (clerkEnabled && clerkTokenGetter) {
    let t: string | null = null;
    try {
      t = await clerkTokenGetter();
    } catch {
      // Clerk could not produce a token (network, expired session refresh).
      // Do not send the request unauthenticated: that 401 would read as
      // "signed out" and loop through the login page.
      throw Object.assign(new Error("Clerk session token unavailable"), { clerkTokenError: true });
    }
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
      // Remembered on the request (never sent), so a 401 can tell "the
      // server refused a real Clerk sign-in" from "not signed in yet".
      (config as { sentClerkToken?: boolean }).sentClerkToken = true;
      return config;
    }
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function saveToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Why the last admin check refused a signed-in visitor, for AdminForbidden. */
export type Refusal = "not-allowlisted" | "session-refused";
let lastRefusal: Refusal = "not-allowlisted";
export function refusalReason(): Refusal {
  return lastRefusal;
}

export type AdminStatus = "checking" | "authed" | "unauthed" | "forbidden" | "error";

export function useRequireAdmin() {
  const router = useRouter();
  const [status, setStatus] = React.useState<AdminStatus>("checking");
  const [email, setEmail] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    const goLogin = () => {
      setStatus("unauthed");
      router.replace(loginUrlFor(window.location.pathname + window.location.search));
    };
    const run = async () => {
      if (clerkEnabled && !(await waitForClerk())) {
        if (!cancelled) setStatus("error"); // Clerk never loaded: offer a retry, not a loop
        return;
      }
      if (cancelled) return;
      if (!getToken() && !(clerkEnabled && clerkSignedIn())) {
        goLogin();
        return;
      }
      try {
        const res = await adminApi.get("/auth/me");
        if (cancelled) return;
        if ((res.config as { sentClerkToken?: boolean }).sentClerkToken) markOwnerDevice();
        setEmail(res.data.email);
        setStatus("authed");
      } catch (e) {
        if (cancelled) return;
        const outcome = outcomeOf({
          status: axios.isAxiosError(e) ? e.response?.status : undefined,
          sentClerkToken:
            axios.isAxiosError(e) && (e.config as { sentClerkToken?: boolean } | undefined)?.sentClerkToken === true,
          clerkTokenError: (e as { clerkTokenError?: boolean }).clerkTokenError === true,
        });
        if (outcome === "not-allowlisted" || outcome === "session-refused") {
          // Signed in with Clerk, but the backend refused. Do NOT redirect:
          // Clerk would send the active session straight back to /admin and
          // we would loop forever. Show a sign-out screen that says why.
          lastRefusal = outcome;
          setStatus("forbidden");
          return;
        }
        if (outcome === "unavailable") {
          // The server or Clerk did not answer properly: a retry screen.
          // Never clear the session or route to login for this.
          setStatus("error");
          return;
        }
        clearToken();
        goLogin();
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { status, email } as const;
}

export function formatApiError(err: unknown, fallback = "Something went wrong."): string {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d: unknown) => (d && typeof (d as { msg?: string }).msg === "string" ? (d as { msg: string }).msg : ""))
        .filter(Boolean)
        .join(" ") || fallback;
    }
  }
  return fallback;
}
