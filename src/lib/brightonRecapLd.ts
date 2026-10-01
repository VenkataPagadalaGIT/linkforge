/**
 * The structured-data graph for the brightonSEO San Diego 2026 recap page.
 *
 * One `@graph`, joined by `@id`, marking up every part of the visible page:
 *
 *   CollectionPage  the page: its markdown edition, its parts, its main entity
 *   Article         the recap itself: headline, author, dates, images
 *   Event           the talk, the same node /research-and-talks emits
 *   VideoObject     the recording: thumbnail, duration, captions file,
 *                   full transcript and one Clip per chapter
 *   ImageGallery    the photos, each an ImageObject with its caption
 *   PresentationDigitalDocument  the slides on Speaker Deck
 *   ItemList        every LinkedIn post about the talk, with its counts
 *   Person / Organization  everyone thanked by name, each tied to LinkedIn
 *
 * Built from the same data modules the page renders, so the markup cannot say
 * anything the page does not. Nothing is invented: no photo credits or
 * licences (the photographers are not known), no end time, no ticket offers.
 */
import { SITE_URL } from "@/lib/site";
import { eventNode } from "@/lib/researchTalksLd";
import { BRIGHTONSEO_2026 as T } from "@/data/talks";
import { TRANSCRIPT, TRANSCRIPT_META } from "@/data/brightonTranscript";
import { PHOTOS } from "@/data/brightonPhotos";
import { MY_TALK_POSTS, SUPPORT_POSTS, THANK_YOU } from "@/data/brightonSupport";

type Node = Record<string, unknown>;

const PERSON = `${SITE_URL}/#person`;
const ref = (id: string) => ({ "@id": id });
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);
/** San Diego local time in September is Pacific Daylight Time. */
const pdt = (local: string) => `${local}:00-07:00`;
const slugOf = (url: string) =>
  decodeURIComponent(new URL(url).pathname)
    .replace(/^\/(in|company)\//, "")
    .replace(/\/$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();

function counters(reactions: number | null, comments: number | null): Node {
  if (reactions === null || comments === null) return {};
  return {
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: reactions },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: comments },
    ],
  };
}

export function buildBrightonRecapGraph({
  path,
  title,
  headline,
  description,
  published,
}: {
  path: string;
  title: string;
  headline: string;
  description: string;
  /** ISO date the recap went live. */
  published: string;
}) {
  const PAGE = `${SITE_URL}${path}`;
  const id = (frag: string) => `${PAGE}#${frag}`;
  const wall = SUPPORT_POSTS.filter((p) => p.phase !== "next");

  // Everyone thanked by name. A poster's node doubles as the author of their posts.
  const personId = (url: string) => id(`person-${slugOf(url)}`);
  const pageNames = new Set(wall.filter((p) => p.authorType === "page").map((p) => p.author));
  const people: Node[] = THANK_YOU.map((t) => ({
    "@type": pageNames.has(t.name) ? "Organization" : "Person",
    "@id": personId(t.url),
    name: t.name,
    url: t.url,
    sameAs: t.url,
  }));
  const byName = new Map(THANK_YOU.map((t) => [t.name, personId(t.url)]));

  const event = { ...eventNode(), recordedIn: ref(id("video")) };

  const video: Node = {
    "@type": "VideoObject",
    "@id": id("video"),
    name: `${T.title}: ${T.tagline}`,
    description: T.summary,
    thumbnailUrl: [abs(T.video.poster)],
    // Posted on LinkedIn 17 Sep 2026, 08:18 Pacific (read from the post id).
    uploadDate: "2026-09-17T15:18:00Z",
    duration: `PT${Math.round(T.video.duration / 60)}M`,
    ...(T.video.linkedinEmbed ? { embedUrl: T.video.linkedinEmbed } : {}),
    url: id("talk"),
    ...(T.video.linkedinPost ? { sameAs: T.video.linkedinPost } : {}),
    inLanguage: "en",
    creator: ref(PERSON),
    publisher: ref(PERSON),
    actor: ref(PERSON),
    recordedAt: ref(event["@id"] as string),
    caption: { "@type": "MediaObject", contentUrl: abs(TRANSCRIPT_META.vtt), encodingFormat: "text/vtt", inLanguage: "en" },
    transcript: TRANSCRIPT.flatMap((c) => c.paragraphs.map((p) => p.text)).join(" "),
    hasPart: TRANSCRIPT.map((c, i) => ({
      "@type": "Clip",
      name: c.title,
      startOffset: c.at,
      endOffset: TRANSCRIPT[i + 1]?.at ?? T.video.duration,
      url: id(`t-${c.at}`),
    })),
  };

  const images: Node[] = PHOTOS.map((p, i) => ({
    "@type": "ImageObject",
    "@id": id(`photo-${i + 1}`),
    contentUrl: abs(p.src),
    url: abs(p.src),
    encodingFormat: "image/webp",
    width: p.width,
    height: p.height,
    caption: p.caption,
    description: p.alt,
    about: ref(event["@id"] as string),
    ...(i === 0 ? { representativeOfPage: true } : {}),
  }));

  const gallery: Node = {
    "@type": "ImageGallery",
    "@id": id("photos"),
    name: `Photos from ${T.event}`,
    about: ref(event["@id"] as string),
    associatedMedia: images.map((n) => ref(n["@id"] as string)),
  };

  const slidesLink = T.links.find((l) => /speakerdeck\.com/.test(l.url));
  const slides: Node | null = slidesLink
    ? {
        "@type": "PresentationDigitalDocument",
        "@id": id("slides"),
        name: `Slides: ${T.title}`,
        url: slidesLink.url,
        author: ref(PERSON),
        about: ref(event["@id"] as string),
        inLanguage: "en",
      }
    : null;

  const posts: Node[] = [
    ...wall.map((p) => ({
      "@type": "SocialMediaPosting",
      "@id": id(`post-${p.id}`),
      url: p.url,
      headline: `LinkedIn post by ${p.author} about ${T.title}`,
      // The post as LinkedIn's public embed shows it, captured for this page.
      ...(p.image ? { image: abs(p.image.src) } : {}),
      datePublished: pdt(p.posted),
      author: ref(byName.get(p.author) ?? personId(p.url)),
      ...(p.quote ? { abstract: p.quote } : {}),
      about: ref(event["@id"] as string),
      mentions: ref(PERSON),
      ...counters(p.reactions, p.comments),
    })),
    ...MY_TALK_POSTS.map((m) => ({
      "@type": "SocialMediaPosting",
      url: m.url,
      headline: m.label,
      ...(m.image ? { image: abs(m.image.src) } : {}),
      datePublished: pdt(m.posted),
      author: ref(PERSON),
      about: ref(event["@id"] as string),
      ...counters(m.reactions, m.comments),
    })),
  ];

  const postList: Node = {
    "@type": "ItemList",
    "@id": id("posts"),
    name: `LinkedIn posts about ${T.title}, ${T.event}`,
    numberOfItems: posts.length,
    itemListElement: posts.map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
  };

  const images16x9 = abs(T.video.poster);
  const article: Node = {
    "@type": "Article",
    "@id": id("article"),
    headline,
    alternativeHeadline: title,
    description,
    inLanguage: "en",
    author: ref(PERSON),
    publisher: ref(PERSON),
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: ref(id("page")),
    image: [images16x9, ...images.slice(0, 2).map((n) => n.contentUrl as string)],
    about: ref(event["@id"] as string),
    video: ref(id("video")),
    // The gallery and the deck are parts of the recap (hasPart takes any
    // CreativeWork); associatedMedia would demand a MediaObject.
    hasPart: [ref(id("photos")), ...(slides ? [ref(id("slides"))] : [])],
    mentions: people.map((n) => ref(n["@id"] as string)),
  };

  const page: Node = {
    "@type": "CollectionPage",
    "@id": id("page"),
    url: PAGE,
    name: title,
    description,
    inLanguage: "en",
    datePublished: published,
    dateModified: published,
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL },
    author: ref(PERSON),
    about: ref(event["@id"] as string),
    primaryImageOfPage: ref(images[0]?.["@id"] as string),
    // The recap, and the list of posts it collects. An ItemList is not a
    // CreativeWork, so it is a main entity here rather than a part.
    mainEntity: [ref(id("article")), ref(id("posts"))],
    // Plain-text edition of this page, transcript included.
    encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: `${PAGE}.md` },
    hasPart: [ref(id("video")), ref(id("photos")), ...(slides ? [ref(id("slides"))] : [])],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [page, article, event, video, gallery, ...images, ...(slides ? [slides] : []), postList, ...people],
  };
}
