import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/seo-overrides";
import FeedsHub from "@/components/feeds/FeedsHub";

const metadata: Metadata = {
  title: "Knowledge Graph Feeds",
  description: "Every story read from every platform and checked against its sources, as a feed you can swipe: what happened, the impact, the details, the theories, every source.",
  alternates: { canonical: "/feeds" },
};
export const generateMetadata = withSeoOverrides("/feeds", metadata);

export default function Page() {
  return <FeedsHub />;
}
