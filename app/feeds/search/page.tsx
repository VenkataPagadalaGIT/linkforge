import type { Metadata } from "next";
import { CardFeed } from "@/components/feeds/CardFeed";
import { withSeoOverrides } from "@/lib/seo-overrides";

// Search results as a feed: find a topic, then scroll every source on it. A view of pages that are indexed themselves.
const metadata: Metadata = {
  title: "Search the feeds",
  description: "Find any AI topic, video, book, paper or story, then scroll every source on it as a feed.",
  robots: { index: false, follow: true },
};
export const generateMetadata = withSeoOverrides("/feeds/search", metadata);

export default function Page() {
  return <CardFeed mode="search" />;
}
