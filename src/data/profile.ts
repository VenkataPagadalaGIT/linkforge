/**
 * Venkata Pagadala as one record: profiles, outside numbers, what peers and
 * colleagues have said, and the bios event organizers ask for.
 *
 * /about, /profile and the site-wide Person node in app/layout.tsx all read
 * from here, so the three cannot disagree about who he is. The rules are the
 * ones src/data/talks.ts already holds itself to:
 *
 *   - Every profile URL was opened on 2026-10-22 and shows this person.
 *   - Every outside number names its source and the date it was read.
 *     Numbers that describe this site (papers, talks, archived posts) are
 *     never typed here; the pages count them from the data.
 *   - Every quote is verbatim, under fifteen words, and links to where it
 *     was said. A cut inside a quote is marked with an ellipsis.
 */
import { SITE_URL } from "@/lib/site";

export const PROFILE = {
  name: "Venkata Pagadala",
  /** As printed on the 2024 journal paper and the 2020 talk title. */
  alternateNames: ["Venkata Durga Eswar Pagadala", "Venkata Eswar Pagadala"],
  /** His title as LinkedIn shows it, 2026-10-22. */
  role: "Lead Technical Product Manager, Automation, AI & SEO",
  employer: "AT&T",
  location: "Atlanta, Georgia",
  /** The field, in one phrase: what his talks, papers and tools share. */
  field: "Search intelligence and AI systems",
  /** First role in search: SEO Manager at Sprout for Business, April 2016. */
  searchSince: "2016-04-01",
  photo: { src: "/venkata-pagadala.jpeg", width: 800, height: 800 },
  /** The address the site footer already publishes. */
  email: "vdepagadala@gmail.com",
};

export type SocialId =
  | "linkedin"
  | "youtube"
  | "substack"
  | "x"
  | "instagram"
  | "facebook"
  | "speakerdeck"
  | "scholar"
  | "github";

export interface SocialProfile {
  id: SocialId;
  label: string;
  handle: string;
  url: string;
}

/** Opened 2026-10-22; each one is his. Order is the order shown. */
export const SOCIAL_PROFILES: SocialProfile[] = [
  { id: "linkedin", label: "LinkedIn", handle: "in/venkata-pagadala", url: "https://www.linkedin.com/in/venkata-pagadala/" },
  { id: "youtube", label: "YouTube", handle: "@Venkata-pagadala", url: "https://www.youtube.com/@Venkata-pagadala" },
  { id: "substack", label: "Substack", handle: "venkatapagadala", url: "https://venkatapagadala.substack.com/" },
  { id: "x", label: "X", handle: "@venkata_pvd", url: "https://x.com/venkata_pvd" },
  { id: "instagram", label: "Instagram", handle: "@venkata_pagadala", url: "https://www.instagram.com/venkata_pagadala/" },
  { id: "facebook", label: "Facebook", handle: "venkatadurgaeswarpagadala", url: "https://www.facebook.com/venkatadurgaeswarpagadala/" },
  { id: "speakerdeck", label: "Speaker Deck", handle: "venkatapagadala1", url: "https://speakerdeck.com/venkatapagadala1" },
  { id: "scholar", label: "Google Scholar", handle: "g6hMDGIAAAAJ", url: "https://scholar.google.com/citations?user=g6hMDGIAAAAJ" },
  { id: "github", label: "GitHub", handle: "VenkataPagadalaGIT", url: "https://github.com/VenkataPagadalaGIT" },
];

export const socialUrl = (id: SocialId) => SOCIAL_PROFILES.find((p) => p.id === id)?.url ?? "";

export const LINKEDIN_URL = socialUrl("linkedin");
export const RECOMMENDATIONS_URL = "https://www.linkedin.com/in/venkata-pagadala/details/recommendations/";

/** His guest article, the written form of the brightonSEO method. */
export const GUEST_ARTICLE = {
  title: "User First, Algorithm Second: Researching Demand Beyond Search Volume",
  outlet: "Previsible",
  date: "2026-09-28",
  url: "https://previsible.com/brightonseo/demand-research-beyond-keywords/",
};

export interface SourcedStat {
  value: string;
  label: string;
  /** Where the number comes from, in words a reader can check. */
  source: string;
  href?: string;
}

/** LinkedIn numbers. The analytics window is the 12 months to 19 Oct 2026. */
export const LINKEDIN_STATS: SourcedStat[] = [
  { value: "20,000+", label: "LinkedIn followers", source: "LinkedIn profile, 22 Oct 2026", href: LINKEDIN_URL },
  { value: "484,000+", label: "Post impressions in 12 months", source: "LinkedIn analytics, 20 Oct 2025 to 19 Oct 2026" },
  { value: "206,000+", label: "Members reached in 12 months", source: "LinkedIn analytics, 20 Oct 2025 to 19 Oct 2026" },
  { value: "40", label: "Recommendations on LinkedIn", source: "LinkedIn profile, 22 Oct 2026", href: RECOMMENDATIONS_URL },
];

export interface PeerQuote {
  name: string;
  /** Their own headline on the source, shortened, as read 2026-10-22. */
  role: string;
  quote: string;
  /** What they were responding to. */
  about: string;
  url: string;
  /** Date of the post that carries the quote (a comment's own date is not shown by LinkedIn). */
  date: string;
}

/** Public posts and comments on LinkedIn, newest first. */
export const PEER_QUOTES: PeerQuote[] = [
  {
    name: "Rodrigo Stockebrand",
    role: "AI researcher and O'Reilly author",
    quote: "a must follow if you're interested in knowledge graphs in AI search space",
    about: "Resharing the knowledge graph built from ten years of posts",
    url: "https://www.linkedin.com/feed/update/urn:li:activity:7518261858701561858/",
    date: "2026-10-20",
  },
  {
    name: "Cihan Geyik",
    role: "Co-founder, Ansvisor and Empler AI",
    quote: "Your work and contributions to the AI Search community truly deserve recognition.",
    about: "On the Ansvisor list of AI search experts",
    url: "https://www.linkedin.com/posts/venkata-pagadala_thanks-for-mention-ansvisor-cihan-geyik-ugcPost-7508558780788445184-nUeK",
    date: "2026-09-23",
  },
  {
    name: "Raymond Martinez",
    role: "Vice President SEO, Archer Education",
    quote: "His work is interesting, challenging, and gets you to think deeply about search.",
    about: "After the brightonSEO San Diego 2026 talk",
    url: "https://www.linkedin.com/posts/raymond-martinez-seo_shout-out-to-venkata-pagadala-at-brightonseo-ugcPost-7505681691353640960-GVHj",
    date: "2026-09-15",
  },
  {
    name: "Jean-Christophe Chouinard",
    role: "Senior SEO Strategist, Tripadvisor",
    quote: "the most impressive SEO success story I've seen this year",
    about: "Previewing the brightonSEO San Diego 2026 talk",
    url: "https://www.linkedin.com/posts/jeanchristophechouinard_had-a-chance-to-have-an-early-preview-of-share-7503463479006085121-NZrS",
    date: "2026-09-09",
  },
  {
    name: "Andrea Volpini",
    role: "CEO and co-founder, WordLift",
    quote: "I see a strong connection with what I have been calling Agent-Oriented Ontology Engineering.",
    about: "On the Springer Nature survey of reward hacking in agentic LLM systems",
    url: "https://www.linkedin.com/posts/venkata-pagadala_agenticai-aialignment-aisafety-share-7496178355352866818-Vl4l",
    date: "2026-08-20",
  },
  {
    name: "Christian J. Ward",
    role: "Chief Data Officer and EVP, Yext",
    quote: "Wonderful to meet a fellow builder… your note vision was next level.",
    about: "On Venkata's notes from Christian's SEO Week talk",
    url: "https://www.linkedin.com/posts/venkata-pagadala_seoweek-notes-speaker-christian-j-ward-share-7455678674877722625-FwQc",
    date: "2026-04-30",
  },
  {
    name: "Anurag Singhal",
    role: "Founder, Quattr",
    quote: "This is really impressive arsenal for long tail SEO.",
    about: "On the industry research system for long-tail demand",
    url: "https://www.linkedin.com/posts/venkata-pagadala_ai-automation-industrialresearch-ugcPost-7419236855944056832-PtUX",
    date: "2026-01-20",
  },
];

export interface ColleagueRec {
  name: string;
  /** Their title in the LinkedIn export, which can be later than the work together. */
  title: string;
  /** Where they worked together, when the recommendation says so. */
  together?: string;
  quote: string;
  /** When the recommendation was written. */
  date: string;
}

/**
 * From the recommendations on his LinkedIn profile (all visible publicly),
 * read from the LinkedIn data export. Newest first.
 */
export const COLLEAGUE_RECS: ColleagueRec[] = [
  {
    name: "Stephen Ebbett",
    title: "Chief Marketing Officer, AMFM Healthcare",
    together: "American Addiction Centers",
    quote: "an exceptionally talented SEO professional",
    date: "2025-03-24",
  },
  {
    name: "Craig Harkins",
    title: "Director of SEO and Content, Apartments.com (CoStar Group)",
    together: "the Apartments.com SEO team",
    quote: "passionate about learning and experimenting with AI systems",
    date: "2025-03-24",
  },
  {
    name: "James Minior",
    title: "Director, Product Management, CoStar Group",
    together: "CoStar Group, on adjacent products",
    quote: "His ability to translate complex methods into practical applications",
    date: "2025-03-10",
  },
  {
    name: "Zach Chahalis",
    title: "VP of Relevance Engineering and Analytics, iPullRank",
    together: "CoStar Group, on his team",
    quote: "He often worked to stretch his skills into new and emerging areas of SEO",
    date: "2025-02-26",
  },
  {
    name: "Kevin Pak",
    title: "Product Manager, Apartments.com (CoStar Group)",
    together: "the Apartments.com product team",
    quote: "his forward-thinking approach and knowledge of how AI is also reshaping the landscape",
    date: "2025-02-18",
  },
  {
    name: "Ejiro Esiri",
    title: "Principal Product Manager, SEO, CoStar Group",
    together: "CoStar Group",
    quote: "very strong on task automation which is quite crucial for enterprise SEO",
    date: "2024-11-08",
  },
  {
    name: "John Domine",
    title: "Product Designer, Fortune Brands Innovations",
    together: "American Addiction Centers",
    quote: "selflessly holding workshops to teach SEO basics",
    date: "2023-01-10",
  },
  {
    name: "Emily Dekkers",
    title: "Technical Program Manager, Valmont Industries",
    quote: "an SEO powerhouse that any team would be lucky to have",
    date: "2020-02-07",
  },
];

export interface FocusLink {
  label: string;
  href: string;
}

export interface FocusArea {
  id: string;
  title: string;
  /** What it is and why it matters, in plain words. */
  body: string;
  links: FocusLink[];
}

/** What he works on. Every link points at something on this site or his own repository. */
export const FOCUS_AREAS: FocusArea[] = [
  {
    id: "demand",
    title: "Search demand beyond search volume",
    body: "A keyword tool reports one number from one search box. Demand also shows up in reviews, support calls, forums, video comments and earnings calls. I classify it by persona and intent, so a query with zero measured volume can still be the one worth winning.",
    links: [
      { label: "Audience Personas", href: "/personas" },
      { label: "The brightonSEO talk", href: "/research-and-talks#brightonseo-san-diego-2026" },
      { label: "The method, written up for Previsible", href: GUEST_ARTICLE.url },
    ],
  },
  {
    id: "ai-visibility",
    title: "AI visibility: AEO and GEO",
    body: "Answer engines retrieve, rank and quote differently from a page of blue links. I study which sources AI answers trust and cite, and build ways to measure a brand's share of those answers.",
    links: [
      { label: "How LLMs work, in 3D", href: "/guides/how-llms-work" },
      { label: "Paper: how LLMs are disrupting SEO", href: "/research-and-talks#llms-disrupting-search" },
    ],
  },
  {
    id: "knowledge-graphs",
    title: "Knowledge graphs and classification",
    body: "Classifying millions of queries into a hierarchy turns a keyword list into a map of an industry. The same graphs give AI agents facts to stand on instead of guesses.",
    links: [
      { label: "Graph types for AI agents", href: "/guides/graph-types-for-ai-agents" },
      { label: "AI Systems Map", href: "/notebook/ai/map" },
      { label: "Ten years of posts as one graph", href: "/venkata-pagadala-universe" },
    ],
  },
  {
    id: "agents",
    title: "AI agents and automation",
    body: "Agents that do real marketing and search work, such as research, briefs, QA and monitoring, tested and guarded before they scale. Design the system first, then the agent.",
    links: [
      { label: "AI agents for marketing guide", href: "/guides/ai-agents-for-marketing" },
      { label: "The Free Coalition session", href: "/research-and-talks#free-coalition-ai-agents-2026" },
      { label: "Open-source agents on GitHub", href: "https://github.com/VenkataPagadalaGIT/marketing-ai-agents" },
    ],
  },
];

/**
 * Bios for organizers and hosts, in the third person they need. Kept free of
 * numbers that go stale within weeks, apart from the follower floor.
 */
export const BIOS = {
  short:
    "Venkata Pagadala is Lead Technical Product Manager for Automation, AI and SEO at AT&T. He researches how people search and how AI systems answer, with papers in Springer Nature's Discover Artificial Intelligence and the Journal of Digital & Social Media Marketing, and spoke at brightonSEO San Diego 2026.",
  long:
    "Venkata Pagadala works on search intelligence: how people search, how AI systems answer, and how to build the systems that serve both. He is Lead Technical Product Manager for Automation, AI and SEO at AT&T in Atlanta, and before that worked on SEO product at Apartments.com (CoStar Group) and American Addiction Centers. His research appears in Springer Nature's Discover Artificial Intelligence (2026), the Journal of Digital & Social Media Marketing (2024) and on SSRN. At brightonSEO San Diego 2026 he presented a method for classifying search demand by persona and intent, and he has been a guest on Previsible's Voices of Search, the AI SEO Show and the SEO Video Show. He has shared his work on LinkedIn since 2016, where more than 20,000 people follow it.",
};

/** Whole years since his first search role, for "10+ years" style labels. */
export function yearsInSearch(now = new Date()): number {
  const start = new Date(`${PROFILE.searchSince}T00:00:00Z`).getTime();
  return Math.floor((now.getTime() - start) / (365.25 * 24 * 3600 * 1000));
}

/**
 * The canonical Person node. app/layout.tsx emits it on every page; /about
 * and /profile embed the same object as their mainEntity, so a parser that
 * reads one page alone still gets the whole entity and never a variant.
 */
export function personJsonLd(): Record<string, unknown> {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PROFILE.name,
    alternateName: PROFILE.alternateNames,
    url: SITE_URL,
    image: `${SITE_URL}${PROFILE.photo.src}`,
    jobTitle: PROFILE.role,
    worksFor: { "@type": "Organization", name: PROFILE.employer, url: "https://www.att.com/" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "New England College" },
      { "@type": "CollegeOrUniversity", name: "KL University" },
    ],
    homeLocation: { "@type": "Place", name: "Atlanta, Georgia, United States" },
    description:
      "Lead Technical Product Manager for Automation, AI and SEO at AT&T. Researcher and speaker on search intelligence: how people search, how AI systems answer, and the systems that serve both.",
    knowsAbout: [
      "Search intelligence",
      "Search engine optimization",
      "Answer engine optimization",
      "Generative engine optimization",
      "Knowledge graphs",
      "Query classification",
      "Audience personas",
      "AI agents",
      "Large language models",
      "Technical SEO",
      "Structured data",
    ],
    sameAs: SOCIAL_PROFILES.map((p) => p.url),
  };
}
