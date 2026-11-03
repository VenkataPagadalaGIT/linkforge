import type { Metadata } from "next";
import { LearnFeed } from "@/components/feeds/LearnFeed";
import { LEARN_PHASES, LEARN_RESOURCES, LEARN_TOPICS } from "@/data/learnCatalog";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { withSeoOverrides } from "@/lib/seo-overrides";

// The app view of the AI Roadmap. /notebook/ai/roadmap stays the page search engines index, so this one follows its links
// without competing with it. The plain list below the feed is for readers and agents that do not run JavaScript.
const metadata: Metadata = {
  title: "Learn: the AI Roadmap as a feed",
  description: "Every video, course, book and repo on the AI Roadmap as a feed you tune by phase, topic, level and format, in learning order.",
  robots: { index: false, follow: true },
  openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `${SITE_URL}/feeds/learn`, type: "website", title: "Learn: the AI Roadmap as a feed", siteName: "Venkata Pagadala · Mono Mind" },
};
export const generateMetadata = withSeoOverrides("/feeds/learn", metadata);

export default function Page() {
  const res = new Map(LEARN_RESOURCES.map((r) => [r.id, r]));
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 py-24 text-foreground [overflow-wrap:anywhere]">
        <h1 className="font-display text-3xl font-bold">Learn: the AI Roadmap as a feed</h1>
        <p className="mt-2 text-sm">
          Everything on the <a className="underline" href="/notebook/ai/roadmap">AI Roadmap</a>, in learning order.
        </p>
        {LEARN_PHASES.map((p) => (
          <section key={p.id} className="mt-8">
            <h2 className="font-display text-xl font-bold">Phase {p.n}: {p.label}</h2>
            {LEARN_TOPICS.filter((t) => t.phase === p.id).map((t) => (
              <div key={t.id} className="mt-4">
                <h3 className="font-semibold">{t.topic}</h3>
                <p className="text-sm">{t.description}</p>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {t.resources.map((id) => {
                    const r = res.get(id);
                    return r && r.status !== "dead" ? (
                      <li key={id}><a className="underline" href={r.url} rel="noopener noreferrer">{r.title}</a></li>
                    ) : null;
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </main>
      <LearnFeed />
    </>
  );
}
