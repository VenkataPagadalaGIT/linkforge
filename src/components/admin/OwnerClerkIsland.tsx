"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/clerk";

/**
 * Clerk for the conference notebook on public pages, loaded only in the
 * owner's browser (see isOwnerDevice) and only after the page has rendered.
 * Ordinary visitors never download Clerk, and the pages stay static. It
 * mounts the same bridge as the admin, so notebook requests carry a fresh
 * Clerk token.
 */
const Island = dynamic(
  async () => {
    const [{ ClerkProvider }, { default: ClerkTokenBridge }] = await Promise.all([
      import("@clerk/nextjs"),
      import("@/components/admin/ClerkTokenBridge"),
    ]);
    return function ClerkIsland() {
      return (
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <ClerkTokenBridge />
        </ClerkProvider>
      );
    };
  },
  { ssr: false },
);

export default function OwnerClerkIsland() {
  return <Island />;
}
