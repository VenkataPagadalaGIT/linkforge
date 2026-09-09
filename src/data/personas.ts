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

export type Dimension = "gender" | "age" | "income" | "education";

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
      "The interactive tables for the same survey. Used for the income and education breakdowns, each cross-checked against the report before publication. Its JavaScript table extracted unreliably for overall figures, which is why the PDF above is treated as authoritative.",
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
