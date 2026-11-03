import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS } from "@/data/events";
import { withSeoOverrides } from "@/lib/seo-overrides";
import { KnowledgeFeed } from "@/components/feeds/KnowledgeFeed";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

interface Props {
  params: { slug: string };
}

// The swipeable view of an event file. The full page is the canonical source; this view says so, and its server HTML
// carries the story in text for crawlers and agents (the swipe interface mounts over it).
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }));
}

export const generateMetadata = withSeoOverrides("/feeds/[slug]", async ({ params }: Props): Promise<Metadata> => {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  return {
    title: `${e.title}: the feed`,
    description: (e.summary ?? "").slice(0, 300),
    alternates: { canonical: `/notebook/events/${e.slug}` },
    openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url: `${SITE_URL}/notebook/events/${e.slug}`, type: "article", title: e.title, siteName: "Venkata Pagadala · Mono Mind" },
  };
});

export default function Page({ params }: Props) {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  return (
    <>
      <article className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Knowledge Graph Feeds</p>
        <h1 className="font-display text-3xl font-bold">{e.title}</h1>
        <p className="mt-3 text-sm">{e.summary}</p>
        <h2 className="mt-6 font-display text-xl font-bold">What happened</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{e.moments.map((m) => <li key={m.at + m.label}>{m.at.slice(0, 16).replace("T", " ")} UTC: {m.label}</li>)}</ul>
        <h2 className="mt-6 font-display text-xl font-bold">Theories and claims</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">{e.claims.map((c) => <li key={c.key}>{c.claim}: {c.verdict}. {c.explain}</li>)}</ul>
        <p className="mt-6 text-sm"><a href={`/notebook/events/${e.slug}`} className="underline">Read the full page with every source</a></p>
      </article>
      <KnowledgeFeed slug={e.slug} />
    </>
  );
}
