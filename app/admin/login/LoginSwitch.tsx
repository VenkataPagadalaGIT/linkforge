"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { clerkEnabled } from "@/lib/clerk";
import LoginClient from "./LoginClient";

/**
 * One login route, two implementations. With Clerk configured the page is
 * Clerk's SignIn (passkeys, MFA, device management come from the Clerk
 * dashboard, not from code here). Without it, the legacy password form.
 * The legacy form is intentionally NOT rendered alongside Clerk: two ways
 * in means the weaker one is the real front door.
 */
const ClerkSignIn = dynamic(
  () => import("@clerk/nextjs").then((m) => m.SignIn),
  { ssr: false, loading: () => <p className="font-mono text-xs text-muted-foreground p-12 text-center">Loading sign in…</p> },
);

export default function LoginSwitch() {
  if (!clerkEnabled) return <LoginClient />;
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-6 py-24">
      <ClerkSignIn
        routing="hash"
        signUpUrl={undefined}
        fallbackRedirectUrl="/admin"
        appearance={{ elements: { footerAction: { display: "none" } } }}
      />
    </div>
  );
}
