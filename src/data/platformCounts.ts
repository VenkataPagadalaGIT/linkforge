/**
 * Reported user counts, and what they are actually counting.
 *
 * "How many people use X" is the query where fabrication is worst, because the
 * honest answer needs two things nobody supplies together: a rate from a survey
 * and a population to multiply it by.
 *
 * What the platforms publish instead is reach. Sprout's YouTube page states
 * 2.58 billion monthly active users, and states that YouTube's potential ad
 * reach totals 2.58 billion. Same number, two labels. X's page reports an ad
 * reach of 557 million while noting Statista's user estimate of 449.5 million,
 * a gap of a hundred million between two things being called the same word.
 *
 * So the counts here are labelled by what they measure, and no US count is
 * derived from them. The US answer on these pages is a rate, measured, with
 * its margin of error, and the page says why the count is missing rather than
 * inventing one.
 */

export interface PlatformCount {
  platform: string;
  /** As reported, verbatim in substance. */
  value: string;
  /** monthly active, daily active, or ad reach. They are not the same. */
  measures: "monthly active" | "daily active" | "ad reach";
  scope: "global" | "us";
  source: string;
  sourceUrl: string;
  /** Something true and awkward about this particular number. */
  caveat?: string;
}

export const PLATFORM_COUNTS: Record<string, PlatformCount[]> = {
  facebook: [
    { platform: "Facebook", value: "3.07 billion", measures: "monthly active", scope: "global",
      source: "Meta quarterly results, via Sprout Social", sourceUrl: "https://sproutsocial.com/insights/facebook-stats/" },
  ],
  youtube: [
    { platform: "YouTube", value: "2.58 billion", measures: "monthly active", scope: "global",
      source: "DataReportal Digital 2026, via Sprout Social", sourceUrl: "https://sproutsocial.com/insights/youtube-stats/",
      caveat: "The same page gives 2.58 billion as YouTube's potential ad reach. One number, two labels: this is a count of accounts an advert can be shown to, not a count of people." },
  ],
  tiktok: [
    { platform: "TikTok", value: "1.99 billion", measures: "monthly active", scope: "global",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/tiktok-stats/" },
  ],
  instagram: [
    { platform: "Instagram", value: "3 billion", measures: "monthly active", scope: "global",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/instagram-stats/",
      caveat: "The same page puts the US at roughly 182 million users, sourced to DataReportal, which reports advertising reach." },
  ],
  snapchat: [
    { platform: "Snapchat", value: "956 million", measures: "monthly active", scope: "global",
      source: "Snap Q1 2026 investor results", sourceUrl: "https://investor.snap.com/" },
    { platform: "Snapchat", value: "483 million", measures: "daily active", scope: "global",
      source: "Snap Q1 2026 investor results", sourceUrl: "https://investor.snap.com/" },
  ],
  x: [
    { platform: "X", value: "251 million", measures: "daily active", scope: "global",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/twitter-statistics/",
      caveat: "The same page reports an ad reach of 557 million while citing Statista's user estimate of 449.5 million. A hundred-million gap between two figures both described as users." },
  ],
  reddit: [
    { platform: "Reddit", value: "194.8 million", measures: "monthly active", scope: "us",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/reddit-statistics/",
      caveat: "Reported as the US market size. It is larger than the US adult population, which is the tell that it counts accounts and visits rather than people." },
  ],
  pinterest: [
    { platform: "Pinterest", value: "619 million", measures: "monthly active", scope: "global",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/pinterest-statistics/" },
  ],
  threads: [
    { platform: "Threads", value: "400 million", measures: "monthly active", scope: "global",
      source: "TechCrunch, via Sprout Social", sourceUrl: "https://sproutsocial.com/insights/threads-statistics/" },
    { platform: "Threads", value: "150 million", measures: "daily active", scope: "global",
      source: "Sprout Social", sourceUrl: "https://sproutsocial.com/insights/threads-statistics/" },
  ],
};

export const countsFor = (id: string) => PLATFORM_COUNTS[id] ?? [];

export const MEASURES_META: Record<PlatformCount["measures"], string> = {
  "monthly active": "An account that opened the app at least once in a month. One person with two accounts counts twice.",
  "daily active": "An account that opened the app on an average day. Narrower than monthly, and still accounts rather than people.",
  "ad reach": "What the advertising tool says it can show an advert to. The platform's own sales figure.",
};
