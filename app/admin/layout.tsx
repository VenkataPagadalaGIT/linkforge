// Admin layout: skip the public Navbar/Footer wrapping so the CMS UI gets
// its own full-canvas chrome. The root layout still provides <html>/<body>.
import * as React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div data-admin-shell>{children}</div>;
}
