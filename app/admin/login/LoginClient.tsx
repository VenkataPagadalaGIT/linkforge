"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { adminApi, saveToken, formatApiError } from "@/lib/admin-client";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await adminApi.post("/auth/login", { email, password });
      saveToken(data.access_token);
      router.replace("/admin");
    } catch (err) {
      setError(formatApiError(err, "Invalid credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-24">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-border/40 bg-card/30 backdrop-blur-sm p-8 font-mono"
        data-testid="admin-login-form"
      >
        <p className="text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase mb-2">
          Mono Mind · Admin
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground text-glow mb-8">Sign in</h1>

        <label className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-3 py-2 text-foreground text-sm mb-5 transition-all"
          placeholder="admin@monomind.com"
          data-testid="admin-login-email"
        />

        <label className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-3 py-2 text-foreground text-sm mb-6 transition-all"
          placeholder="••••••••"
          data-testid="admin-login-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full border border-foreground/40 hover:border-foreground text-foreground py-2.5 text-xs tracking-[0.2em] uppercase transition-all hover:bg-foreground hover:text-background disabled:opacity-50"
          data-testid="admin-login-submit"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {error && (
          <p
            className="mt-4 text-[11px] text-destructive-foreground/90 border border-destructive/50 bg-destructive/10 px-3 py-2"
            role="alert"
            data-testid="admin-login-error"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
