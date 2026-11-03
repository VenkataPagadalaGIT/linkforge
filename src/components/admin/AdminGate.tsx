"use client";
import * as React from "react";
import AdminForbidden from "@/components/admin/AdminForbidden";
import type { AdminStatus } from "@/lib/admin-client";

/**
 * One gate for every admin screen, so none of them can forget a state:
 * refused sign-ins get the sign-out screen, a server or Clerk hiccup gets a
 * retry screen (never a login loop), and nothing renders until "authed".
 */
export default function AdminGate({ status, children }: { status: AdminStatus; children?: React.ReactNode }) {
  if (status === "authed") return <>{children}</>;
  if (status === "forbidden") return <AdminForbidden />;
  if (status === "error") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center" role="alert">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-700 dark:text-amber-300">
          Temporarily unavailable
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground">Can&apos;t reach the admin right now</h1>
        <p className="font-mono text-sm text-muted-foreground max-w-md">
          The admin server or the sign-in service did not answer. You are still signed in. Try again in a minute.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="border border-foreground/60 bg-foreground/10 hover:bg-foreground/20 px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          Try again
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground/70">
      {status === "checking" ? "Checking session…" : "Redirecting…"}
    </div>
  );
}
