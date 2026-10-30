import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS } from "@/data/events";
import { OG_IMAGE, SITE_NAME } from "@/lib/site";
import { withSeoOverrides } from "@/lib/seo-overrides";
import EventFileView from "@/views/EventFileView";

interface Props {
  params: { slug: string };
}

// One page per breaking event (data/corpus/gen_events_ts.py), built at build time; an unknown slug is a real 404.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }));
}

export const generateMetadata = withSeoOverrides("/notebook/events/[slug]", baseMetadata);

async function baseMetadata({ params }: Props): Promise<Metadata> {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  const url = `/notebook/events/${e.slug}`;
  const title = `${e.title}: what happened, sourced`;
  const description = (e.summary ?? "").slice(0, 300);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }], url, type: "article", title, description, siteName: "Venkata Pagadala · Mono Mind" },
    twitter: { card: "summary", title, description },
  };
}

export default function Page({ params }: Props) {
  const e = EVENTS[params.slug];
  if (!e) notFound();
  return <EventFileView slug={e.slug} />;
}
