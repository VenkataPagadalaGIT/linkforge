import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionDetail, { type SessionDetailContext } from "@/views/SessionDetail";
import {
  getConferenceBySlug,
  findSessionByUrlSlug,
  listConferenceSessions,
  type Session,
} from "@/data/conferences";
import { getSpeakerByName } from "@/data/speakers";
import { SITE_URL } from "@/lib/site";

interface Params {
  slug: string;
  sessionId: string;
}

interface Props {
  params: Params;
}

// Server-render on demand. Bots get full HTML; readers cached after first hit.
export const dynamic = "force-dynamic";

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

function isoDate(label: string): string | undefined {
  // "Monday, April 27, 2026" → "2026-04-27"
  const m = label.match(/(\w+), (\w+) (\d{1,2}), (\d{4})/);
  if (!m) return undefined;
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };
  const mm = months[m[2]];
  if (!mm) return undefined;
  const dd = m[3].padStart(2, "0");
  return `${m[4]}-${mm}-${dd}`;
}

function startTimeIso(dayDate: string, start: string): string | undefined {
  const d = isoDate(dayDate);
  if (!d) return undefined;
  // "9:00 AM" → "09:00:00"
  const m = start.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return d;
  let h = parseInt(m[1], 10);
  const mi = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${d}T${String(h).padStart(2, "0")}:${mi}:00`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = resolveContext(params.slug, params.sessionId);
  if (!ctx) return { title: "Session not found", robots: { index: false } };
  const conf = ctx.conference;
  const speakerInfo = ctx.session.speaker
    ? `${ctx.session.speaker}${ctx.session.affiliation ? ` · ${ctx.session.affiliation}` : ""}`
    : "";
  const title = `${ctx.session.title}${speakerInfo ? " — " + ctx.session.speaker : ""} · ${conf.name} ${conf.edition || conf.year}`;
  const desc =
    ctx.session.description ||
    `${ctx.session.title}${speakerInfo ? " — talk by " + speakerInfo : ""}. Field notes from ${conf.name} ${conf.edition || conf.year}.`;
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
    alternates: { canonical: url },
    openGraph: {
      url,
      type: "article",
      title,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
      siteName: "Venkata Pagadala — Mono Mind",
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
  const startIso = startTimeIso(ctx.dayDate, ctx.session.start);
  const endIso = startTimeIso(ctx.dayDate, ctx.session.end);
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
    },
    location: conf.venue
      ? {
          "@type": "Place",
          name: conf.venue.name,
          address: { "@type": "PostalAddress", addressLocality: conf.venue.city, addressCountry: conf.venue.country },
        }
      : { "@type": "Place", name: `${conf.city}, ${conf.country}` },
  };
  if (startIso) eventLd.startDate = startIso;
  if (endIso) eventLd.endDate = endIso;
  if (ctx.session.speaker) {
    eventLd.performer = {
      "@type": "Person",
      name: ctx.session.speaker,
      ...(ctx.session.affiliation ? { affiliation: { "@type": "Organization", name: ctx.session.affiliation } } : {}),
      ...(profile ? { url: `${SITE_URL}/notebook/conference/speakers/${profile.slug}` } : {}),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SessionDetail ctx={ctx} />
    </>
  );
}
