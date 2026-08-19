"use client";
import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { registerClerkSignOut, registerClerkTokenGetter } from "@/lib/admin-client";

/** Mounted inside ClerkProvider; hands the api client a per-request token
 *  getter. Unregisters on unmount so a signed-out tree stops supplying. */
export default function ClerkTokenBridge() {
  const { getToken, isSignedIn, signOut } = useAuth();
  React.useEffect(() => {
    if (!isSignedIn) {
      registerClerkTokenGetter(null);
      registerClerkSignOut(null);
      return;
    }
    registerClerkTokenGetter(() => getToken());
    registerClerkSignOut(() => signOut());
    return () => {
      registerClerkTokenGetter(null);
      registerClerkSignOut(null);
    };
  }, [getToken, isSignedIn, signOut]);
  return null;
}
