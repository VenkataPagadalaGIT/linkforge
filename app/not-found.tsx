import type { Metadata } from "next";
import NotFound from "@/views/NotFound";

// A 404 status already tells a crawler not to index this, but the routes that
// answer 200 with this body (the backend-driven ones, where Next streams the
// shell before notFound() can set a status) rely on the meta tag instead. The
// rehearsal QA asserts it on bogus slugs, so it is stated here for both cases.
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
