import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/seo-overrides";
import FeedsHub from "@/components/feeds/FeedsHub";
import { KnowledgeFeed } from "@/components/feeds/KnowledgeFeed";
import { EVENTS } from "@/data/events";

const metadata: Metadata = {
  title: "Knowledge Graph Feeds",
  description: "Every story read from every platform and checked against its sources, as a feed you can swipe: what happened, the impact, the details, the theories, every source.",
  alternates: { canonical: "/feeds" },
};
export const generateMetadata = withSeoOverrides("/feeds", metadata);

// Social by default (owner, 2026-10-30): the tab opens straight into the newest story's feed, like an app opens on
// For You. The hub renders underneath, so the server HTML still lists every feed for crawlers and agents; Topics in
// the feed opens the same list.
export default function Page() {
  const latest = Object.values(EVENTS).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <>
      <FeedsHub />
      {latest && <KnowledgeFeed slug={latest.slug} />}
    </>
  );
}
