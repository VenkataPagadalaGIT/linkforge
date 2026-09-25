import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionDetail, { type SessionDetailContext } from "@/views/SessionDetail";
import {
  getConferenceBySlug,
  findSessionByUrlSlug,
  listConferenceSessions,
  isLogisticsSession,
  type Session,
} from "@/data/conferences";
import { getSpeakerByName } from "@/data/speakers";
import { SITE_URL } from "@/lib/site";
import { jsonLdScript } from "@/lib/jsonld";
import { conferencePlace, isoDateTime } from "@/lib/conferenceLd";

interface Params {
  slug: string;
  sessionId: string;
}

interface Props {
  params: Params;
}

// Server-render on demand. Bots get full HTML; readers cached after first hit.
export const dynamicParams = false;

export async function generateStaticParams() {
  const { conferences, listConferenceSessions } = await import("@/data/conferences");
  return conferences.flatMap((c) =>
    listConferenceSessions(c).map((f) => ({ slug: c.slug, sessionId: f.urlSlug })),
  );
}

function resolveContext(slug: string, sessionParam: string): SessionDetailContext | null {
  const c = getConferenceBySlug(slug);
  if (!c) return null;
  const found = findSessionByUrlSlug(c, sessionParam);
  if (!found) return null;
  const flat = listConferenceSessions(c);
  const idx = flat.findIndex((f) => f.sessionId === found.sessionId);
  const prev = idx > 0 ? flat[idx - 1] : undefined;
  const next = idx < flat.length - 1 ? flat[idx + 1] : undefined;
  return {
    conference: c,
    session: found.session,
    sessionId: found.sessionId,
    urlSlug: found.urlSlug,
    dayDate: found.dayDate,
    dayIndex: found.dayIndex,
    dayTheme: c.days[found.dayIndex]?.theme,
    prev: prev
      ? { sessionId: prev.urlSlug, title: prev.session.title, start: prev.session.start }
      : undefined,
    next: next
      ? { sessionId: next.urlSlug, title: next.session.title, start: next.session.start }
      : undefined,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = resolveContext(params.slug, params.sessionId);
  if (!ctx) return { title: "Session not found", robots: { index: false } };
  const conf = ctx.conference;
  const speakerInfo = ctx.session.speaker
    ? `${ctx.session.speaker}${ctx.session.affiliation ? ` · ${ctx.session.affiliation}` : ""}`
    : "";
  const title = `${ctx.session.title}${speakerInfo ? " · " + ctx.session.speaker : ""} · ${conf.name} ${conf.edition || conf.year}`;
  const desc =
    ctx.session.description ||
    `${ctx.session.title}${speakerInfo ? ", talk by " + speakerInfo : ""}. Field notes from ${conf.name} ${conf.edition || conf.year}.`;
  const urlSlug = findSessionByUrlSlug(conf, params.sessionId)?.urlSlug || params.sessionId;
  const url = `/notebook/conference/${conf.slug}/sessions/${urlSlug}`;
  const profile = ctx.session.speaker ? getSpeakerByName(ctx.session.speaker) : undefined;
  const ogImage = profile?.photo;
  const keywords = [
    ctx.session.type,
    conf.name,
    conf.topic,
    ctx.session.speaker || "",
    ctx.session.affiliation || "",
  ].filter(Boolean);
  return {
    title,
    description: desc,
    keywords,
    // registration, breaks and meals: the page stays, the index skips it
    ...(isLogisticsSession(ctx.session) ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: url },
    openGraph: {
      url,
      type: "article",
      title,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
      siteName: "Venkata Pagadala · Mono Mind",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function Page({ params }: Props) {
  const ctx = resolveContext(params.slug, params.sessionId);
  if (!ctx) notFound();
  const conf = ctx.conference;
  const urlSlug = findSessionByUrlSlug(conf, params.sessionId)?.urlSlug || params.sessionId;
  const url = `${SITE_URL}/notebook/conference/${conf.slug}/sessions/${urlSlug}`;
  const startIso = isoDateTime(ctx.dayDate, ctx.session.start);
  const endIso = isoDateTime(ctx.dayDate, ctx.session.end);
  const profile = ctx.session.speaker ? getSpeakerByName(ctx.session.speaker) : undefined;

  const eventLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ctx.session.title,
    description: ctx.session.description || ctx.session.title,
    url,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    superEvent: {
      "@type": "Event",
      name: `${conf.name} ${conf.edition || conf.year}`,
      url: `${SITE_URL}/notebook/conference/${conf.slug}`,
      ...(conf.url ? { sameAs: conf.url } : {}),
    },
    location: conferencePlace(conf),
  };
  if (startIso) eventLd.startDate = startIso;
  if (endIso) eventLd.endDate = endIso;
  if (ctx.session.speaker) {
    eventLd.performer = {
      "@type": "Person",
      name: ctx.session.speaker,
      ...(ctx.session.affiliation ? { affiliation: { "@type": "Organization", name: ctx.session.affiliation } } : {}),
      ...(profile ? { url: `${SITE_URL}/notebook/conference/speakers/${profile.slug}` } : {}),
      ...(ctx.session.speakerUrl ? { sameAs: ctx.session.speakerUrl } : {}),
    };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Conference Notebook", item: `${SITE_URL}/notebook/conference` },
      { "@type": "ListItem", position: 2, name: `${conf.name} ${conf.edition || conf.year}`, item: `${SITE_URL}/notebook/conference/${conf.slug}` },
      { "@type": "ListItem", position: 3, name: ctx.session.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbLd) }} />
      <SessionDetail ctx={ctx} />
    </>
  );
}
