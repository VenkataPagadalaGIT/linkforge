/**
 * Where people get news, and which channel they prefer.
 *
 * Generated from research_corpus by data/corpus/gen_news_ts.py. Do not
 * hand-edit: re-run the generator instead.
 *
 * Source: Pew Research Center News Platform Fact Sheet, 2025-09-25.
 * AI chatbots appear here for the first time: 9% of US adults get news
 * that way, and 19% of Asian adults do.
 */
export interface NewsChannel {
  id: string;
  label: string;
  /** % of US adults who get news here at least sometimes. */
  overall: number;
  /** % naming it their PREFERRED way to get news. */
  preferred?: number;
  /** segmentId -> %. Absent means that cut is not published. */
  by: Record<string, number>;
}

export const NEWS_CHANNELS: NewsChannel[] = [
  { id: "digital", label: "Digital devices", overall: 86, by: { "18-29": 93, "30-49": 92, "50-64": 85, "65+": 71, "edu-grad": 92, "edu-hs": 79, "edu-some": 88, "men": 88, "party-dem": 87, "party-rep": 86, "race-asian": 91, "race-black": 82, "race-hispanic": 83, "race-white": 87, "women": 84 } },
  { id: "news_sites", label: "News sites or apps", overall: 65, preferred: 21, by: { "18-29": 60, "30-49": 68, "50-64": 71, "65+": 57, "edu-grad": 75, "edu-hs": 55, "edu-some": 65, "men": 66, "party-dem": 68, "party-rep": 64, "race-asian": 70, "race-black": 61, "race-hispanic": 58, "race-white": 67, "women": 64 } },
  { id: "search", label: "Search", overall: 63, preferred: 10, by: { "18-29": 69, "30-49": 68, "50-64": 65, "65+": 50, "edu-grad": 67, "edu-hs": 57, "edu-some": 67, "men": 63, "party-dem": 65, "party-rep": 63, "race-asian": 70, "race-black": 68, "race-hispanic": 59, "race-white": 63, "women": 64 } },
  { id: "television", label: "Television", overall: 64, preferred: 34, by: { "18-29": 47, "30-49": 51, "50-64": 74, "65+": 87, "edu-grad": 58, "edu-hs": 69, "edu-some": 65, "men": 61, "party-dem": 63, "party-rep": 65, "race-asian": 54, "race-black": 75, "race-hispanic": 65, "race-white": 63, "women": 67 } },
  { id: "social_media", label: "Social media", overall: 53, preferred: 14, by: { "18-29": 76, "30-49": 62, "50-64": 46, "65+": 28, "edu-grad": 49, "edu-hs": 54, "edu-some": 57, "men": 50, "party-dem": 52, "party-rep": 55, "race-asian": 62, "race-black": 56, "race-hispanic": 61, "race-white": 50, "women": 56 } },
  { id: "radio", label: "Radio", overall: 44, preferred: 5, by: { "18-29": 33, "30-49": 46, "50-64": 52, "65+": 44, "edu-grad": 44, "edu-hs": 45, "edu-some": 43, "men": 43, "party-dem": 43, "party-rep": 47, "race-asian": 38, "race-black": 46, "race-hispanic": 41, "race-white": 45, "women": 46 } },
  { id: "podcasts", label: "Podcasts", overall: 32, preferred: 6, by: { "18-29": 39, "30-49": 39, "50-64": 29, "65+": 18, "edu-grad": 38, "edu-hs": 27, "edu-some": 31, "men": 35, "party-dem": 32, "party-rep": 33, "race-asian": 36, "race-black": 35, "race-hispanic": 33, "race-white": 30, "women": 28 } },
  { id: "newsletters", label: "Email newsletters", overall: 30, preferred: 3, by: { "18-29": 28, "30-49": 31, "50-64": 32, "65+": 31, "edu-grad": 35, "edu-hs": 25, "edu-some": 31, "men": 29, "party-dem": 34, "party-rep": 29, "race-asian": 40, "race-black": 40, "race-hispanic": 24, "race-white": 29, "women": 31 } },
  { id: "print", label: "Print", overall: 25, preferred: 5, by: { "18-29": 18, "30-49": 22, "50-64": 23, "65+": 37, "edu-grad": 28, "edu-hs": 25, "edu-some": 21, "men": 24, "party-dem": 27, "party-rep": 23, "race-asian": 25, "race-black": 26, "race-hispanic": 20, "race-white": 26, "women": 25 } },
  { id: "ai_chatbots", label: "AI chatbots", overall: 9, by: { "18-29": 13, "30-49": 11, "50-64": 7, "65+": 4, "edu-grad": 9, "edu-hs": 10, "edu-some": 8, "men": 8, "party-dem": 9, "party-rep": 9, "race-asian": 19, "race-black": 13, "race-hispanic": 14, "race-white": 6, "women": 9 } },
];
