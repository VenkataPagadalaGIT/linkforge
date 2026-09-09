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
    published: "2025",
    limitation:
      "Reports whether someone ever uses a platform. It does not measure time spent, frequency, or what they do there.",
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

  { id: "tt-all", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "All US adults", value: "32%" },
  { id: "tt-18", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 18-29", value: "63%" },
  { id: "tt-30", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 30-49", value: "44%" },
  { id: "tt-50", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 50-64", value: "30%" },
  { id: "tt-65", studyId: "pew-social-2025", metric: "Ever use TikTok", segment: "Ages 65+", value: "12%" },

  { id: "sc-all", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "All US adults", value: "26%" },
  { id: "sc-18", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 18-29", value: "58%" },
  { id: "sc-30", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 30-49", value: "31%" },
  { id: "sc-50", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 50-64", value: "13%" },
  { id: "sc-65", studyId: "pew-social-2025", metric: "Ever use Snapchat", segment: "Ages 65+", value: "4%" },

  { id: "rd-all", studyId: "pew-social-2025", metric: "Ever use Reddit", segment: "All US adults", value: "24%" },
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
  "Pew gender splits by platform (Men/Women columns). Two independent reads of the fact sheet returned figures that do not reconcile against the published overall: TikTok showed men 30% / women 42% against an overall of 32%, which is arithmetically impossible for a US adult sample. The tabbed table did not extract reliably. Gender data is therefore excluded until it can be read from the source by hand or from Pew's downloadable dataset.",
  "Pew WhatsApp overall usage. Returned 25% on one read and 21% on another. Excluded entirely until resolved.",
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
