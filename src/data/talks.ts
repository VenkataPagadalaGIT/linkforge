/**
 * Talks, workshops, podcasts, interviews and recognition.
 *
 * Every entry was opened and checked on 2026-09-17 before it went in, and the
 * wording of each one is held to what its source actually says. That matters
 * more here than anywhere else on the site, because this page is a record of a
 * person, and a record that stretches is worse than a short one.
 *
 * Two examples of the gap, both corrected before publishing:
 *   - The US Search Awards page does not name Venkata as a winner. It
 *     acknowledges him as a contributor to Impressive's entry. It is listed as
 *     exactly that.
 *   - Plerdy's page is a list titled "41 Best San Diego SEO Experts", dated
 *     2022. It is listed as a 2022 list, not as a present-tense title.
 *
 * Dates are the source's own: a LinkedIn activity id carries its post time in
 * its top 41 bits, YouTube pages carry uploadDate, articles carry
 * datePublished. Where no source states a date, no date is shown.
 */

export type TalkKind = "talk" | "workshop" | "podcast" | "interview" | "recognition";

export interface TalkLink {
  label: string;
  url: string;
  /** Internal links stay on the site; everything else opens a new tab. */
  internal?: boolean;
}

export interface TalkVideo {
  /** Poster in /public, shown until the video plays and when it cannot. */
  poster: string;
  /** Self-hosted file in /public. */
  src?: string;
  /** Hosted on YouTube: rendered as a click-to-load facade. */
  youtubeId?: string;
  /** "16:9" landscape or "9:16" vertical. */
  aspect: "16:9" | "9:16";
  /** Seconds. */
  duration: number;
  /** ISO date the recording was made public, for VideoObject. */
  uploadDate?: string;
  /** The full recording as posted publicly on LinkedIn. */
  linkedinPost?: string;
  /** LinkedIn's embed of that post: an inline player for pages that have room for it. */
  linkedinEmbed?: string;
}

export interface TalkEntry {
  slug: string;
  kind: TalkKind;
  title: string;
  /** Where it happened or who published it. */
  outlet: string;
  /** ISO date or year, as precise as the source allows and no more. */
  date: string;
  /** One or two plain sentences on what it covered. */
  summary: string;
  links: TalkLink[];
  video?: TalkVideo;
  /** For podcasts and interviews: minutes, when the source states it. */
  minutes?: number;
  /**
   * 640x360 preview in /public/talks/thumbs, copied from the source's own
   * og:image or video thumbnail. Self-hosted because LinkedIn media URLs are
   * signed and third-party hotlinks fail on corporate proxies.
   */
  thumb?: string;
}

export interface Chapter {
  /** Seconds from the start of the edited talk. */
  at: number;
  title: string;
}

/** The brightonSEO talk, the page's featured item. */
export const BRIGHTONSEO_2026 = {
  slug: "brightonseo-san-diego-2026",
  /** brightonSEO's approved session title, verified on the session page. */
  title: "Industrial Level Classification with Intent",
  tagline: "User First, Algorithm Second",
  event: "brightonSEO San Diego 2026",
  /** Tue 15 Sep 2026, 09:15, Track 1, per the session page. */
  startDate: "2026-09-15T09:15:00-07:00",
  track: "Track 1",
  city: "San Diego, CA",
  /** Speaker Deck's player for the deck, from its oEmbed (deck id 42500ef2...). */
  slidesPlayer: "https://speakerdeck.com/player/42500ef2be054df78bf4832f5d091a32",
  summary:
    "Search volume is a direction, not a strategy. The talk walks through why a query with zero measured volume can still carry real demand, then the method: twenty places demand shows up outside the search box, classifying it by persona rather than by keyword, mapping a whole industry, and turning customer pain points into products.",
  links: [
    { label: "Session on brightonSEO", url: "https://brightonseo.com/events/san-diego-2026/sessions/search-intent" },
    { label: "Slides on Speaker Deck", url: "https://speakerdeck.com/venkatapagadala1/industrial-context-graphs" },
    { label: "The method, built: Audience Personas", url: "/personas", internal: true },
    { label: "Thank you: the people who showed up", url: "/research-and-talks/brightonseo-san-diego-2026", internal: true },
  ] as TalkLink[],
  video: {
    poster: "/talks/brightonseo-san-diego-2026.jpg",
    // The recording, as Venkata posted it on LinkedIn on 17 Sep 2026 (public post).
    linkedinPost: "https://www.linkedin.com/feed/update/urn:li:activity:7506371063925223424/",
    linkedinEmbed: "https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7506370624076959745",
    aspect: "16:9",
    duration: 900,
    // Hosting pending: 224 MB is too large for the repository or the Railway
    // upload. Set youtubeId (or src, once on object storage) and the player,
    // the chapter links and the VideoObject schema all switch on together.
  } as TalkVideo,
  /** Chapters in the 15-minute edit, from the edit's own chapter file. */
  chapters: [
    { at: 0, title: "Introduction" },
    { at: 135, title: "Zero volume, real demand" },
    { at: 228, title: "Case study: useful content" },
    { at: 291, title: "The car-buying journey" },
    { at: 389, title: "Queries become conversations" },
    { at: 421, title: "AI retrieval" },
    { at: 464, title: "The method" },
    { at: 480, title: "Reviews and pain points" },
    { at: 512, title: "Video and social platforms" },
    { at: 557, title: "Conference insights" },
    { at: 583, title: "Earnings calls and jobs" },
    { at: 633, title: "Research and regulations" },
    { at: 660, title: "Classify by persona" },
    { at: 693, title: "Map the industry" },
    { at: 731, title: "Market share" },
    { at: 761, title: "Reviews into products" },
    { at: 827, title: "Agent systems" },
    { at: 866, title: "Dedication" },
  ] as Chapter[],
};

export const TALKS: TalkEntry[] = [
  {
    slug: "att-product-strategy-workshop",
    kind: "workshop",
    title: "Product Strategy Workshop",
    outlet: "AT&T, Atlanta",
    // The recap was exported 2026-09-17; the workshop's own date is not stated
    // anywhere, so only the year is claimed.
    date: "2026",
    summary: "A product strategy workshop with the team at AT&T in Atlanta.",
    links: [],
    video: {
      poster: "/talks/att-product-strategy-workshop.jpg",
      src: "/talks/att-product-strategy-workshop.mp4",
      aspect: "9:16",
      duration: 44,
    },
  },
  {
    slug: "ai-seo-show-enterprise-ai-seo",
    thumb: "/talks/thumbs/ai-seo-show-enterprise-ai-seo.jpg",
    kind: "interview",
    title: "Enterprise AI SEO: Automation Pipelines, MCPs, and Future Proofing",
    outlet: "AI SEO Show",
    // YouTube uploadDate and the Keywords Everywhere post share this date.
    date: "2025-10-21",
    minutes: 33,
    summary:
      "How enterprise teams ship automation pipelines for metadata, schema and content drafts, classify queries at scale, and earn inclusion inside LLM answers.",
    links: [
      { label: "Watch on YouTube", url: "https://www.youtube.com/watch?v=qwyIY0vWO8g" },
      {
        label: "Keywords Everywhere's post",
        url: "https://www.linkedin.com/posts/keywords-everywhere-tool_this-week-we-sat-down-with-venkata-pagadala-activity-7386420721540820992--hwM/",
      },
    ],
  },
  {
    slug: "botpresso-seo-bytes",
    thumb: "/talks/thumbs/botpresso-seo-bytes.jpg",
    kind: "interview",
    title: "SEO Bytes",
    outlet: "Botpresso",
    date: "2026-05-25",
    summary:
      "A session on AI systems and their use cases: using AI to build scalable SEO systems, with an early look at the platform in development.",
    links: [
      {
        label: "Botpresso's post",
        url: "https://www.linkedin.com/posts/botpresso_another-week-another-insightful-seo-bytes-activity-7464525687811489792-orQQ/",
      },
    ],
  },
  {
    slug: "opinionated-seo-brightonseo-2024",
    thumb: "/talks/thumbs/opinionated-seo-brightonseo-2024.jpg",
    kind: "podcast",
    title: "Trends and Takeaways from BrightonSEO - San Diego 2024 SEO Conference",
    outlet: "Opinionated SEO podcast",
    date: "2024-11-26",
    minutes: 18,
    summary:
      "A guest on the conference recap: AI in SEO, brand consistency, and what the overlap with HeroConf added on reporting and data analysis.",
    links: [{ label: "Listen on Spotify", url: "https://open.spotify.com/episode/1TcEeYSTgJquItuTpt0Zj7" }],
  },
  {
    slug: "seo-success-stories-episode-39",
    thumb: "/talks/thumbs/seo-success-stories-episode-39.jpg",
    kind: "interview",
    title: "Episode 39: SEO Success Stories - Talking SEO with Venkata Pagadala of Apartments.com",
    outlet: "Impressive Digital",
    date: "2024-01-24",
    summary: "Talking SEO with Venkata Pagadala, then at Apartments.com.",
    links: [
      {
        label: "Episode page",
        url: "https://www.impressivedigital.com/seo_success_stories/episode-39-seo-success-stories-talking-seo-with-venkata-pagadala-of-apartments-com/",
      },
    ],
  },
  {
    slug: "360degree-inspirational-talk",
    thumb: "/talks/thumbs/360degree-inspirational-talk.jpg",
    kind: "talk",
    title: "360Degree Presents An Inspirational Talk With Vikas Mishra & Venkata Eswar Pagadala From USA",
    outlet: "360Degree",
    date: "2020-06-22",
    summary: "A conversation published on Vikas Mishra's channel.",
    links: [{ label: "Watch on YouTube", url: "https://www.youtube.com/watch?v=nfTo6_Sp3r8" }],
  },
];

/**
 * Recognition, worded to match the source exactly. Each `claim` is the
 * strongest statement its source supports, and no stronger.
 */
export interface RecognitionEntry {
  slug: string;
  claim: string;
  source: string;
  date: string;
  url: string;
  /** A short quote from the source, under fifteen words, when one exists. */
  quote?: string;
  /** Where the source is published, when that differs from who wrote it. */
  publishedOn?: string;
  thumb?: string;
}

export const RECOGNITION: RecognitionEntry[] = [
  {
    // Verified 2026-09-17 in a browser: published 24 Jul 2026, entry 33 on
    // the main list (not an honorable mention). The URL slug says 37 people;
    // the live title says 69, so the title is quoted as it reads now.
    slug: "linkedin-geo-aeo-experts-2026",
    claim: "Named in Metehan Yeşilyurt's Best GEO and AEO Experts to Follow in 2026",
    source: "Metehan Yeşilyurt",
    publishedOn: "LinkedIn",
    date: "2026-07-24",
    url: "https://www.linkedin.com/pulse/best-geo-aeo-experts-follow-2026-37-people-whose-work-ye%C5%9Filyurt--oqhnc/",
    quote: "Strategy decks are cheap. He ships pipelines.",
    thumb: "/talks/thumbs/linkedin-geo-aeo-experts-2026.jpg",
  },
  {
    slug: "clutch-content-gap-analysis",
    claim: "Cited in Clutch's guide to content gap analysis",
    source: "Clutch",
    date: "2026-05-25",
    url: "https://clutch.co/resources/secret-sauce-content-gap-analysis",
    quote: "notable for his work with programmatic SEO and AI",
    thumb: "/talks/thumbs/clutch-content-gap-analysis.jpg",
  },
  {
    slug: "us-search-awards-reservebar",
    claim:
      "Acknowledged as a contributor in Impressive's US Search Awards entry on ReserveBar's zero-loss SEO migration",
    source: "US Search Awards",
    date: "2026-04-16",
    url: "https://ussearchawards.com/impressive-reserved-bar/",
    quote: "a clever mind we tapped into occasionally",
    thumb: "/talks/thumbs/us-search-awards-reservebar.jpg",
  },
  {
    slug: "plerdy-san-diego-seo-experts",
    claim: "Listed in Plerdy's 41 Best San Diego SEO Experts",
    source: "Plerdy",
    date: "2022-08-10",
    url: "https://www.plerdy.com/seo-experts-san-diego/",
    thumb: "/talks/thumbs/plerdy-san-diego-seo-experts.jpg",
  },
];

/** Render an ISO date or bare year the way the source can support it. */
export function formatTalkDate(d: string): string {
  if (/^\d{4}$/.test(d)) return d;
  const dt = new Date(`${d}T12:00:00Z`);
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Newest first. A year-only date sorts as the start of that year. */
export const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/** The verb a link earns from where it points, so a thumbnail says what happens on click. */
export function linkVerb(url: string): "Watch" | "Listen" | "Read" | "Open" {
  if (/youtube\.com|youtu\.be/.test(url)) return "Watch";
  if (/spotify\.com|podcasts\.apple\.com/.test(url)) return "Listen";
  if (/linkedin\.com|clutch\.co|plerdy\.com|ussearchawards\.com/.test(url)) return "Read";
  return "Open";
}

export const KIND_LABEL: Record<TalkKind, string> = {
  talk: "Talk",
  workshop: "Workshop",
  podcast: "Podcast",
  interview: "Interview",
  recognition: "Recognition",
};
