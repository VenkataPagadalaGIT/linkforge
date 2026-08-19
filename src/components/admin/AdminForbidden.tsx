"use client";
import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { signOutEverywhere } from "@/lib/admin-client";

/**
 * Shown when Clerk authenticated the visitor but their email is not on the
 * admin allowlist (the backend returned 403). This is the "authenticated is
 * not authorized" case, and it must be a dead end with a sign-out, never a
 * redirect back to login, or the active Clerk session loops straight back.
 */
export default function AdminForbidden() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "this account";
  const [busy, setBusy] = React.useState(false);
  const signOut = async () => {
    setBusy(true);
    await signOutEverywhere();
    window.location.href = "/admin/login";
  };
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">
        Not an authorized admin
      </p>
      <h1 className="font-display text-2xl font-bold text-foreground">This account cannot access the admin</h1>
      <p className="font-mono text-sm text-muted-foreground max-w-md">
        You are signed in as <span className="text-foreground">{email}</span>, which is not on the
        allowlist for this site. Sign out and sign back in with an allowlisted account.
      </p>
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className="border border-foreground/60 bg-foreground/10 hover:bg-foreground/20 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-foreground transition-colors disabled:opacity-50"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
