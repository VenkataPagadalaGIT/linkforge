"use client";

import * as React from "react";
import axios from "axios";
import { API } from "@/lib/site";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function NewsletterForm({ source = "kit_signup", tag }: { source?: string; tag?: string }) {
  const [email, setEmail] = React.useState("");
  const [state, setState] = React.useState<State>({ kind: "idle" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setState({ kind: "error", message: "Please enter a valid email address." });
      return;
    }
    setState({ kind: "loading" });
    try {
      const { data } = await axios.post(
        `${API}/newsletter`,
        { email: email.trim(), source, tag },
        { headers: { "Content-Type": "application/json" } }
      );
      setState({ kind: "success", message: data?.message || "Subscribed — welcome to Mono Mind." });
      setEmail("");
    } catch (err: unknown) {
      const msg =
        (axios.isAxiosError(err) && (err.response?.data as { detail?: string } | undefined)?.detail) ||
        "Subscription failed. Please try again.";
      setState({ kind: "error", message: String(msg) });
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" data-testid="newsletter-form">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state.kind === "loading"}
          placeholder="your@email.com"
          className="flex-1 bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-3 py-2 text-foreground font-mono text-sm placeholder:text-muted-foreground/40 transition-all"
          data-testid="newsletter-form-email"
        />
        <button
          type="submit"
          disabled={state.kind === "loading"}
          className="border border-foreground/40 hover:border-foreground px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-foreground transition-all hover:bg-foreground hover:text-background disabled:opacity-50"
          data-testid="newsletter-form-submit"
        >
          {state.kind === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {state.kind === "success" && (
        <p className="text-[10px] tracking-wide text-emerald-400" data-testid="newsletter-form-success">
          {state.message}
        </p>
      )}
      {state.kind === "error" && (
        <p className="text-[10px] tracking-wide text-destructive-foreground/80" data-testid="newsletter-form-error">
          {state.message}
        </p>
      )}
    </form>
  );
}
