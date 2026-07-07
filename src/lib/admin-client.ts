"use client";

import * as React from "react";
import axios, { AxiosInstance } from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/lib/site";

const TOKEN_KEY = "mm_admin_token";

export const adminApi: AxiosInstance = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
      if (!token) {
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
