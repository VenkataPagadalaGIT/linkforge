/**
 * ufiShowcase.ts: research views the User-First Intelligence guide shows,
 * kept as data so the charts, the markdown edition and the prose read the
 * same numbers. Provenance is recorded per block.
 *
 * Confidentiality rules applied here, at the owner's request:
 *  - AI citations: brand names are masked (Brand A, Brand B, ...). Platforms
 *    that are third-party sources (YouTube, Reddit, Wikipedia, ...) keep their
 *    names, because they are the finding.
 *  - Reviews: the retailer is not named; only theme-level aggregates appear.
 *  - Industry map: category aggregates only; no keyword, no lower-level topic
 *    name, no brand, and no money estimate.
 */
import telecom from "./ufiTelecomMap.json";

/* ── Industry map: a whole industry classified (Omniscite telecom taxonomy) ── */

export const UFI_TELECOM = telecom as {
  industry: string;
  keywords: number;
  monthlyVolume: number;
  topics: number;
  categories: { label: string; keywords: number; monthlyVolume: number; topics: number; nodes: number }[];
};

/* ── AI answers: who gets cited for one topic ──
 * One topic in an online-learning vertical, U.S., all AI platforms in the
 * index, non-brand prompts, share of all cited sources. Read from the owner's
 * AI market share view (computed 2026-09-22 from a commercial AI-citation
 * index) on 2026-10-23. */

export const UFI_AI_CITATIONS = {
  vertical: "online learning",
  market: "U.S.",
  computed: "2026-09-22",
  prompts: 348450,
  answers: 372853,
  trackedBrands: 22,
  brands: [
    { label: "Brand A", share: 6.2 },
    { label: "Brand B", share: 4.2 },
    { label: "Brand C", share: 3.0 },
    { label: "Brand D", share: 3.0 },
    { label: "Brand E", share: 2.0 },
    { label: "Brand F", share: 0.4 },
    { label: "Brand G", share: 0.2 },
    { label: "Brand H", share: 0.2 },
    { label: "Brand I", share: 0.2 },
    { label: "Brand J", share: 0.1 },
    { label: "Brand K", share: 0.1 },
    { label: "Brand L", share: 0.1 },
    { label: "Brand M", share: 0.1 },
    { label: "Brand N", share: 0.1 },
    { label: "Brand O", share: 0.0 },
  ],
  /** The ten most-cited sources outside the tracked brands, in the same denominator. */
  sources: [
    { label: "YouTube", group: "platform", share: 12.4 },
    { label: "Brand A, its other pages", group: "brand", share: 6.0 },
    { label: "Reddit", group: "platform", share: 4.2 },
    { label: "Google's own pages", group: "platform", share: 1.8 },
    { label: "Wikipedia", group: "platform", share: 1.5 },
    { label: "Medium", group: "platform", share: 1.1 },
    { label: "LinkedIn posts and articles", group: "platform", share: 0.9 },
    { label: "Stack Overflow", group: "platform", share: 0.9 },
    { label: "Brand B, its support site", group: "brand", share: 0.7 },
    { label: "Another education site, not tracked", group: "brand", share: 0.5 },
  ],
} as const;

const sum = (xs: readonly number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;
export const UFI_AI_SPLIT = (() => {
  const c = UFI_AI_CITATIONS;
  const brands = sum(c.brands.map((b) => b.share));
  const platforms = sum(c.sources.filter((s) => s.group === "platform").map((s) => s.share));
  const brandOwned = sum(c.sources.filter((s) => s.group === "brand").map((s) => s.share));
  const rest = Math.round((100 - brands - platforms - brandOwned) * 10) / 10;
  const youtube = c.sources[0].share;
  const leader = c.brands[0].share;
  return { brands, platforms, brandOwned, rest, youtube, leader };
})();

/* ── Reviews: what customers praise and what they complain about ──
 * Google Business Profile reviews of the stores of one U.S. telecom retailer
 * (name withheld). Themes assigned by a classifier; a review can carry
 * several. Read from the owner's review-theme view on 2026-10-23. Shares are
 * of the reviews with text, computed below from the mention counts. */

export const UFI_REVIEWS = {
  total: 47485,
  withText: 37193,
  topics: [
    { label: "Customer service", mentions: 14465, rating: 4.18 },
    { label: "Helpfulness", mentions: 12519, rating: 4.61 },
    { label: "Store experience", mentions: 11688, rating: 3.83 },
    { label: "Phone or device", mentions: 10786, rating: 3.9 },
    { label: "Staff quality", mentions: 6818, rating: 3.63 },
    { label: "Friendliness", mentions: 6504, rating: 4.66 },
    { label: "Plan or account", mentions: 6078, rating: 3.78 },
    { label: "Online or app", mentions: 4040, rating: 3.61 },
    { label: "Billing and payments", mentions: 3933, rating: 3.16 },
    { label: "Recommendation", mentions: 3809, rating: 4.51 },
    { label: "Promotions", mentions: 3700, rating: 3.98 },
    { label: "Activation", mentions: 3686, rating: 4.2 },
  ],
  praise: [
    { label: "Helpfulness", mentions: 12519, rating: 4.61 },
    { label: "Customer service", mentions: 9914, rating: 4.29 },
    { label: "Friendly staff", mentions: 5179, rating: 4.66 },
    { label: "Knowledgeable", mentions: 3872, rating: 4.6 },
    { label: "Highly recommended", mentions: 3625, rating: 4.56 },
    { label: "Fast service", mentions: 3069, rating: 4.73 },
    { label: "Patient staff", mentions: 3065, rating: 4.89 },
    { label: "Professional", mentions: 2588, rating: 4.3 },
    { label: "Problem resolved", mentions: 1621, rating: 4.42 },
    { label: "Good experience", mentions: 1244, rating: 4.83 },
  ],
  complaints: [
    { label: "Rude staff", mentions: 1619, rating: 1.91 },
    { label: "Long wait", mentions: 1037, rating: 2.39 },
    { label: "Poor service", mentions: 493, rating: 1.17 },
    { label: "Misleading information", mentions: 385, rating: 1.47 },
    { label: "Pushy sales", mentions: 355, rating: 3.47 },
    { label: "Billing issues", mentions: 255, rating: 2.74 },
    { label: "No resolution", mentions: 148, rating: 2.01 },
    { label: "Store issues", mentions: 32, rating: 1.66 },
    { label: "Poor communication", mentions: 31, rating: 1.19 },
    { label: "Coverage issues", mentions: 17, rating: 2 },
  ],
} as const;

export const reviewShare = (mentions: number) => Math.round((mentions / UFI_REVIEWS.withText) * 1000) / 10;

/* ── Audiences move: two documented migrations ── */

export const UFI_MIGRATION = {
  india: {
    source: "comScore, 25 August 2010: India, age 15+, home and work, monthly unique visitors in millions",
    from: "July 2009",
    to: "July 2010",
    facebook: { from: 7.5, to: 20.9 },
    orkut: { from: 17.1, to: 19.9 },
  },
  teens: {
    source: "Pew Research Center, Teens, Social Media and Technology 2024: share of U.S. teens (13 to 17) who use each site",
    from: "2014-15",
    to: "2024",
    facebook: { from: 71, to: 32 },
    x: { from: 33, to: 17 },
  },
} as const;

/* ── AI summaries and clicks (Pew Research Center, July 2025) ── */

export const UFI_AI_SUMMARY = {
  searchesWithSummary: 18,
  clicksWithSummary: 8,
  clicksWithout: 15,
  clicksInsideSummary: 1,
  adults: 900,
  month: "March 2025",
} as const;
