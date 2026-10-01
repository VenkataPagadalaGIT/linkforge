"use client";
import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { markClerkLoaded, registerClerkSignOut, registerClerkTokenGetter } from "@/lib/admin-client";

/** Mounted inside ClerkProvider; hands the api client a per-request token
 *  getter, and reports when Clerk has loaded so auth checks never decide
 *  "signed out" before Clerk knows. Unregisters on unmount so a signed-out
 *  tree stops supplying. */
export default function ClerkTokenBridge() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  React.useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      registerClerkTokenGetter(() => getToken());
      registerClerkSignOut(() => signOut());
    } else {
      registerClerkTokenGetter(null);
      registerClerkSignOut(null);
    }
    // Register first, then report ready, so a waiting check sees the getter.
    markClerkLoaded();
    window.dispatchEvent(new CustomEvent("notebook-auth-changed"));
    return () => {
      registerClerkTokenGetter(null);
      registerClerkSignOut(null);
    };
  }, [getToken, isLoaded, isSignedIn, signOut]);
  return null;
}
