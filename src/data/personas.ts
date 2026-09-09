/**
 * personas.ts: evidence-graded audience personas.
 *
 * The problem this file exists to solve: a persona is a synthesis, and
 * synthesis is where invented detail creeps in. Almost every persona
 * document on the internet states a person's motivations with the same
 * confidence it states their age, when only one of those came from a study.
 *
 * The contract:
 *   - STUDIES are the only source of truth. Each carries its publisher,
 *     method, population, sample size and field dates, so a reader can judge
 *     it without trusting us.
 *   - Every persona trait carries a GRADE:
 *       measured  a study reports this, for this population
 *       derived   real data, but a wider population than the persona
 *       inferred  no source. An assumption to test, never a finding.
 *   - `inferred` traits render visibly different on the page. They are not
 *     hidden, because hiding them is how personas become fiction.
 *   - DO_NOT_ASSERT records numbers that FAILED verification, so a later
 *     refresh cannot quietly reintroduce them.
 *
 * Refresh: when a publisher issues a new edition, add the new Study (keep the
 * old id), update the rows that changed, bump PERSONAS_LAST_UPDATED, and log
 * it in PERSONA_CHANGELOG. Never edit a value without moving its study's
 * `fielded` date, or the provenance silently breaks.
 */

export type EvidenceGrade = "measured" | "derived" | "inferred";

export const GRADE_META: Record<EvidenceGrade, { label: string; dot: string; note: string }> = {
  measured: { label: "Measured", dot: "#10b981", note: "A study reports this for this population" },
  derived: { label: "Derived", dot: "#f59e0b", note: "Real data, but a wider population than this persona" },
  inferred: { label: "Inferred", dot: "#ef4444", note: "No source. An assumption to test, not a finding" },
};

export type StudyMethod =
  | "probability-survey"
  | "commercial-panel"
  | "buyer-survey";

export const METHOD_LABEL: Record<StudyMethod, string> = {
  "probability-survey": "probability survey",
  "commercial-panel": "commercial panel",
  "buyer-survey": "survey of actual buyers",
};

export interface Study {
  id: string;
  name: string;
  publisher: string;
  url: string;
  method: StudyMethod;
  /** Who was actually surveyed. The persona is only as good as this line. */
  population: string;
  sampleSize?: number;
  fielded: string;
  published: string;
  /** Honest caveat about what this study cannot tell you. */
  limitation: string;
}

export interface EvidenceRow {
  id: string;
  studyId: string;
  metric: string;
  segment: string;
  value: string;
}

export interface PersonaTrait {
  label: string;
  value: string;
  grade: EvidenceGrade;
  /** Evidence ids backing a measured/derived trait. */
  evidenceIds?: string[];
  /** For derived: why the stretch is defensible. For inferred: the assumption. */
  rationale?: string;
}

export interface Persona {
  slug: string;
  name: string;
  segment: string;
  summary: string;
  traits: PersonaTrait[];
  /** What we would have to research to upgrade the inferred traits. */
  openQuestions: string[];
}

export const PERSONAS_LAST_UPDATED = "2026-09-09";
export const PERSONAS_FIRST_PUBLISHED = "2026-09-09";

export const STUDIES: Study[] = [
  {
    id: "pew-social-2025",
    name: "Social Media Fact Sheet",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/internet/fact-sheet/social-media/",
    method: "probability-survey",
    population: "US adults 18+",
    sampleSize: 5022,
    fielded: "2025-02-05 to 2025-06-18",
    published: "2025-11-20",
    limitation:
      "Reports whether someone ever uses a platform, not time spent, frequency, or what they do there. It publishes each demographic dimension separately, so there is no published figure for any INTERSECTION of two dimensions.",
  },
  {
    id: "datareportal-2026",
    name: "Digital 2026 Global Overview Report",
    publisher: "DataReportal, using GWI panel data",
    url: "https://datareportal.com/reports/digital-2026-global-overview-report",
    method: "commercial-panel",
    population: "Global internet users, broad age bands",
    fielded: "2026",
    published: "2026",
    limitation:
      "Panel-based and self-reported, global rather than US, and reported for all users rather than any specific age and gender cell. Use for order of magnitude, never as a per-persona figure.",
  },
  {
    id: "cox-cbj-2025",
    name: "Car Buyer Journey Study (16th annual)",
    publisher: "Cox Automotive",
    url: "https://www.coxautoinc.com/wp-content/uploads/2026/01/2025-Cox-Automotive-Car-Buyer-Journey-Study-Summary.pdf",
    method: "buyer-survey",
    population: "US consumers who bought a new or used vehicle in the prior 12 months",
    sampleSize: 2300,
    fielded: "Fall 2025",
    published: "2026-01-13",
    limitation:
      "Covers vehicle buyers as a whole. It is not cut by parental status, child age, or specific model, so it cannot describe a dad shopping a 3-row SUV specifically.",
  },
];

/**
 * Verified rows only. Pew's age breakdown reconciled against the published
 * overall figure on two independent reads; the gender breakdown did not, and
 * is therefore absent. See PERSONA_DO_NOT_ASSERT.
 */
export const EVIDENCE: EvidenceRow[] = [
  { id: "yt-all", studyId: "pew-social-2025", metric: "Ever use YouTube", segment: "All US adults", value: "84%" },
  { id: "yt-18", studyId: "pew-social-2025", metric: "Ever use YouTube", segment: "Ages 18-29", value: "95%" },
  { id: "yt-30", studyId: "pew-social-2025", metric: "Ever use YouTube", segment: "Ages 30-49", value: "92%" },
  { id: "yt-50", studyId: "pew-social-2025", metric: "Ever use YouTube", segment: "Ages 50-64", value: "85%" },
  { id: "yt-65", studyId: "pew-social-2025", metric: "Ever use YouTube", segment: "Ages 65+", value: "64%" },

  { id: "fb-all", studyId: "pew-social-2025", metric: "Ever use Facebook", segment: "All US adults", value: "71%" },
  { id: "fb-18", studyId: "pew-social-2025", metric: "Ever use Facebook", segment: "Ages 18-29", value: "68%" },
  { id: "fb-30", studyId: "pew-social-2025", metric: "Ever use Facebook", segment: "Ages 30-49", value: "80%" },
  { id: "fb-50", studyId: "pew-social-2025", metric: "Ever use Facebook", segment: "Ages 50-64", value: "74%" },
  { id: "fb-65", studyId: "pew-social-2025", metric: "Ever use Facebook", segment: "Ages 65+", value: "57%" },

  { id: "ig-all", studyId: "pew-social-2025", metric: "Ever use Instagram", segment: "All US adults", value: "50%" },
  { id: "ig-18", studyId: "pew-social-2025", metric: "Ever use Instagram", segment: "Ages 18-29", value: "80%" },
  { id: "ig-30", studyId: "pew-social-2025", metric: "Ever use Instagram", segment: "Ages 30-49", value: "62%" },
  { id: "ig-50", studyId: "pew-social-2025", metric: "Ever use Instagram", segment: "Ages 50-64", value: "40%" },
  { id: "ig-65", studyId: "pew-social-2025", metric: "Ever use Instagram", segment: "Ages 65+", value: "19%" },

  { id: "tt-all", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "All US adults", value: "37%" },
  { id: "tt-18", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 18-29", value: "63%" },
  { id: "tt-30", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 30-49", value: "44%" },
  { id: "tt-50", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 50-64", value: "30%" },
  { id: "tt-65", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 65+", value: "12%" },

  { id: "sc-all", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "All US adults", value: "25%" },
  { id: "sc-18", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 18-29", value: "58%" },
  { id: "sc-30", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 30-49", value: "31%" },
  { id: "sc-50", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 50-64", value: "13%" },
  { id: "sc-65", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 65+", value: "4%" },

  { id: "rd-all", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "All US adults", value: "26%" },
  { id: "rd-18", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "Ages 18-29", value: "48%" },
  { id: "rd-30", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "Ages 30-49", value: "35%" },
  { id: "rd-50", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "Ages 50-64", value: "16%" },
  { id: "rd-65", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "Ages 65+", value: "6%" },

  { id: "x-all", studyId: "pew-social-2025", metric: "Ever use X", segment: "All US adults", value: "21%" },
  { id: "x-18", studyId: "pew-social-2025", metric: "Ever use X", segment: "Ages 18-29", value: "33%" },
  { id: "x-30", studyId: "pew-social-2025", metric: "Ever use X", segment: "Ages 30-49", value: "25%" },
  { id: "x-50", studyId: "pew-social-2025", metric: "Ever use X", segment: "Ages 50-64", value: "16%" },
  { id: "x-65", studyId: "pew-social-2025", metric: "Ever use X", segment: "Ages 65+", value: "10%" },

  { id: "time-tt", studyId: "datareportal-2026", metric: "Time per day, TikTok", segment: "All users (global)", value: "about 95 min" },
  { id: "time-yt", studyId: "datareportal-2026", metric: "Time per day, YouTube incl. Shorts", segment: "All users (global)", value: "about 75 min" },
  { id: "time-ig", studyId: "datareportal-2026", metric: "Time per day, Instagram", segment: "All users (global)", value: "about 55 min" },
  { id: "time-fb", studyId: "datareportal-2026", metric: "Time per day, Facebook", segment: "All users (global)", value: "about 33 min" },
  { id: "time-all", studyId: "datareportal-2026", metric: "Time per day, all social", segment: "All users (global)", value: "about 2h 21m" },

  { id: "cox-omni", studyId: "cox-cbj-2025", metric: "Say an omnichannel buy would be ideal", segment: "Recent US vehicle buyers", value: "63%" },
  { id: "cox-dealer", studyId: "cox-cbj-2025", metric: "Completed all steps at the dealership", segment: "Recent US vehicle buyers", value: "53%" },
  { id: "cox-online", studyId: "cox-cbj-2025", metric: "Bought completely online", segment: "Recent US vehicle buyers", value: "7%" },
  { id: "cox-allonline", studyId: "cox-cbj-2025", metric: "Say they want an all-online purchase", segment: "Recent US vehicle buyers", value: "28%" },
  { id: "cox-ai", studyId: "cox-cbj-2025", metric: "Believe AI will reshape car buying within 10 years", segment: "Recent US vehicle buyers", value: "83%" },
];

export const PERSONAS: Persona[] = [
  {
    slug: "us-dad-30-49-three-row-suv",
    name: "The 3-row SUV dad",
    segment: "US man, 30 to 49, young family, in-market for a 3-row SUV",
    summary:
      "Built to show the method rather than to flatter the subject. Every line below is either backed by a named study of a stated population, stretched from a wider population and labelled as such, or admitted to be an assumption with no evidence behind it. The last group is the interesting one.",
    traits: [
      {
        label: "Reachable on YouTube",
        value: "92% of 30-49s ever use it, the second-highest of any age group",
        grade: "measured",
        evidenceIds: ["yt-30"],
      },
      {
        label: "Facebook is not dead for this cohort",
        value: "80% of 30-49s use it, the HIGHEST of any age band, above 18-29s at 68%",
        grade: "measured",
        evidenceIds: ["fb-30", "fb-18"],
      },
      {
        label: "Instagram reaches most of them",
        value: "62% of 30-49s",
        grade: "measured",
        evidenceIds: ["ig-30"],
      },
      {
        label: "Reddit is a real channel here, TikTok bigger than assumed",
        value: "Reddit 35%, TikTok 44% of 30-49s",
        grade: "measured",
        evidenceIds: ["rd-30", "tt-30"],
      },
      {
        label: "Wants a hybrid buying process, not a fully online one",
        value: "63% say omnichannel would be ideal; only 28% want all-online, and just 7% actually bought that way",
        grade: "measured",
        evidenceIds: ["cox-omni", "cox-allonline", "cox-online"],
        rationale: "Measured on recent vehicle buyers as a whole, which includes this persona.",
      },
      {
        label: "Still ends up at the dealership",
        value: "53% completed every step in person",
        grade: "measured",
        evidenceIds: ["cox-dealer"],
      },
      {
        label: "Attention is concentrated in video",
        value: "TikTok about 95 min/day, YouTube about 75, Facebook about 33",
        grade: "derived",
        evidenceIds: ["time-tt", "time-yt", "time-fb"],
        rationale:
          "GWI panel figures for all global users, not for US men aged 30-49. Directionally useful for ranking platforms by attention, wrong to quote as this persona's daily minutes.",
      },
      {
        label: "Open to AI in the buying process",
        value: "83% of recent buyers expect AI to reshape car buying within a decade",
        grade: "derived",
        evidenceIds: ["cox-ai"],
        rationale: "Measured on all recent buyers. Expectation about the future is not the same as willingness to use it today.",
      },
      {
        label: "Trusts current owners over dealer marketing",
        value: "Commonly assumed, not established here",
        grade: "inferred",
        rationale:
          "No study in this evidence base measures source trust for vehicle buyers. Plausible and widely repeated, which is exactly why it needs testing rather than repeating.",
      },
      {
        label: "Behaviour changes because he has an infant",
        value: "No public dataset cuts platform use by parental status or child age",
        grade: "inferred",
        rationale:
          "Pew publishes age, gender, race, income, education, community type and party. Parenthood is not among them. Any persona claiming it either bought inferred panel data or invented it.",
      },
      {
        label: "Avoids owner groups after purchase, uses them before",
        value: "No evidence either way",
        grade: "inferred",
        rationale:
          "This is a motivation claim. Browsing panels can show that someone visited a forum; they cannot show why, or what it changed. Only interviews or a purpose-built survey can answer it.",
      },
    ],
    openQuestions: [
      "Does parental status shift platform mix at all, once you control for age? No public source answers this, so it would need a commissioned survey question.",
      "Which sources do 3-row SUV buyers say changed their shortlist? Cox measures the journey shape but not source influence by segment.",
      "Do owner communities influence the decision, or only reassure after it? This needs interviews; no behavioural dataset can separate the two.",
      "Is the Facebook 30-49 peak about the feed, or about Groups and Marketplace? Pew measures platform use, not surface use.",
    ],
  },
];

/**
 * Numbers that FAILED verification and must never be published.
 * Checked before any refresh adds a row.
 */
export const PERSONA_DO_NOT_ASSERT: string[] = [
  "Multiplying marginals into an intersection. Pew publishes a number for men, and a number for 30-49s, but none for men aged 30-49. The explorer shows each lens separately and refuses to combine them, because a combined figure would be invented arithmetic wearing a citation.",
  "Pew LinkedIn and Pinterest age breakdowns. The overall figures appeared (25% and 37%) but no age columns could be read, so no age rows exist for them.",
  "Any claim tying child age, parental status or household composition to platform behaviour. Pew does not publish this cut. If it appears in a future persona, it came from a paid inferred panel or from nowhere, and it must be graded accordingly.",
  "Any daily-minutes figure presented as US-specific or age-specific. The DataReportal/GWI numbers are global, all-user averages.",
  "Aggregator sites (demandsage, blastup, sqmagazine, broadbandsearch and similar) that dominate these search results. They recycle figures without primary attribution and are the most likely vector for a fabricated statistic entering this file. Cite the publisher, never the aggregator.",
];

export const PERSONA_CHANGELOG: { date: string; entries: string[] }[] = [
  {
    date: "2026-09-09 · Pew fact sheet corpus",
    entries: [
      "Pulled all three Pew Internet & Technology fact sheets through the machine-readable .md endpoints their robots.txt publishes for AI clients. 44 tables extracted structurally rather than read by eye.",
      "Reconciliation first: all 136 reach cells already shipped were compared against the fresh pull. 136 of 136 matched exactly, zero drift. That is what licensed expanding from this source rather than re-deriving from the PDF.",
      "Reach grid went from 136 cells to 242, now dense: 11 platforms by 22 segments with no gaps.",
      "Added Threads (8%), Bluesky (4%) and Truth Social (3%), first published in the 2025 wave.",
      "Added two dimensions Pew publishes that were not being used: community type (urban, suburban, rural) and party lean.",
      "Added the access layer: internet use, home broadband, cellphone and smartphone ownership, and smartphone dependency. 16% of US adults are smartphone-only, rising to 34% under $30,000 and 28% among Hispanic adults.",
      "Every sample size and margin of error re-verified against Pew's own methodology table, which is published as an image. All 17 previously shipped figures confirmed exact; five new segments added from it.",
      "Access-layer figures are deliberately NOT combined across traits. They sit near the ceiling, where multiplying odds adds error without adding information, so each is shown as published.",
    ],
  },
  {
    date: "2026-09-09",
    entries: [
      "First published. Three studies, 42 verified evidence rows, one persona.",
      "Pew age breakdowns verified across two independent reads and reconciled against published overall figures.",
      "Pew gender breakdowns and WhatsApp overall excluded after failing that reconciliation; recorded in the do-not-assert list.",
      "Re-verified the same day against the primary report PDF (Americans' Social Media Use 2025, published 2025-11-20) instead of the JavaScript fact-sheet table. The audit reversed the earlier conclusion: the OVERALL figures were the faulty read, not the gender splits. Corrected TikTok 32% to 37%, WhatsApp to 32%, Reddit 24% to 26%, Snapchat 26% to 25%. Gender data restored, corroborated verbatim by the report for Instagram (women 55%, men 44%).",
      "Added the full reach matrix (8 platforms x 13 segments across gender, age, income and education) with the published sample size and margin of error for every segment, to power the interactive explorer.",
    ],
  },
];

export const PERSONA_COUNTS = {
  studies: () => STUDIES.length,
  evidence: () => EVIDENCE.length,
  personas: () => PERSONAS.length,
  measured: () => PERSONAS.flatMap((p) => p.traits).filter((t) => t.grade === "measured").length,
  inferred: () => PERSONAS.flatMap((p) => p.traits).filter((t) => t.grade === "inferred").length,
};

export const studyById = (id: string) => STUDIES.find((s) => s.id === id);
export const evidenceById = (id: string) => EVIDENCE.find((e) => e.id === id);
export const personaBySlug = (slug: string) => PERSONAS.find((p) => p.slug === slug);

/* ------------------------------------------------------------------ *
 * The reach matrix that powers the interactive explorer.
 *
 * Re-verified 2026-09-09 against the PRIMARY report PDF ("Americans'
 * Social Media Use 2025", published 2025-11-20) rather than the
 * JavaScript fact-sheet table, after the fact sheet produced figures
 * that would not reconcile. The audit found the OVERALL numbers were
 * the bad read, not the demographic splits: TikTok is 37% (not 32%)
 * and WhatsApp is 32% (not 25% or 21%). Gender data was wrongly
 * suspected and is now restored, corroborated verbatim by the report
 * ("more than half of women report using Instagram (55%), compared
 * with under half of men (44%)").
 *
 * CRITICAL, and the reason the explorer is built the way it is:
 * Pew publishes MARGINALS, not the full crosstab. There is a published
 * number for men, and a published number for 30-49s, but NONE for men
 * aged 30-49. Multiplying marginals is statistically invalid. The
 * explorer therefore shows each selected lens SEPARATELY and refuses
 * to synthesise an intersection.
 * ------------------------------------------------------------------ */

export interface Platform {
  id: string;
  name: string;
  /** Official brand colour, used for the mark and the bar only, never text. */
  color: string;
  /** % of ALL US adults who ever use it. Primary report, 2025. */
  overall: number;
}

export type Dimension =
  | "gender"
  | "age"
  | "income"
  | "education"
  | "race"
  | "community"
  | "party";

export interface Segment {
  id: string;
  dimension: Dimension;
  label: string;
  /** Unweighted sample size, published by Pew. */
  n: number;
  /** Margin of error in percentage points, at 95% confidence. */
  moe: number;
}

export const DIMENSION_LABEL: Record<Dimension, string> = {
  gender: "Gender",
  age: "Age",
  income: "Household income",
  education: "Education",
  race: "Race and ethnicity",
  community: "Community type",
  party: "Party",
};

export const PLATFORMS: Platform[] = [
  { id: "youtube", name: "YouTube", color: "#FF0000", overall: 84 },
  { id: "facebook", name: "Facebook", color: "#1877F2", overall: 71 },
  { id: "instagram", name: "Instagram", color: "#E4405F", overall: 50 },
  { id: "tiktok", name: "TikTok", color: "#FE2C55", overall: 37 },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", overall: 32 },
  { id: "reddit", name: "Reddit", color: "#FF4500", overall: 26 },
  { id: "snapchat", name: "Snapchat", color: "#FFFC00", overall: 25 },
  { id: "x", name: "X", color: "#E7E9EA", overall: 21 },
  { id: "threads", name: "Threads", color: "#A855F7", overall: 8 },
  { id: "bluesky", name: "Bluesky", color: "#0085FF", overall: 4 },
  { id: "truthsocial", name: "Truth Social", color: "#5448EE", overall: 3 },
];

export const SEGMENTS: Segment[] = [
  { id: "men", dimension: "gender", label: "Men", n: 2194, moe: 3.0 },
  { id: "women", dimension: "gender", label: "Women", n: 2758, moe: 2.5 },

  { id: "18-29", dimension: "age", label: "18 to 29", n: 480, moe: 5.6 },
  { id: "30-49", dimension: "age", label: "30 to 49", n: 1399, moe: 3.4 },
  { id: "50-64", dimension: "age", label: "50 to 64", n: 1274, moe: 3.6 },
  { id: "65+", dimension: "age", label: "65 and over", n: 1813, moe: 3.0 },

  { id: "inc-lt30", dimension: "income", label: "Under $30K", n: 939, moe: 4.5 },
  { id: "inc-30-70", dimension: "income", label: "$30K to $70K", n: 1533, moe: 3.6 },
  { id: "inc-70-100", dimension: "income", label: "$70K to $100K", n: 692, moe: 5.1 },
  { id: "inc-100", dimension: "income", label: "$100K and over", n: 1629, moe: 3.1 },

  { id: "edu-hs", dimension: "education", label: "High school or less", n: 1175, moe: 3.8 },
  { id: "edu-some", dimension: "education", label: "Some college", n: 1587, moe: 3.4 },
  { id: "edu-grad", dimension: "education", label: "College graduate", n: 2215, moe: 2.7 },
];

/** platformId -> segmentId -> % who ever use. Published cells only. */
export const REACH: Record<string, Record<string, number>> = {
  youtube: { men: 86, women: 83, "18-29": 95, "30-49": 92, "50-64": 85, "65+": 64, "inc-lt30": 77, "inc-30-70": 84, "inc-70-100": 87, "inc-100": 89, "edu-hs": 78, "edu-some": 87, "edu-grad": 89 },
  facebook: { men: 63, women: 78, "18-29": 68, "30-49": 80, "50-64": 74, "65+": 57, "inc-lt30": 71, "inc-30-70": 72, "inc-70-100": 72, "inc-100": 71, "edu-hs": 69, "edu-some": 73, "edu-grad": 71 },
  instagram: { men: 44, women: 55, "18-29": 80, "30-49": 62, "50-64": 40, "65+": 19, "inc-lt30": 41, "inc-30-70": 46, "inc-70-100": 54, "inc-100": 60, "edu-hs": 41, "edu-some": 53, "edu-grad": 58 },
  tiktok: { men: 30, women: 42, "18-29": 63, "30-49": 44, "50-64": 30, "65+": 12, "inc-lt30": 42, "inc-30-70": 40, "inc-70-100": 39, "inc-100": 30, "edu-hs": 40, "edu-some": 42, "edu-grad": 29 },
  whatsapp: { men: 30, women: 34, "18-29": 37, "30-49": 40, "50-64": 30, "65+": 20, "inc-lt30": 28, "inc-30-70": 31, "inc-70-100": 28, "inc-100": 39, "edu-hs": 27, "edu-some": 29, "edu-grad": 41 },
  reddit: { men: 29, women: 23, "18-29": 48, "30-49": 35, "50-64": 16, "65+": 6, "inc-lt30": 17, "inc-30-70": 22, "inc-70-100": 29, "inc-100": 37, "edu-hs": 15, "edu-some": 28, "edu-grad": 37 },
  snapchat: { men: 22, women: 28, "18-29": 58, "30-49": 31, "50-64": 13, "65+": 4, "inc-lt30": 26, "inc-30-70": 26, "inc-70-100": 31, "inc-100": 23, "edu-hs": 24, "edu-some": 29, "edu-grad": 24 },
  x: { men: 25, women: 16, "18-29": 33, "30-49": 25, "50-64": 16, "65+": 10, "inc-lt30": 16, "inc-30-70": 19, "inc-70-100": 26, "inc-100": 25, "edu-hs": 16, "edu-some": 23, "edu-grad": 24 },
  threads: { men: 8, women: 9, "18-29": 15, "30-49": 10, "50-64": 6, "65+": 3, "inc-lt30": 8, "inc-30-70": 9, "inc-70-100": 10, "inc-100": 7, "edu-hs": 7, "edu-some": 9, "edu-grad": 9 },
  bluesky: { men: 4, women: 3, "18-29": 6, "30-49": 5, "50-64": 3, "65+": 2, "inc-lt30": 2, "inc-30-70": 4, "inc-70-100": 3, "inc-100": 5, "edu-hs": 2, "edu-some": 4, "edu-grad": 6 },
  truthsocial: { men: 4, women: 3, "18-29": 1, "30-49": 3, "50-64": 5, "65+": 4, "inc-lt30": 3, "inc-30-70": 3, "inc-70-100": 3, "inc-100": 4, "edu-hs": 3, "edu-some": 5, "edu-grad": 3 },
};

/**
 * Attributes a reader will reach for that Pew does NOT publish. The
 * explorer offers them, then explains the absence, because the absence
 * is the most useful thing it can teach.
 */
export const UNMEASURED_ATTRIBUTES = [
  { id: "kids", label: "Has children", why: "Pew publishes age, gender, race, income, education, community type and party. Parental status is not among them." },
  { id: "baby", label: "Has an infant", why: "No public dataset cuts platform use by the age of a person's child." },
  { id: "location", label: "Specific city or state", why: "Pew publishes urban, suburban and rural, not geography at state or metro level." },
  { id: "intent", label: "In-market for a car", why: "Cox Automotive measures the buying journey for all recent buyers. It is not cross-cut with platform use." },
];

export const reachFor = (platformId: string, segmentId: string): number | undefined =>
  REACH[platformId]?.[segmentId];

export const segmentById = (id: string) => SEGMENTS.find((s) => s.id === id);

/* ------------------------------------------------------------------ *
 * DAILY USE: a second, sharper layer.
 *
 * "Ever use" is reach. "Daily use" is habit, and it is the better answer
 * to the question people actually mean when they ask which platform an
 * audience spends time on. Different survey, different sample, different
 * field dates, so it is kept as its own layer and never mixed with reach.
 *
 * Source: same report, appendix table. Survey of 5,123 US adults,
 * Feb 24 to March 2, 2025. Only four platforms were asked about.
 * ------------------------------------------------------------------ */

export const DAILY_PLATFORMS = ["facebook", "youtube", "tiktok", "x"] as const;

export interface DailyRow {
  segmentId: string;
  label: string;
  dimension: Dimension | "race" | "community" | "party" | "all";
  facebook: number;
  youtube: number;
  tiktok: number;
  x: number;
}

export const DAILY_USE: DailyRow[] = [
  { segmentId: "all", label: "All US adults", dimension: "all", facebook: 52, youtube: 48, tiktok: 24, x: 10 },

  { segmentId: "men", label: "Men", dimension: "gender", facebook: 44, youtube: 58, tiktok: 19, x: 15 },
  { segmentId: "women", label: "Women", dimension: "gender", facebook: 60, youtube: 39, tiktok: 28, x: 6 },

  { segmentId: "18-29", label: "18 to 29", dimension: "age", facebook: 49, youtube: 66, tiktok: 47, x: 18 },
  { segmentId: "30-49", label: "30 to 49", dimension: "age", facebook: 58, youtube: 54, tiktok: 28, x: 10 },
  { segmentId: "50-64", label: "50 to 64", dimension: "age", facebook: 54, youtube: 45, tiktok: 17, x: 9 },
  { segmentId: "65+", label: "65 and over", dimension: "age", facebook: 45, youtube: 27, tiktok: 5, x: 4 },

  { segmentId: "race-white", label: "White", dimension: "race", facebook: 54, youtube: 41, tiktok: 19, x: 9 },
  { segmentId: "race-black", label: "Black", dimension: "race", facebook: 44, youtube: 56, tiktok: 31, x: 13 },
  { segmentId: "race-hispanic", label: "Hispanic", dimension: "race", facebook: 55, youtube: 61, tiktok: 38, x: 12 },
  { segmentId: "race-asian", label: "Asian", dimension: "race", facebook: 48, youtube: 70, tiktok: 17, x: 10 },

  { segmentId: "inc-lower", label: "Lower income", dimension: "income", facebook: 58, youtube: 53, tiktok: 31, x: 10 },
  { segmentId: "inc-middle", label: "Middle income", dimension: "income", facebook: 52, youtube: 48, tiktok: 23, x: 11 },
  { segmentId: "inc-upper", label: "Upper income", dimension: "income", facebook: 45, youtube: 43, tiktok: 14, x: 11 },

  { segmentId: "edu-hs", label: "High school or less", dimension: "education", facebook: 56, youtube: 48, tiktok: 29, x: 9 },
  { segmentId: "edu-some", label: "Some college", dimension: "education", facebook: 54, youtube: 50, tiktok: 26, x: 11 },
  { segmentId: "edu-grad", label: "College graduate", dimension: "education", facebook: 47, youtube: 47, tiktok: 16, x: 11 },

  { segmentId: "urban", label: "Urban", dimension: "community", facebook: 49, youtube: 55, tiktok: 28, x: 10 },
  { segmentId: "suburban", label: "Suburban", dimension: "community", facebook: 51, youtube: 48, tiktok: 21, x: 11 },
  { segmentId: "rural", label: "Rural", dimension: "community", facebook: 57, youtube: 42, tiktok: 25, x: 8 },
];

/** Every source behind this page, cited in full at the foot of it. */
export interface Citation {
  id: string;
  title: string;
  publisher: string;
  url: string;
  detail: string;
  accessed: string;
}

export const CITATIONS: Citation[] = [
  {
    id: "pew-report",
    title: "Americans' Social Media Use 2025 (full report, PDF)",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/wp-content/uploads/sites/20/2025/11/PI_2025.11.20_Social-Media-Use_REPORT.pdf",
    detail:
      "The primary source for every reach and daily-use figure on this page. Published November 20, 2025. Reach data: survey of 5,022 US adults, February 5 to June 18, 2025, margin of error ±1.9pp. Daily-use data: a separate survey of 5,123 US adults, February 24 to March 2, 2025. Read directly from the PDF after the interactive fact sheet produced figures that would not reconcile.",
    accessed: "2026-09-09",
  },
  {
    id: "pew-factsheet",
    title: "Social Media Fact Sheet",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/internet/fact-sheet/social-media/",
    detail:
      "The full crosstabs for the same survey: 11 platforms by age, gender, race, income, education, community type and party, plus the 2012-2025 trend. Read through Pew's machine-readable .md endpoint, which its robots.txt publishes for AI clients. All 136 cells that overlapped the PDF extraction matched exactly, which is what licensed the rest of the grid being taken from here.",
    accessed: "2026-09-09",
  },
  {
    id: "pew-internet-broadband",
    title: "Internet, Broadband Fact Sheet",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/internet/fact-sheet/internet-broadband/",
    detail:
      "Internet use and home broadband subscription, each by age, race, gender, income, education and community type, with trend lines back to 2000. Published November 20, 2025 from the same NPORS survey. The source for the access layer: 96% of US adults use the internet, 78% subscribe to home broadband.",
    accessed: "2026-09-09",
  },
  {
    id: "pew-mobile",
    title: "Mobile Fact Sheet",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/internet/fact-sheet/mobile/",
    detail:
      "Cellphone and smartphone ownership by seven dimensions, and smartphone dependency, defined as owning a smartphone without a home broadband subscription. Published November 20, 2025. The source for the smartphone-only figure of 16% nationally, which rises to 34% among adults in households under $30,000.",
    accessed: "2026-09-09",
  },
  {
    id: "pew-npors-method",
    title: "Social Media Use 2025: Methodology",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/internet/2025/11/20/social-media-use-2025-methodology/",
    detail:
      "Where every sample size and margin of error on this site comes from. Total sample 5,022 at ±1.9pp; subgroups range from White adults at n=3,304 (±2.3pp) to Asian adults at n=211 (±8.9pp). Pew publishes this table as an image, so it was read from the image rather than parsed.",
    accessed: "2026-09-09",
  },
  {
    id: "pew-npors",
    title: "National Public Opinion Reference Survey (NPORS) methodology",
    publisher: "Pew Research Center",
    url: "https://www.pewresearch.org/wp-content/uploads/sites/20/2025/11/PI_2025.11.20_Social-Media-Use_REPORT.pdf",
    detail:
      "Address-based sampling with a web, mail and phone protocol. 2,349 completed online, 2,331 on paper and 342 by phone. The published unweighted sample size and margin of error for every segment on this page comes from its appendix, which is why each column carries its own ± figure.",
    accessed: "2026-09-09",
  },
  {
    id: "usafacts",
    title: "Answers (94 questions, harmonised from 70+ federal agencies)",
    publisher: "USAFacts",
    url: "https://usafacts.org/",
    detail:
      "Nonpartisan nonprofit founded by Steve Ballmer in 2017, which collects and standardises data from more than 70 federal agencies and names the agency behind each figure. Used here for the national baseline: income, wages, debt, rent, homeownership, poverty, population and household composition. Every row carries the originating agency as well, because the agency is the source of record and USAFacts is the route. Retrieved by direct fetch, permitted by their robots.txt.",
    accessed: "2026-09-09",
  },
  {
    id: "datareportal",
    title: "Digital 2026 Global Overview Report",
    publisher: "DataReportal, with GWI panel data",
    url: "https://datareportal.com/reports/digital-2026-global-overview-report",
    detail:
      "Source of the time-per-day figures. Panel-based, self-reported, global and all-user, so it is graded derived rather than measured wherever it appears against a US persona.",
    accessed: "2026-09-09",
  },
  {
    id: "cox",
    title: "Car Buyer Journey Study, 16th annual (summary PDF)",
    publisher: "Cox Automotive",
    url: "https://www.coxautoinc.com/wp-content/uploads/2026/01/2025-Cox-Automotive-Car-Buyer-Journey-Study-Summary.pdf",
    detail:
      "Source of every vehicle-purchase figure. Surveyed 2,300 US consumers who bought a new or used vehicle in the prior 12 months, fielded autumn 2025, published January 13, 2026. Measures the journey for buyers as a whole and is not cross-cut by platform use, parental status or model.",
    accessed: "2026-09-09",
  },
];

/* ------------------------------------------------------------------ *
 * THE DEMAND-SOURCE FRAMEWORK
 *
 * The owner's own method, presented at brightonSEO San Diego 2026:
 * twenty demand sources in five categories, five buyer personas that ask
 * five different questions about the same product, and a six-dimension
 * classification applied to every signal before it is used.
 *
 * One box is search demand. The other nineteen are where buyers talk.
 * ------------------------------------------------------------------ */

export type SourceCategory = "search" | "social" | "reviews" | "market" | "expert";

export const SOURCE_CATEGORY: Record<
  SourceCategory,
  { label: string; tells: string; color: string }
> = {
  search: { label: "Search", tells: "what they type", color: "#3b82f6" },
  social: { label: "Social", tells: "what they say", color: "#a855f7" },
  reviews: { label: "Reviews", tells: "what they felt", color: "#f59e0b" },
  market: { label: "Market", tells: "what they pay", color: "#10b981" },
  expert: { label: "Expert", tells: "what comes next", color: "#ef4444" },
};

export interface DemandSource {
  id: string;
  name: string;
  yields: string;
  category: SourceCategory;
  /** Platform id where a brand mark exists for it. */
  platformId?: string;
}

export const DEMAND_SOURCES: DemandSource[] = [
  { id: "search-demand", name: "Search Demand", yields: "Queries + Trends", category: "search" },
  { id: "wikis", name: "Wikis", yields: "Entities + Terminology", category: "search" },

  { id: "youtube", name: "YouTube", yields: "Videos + Comments", category: "social", platformId: "youtube" },
  { id: "reddit", name: "Reddit", yields: "Communities + Subreddits", category: "social", platformId: "reddit" },
  { id: "tiktok", name: "TikTok", yields: "Trends + Comments", category: "social", platformId: "tiktok" },
  { id: "facebook-groups", name: "Facebook Groups", yields: "Questions + Discussions", category: "social", platformId: "facebook" },
  { id: "instagram", name: "Instagram", yields: "Creators + Comments", category: "social", platformId: "instagram" },
  { id: "x", name: "X", yields: "Real-time conversations", category: "social", platformId: "x" },

  { id: "gbp-reviews", name: "GBP Reviews", yields: "Ratings + Response", category: "reviews" },
  { id: "marketplaces", name: "Marketplaces", yields: "Pricing + Reviews", category: "reviews" },
  { id: "app-reviews", name: "App Reviews", yields: "Experience + Pain points", category: "reviews" },

  { id: "competitors", name: "Competitors", yields: "Products + Pricing", category: "market" },
  { id: "public-data", name: "Public Data", yields: "Revenue + Market share", category: "market" },
  { id: "earnings-calls", name: "Earnings Calls", yields: "Strategy + Risks", category: "market" },
  { id: "job-postings", name: "Job Postings", yields: "Skills + Investment", category: "market" },
  { id: "regulations", name: "Regulations", yields: "Policies + Constraints", category: "market" },

  { id: "conferences", name: "Conferences", yields: "Expert insights", category: "expert" },
  { id: "newsletters", name: "Newsletters", yields: "Trends + Opinions", category: "expert" },
  { id: "podcasts", name: "Podcasts", yields: "Interviews + Predictions", category: "expert" },
  { id: "research-papers", name: "Research Papers", yields: "Innovation + Evidence", category: "expert" },
];

export interface BuyerPersona {
  id: string;
  initials: string;
  name: string;
  mode: string;
  asks: string;
  /** Source ids this persona actually trusts. Drives the match score. */
  trusts: string[];
  wonBy: string;
  /** The owner's own note from the deck. */
  note?: string;
}

export const BUYER_PERSONAS: BuyerPersona[] = [
  {
    id: "value-seeker",
    initials: "VS",
    name: "Value Seeker",
    mode: "Compare",
    asks: "Which DFW dealer has the lowest markup on a Grand Highlander?",
    trusts: ["search-demand", "gbp-reviews", "marketplaces"],
    wonBy: "Transparent pricing pages, fresh reviews",
  },
  {
    id: "deep-researcher",
    initials: "DR",
    name: "Deep Researcher",
    mode: "Validate",
    asks: "Hybrid Max or Hybrid: real MPG, reliability, trade-offs?",
    trusts: ["youtube", "reddit", "competitors"],
    wonBy: "Comparison guides, spec videos, owner data",
  },
  {
    id: "community-buyer",
    initials: "CB",
    name: "Community Buyer",
    mode: "Trust",
    asks: "Anyone in DFW buy one recently? Was the price fair?",
    trusts: ["facebook-groups", "reddit", "gbp-reviews"],
    wonBy: "Owner threads, answers in the group, dealer replies",
    note: "That was me",
  },
  {
    id: "trend-explorer",
    initials: "TE",
    name: "Trend Explorer",
    mode: "Discover",
    asks: "Is the next model year worth waiting for?",
    trusts: ["tiktok", "instagram", "youtube"],
    wonBy: "Short video, first looks, walkarounds",
  },
  {
    id: "industry-expert",
    initials: "IE",
    name: "Industry Expert",
    mode: "Anticipate",
    asks: "How does hybrid demand change dealer inventory?",
    trusts: ["x", "podcasts", "earnings-calls"],
    wonBy: "Analysis, earnings commentary, forecasts",
  },
];

/** The six dimensions every signal is classified against before use. */
export const CLASSIFICATION_DIMENSIONS = [
  "Persona",
  "Intent",
  "Need",
  "Sentiment",
  "Journey stage",
  "Platform",
] as const;

/** The worked example from the deck, kept verbatim. */
export const WORKED_EXAMPLE = {
  query: "Fair-priced Toyota Grand Highlander Hybrid Max dealers in DFW area | Texas",
  rows: [
    { k: "Source", v: "Facebook Groups (Social)" },
    { k: "Persona", v: "Community Buyer" },
    { k: "Intent", v: "Buy. Compare price" },
    { k: "Need", v: "A fair price, a dealer I can trust" },
    { k: "Sentiment", v: "Anxious, high stakes" },
    { k: "Journey stage", v: "Decision" },
    { k: "Platform", v: "Facebook Groups" },
  ],
  output: "Dealer pricing content, and an answer inside the thread.",
};

/* Teen layer. Separate survey, separate population, never merged with adults. */
export const TEEN_STUDY = {
  id: "pew-teens-2025",
  name: "Teens, Social Media and AI Chatbots 2025",
  publisher: "Pew Research Center",
  url: "https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/",
  population: "US teens aged 13 to 17",
  sampleSize: 1458,
  fielded: "2025-09-25 to 2025-10-09",
};

/** Only figures that read consistently. Approximations are excluded. */
export const TEEN_REACH = [
  { label: "Snapchat", pct: 55, note: "of US teens ever use it" },
  { label: "Facebook", pct: 31, note: "of US teens ever use it" },
  { label: "WhatsApp", pct: 24, note: "of US teens ever use it" },
  { label: "Snapchat, girls vs boys", pct: 61, note: "girls 61% against boys 49%" },
  { label: "Reddit, boys vs girls", pct: 21, note: "boys 21% against girls 12%" },
  { label: "TikTok, Black teens", pct: 79, note: "against 74% Hispanic and 54% White" },
  { label: "Instagram, Black teens", pct: 82, note: "against 69% Hispanic and 55% White" },
];

/* ------------------------------------------------------------------ *
 * RESEARCH FOUNDATIONS
 *
 * The peer-reviewed basis for why this section is built the way it is.
 * The Chapman result is the load-bearing one: it is the empirical proof
 * that a persona with many attributes describes almost nobody, which is
 * exactly why the composer loses confidence as traits are added instead
 * of gaining it.
 * ------------------------------------------------------------------ */

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  finding: string;
  /** How this page actually acts on it. */
  applied: string;
}

export const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: "chapman-2008",
    title: "Quantitative Evaluation of Personas as Information",
    authors: "Chapman, Love, Milham, ElRif & Alford",
    venue: "Proceedings of the Human Factors and Ergonomics Society Annual Meeting",
    year: 2008,
    url: "https://quantuxbook.com/papers/REPRINT-HFES08-chapman-love-milham-elrif-alford.pdf",
    finding:
      "Across six real survey datasets (N=268 to N=10,307) and two simulated ones, the authors generated 10,000 random persona-like descriptions per dataset and measured how many real people each matched. Prevalence fell rapidly with every attribute added. In their words, the 99th percentile description \"fails to match anyone when 9 or more attributes are combined in 5 out of 6 survey datasets, including all consumer datasets\", and only one dataset saw descriptions with 7 or more attributes match more than 0.3% of respondents. Their conclusion: a persona with more than a few attributes cannot be assumed to describe many actual people.",
    applied:
      "This is why the composer gets LESS confident as you narrow, why two selected lenses are printed separately instead of merged, and why the do-not-assert list bans multiplying marginals. A tool that grew more confident with each attribute would be contradicting a measured result.",
  },
  {
    id: "chapman-2006",
    title: "The Personas' New Clothes: Methodological and Practical Arguments against a Popular Method",
    authors: "Chapman & Milham",
    venue: "Proceedings of the Human Factors and Ergonomics Society Annual Meeting, 50(5), 634-636",
    year: 2006,
    url: "https://journals.sagepub.com/doi/10.1177/154193120605000503",
    finding:
      "The original methodological critique: it is difficult to know how many real users a persona represents, personas cannot be verified or falsified and so have no demonstrable validity, and they tend to settle questions politically rather than with data.",
    applied:
      "Answered directly by grading every trait and linking it to a study. A trait marked measured is falsifiable: open the source and check it. A trait marked inferred is labelled as an assumption to test rather than presented as a finding.",
  },
  {
    id: "salminen-2021",
    title: "A Survey of 15 Years of Data-Driven Persona Development",
    authors: "Salminen, Guan, Jung & Jansen",
    venue: "International Journal of Human-Computer Interaction",
    year: 2021,
    url: "https://research.tudelft.nl/en/publications/a-survey-of-15-years-of-data-driven-persona-development/",
    finding:
      "A systematic review of 77 data-driven persona articles from 2005 to 2020, identifying three eras: quantification (2005-2008), diversification (2009-2014) and digitalisation (2015 onward). The constructive counterpart to the Chapman critique: personas can be built from data, provided the data and method are stated.",
    applied:
      "The reason this section exists at all. Personas are not abandoned here, they are made auditable: every figure carries its study, population, sample size, field dates and margin of error.",
  },
];

/**
 * Which source answers which layer, and what it costs.
 *
 * The mapping follows the owner's own five-category demand framework.
 * Three of the six layers are fully answered by free public research, so
 * paid tooling is only justified for collection, never for demographics.
 */
export interface DataLayer {
  layer: string;
  question: string;
  source: string;
  cost: "free" | "paid";
  url?: string;
  note: string;
}

export const DATA_LADDER: DataLayer[] = [
  {
    layer: "Who they are",
    question: "Age, gender, income, education, race, community",
    source: "Pew Research Center, US Census, American Community Survey",
    cost: "free",
    url: "https://www.pewresearch.org/internet/fact-sheet/social-media/",
    note: "Probability samples with published margins of error. No commercial audience tool improves on this for US demographics, and most are inferring what Pew measures.",
  },
  {
    layer: "How they spend time",
    question: "Hours per day on an activity, by demographic",
    source: "American Time Use Survey (BLS)",
    cost: "free",
    url: "https://www.bls.gov/tus/data.htm",
    note: "Federal time-diary survey, roughly 6,100 respondents in 2025, microdata downloadable at no cost. A stronger answer to time spent than any commercial panel, because it is a diary rather than a recollection.",
  },
  {
    layer: "What they pay",
    question: "Spending by category and demographic",
    source: "Consumer Expenditure Survey (BLS)",
    cost: "free",
    url: "https://www.bls.gov/cex/",
    note: "Annual means, standard errors and shares across 17 demographic characteristics, plus public-use microdata back to 1980. This is the salary and spending layer, already published.",
  },
  {
    layer: "What they type",
    question: "Search demand, queries, SERP composition",
    source: "DataForSEO",
    cost: "paid",
    note: "Justified: no free source gives query-level volume at scale. Keyword volume understates real demand, so pair it with Search Console rather than treating it as the whole picture.",
  },
  {
    layer: "What they say",
    question: "Posts, comments, community threads",
    source: "mcpscraper, Bright Data",
    cost: "paid",
    note: "Justified for collection only. These retrieve text that is already public; they do not supply demographics, and nothing they return establishes why somebody decided anything.",
  },
  {
    layer: "Why they decided",
    question: "Motivation, trust, trade-offs",
    source: "Purpose-built surveys and interviews",
    cost: "free",
    note: "No tool at any price answers this. Behavioural data shows where a person went, never why. This is the layer where every persona on the internet quietly starts inventing, and where ours marks traits inferred.",
  },
];

/* ------------------------------------------------------------------ *
 * US CONTEXT, via USAFacts
 *
 * The baseline a persona sits inside: what a household earns, owns,
 * owes and pays. Retrieved from USAFacts, the nonpartisan nonprofit
 * founded by Steve Ballmer in 2017, which harmonises data from 70-plus
 * federal agencies and names the agency behind each figure.
 *
 * Why an aggregator is used here when the do-not-assert list warns
 * against them: the warning targets content farms that recycle numbers
 * with no attribution. USAFacts is a different class of thing. It cites
 * its agency, states its refresh cadence, and solves the real problem
 * that federal data is scattered across dozens of portals on different
 * update schedules. Both layers of attribution are therefore carried:
 * the agency of record, and the route by which it was retrieved.
 *
 * Collected 2026-09-09 by direct fetch. No paid scraper was used and
 * none was needed: usafacts.org/robots.txt explicitly permits ClaudeBot,
 * and every figure below is present in the served HTML.
 * ------------------------------------------------------------------ */

export interface UsContextFact {
  id: string;
  metric: string;
  value: string;
  asOf: string;
  /** The federal agency that produced the number. */
  agency: string;
  /** The page it was read from. */
  url: string;
  /** Which persona bucket this informs. */
  bucket: "money" | "household" | "people" | "work";
}

export const US_CONTEXT: UsContextFact[] = [
  {
    id: "median-hh-income",
    metric: "Median household income",
    value: "$81,600",
    asOf: "2024",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/what-is-the-income-of-a-us-household/country/united-states/",
    bucket: "money",
  },
  {
    id: "avg-wage",
    metric: "Average weekly wage",
    value: "$1,290 per week",
    asOf: "July 2026",
    agency: "Bureau of Labor Statistics",
    url: "https://usafacts.org/answers/what-is-the-average-wage-in-the-us/country/united-states/",
    bucket: "money",
  },
  {
    id: "gender-pay-gap",
    metric: "Gender pay gap",
    value: "Women earned $0.82 for every dollar men made in a typical week",
    asOf: "Q2 2026",
    agency: "Bureau of Labor Statistics",
    url: "https://usafacts.org/answers/what-is-the-gender-pay-gap-in-the-us/country/united-states/",
    bucket: "money",
  },
  {
    id: "avg-debt",
    metric: "Average debt owed per American",
    value: "$63,500",
    asOf: "Q2 2026",
    agency: "Federal Reserve",
    url: "https://usafacts.org/answers/how-much-debt-does-the-average-american-owe/country/united-states/",
    bucket: "money",
  },
  {
    id: "homeownership",
    metric: "Homeownership rate",
    value: "65.2% of households own their home, about 2 in 3",
    asOf: "2025",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/what-is-the-homeownership-rate/country/united-states/",
    bucket: "household",
  },
  {
    id: "median-rent",
    metric: "Median rent, including utilities",
    value: "about $1,487 per month",
    asOf: "2024",
    agency: "US Census Bureau and Department of Housing and Urban Development",
    url: "https://usafacts.org/answers/how-much-do-households-spend-on-rent/country/united-states/",
    bucket: "household",
  },
  {
    id: "same-sex-households",
    metric: "Households led by a same-sex married couple",
    value: "835,900, which is 1.3% of all married-couple households",
    asOf: "2024",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/how-many-same-sex-married-households-are-in-the-us/",
    bucket: "household",
  },
  {
    id: "language",
    metric: "People aged 5+ speaking a language other than English at home",
    value: "74.1 million, which is 23%",
    asOf: "2024",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/how-many-people-speak-a-language-other-than-english-at-home/country/united-states/",
    bucket: "people",
  },
  {
    id: "population",
    metric: "US population",
    value: "about 341.8 million",
    asOf: "2025",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/how-many-people-live-in-the-us/country/united-states/",
    bucket: "people",
  },
  {
    id: "poverty",
    metric: "People living in poverty",
    value: "35.9 million",
    asOf: "2024",
    agency: "US Census Bureau",
    url: "https://usafacts.org/answers/what-is-the-us-poverty-rate/country/united-states/",
    bucket: "people",
  },
  {
    id: "unemployment",
    metric: "Unemployment rate",
    value: "4.1%",
    asOf: "August 2026",
    agency: "Bureau of Labor Statistics",
    url: "https://usafacts.org/answers/what-is-the-unemployment-rate/country/united-states/",
    bucket: "work",
  },
];

export const US_CONTEXT_BUCKETS: Record<string, string> = {
  money: "Money",
  household: "Household",
  people: "People",
  work: "Work",
};

/** The wider corpus this was drawn from, for the next pass. */
export const USAFACTS_CORPUS = {
  questions: 94,
  pages: 30610,
  answerPages: 29525,
  note:
    "USAFacts publishes 94 distinct questions, each expanded across states and counties into roughly 29,500 answer pages. Eleven were taken here, selected for what a persona actually needs. The remainder is a known, mapped source for later passes rather than an unexplored pile.",
};

/* ------------------------------------------------------------------ *
 * RACE AND ETHNICITY, and THE ESTIMATOR
 *
 * The estimator is the heart of the tool and the place where honesty is
 * either kept or quietly lost, so the method is stated in full.
 *
 * Published research gives MARGINALS: a figure for women, a figure for
 * 30-to-49s, a figure for Asian adults. It does not give the cell where
 * those meet. Refusing to combine them is safe but useless, because the
 * question people actually have is always about a combination.
 *
 * So combinations are ESTIMATED by multiplicative lift, and the working
 * is shown every time. Each trait's lift against the national base is
 * multiplied through. The assumption is independence, which is rarely
 * exactly true, so the result is labelled an estimate, the arithmetic is
 * printed, and the sampling error is carried through. Chapman et al.
 * (2008) is the reason the tool also widens its uncertainty and softens
 * its language as traits accumulate rather than sounding more certain.
 * ------------------------------------------------------------------ */

export const RACE_SEGMENTS: Segment[] = [
  { id: "race-white", dimension: "race", label: "White", n: 3304, moe: 2.3 },
  { id: "race-black", dimension: "race", label: "Black", n: 512, moe: 6.0 },
  { id: "race-hispanic", dimension: "race", label: "Hispanic", n: 757, moe: 5.0 },
  { id: "race-asian", dimension: "race", label: "Asian", n: 211, moe: 8.9 },
];

/** Race rows for the reach matrix. Corroborated against the report text. */
export const RACE_REACH: Record<string, Record<string, number>> = {
  youtube: { "race-white": 82, "race-black": 85, "race-hispanic": 88, "race-asian": 92 },
  facebook: { "race-white": 70, "race-black": 74, "race-hispanic": 74, "race-asian": 62 },
  instagram: { "race-white": 45, "race-black": 54, "race-hispanic": 62, "race-asian": 58 },
  tiktok: { "race-white": 28, "race-black": 53, "race-hispanic": 57, "race-asian": 31 },
  whatsapp: { "race-white": 23, "race-black": 37, "race-hispanic": 56, "race-asian": 54 },
  reddit: { "race-white": 27, "race-black": 18, "race-hispanic": 22, "race-asian": 44 },
  snapchat: { "race-white": 24, "race-black": 29, "race-hispanic": 31, "race-asian": 19 },
  x: { "race-white": 18, "race-black": 26, "race-hispanic": 23, "race-asian": 32 },
  threads: { "race-white": 6, "race-black": 18, "race-hispanic": 10, "race-asian": 12 },
  bluesky: { "race-white": 4, "race-black": 2, "race-hispanic": 4, "race-asian": 3 },
  truthsocial: { "race-white": 4, "race-black": 2, "race-hispanic": 2, "race-asian": 6 },
};

/** Every segment the estimator can reason about. */
/**
 * Community type and party, published in the same NPORS 2025 survey.
 * They answer a different question than demographics do: where a person
 * lives, and how they lean.
 */
export const COMMUNITY_SEGMENTS: Segment[] = [
  { id: "urban", dimension: "community", label: "Urban", n: 1394, moe: 3.6 },
  { id: "suburban", dimension: "community", label: "Suburban", n: 2334, moe: 2.8 },
  { id: "rural", dimension: "community", label: "Rural", n: 1235, moe: 3.8 },
];

export const PARTY_SEGMENTS: Segment[] = [
  { id: "party-rep", dimension: "party", label: "Rep / lean Rep", n: 2234, moe: 2.8 },
  { id: "party-dem", dimension: "party", label: "Dem / lean Dem", n: 2446, moe: 2.8 },
];

/** Platform reach by community type and party. Published cells only. */
export const CONTEXT_REACH: Record<string, Record<string, number>> = {
  youtube: { urban: 85, suburban: 87, rural: 79, "party-rep": 84, "party-dem": 85 },
  facebook: { urban: 71, suburban: 71, rural: 71, "party-rep": 72, "party-dem": 70 },
  instagram: { urban: 55, suburban: 54, rural: 37, "party-rep": 49, "party-dem": 53 },
  tiktok: { urban: 42, suburban: 37, rural: 32, "party-rep": 33, "party-dem": 40 },
  whatsapp: { urban: 44, suburban: 34, rural: 17, "party-rep": 25, "party-dem": 38 },
  reddit: { urban: 29, suburban: 30, rural: 18, "party-rep": 22, "party-dem": 32 },
  snapchat: { urban: 25, suburban: 26, rural: 23, "party-rep": 26, "party-dem": 25 },
  x: { urban: 23, suburban: 22, rural: 17, "party-rep": 24, "party-dem": 19 },
  threads: { urban: 11, suburban: 9, rural: 4, "party-rep": 6, "party-dem": 10 },
  bluesky: { urban: 4, suburban: 5, rural: 2, "party-rep": 1, "party-dem": 8 },
  truthsocial: { urban: 2, suburban: 4, rural: 4, "party-rep": 6, "party-dem": 1 },
};

/**
 * The access layer: whether a person is online at all, and on what.
 *
 * For anyone building something this matters more than platform choice.
 * A group that is 28% smartphone-only has no home broadband, which decides
 * page weight, video autoplay, and whether a desktop flow is reachable at
 * all. Reach says where to show up. This says what will actually load.
 *
 * Internet use and home broadband come from the Internet/Broadband fact
 * sheet; ownership and smartphone dependency from the Mobile fact sheet.
 * Neither publishes a party breakdown, so those cells are absent rather
 * than filled in.
 */
export interface TechMetric {
  id: string;
  label: string;
  /** Published national figure for all US adults. */
  overall: number;
  /** Which fact sheet published it. */
  sheet: "internet-broadband" | "mobile";
  /** segmentId -> %. A missing key means that sheet does not publish the cut. */
  by: Record<string, number>;
}

export const TECH_ACCESS: TechMetric[] = [
  { id: "internet", label: "Uses the internet", overall: 96, sheet: "internet-broadband", by: { "18-29": 99, "30-49": 99, "50-64": 96, "65+": 90, "race-white": 96, "race-black": 94, "race-hispanic": 97, "race-asian": 99, "men": 96, "women": 97, "inc-lt30": 91, "inc-30-70": 96, "inc-70-100": 98, "inc-100": 99, "edu-hs": 93, "edu-some": 98, "edu-grad": 99, "urban": 96, "suburban": 98, "rural": 94 } },
  { id: "broadband", label: "Has home broadband", overall: 78, sheet: "internet-broadband", by: { "18-29": 71, "30-49": 87, "50-64": 79, "65+": 70, "race-white": 81, "race-black": 71, "race-hispanic": 68, "race-asian": 86, "men": 79, "women": 78, "inc-lt30": 54, "inc-30-70": 75, "inc-70-100": 88, "inc-100": 94, "edu-hs": 62, "edu-some": 81, "edu-grad": 92, "urban": 75, "suburban": 84, "rural": 71 } },
  { id: "smartphone", label: "Owns a smartphone", overall: 91, sheet: "mobile", by: { "18-29": 97, "30-49": 96, "50-64": 90, "65+": 78, "men": 90, "women": 91, "race-white": 91, "race-black": 85, "race-hispanic": 93, "race-asian": 96, "inc-lt30": 82, "inc-30-70": 89, "inc-70-100": 96, "inc-100": 97, "edu-hs": 84, "edu-some": 93, "edu-grad": 96, "urban": 91, "suburban": 93, "rural": 87, "party-rep": 91, "party-dem": 92 } },
  { id: "cellphone", label: "Owns a cellphone of any kind", overall: 98, sheet: "mobile", by: { "18-29": 99, "30-49": 99, "50-64": 98, "65+": 95, "men": 97, "women": 98, "race-white": 98, "race-black": 98, "race-hispanic": 98, "race-asian": 98, "inc-lt30": 95, "inc-30-70": 98, "inc-70-100": 99, "inc-100": 99, "edu-hs": 97, "edu-some": 98, "edu-grad": 99, "urban": 97, "suburban": 99, "rural": 97, "party-rep": 98, "party-dem": 98 } },
  { id: "featurephone", label: "Owns a cellphone but not a smartphone", overall: 7, sheet: "mobile", by: { "18-29": 2, "30-49": 3, "50-64": 7, "65+": 16, "men": 7, "women": 7, "race-white": 7, "race-black": 12, "race-hispanic": 5, "race-asian": 3, "inc-lt30": 13, "inc-30-70": 9, "inc-70-100": 3, "inc-100": 2, "edu-hs": 13, "edu-some": 5, "edu-grad": 2, "urban": 7, "suburban": 5, "rural": 9, "party-rep": 6, "party-dem": 6 } },
  { id: "smartphone-dep", label: "Smartphone-only: owns a smartphone but has no home broadband", overall: 16, sheet: "mobile", by: { "18-29": 27, "30-49": 11, "50-64": 15, "65+": 17, "race-white": 13, "race-black": 19, "race-hispanic": 28, "race-asian": 11, "men": 15, "women": 17, "inc-lt30": 34, "inc-30-70": 19, "inc-70-100": 10, "inc-100": 4, "edu-hs": 27, "edu-some": 15, "edu-grad": 6, "urban": 19, "suburban": 12, "rural": 20 } },
];

export const techAccess = (metricId: string, segmentId?: string): number | undefined => {
  const m = TECH_ACCESS.find((x) => x.id === metricId);
  if (!m) return undefined;
  return segmentId ? m.by[segmentId] : m.overall;
};

export const ALL_SEGMENTS: Segment[] = [
  ...SEGMENTS,
  ...RACE_SEGMENTS,
  ...COMMUNITY_SEGMENTS,
  ...PARTY_SEGMENTS,
];
export const allSegmentById = (id: string) => ALL_SEGMENTS.find((s) => s.id === id);

/** Reach lookup across every published matrix. */
export const reachAny = (platformId: string, segmentId: string): number | undefined =>
  REACH[platformId]?.[segmentId] ??
  RACE_REACH[platformId]?.[segmentId] ??
  CONTEXT_REACH[platformId]?.[segmentId];

export type EstimateBasis = "measured" | "estimated" | "unknown";

export interface ReachEstimate {
  value: number;
  basis: EstimateBasis;
  /** Plain-language arithmetic, printed in the interface. */
  derivation: string;
  /** Sampling error only. Model error from the independence assumption is extra. */
  samplingMoe: number;
  /** Traits that contributed. */
  used: string[];
  /** Traits that had no published figure for this platform. */
  ignored: string[];
  caution?: string;
}

/** Probability to odds, and back. Odds cannot leave the 0-1 range on return. */
const toOdds = (p: number) => p / (100 - p);
const toPct = (o: number) => (100 * o) / (1 + o);

/**
 * Estimate the share of a trait combination that ever uses a platform.
 *
 * No traits: the published national figure, measured.
 * One trait: the published cell for that trait, measured.
 * Two or more: the traits are combined in ODDS space, estimated, working shown.
 *
 * Odds rather than percentages, deliberately. Multiplying published
 * percentages compounds past 100: a woman aged 30 to 49 who is Asian came out
 * at 99% on YouTube, which is not a real number, it is arithmetic running off
 * the end of the scale. Odds ratios multiply without a ceiling and convert
 * back inside 0 to 100 by construction, which is why logistic models work this
 * way. It also stays conservative where the base rate is already high, which
 * is exactly where the naive version was worst.
 *
 * The assumption that survives either way is independence: that being Asian
 * shifts the odds by the same factor whether or not you are also 33 and a
 * woman. That is rarely exactly true. It is stated in the interface rather
 * than buried here.
 */
export function estimateReach(platformId: string, traitIds: string[]): ReachEstimate {
  const base = PLATFORMS.find((p) => p.id === platformId)?.overall ?? 0;
  const used: string[] = [];
  const ignored: string[] = [];

  for (const t of traitIds) {
    if (reachAny(platformId, t) !== undefined) used.push(t);
    else ignored.push(t);
  }

  if (used.length === 0) {
    return {
      value: base,
      basis: "measured",
      derivation: `Published national figure: ${base}% of all US adults ever use it.`,
      samplingMoe: 1.9,
      used,
      ignored,
    };
  }

  if (used.length === 1) {
    const seg = allSegmentById(used[0]);
    const v = reachAny(platformId, used[0])!;
    return {
      value: v,
      basis: "measured",
      derivation: `Published cell: ${v}% of ${seg?.label ?? used[0]} (n=${seg?.n.toLocaleString() ?? "?"}).`,
      samplingMoe: seg?.moe ?? 1.9,
      used,
      ignored,
    };
  }

  const baseOdds = toOdds(base);
  const parts: string[] = [];
  let odds = baseOdds;
  let varSum = 0;
  for (const t of used) {
    const seg = allSegmentById(t);
    const v = reachAny(platformId, t)!;
    const or = baseOdds > 0 ? toOdds(v) / baseOdds : 1;
    odds *= or;
    varSum += (seg?.moe ?? 3) ** 2;
    parts.push(`${seg?.label ?? t} ${or.toFixed(2)}x`);
  }
  const value = Math.max(1, Math.min(99, Math.round(toPct(odds))));

  return {
    value,
    basis: "estimated",
    derivation: `Start at the national ${base}%, which is odds of ${baseOdds.toFixed(2)} to 1. Each trait multiplies those odds: ${parts.join(
      ", ",
    )}. Combined odds ${odds.toFixed(2)} to 1, which converts back to ${value}%.`,
    samplingMoe: Math.round(Math.sqrt(varSum) * 10) / 10,
    used,
    ignored,
    caution:
      used.length >= 4
        ? "Four or more traits combined. Chapman et al. found descriptions this specific match almost nobody, so read this as a direction, not a population."
        : "Assumes these traits shift the odds independently of one another, which is rarely exactly true. Treat as a direction, not a measurement.",
  };
}
