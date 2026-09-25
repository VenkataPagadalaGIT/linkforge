import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConferenceDetail from "@/views/ConferenceDetail";
import { isLogisticsSession,
  conferences,
  getConferenceBySlug,
  listConferenceSessions,
} from "@/data/conferences";
import { SITE_URL, OG_IMAGE, SITE_NAME } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { conferencePlace, isoDateTime } from "@/lib/conferenceLd";

interface Props {
  params: { slug: string };
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return conferences.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getConferenceBySlug(params.slug);
  if (!c) return { title: "Conference not found", robots: { index: false } };
  const title = `${c.name} ${c.edition || c.year} · Conference Notebook`;
  const desc = c.summary;
  const url = `/notebook/conference/${c.slug}`;
  const speakerNames = listConferenceSessions(c)
    .map((f) => f.session.speaker)
    .filter(Boolean) as string[];
  const uniqueSpeakers = Array.from(new Set(speakerNames)).slice(0, 12);
  return {
    title,
    description: desc,
    keywords: [c.name, c.topic, c.city, c.country, "field notes", ...uniqueSpeakers],
    alternates: { canonical: url },
    openGraph: {
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      url,
      type: "article",
      title: `${title}`,
      description: desc,
      siteName: "Venkata Pagadala · Mono Mind",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
    },
  };
}

export default function Page({ params }: Props) {
  const c = getConferenceBySlug(params.slug);
  if (!c) notFound();
  const url = `${SITE_URL}/notebook/conference/${c.slug}`;
  const sessions = listConferenceSessions(c);

  // Use ISO start/end dates from c.startDate / c.endDate (already ISO strings)
  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${c.name} ${c.edition || c.year}`,
    description: c.summary,
    startDate: c.startDate,
    endDate: c.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    location: conferencePlace(c),
    ...(c.url ? { sameAs: c.url } : {}),
    organizer: { "@type": "Organization", name: c.organizer || c.name },
    subEvent: sessions
      .filter((f) => !isLogisticsSession(f.session))
      .slice(0, 50)
      .map((f) => ({
        "@type": "Event",
        name: f.session.title,
        url: `${url}/sessions/${f.urlSlug}`,
        ...(isoDateTime(f.dayDate, f.session.start) ? { startDate: isoDateTime(f.dayDate, f.session.start) } : {}),
        location: conferencePlace(c),
        ...(f.session.speaker
          ? {
              performer: {
                "@type": "Person",
                name: f.session.speaker,
                ...(f.session.affiliation
                  ? { affiliation: { "@type": "Organization", name: f.session.affiliation } }
                  : {}),
              },
            }
          : {}),
      })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Notebook", item: `${SITE_URL}/notebook` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Conference Notebook",
        item: `${SITE_URL}/notebook/conference`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${c.name} ${c.edition || c.year}`,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }}
      />
      <ConferenceDetail conference={c} />
    </>
  );
}
