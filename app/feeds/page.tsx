import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/seo-overrides";
import FeedsHub from "@/components/feeds/FeedsHub";
import { CardFeed } from "@/components/feeds/CardFeed";
import { getStoryCards } from "@/lib/story-index";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const metadata: Metadata = {
  title: "Knowledge Graph Feeds",
  description: "Every story read from every platform and checked against its sources, as a feed you can swipe, ranked by freshness and evidence, plus the AI Roadmap and Encyclopedia to learn from.",
  alternates: { canonical: "/feeds" },
  // Its own og:url; inheriting the layout's would point shares at the home page.
  openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `${SITE_URL}/feeds`, type: "website", title: "Knowledge Graph Feeds", siteName: "Venkata Pagadala · Mono Mind" },
};
export const generateMetadata = withSeoOverrides("/feeds", metadata);
export const revalidate = 3600;

// Social by default: the tab opens straight into the ranked stories. The hub renders underneath, so the server HTML still
// lists every story for crawlers and agents.
export default async function Page() {
  const stories = await getStoryCards();
  return (
    <>
      <FeedsHub stories={stories} />
      <CardFeed mode="news" />
    </>
  );
}
