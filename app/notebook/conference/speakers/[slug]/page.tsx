import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SpeakerProfile from "@/views/SpeakerProfile";
import { getSpeakerBySlug } from "@/data/speakers";
import { SITE_URL } from "@/lib/site";

interface Props {
  params: { slug: string };
}

// Render on-demand at request time. 78 speakers as SSG was using too much
// build memory; on-request render still produces full HTML for SEO bots.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sp = getSpeakerBySlug(params.slug);
  if (!sp) return { title: "Speaker not found", robots: { index: false } };
  const title = `${sp.name} — ${sp.role}, ${sp.company}`;
  const desc = sp.bio;
  const url = `/notebook/conference/speakers/${sp.slug}`;
  return {
    title,
    description: desc,
    keywords: [sp.name, sp.role, sp.company, "speaker", "conference notebook"],
    alternates: { canonical: url },
    openGraph: {
      url,
      type: "profile",
      title: `${sp.name} — ${sp.role} at ${sp.company}`,
      description: desc,
      images: sp.photo ? [sp.photo] : undefined,
      siteName: "Venkata Pagadala — Mono Mind",
    },
    twitter: {
      card: "summary_large_image",
      title: `${sp.name} — ${sp.role}`,
      description: desc,
      images: sp.photo ? [sp.photo] : undefined,
    },
  };
}

export default function Page({ params }: Props) {
  const sp = getSpeakerBySlug(params.slug);
  if (!sp) notFound();
  const url = `${SITE_URL}/notebook/conference/speakers/${sp.slug}`;

  const sameAs: string[] = [];
  if (sp.linkedin) sameAs.push(sp.linkedin);
  if (sp.website) sameAs.push(sp.website);
  if (sp.podcastUrl) sameAs.push(sp.podcastUrl);

  const personLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: sp.name,
    jobTitle: sp.role,
    worksFor: { "@type": "Organization", name: sp.company },
    description: sp.bio,
    url,
    ...(sp.photo ? { image: sp.photo.startsWith("http") ? sp.photo : `${SITE_URL}${sp.photo}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Conference Notebook", item: `${SITE_URL}/notebook/conference` },
      { "@type": "ListItem", position: 2, name: "Speakers", item: `${SITE_URL}/notebook/conference#speakers` },
      { "@type": "ListItem", position: 3, name: sp.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SpeakerProfile speaker={sp} />
    </>
  );
}
