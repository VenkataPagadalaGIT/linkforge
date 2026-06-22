"use client";

import * as React from "react";
import axios from "axios";
import { API } from "@/lib/site";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function ContactForm() {
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "" });

  const disabled = state.kind === "loading";

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 5) {
      setState({ kind: "error", message: "Please fill in name, email and a message (5+ chars)." });
      return;
    }
    setState({ kind: "loading" });
    try {
      const { data } = await axios.post(`${API}/contact`, form, {
        headers: { "Content-Type": "application/json" },
      });
      setState({ kind: "success", message: data?.message || "Thanks — we'll get back to you soon." });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: unknown) {
      const msg =
        (axios.isAxiosError(err) && (err.response?.data as { detail?: string } | undefined)?.detail) ||
        "Something went wrong. Please try again.";
      setState({ kind: "error", message: String(msg) });
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 font-mono text-sm"
      data-testid="contact-form"
      noValidate
    >
      <div>
        <label htmlFor="cf-name" className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">
          Name
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          value={form.name}
          onChange={onChange}
          required
          maxLength={200}
          disabled={disabled}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/40 transition-all"
          placeholder="Your name"
          data-testid="contact-form-name-input"
        />
      </div>

      <div>
        <label htmlFor="cf-email" className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">
          Email
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          required
          disabled={disabled}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/40 transition-all"
          placeholder="you@example.com"
          data-testid="contact-form-email-input"
        />
      </div>

      <div>
        <label htmlFor="cf-subject" className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">
          Subject
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          value={form.subject}
          onChange={onChange}
          maxLength={300}
          disabled={disabled}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/40 transition-all"
          placeholder="What is this about? (optional)"
          data-testid="contact-form-subject-input"
        />
      </div>

      <div>
        <label htmlFor="cf-message" className="block text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-2">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          value={form.message}
          onChange={onChange}
          required
          rows={5}
          maxLength={5000}
          disabled={disabled}
          className="w-full bg-transparent border border-border/40 focus:border-foreground/40 outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground/40 transition-all resize-none"
          placeholder="Tell me about your project, problem, or idea."
          data-testid="contact-form-message-input"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full border border-foreground/40 hover:border-foreground text-foreground py-3 px-6 font-mono text-xs tracking-[0.2em] uppercase transition-all hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="contact-form-submit-button"
      >
        {state.kind === "loading" ? "Sending…" : "Send Message"}
      </button>

      {state.kind === "success" && (
        <p
          className="text-[11px] tracking-wide text-emerald-400 border border-emerald-400/30 bg-emerald-400/5 px-3 py-2"
          data-testid="contact-form-success"
          role="status"
        >
          {state.message}
        </p>
      )}
      {state.kind === "error" && (
        <p
          className="text-[11px] tracking-wide text-destructive-foreground/80 border border-destructive/50 bg-destructive/10 px-3 py-2"
          data-testid="contact-form-error"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
