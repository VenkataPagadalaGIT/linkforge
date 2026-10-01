// Admin layout: skip the public Navbar/Footer wrapping so the CMS UI gets
// its own full-canvas chrome. The root layout still provides <html>/<body>.
//
// ClerkProvider mounts here, not in the root layout, so the public site's
// bundle and rendering are untouched by auth. When no publishable key is
// configured the provider is skipped entirely and the legacy password
// login is the auth path (local dev, CI).
import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { CLERK_PUBLISHABLE_KEY, clerkEnabled } from "@/lib/clerk";
import ClerkTokenBridge from "@/components/admin/ClerkTokenBridge";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const shell = <div data-admin-shell>{children}</div>;
  if (!clerkEnabled) return shell;
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/admin/login">
      <ClerkTokenBridge />
      {shell}
    </ClerkProvider>
  );
}
