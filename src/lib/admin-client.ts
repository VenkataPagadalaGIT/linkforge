"use client";

import * as React from "react";
import axios, { AxiosInstance } from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/site";
import { clerkEnabled } from "@/lib/clerk";

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
  if (clerkSignOut) {
    try { await clerkSignOut(); } catch { /* already signed out */ }
  }
}

export const adminApi: AxiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;
  if (clerkEnabled && clerkTokenGetter) {
    const t = await clerkTokenGetter();
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
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

export function useRequireAdmin() {
  const router = useRouter();
  const [status, setStatus] = React.useState<"checking" | "authed" | "unauthed">("checking");
  const [email, setEmail] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const token = getToken();
      if (!token && !clerkEnabled) {
        setStatus("unauthed");
        router.replace("/admin/login");
        return;
      }
      try {
        const { data } = await adminApi.get("/auth/me");
        if (cancelled) return;
        setEmail(data.email);
        setStatus("authed");
      } catch {
        clearToken();
        if (cancelled) return;
        setStatus("unauthed");
        router.replace("/admin/login");
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
