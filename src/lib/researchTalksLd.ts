/**
 * The structured-data graph for /research-and-talks.
 *
 * One `@graph` rather than a pile of loose script tags, because the point of
 * this page is the relationships: this person gave that talk, wrote these
 * papers, appeared on those shows, and was named by these third parties. Loose
 * nodes state four facts; a graph joined by `@id` states the connections, and
 * a retrieval system quoting the page can follow them.
 *
 * Everything here is derived from src/data/research.ts and src/data/talks.ts,
 * so the markup cannot drift from the words on the page. Nothing is asserted
 * that the visible page does not also say: no invented ratings, no awards the
 * sources do not support, no durations for recordings whose length nobody
 * published.
 */
import { SITE_URL } from "@/lib/site";
import { GOOGLE_SCHOLAR_URL, linkedPapers } from "@/data/research";
import { paperNode } from "@/lib/paperLd";
import {
  BRIGHTONSEO_2026,
  KIND_LABEL,
  RECOGNITION,
  TALKS,
  type TalkEntry,
} from "@/data/talks";

type Node = Record<string, unknown>;

const PAGE = `${SITE_URL}/research-and-talks`;
const PERSON = `${SITE_URL}/#person`;
const ref = (id: string) => ({ "@id": id });
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** Seconds to ISO 8601, which is the only duration format schema.org reads. */
function iso8601(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${s ? `${s}S` : ""}` || "PT0S";
}

/** A bare year is a year, not a date. Emitting "2026" as a date invents 1 Jan. */
const dateOnly = (d: string) => (/^\d{4}(-\d{2}-\d{2})?$/.test(d) ? d : undefined);

const YOUTUBE_ID = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

/**
 * A recording on YouTube, an episode on Spotify and a written interview are
 * three different things. Typing them alike would be tidier and less true.
 */
function talkNode(t: TalkEntry): Node {
  const primary = t.links[0];
  const yt = primary ? YOUTUBE_ID.exec(primary.url)?.[1] : undefined;
  const spotify = primary && /open\.spotify\.com/.test(primary.url);
  const published = dateOnly(t.date);

  const base: Node = {
    "@id": `${PAGE}#${t.slug}`,
    name: t.title,
    description: t.summary,
    inLanguage: "en",
    mainEntityOfPage: ref(`${PAGE}#page`),
    about: ref(PERSON),
    ...(published ? { datePublished: published } : {}),
    ...(primary ? { url: primary.url } : {}),
    ...(t.thumb ? { thumbnailUrl: abs(t.thumb) } : {}),
    ...(t.links.length > 1 ? { sameAs: t.links.slice(1).map((l) => l.url) } : {}),
  };

  if (yt) {
    return {
      ...base,
      "@type": "VideoObject",
      uploadDate: published,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
      thumbnailUrl: t.thumb ? abs(t.thumb) : `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      publisher: { "@type": "Organization", name: t.outlet },
      actor: ref(PERSON),
      ...(t.minutes ? { duration: iso8601(t.minutes * 60) } : {}),
    };
  }

  if (spotify) {
    return {
      ...base,
      "@type": "PodcastEpisode",
      partOfSeries: { "@type": "PodcastSeries", name: t.outlet },
      actor: ref(PERSON),
      ...(t.minutes ? { timeRequired: iso8601(t.minutes * 60) } : {}),
    };
  }

  // A self-hosted recording of a workshop: the file is the work.
  if (t.video?.src) {
    return {
      ...base,
      "@type": "VideoObject",
      uploadDate: published,
      contentUrl: abs(t.video.src),
      thumbnailUrl: abs(t.video.poster),
      duration: iso8601(t.video.duration),
      actor: ref(PERSON),
      ...(t.links.length === 0 ? { url: `${PAGE}#${t.slug}` } : {}),
    };
  }

  return {
    ...base,
    "@type": "CreativeWork",
    genre: KIND_LABEL[t.kind],
    publisher: { "@type": "Organization", name: t.outlet },
  };
}

/**
 * Recognition is somebody else's page saying something about him, so it is
 * modelled as their work that mentions him, never as an award he holds. The
 * quote rides along as `abstract` so a reader of the markup sees the wording
 * the claim rests on.
 */
function recognitionNode(r: (typeof RECOGNITION)[number]): Node {
  return {
    "@type": "CreativeWork",
    "@id": `${PAGE}#${r.slug}`,
    name: r.claim,
    url: r.url,
    datePublished: dateOnly(r.date),
    author: { "@type": "Person", name: r.source },
    ...(r.publishedOn ? { publisher: { "@type": "Organization", name: r.publishedOn } } : {}),
    mentions: ref(PERSON),
    about: ref(PERSON),
    ...(r.quote ? { abstract: r.quote } : {}),
    ...(r.thumb ? { thumbnailUrl: abs(r.thumb) } : {}),
    inLanguage: "en",
  };
}

/** The brightonSEO talk as an Event. Exported so the recap page emits the identical node under the same @id. */
export function eventNode(): Node {
  const T = BRIGHTONSEO_2026;
  return {
    "@type": "Event",
    "@id": `${PAGE}#${T.slug}`,
    name: T.title,
    alternateName: T.tagline,
    description: T.summary,
    startDate: T.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: T.event,
      address: {
        "@type": "PostalAddress",
        addressLocality: "San Diego",
        addressRegion: "CA",
        addressCountry: "US",
      },
    },
    performer: ref(PERSON),
    organizer: { "@type": "Organization", name: "brightonSEO", url: "https://brightonseo.com" },
    url: T.links[0].url,
    image: abs(T.video.poster),
    // The conference the talk was part of. Google validates a nested Event as
    // an item of its own, so it carries the required dates and place too:
    // 15 and 16 September 2026 in San Diego, per the deck's title slide.
    superEvent: {
      "@type": "Event",
      name: T.event,
      url: "https://brightonseo.com/events/san-diego-2026",
      description: `${T.event}, the two-day brightonSEO search marketing conference in San Diego.`,
      startDate: "2026-09-15",
      endDate: "2026-09-16",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: T.event,
        address: { "@type": "PostalAddress", addressLocality: "San Diego", addressRegion: "CA", addressCountry: "US" },
      },
      organizer: { "@type": "Organization", name: "brightonSEO", url: "https://brightonseo.com" },
      performer: ref(PERSON),
    },
    // The chapter list as a real outline. It is the most specific description
    // of the talk that exists while the recording is unpublished, and it is
    // the part an answer engine can actually quote.
    workFeatured: {
      "@type": "CreativeWork",
      name: T.title,
      abstract: T.summary,
      // Positions only: startOffset belongs to Clip, not CreativeWork, and the
      // timed chapters live on the recording's VideoObject where they apply.
      hasPart: T.chapters.map((c, i) => ({
        "@type": "CreativeWork",
        position: i + 1,
        name: c.title,
      })),
    },
  };
}

export function buildResearchTalksGraph(title: string, description: string) {
  const media = TALKS.map(talkNode);
  const papers = linkedPapers.map((p) => paperNode(p, PAGE));
  const recognitions = RECOGNITION.map(recognitionNode);
  const event = eventNode();

  const person: Node = {
    "@type": "Person",
    "@id": PERSON,
    name: "Venkata Pagadala",
    url: SITE_URL,
    jobTitle: "Lead Technical Product Manager, AI & Automation",
    worksFor: { "@type": "Organization", name: "AT&T" },
    sameAs: [
      GOOGLE_SCHOLAR_URL,
      "https://www.linkedin.com/in/venkata-pagadala",
      "https://speakerdeck.com/venkatapagadala1",
    ],
    knowsAbout: [
      "Search engine optimization",
      "Generative engine optimization",
      "Large language models",
      "Query classification",
      "Audience personas",
      "AI agents",
    ],
    // Authorship and appearances point back from the person, so a crawler that
    // lands on the Person node can reach the evidence without re-reading the
    // page.
    subjectOf: [...media, ...recognitions].map((n) => ref(n["@id"] as string)),
    performerIn: ref(event["@id"] as string),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "CollectionPage",
        "@id": `${PAGE}#page`,
        url: PAGE,
        name: title,
        description,
        about: ref(PERSON),
        isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL },
        // No BreadcrumbList here: <Breadcrumbs> already emits one for every
        // page on the site, and two of them on one page is a contradiction a
        // consumer has to resolve rather than a fact it can use.
        // Plain-text edition of this exact page, for clients that would rather
        // read markdown than strip tags out of HTML.
        encoding: {
          "@type": "MediaObject",
          encodingFormat: "text/markdown",
          contentUrl: `${PAGE}.md`,
        },
        hasPart: [event, ...papers, ...media, ...recognitions].map((n) => ref(n["@id"] as string)),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: 1 + papers.length + media.length + recognitions.length,
          itemListElement: [event, ...papers, ...media, ...recognitions].map((n, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: ref(n["@id"] as string),
          })),
        },
      },
      event,
      ...papers,
      ...media,
      ...recognitions,
    ],
  };
}
