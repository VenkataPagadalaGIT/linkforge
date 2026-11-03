/**
 * Ad-platform composition figures, kept apart from measured penetration.
 *
 * These come from advertising dashboards and press material, which count
 * reachable accounts rather than people and cover the world rather than the
 * US. They are here because they are the numbers everyone finds, and because
 * putting them beside a survey is the only way to show they answer a different
 * question. They are never blended with the measured figures.
 */

export interface CompositionSet {
  platform: string;
  /** Where the composition figures were reported. */
  reportedBy: string;
  reportedByUrl: string;
  /** What that page in turn cited. */
  originalSources: { label: string; url: string }[];
  population: string;
  bands: { label: string; composition: number }[];
  /** Figures that are not age composition but belong to the same source. */
  headline: { claim: string; value: string; source: string; url: string }[];
}

export const SNAPCHAT_COMPOSITION: CompositionSet = {
  platform: "Snapchat",
  reportedBy: "Sprout Social, Snapchat statistics for 2026",
  reportedByUrl: "https://sproutsocial.com/insights/snapchat-statistics/",
  originalSources: [
    { label: "Snap Inc. Q1 2026 investor results", url: "https://investor.snap.com/" },
    { label: "Snapchat for Business, audience insights", url: "https://forbusiness.snapchat.com/" },
    { label: "Snap Newsroom", url: "https://newsroom.snap.com/" },
    { label: "Statista, social platform gender distribution", url: "https://www.statista.com/statistics/274828/gender-distribution-of-active-social-media-users-worldwide-by-platform/" },
    { label: "World Population Review, Snapchat users by country", url: "https://worldpopulationreview.com/" },
    { label: "DataReportal", url: "https://datareportal.com/" },
  ],
  population: "Global advertising audience, all ages",
  bands: [
    { label: "Under 18", composition: 18.3 },
    { label: "18 to 24", composition: 35.4 },
    { label: "25 to 34", composition: 25.2 },
  ],
  headline: [
    { claim: "Daily active users", value: "483 million", source: "Snap Q1 2026 results", url: "https://investor.snap.com/" },
    { claim: "Monthly active users", value: "956 million", source: "Snap Q1 2026 results", url: "https://investor.snap.com/" },
    { claim: "Year-over-year user growth", value: "5%", source: "Snap Q1 2026 results", url: "https://investor.snap.com/" },
    { claim: "Reach among 13 to 24 year olds, 25+ countries", value: "90%", source: "Snapchat for Business", url: "https://forbusiness.snapchat.com/" },
    { claim: "Average time in app per day", value: "30 minutes", source: "Snapchat for Business", url: "https://forbusiness.snapchat.com/" },
    { claim: "Snaps sent per day", value: "5.5 billion", source: "Snap Newsroom", url: "https://newsroom.snap.com/" },
    { claim: "Q1 2026 revenue", value: "$1.5 billion, up 12%", source: "Snap Q1 2026 results", url: "https://investor.snap.com/" },
    { claim: "Snapchat+ subscribers", value: "25 million", source: "Snap Newsroom", url: "https://newsroom.snap.com/" },
    { claim: "Largest national market", value: "India, 108.8 million", source: "World Population Review", url: "https://worldpopulationreview.com/" },
  ],
};

export const COMPOSITION_SETS: Record<string, CompositionSet> = {
  snapchat: SNAPCHAT_COMPOSITION,
};
