import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/seo-overrides";
import FeedsHub from "@/components/feeds/FeedsHub";
import { KnowledgeFeed } from "@/components/feeds/KnowledgeFeed";
import { EVENTS } from "@/data/events";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const metadata: Metadata = {
  title: "Knowledge Graph Feeds",
  description: "Every story read from every platform and checked against its sources, as a feed you can swipe: what happened, the impact, the details, the theories, every source.",
  alternates: { canonical: "/feeds" },
  // Its own og:url; inheriting the layout's would point shares at the home page.
  openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `${SITE_URL}/feeds`, type: "website", title: "Knowledge Graph Feeds", siteName: "Venkata Pagadala · Mono Mind" },
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
