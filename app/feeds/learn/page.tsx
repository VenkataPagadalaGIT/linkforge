import type { Metadata } from "next";
import { CardFeed } from "@/components/feeds/CardFeed";
import { LEARN_PHASES, LEARN_TOPICS } from "@/data/learnCatalog";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { withSeoOverrides } from "@/lib/seo-overrides";

// The app view of the AI Roadmap and the AI Encyclopedia. Those pages stay what search engines index, so this one follows
// their links without competing with them. The plain list below the feed is for readers and agents without JavaScript.
const metadata: Metadata = {
  title: "Learn: the AI Roadmap and Encyclopedia as a feed",
  description: "Every video, course, guide, book, paper and repo on the AI Roadmap and in the AI Encyclopedia as a feed you tune by platform, topic, level and format, in learning order.",
  robots: { index: false, follow: true },
  openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `${SITE_URL}/feeds/learn`, type: "website", title: "Learn: the AI Roadmap and Encyclopedia as a feed", siteName: "Venkata Pagadala · Mono Mind" },
};
export const generateMetadata = withSeoOverrides("/feeds/learn", metadata);

export default function Page() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-24 text-foreground [overflow-wrap:anywhere]">
        <h1 className="font-display text-3xl font-bold">Learn: the AI Roadmap and Encyclopedia as a feed</h1>
        <p className="mt-2 text-sm">
          Everything on the <a className="underline" href="/notebook/ai/roadmap">AI Roadmap</a> and in the <a className="underline" href="/notebook/ai/encyclopedia">AI Encyclopedia</a>, in learning order.
        </p>
        {LEARN_PHASES.map((p) => (
          <section key={p.id} className="mt-6">
            <h2 className="font-display text-lg font-bold">{p.path === "roadmap" ? `Phase ${p.n}: ` : ""}{p.label}</h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {LEARN_TOPICS.filter((t) => t.phase === p.id).map((t) => (
                <li key={t.id}>{t.page ? <a className="underline" href={t.page}>{t.topic}</a> : t.topic} ({t.resources.length} sources)</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <CardFeed mode="learn" />
    </>
  );
}
