/**
 * The research corpus, generated.
 *
 * Produced by data/corpus/gen_all_ts.py from the research_corpus
 * database. Do not hand-edit: re-run the generator. Every figure here
 * traces to a document row that records the URL it came from, when it
 * was retrieved and how.
 */

export interface CorpusSegment {
  slug: string;
  dimension: string;
  label: string;
  n: number | null;
  moe: number | null;
  /** The source's own category definition, where a bare label loses meaning. */
  definition: string;
}
export interface CorpusDocument {
  slug: string;
  title: string;
  url: string;
  published: string | null;
  sampleSize: number | null;
  moe: number | null;
  population: string | null;
  /** When the data was collected, which is older than when it was published. */
  fieldStart: string | null;
  fieldEnd: string | null;
}
export interface CorpusMetric {
  slug: string;
  label: string;
  definition: string;
  period: string;
  document: string;
  url: string;
  /** subject ('' when the metric stands alone) -> segment ('' = national) -> % */
  values: Record<string, Record<string, number>>;
}

export const CORPUS_SEGMENTS: CorpusSegment[] = [
  { slug: "men", dimension: "gender", label: "Men", n: 2194, moe: 3.00, definition: "" },
  { slug: "women", dimension: "gender", label: "Women", n: 2758, moe: 2.50, definition: "" },
  { slug: "18-29", dimension: "age", label: "18 to 29", n: 480, moe: 5.60, definition: "" },
  { slug: "30-49", dimension: "age", label: "30 to 49", n: 1399, moe: 3.40, definition: "" },
  { slug: "50-64", dimension: "age", label: "50 to 64", n: 1274, moe: 3.60, definition: "" },
  { slug: "65+", dimension: "age", label: "65 and over", n: 1813, moe: 3.00, definition: "" },
  { slug: "18-49", dimension: "age", label: "18 to 49", n: null, moe: null, definition: "" },
  { slug: "50plus", dimension: "age", label: "50 and over", n: null, moe: null, definition: "" },
  { slug: "race-white", dimension: "race", label: "White", n: 3304, moe: 2.30, definition: "Adults who report being only one race, White, and are not Hispanic. Pew's own category, quoted rather than renamed." },
  { slug: "race-black", dimension: "race", label: "Black", n: 512, moe: 6.00, definition: "Adults who report being only one race, Black, and are not Hispanic. Pew's own category and capitalisation." },
  { slug: "race-hispanic", dimension: "race", label: "Hispanic", n: 757, moe: 5.00, definition: "Hispanic adults of any race, so this group overlaps none of the others by construction and is not a residual." },
  { slug: "race-asian", dimension: "race", label: "Asian", n: 211, moe: 8.90, definition: "Adults who report being only one race, Asian, and are not Hispanic. Pew states these estimates represent English speakers only, so non-English-speaking Asian adults are absent from this column." },
  { slug: "inc-lt30", dimension: "income", label: "Under $30K", n: 939, moe: 4.50, definition: "" },
  { slug: "inc-30-70", dimension: "income", label: "$30K to $70K", n: 1533, moe: 3.60, definition: "" },
  { slug: "inc-70-100", dimension: "income", label: "$70K to $100K", n: 692, moe: 5.10, definition: "" },
  { slug: "inc-100", dimension: "income", label: "$100K and over", n: 1629, moe: 3.10, definition: "" },
  { slug: "inc-30-50-legacy", dimension: "income", label: "$30K to $50K (pre-2023 bands)", n: null, moe: null, definition: "" },
  { slug: "inc-50-75-legacy", dimension: "income", label: "$50K to $75K (pre-2023 bands)", n: null, moe: null, definition: "" },
  { slug: "inc-75-legacy", dimension: "income", label: "$75K and over (pre-2023 bands)", n: null, moe: null, definition: "" },
  { slug: "edu-hs", dimension: "education", label: "High school or less", n: 1175, moe: 3.80, definition: "" },
  { slug: "edu-some", dimension: "education", label: "Some college", n: 1587, moe: 3.40, definition: "" },
  { slug: "edu-grad", dimension: "education", label: "College graduate", n: 2215, moe: 2.70, definition: "" },
  { slug: "edu-lths-legacy", dimension: "education", label: "Less than high school (legacy band)", n: null, moe: null, definition: "" },
  { slug: "edu-hsgrad-legacy", dimension: "education", label: "High school graduate (legacy band)", n: null, moe: null, definition: "" },
  { slug: "urban", dimension: "community", label: "Urban", n: 1394, moe: 3.60, definition: "Self-described community type, not a census geography." },
  { slug: "suburban", dimension: "community", label: "Suburban", n: 2334, moe: 2.80, definition: "Self-described community type, not a census geography." },
  { slug: "rural", dimension: "community", label: "Rural", n: 1235, moe: 3.80, definition: "Self-described community type, not a census geography." },
  { slug: "party-rep", dimension: "party", label: "Rep / lean Rep", n: 2234, moe: 2.80, definition: "Republicans and independents who lean Republican." },
  { slug: "party-dem", dimension: "party", label: "Dem / lean Dem", n: 2446, moe: 2.80, definition: "Democrats and independents who lean Democratic." },
];

export const CORPUS_DOCUMENTS: CorpusDocument[] = [
  { slug: "pew-internet-broadband-2025", title: "Internet, Broadband Fact Sheet", url: "https://www.pewresearch.org/internet/fact-sheet/internet-broadband/", published: "2025-11-20", sampleSize: 5022, moe: 1.90, population: "US adults", fieldStart: "2025-02-05", fieldEnd: "2025-06-18" },
  { slug: "pew-mobile-2025", title: "Mobile Fact Sheet", url: "https://www.pewresearch.org/internet/fact-sheet/mobile/", published: "2025-11-20", sampleSize: 5022, moe: 1.90, population: "US adults", fieldStart: "2025-02-05", fieldEnd: "2025-06-18" },
  { slug: "pew-news-influencers-2025", title: "News Influencers Fact Sheet", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", published: "2025-11-04", sampleSize: null, moe: null, population: "US adults", fieldStart: null, fieldEnd: null },
  { slug: "pew-news-platform-2025", title: "News Platform Fact Sheet", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", published: "2025-09-25", sampleSize: null, moe: null, population: "US adults", fieldStart: null, fieldEnd: null },
  { slug: "pew-social-media-2025", title: "Social Media Fact Sheet", url: "https://www.pewresearch.org/internet/fact-sheet/social-media/", published: "2025-11-20", sampleSize: 5022, moe: 1.90, population: "US adults", fieldStart: "2025-02-05", fieldEnd: "2025-06-18" },
  { slug: "pew-social-news-2025", title: "Social Media and News Fact Sheet", url: "https://www.pewresearch.org/journalism/fact-sheet/social-media-and-news-fact-sheet/", published: "2025-09-25", sampleSize: null, moe: null, population: "US adults", fieldStart: null, fieldEnd: null },
  { slug: "usafacts-context-2026", title: "USAFacts national context", url: "https://usafacts.org", published: null, sampleSize: null, moe: null, population: "United States", fieldStart: null, fieldEnd: null },
];

export const CORPUS_METRICS: CorpusMetric[] = [
  { slug: "ever_use", label: "Ever uses the platform", definition: "% of the group who say they ever use the named platform.", period: "2021", document: "pew-social-media-2025", url: "https://www.pewresearch.org/internet/fact-sheet/social-media/", values: {"nextdoor":{"":13},"pinterest":{"":36},"linkedin":{"":32},"bereal":{"":3},"youtube":{"":84,"18-29":95,"30-49":92,"50-64":85,"65+":64,"men":86,"women":83,"race-white":82,"race-black":85,"race-hispanic":88,"race-asian":92,"inc-lt30":77,"inc-30-70":84,"inc-70-100":87,"inc-100":89,"edu-hs":78,"edu-some":87,"edu-grad":89,"urban":85,"suburban":87,"rural":79,"party-rep":84,"party-dem":85},"facebook":{"":71,"18-29":68,"30-49":80,"50-64":74,"65+":57,"men":63,"women":78,"race-white":70,"race-black":74,"race-hispanic":74,"race-asian":62,"inc-lt30":71,"inc-30-70":72,"inc-70-100":72,"inc-100":71,"edu-hs":69,"edu-some":73,"edu-grad":71,"urban":71,"suburban":71,"rural":71,"party-rep":72,"party-dem":70},"instagram":{"":50,"18-29":80,"30-49":62,"50-64":40,"65+":19,"men":44,"women":55,"race-white":45,"race-black":54,"race-hispanic":62,"race-asian":58,"inc-lt30":41,"inc-30-70":46,"inc-70-100":54,"inc-100":60,"edu-hs":41,"edu-some":53,"edu-grad":58,"urban":55,"suburban":54,"rural":37,"party-rep":49,"party-dem":53},"tiktok":{"":37,"18-29":63,"30-49":44,"50-64":30,"65+":12,"men":30,"women":42,"race-white":28,"race-black":53,"race-hispanic":57,"race-asian":31,"inc-lt30":42,"inc-30-70":40,"inc-70-100":39,"inc-100":30,"edu-hs":40,"edu-some":42,"edu-grad":29,"urban":42,"suburban":37,"rural":32,"party-rep":33,"party-dem":40},"whatsapp":{"":32,"18-29":37,"30-49":40,"50-64":30,"65+":20,"men":30,"women":34,"race-white":23,"race-black":37,"race-hispanic":56,"race-asian":54,"inc-lt30":28,"inc-30-70":31,"inc-70-100":28,"inc-100":39,"edu-hs":27,"edu-some":29,"edu-grad":41,"urban":44,"suburban":34,"rural":17,"party-rep":25,"party-dem":38},"snapchat":{"":25,"18-29":58,"30-49":31,"50-64":13,"65+":4,"men":22,"women":28,"race-white":24,"race-black":29,"race-hispanic":31,"race-asian":19,"inc-lt30":26,"inc-30-70":26,"inc-70-100":31,"inc-100":23,"edu-hs":24,"edu-some":29,"edu-grad":24,"urban":25,"suburban":26,"rural":23,"party-rep":26,"party-dem":25},"x":{"":21,"18-29":33,"30-49":25,"50-64":16,"65+":10,"men":25,"women":16,"race-white":18,"race-black":26,"race-hispanic":23,"race-asian":32,"inc-lt30":16,"inc-30-70":19,"inc-70-100":26,"inc-100":25,"edu-hs":16,"edu-some":23,"edu-grad":24,"urban":23,"suburban":22,"rural":17,"party-rep":24,"party-dem":19},"reddit":{"":26,"18-29":48,"30-49":35,"50-64":16,"65+":6,"men":29,"women":23,"race-white":27,"race-black":18,"race-hispanic":22,"race-asian":44,"inc-lt30":17,"inc-30-70":22,"inc-70-100":29,"inc-100":37,"edu-hs":15,"edu-some":28,"edu-grad":37,"urban":29,"suburban":30,"rural":18,"party-rep":22,"party-dem":32},"threads":{"":8,"18-29":15,"30-49":10,"50-64":6,"65+":3,"men":8,"women":9,"race-white":6,"race-black":18,"race-hispanic":10,"race-asian":12,"inc-lt30":8,"inc-30-70":9,"inc-70-100":10,"inc-100":7,"edu-hs":7,"edu-some":9,"edu-grad":9,"urban":11,"suburban":9,"rural":4,"party-rep":6,"party-dem":10},"bluesky":{"":4,"18-29":6,"30-49":5,"50-64":3,"65+":2,"men":4,"women":3,"race-white":4,"race-black":2,"race-hispanic":4,"race-asian":3,"inc-lt30":2,"inc-30-70":4,"inc-70-100":3,"inc-100":5,"edu-hs":2,"edu-some":4,"edu-grad":6,"urban":4,"suburban":5,"rural":2,"party-rep":1,"party-dem":8},"truthsocial":{"":3,"18-29":1,"30-49":3,"50-64":5,"65+":4,"men":4,"women":3,"race-white":4,"race-black":2,"race-hispanic":2,"race-asian":6,"inc-lt30":3,"inc-30-70":3,"inc-70-100":3,"inc-100":4,"edu-hs":3,"edu-some":5,"edu-grad":3,"urban":2,"suburban":4,"rural":4,"party-rep":6,"party-dem":1}} },
  { slug: "home_broadband", label: "Subscribes to home broadband", definition: "% of the group who say they have a home broadband subscription.", period: "2025", document: "pew-internet-broadband-2025", url: "https://www.pewresearch.org/internet/fact-sheet/internet-broadband/", values: {"":{"":78,"18-29":71,"30-49":87,"50-64":79,"65+":70,"race-white":81,"race-black":71,"race-hispanic":68,"race-asian":86,"men":79,"women":78,"inc-lt30":54,"inc-30-70":75,"inc-70-100":88,"inc-100":94,"edu-hs":62,"edu-some":81,"edu-grad":92,"urban":75,"suburban":84,"rural":71}} },
  { slug: "influencer_affiliation", label: "Believed affiliation of news influencers", definition: "% giving this answer about whether news influencers work for a news organisation.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"independent-and-not-connected-to-a-news-organization":{"":52},"connected-to-a-news-organization":{"":10},"about-an-even-mix":{"":17},"not-sure":{"":21}} },
  { slug: "influencer_reason_major", label: "Major reason for following news influencers", definition: "% naming this as a MAJOR reason they get news from influencers.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"help-understanding-current-events-and-civic-issues":{"":54,"18-49":54,"50plus":54},"quick-reporting-on-breaking-news":{"":54,"18-49":52,"50plus":58},"a-feeling-of-authenticity-news-influencers-seeming-to-be-the":{"":49,"18-49":45,"50plus":58},"different-information-from-other-sources":{"":46,"18-49":44,"50plus":52},"matching-opinions-or-values":{"":39,"18-49":35,"50plus":52},"entertainment":{"":37,"18-49":40,"50plus":30},"a-feeling-of-connection-with-news-influencers":{"":23,"18-49":22,"50plus":26}} },
  { slug: "influencer_reason_minor", label: "Minor reason for following news influencers", definition: "% naming this as a minor reason.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"help-understanding-current-events-and-civic-issues":{"":34},"quick-reporting-on-breaking-news":{"":31},"a-feeling-of-authenticity-news-influencers-seeming-to-be-the":{"":35},"different-information-from-other-sources":{"":37},"matching-opinions-or-values":{"":41},"entertainment":{"":43},"a-feeling-of-connection-with-news-influencers":{"":39}} },
  { slug: "influencer_reason_none", label: "Not a reason for following news influencers", definition: "% saying this is not a reason.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"help-understanding-current-events-and-civic-issues":{"":12},"quick-reporting-on-breaking-news":{"":15},"a-feeling-of-authenticity-news-influencers-seeming-to-be-the":{"":16},"different-information-from-other-sources":{"":17},"matching-opinions-or-values":{"":20},"entertainment":{"":20},"a-feeling-of-connection-with-news-influencers":{"":37}} },
  { slug: "internet_use", label: "Uses the internet", definition: "% of the group who say they use the internet.", period: "2025", document: "pew-internet-broadband-2025", url: "https://www.pewresearch.org/internet/fact-sheet/internet-broadband/", values: {"":{"":96,"18-29":99,"30-49":99,"50-64":96,"65+":90,"race-white":96,"race-black":94,"race-hispanic":97,"race-asian":99,"men":96,"women":97,"inc-lt30":91,"inc-30-70":96,"inc-70-100":98,"inc-100":99,"edu-hs":93,"edu-some":98,"edu-grad":99,"urban":96,"suburban":98,"rural":94}} },
  { slug: "news_freq_never", label: "Never gets news here", definition: "% who say they never get news from the named channel.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"digital":{"":7},"television":{"":14},"radio":{"":27},"print":{"":40},"news_sites":{"":17},"search":{"":15},"social_media":{"":27},"podcasts":{"":46},"newsletters":{"":43},"ai_chatbots":{"":75}} },
  { slug: "news_freq_often", label: "Gets news here often", definition: "% who say they often get news from the named channel.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"digital":{"":56},"television":{"":32},"radio":{"":11},"print":{"":7},"news_sites":{"":27},"search":{"":19},"social_media":{"":21},"podcasts":{"":10},"newsletters":{"":6},"ai_chatbots":{"":2}} },
  { slug: "news_freq_rarely", label: "Gets news here rarely", definition: "% who say they rarely get news from the named channel.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"digital":{"":7},"television":{"":22},"radio":{"":28},"print":{"":34},"news_sites":{"":18},"search":{"":21},"social_media":{"":19},"podcasts":{"":22},"newsletters":{"":26},"ai_chatbots":{"":16}} },
  { slug: "news_freq_sometimes", label: "Gets news here sometimes", definition: "% who say they sometimes get news from the named channel.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"digital":{"":30},"television":{"":31},"radio":{"":33},"print":{"":18},"news_sites":{"":37},"search":{"":44},"social_media":{"":32},"podcasts":{"":22},"newsletters":{"":24},"ai_chatbots":{"":7}} },
  { slug: "news_influencer_seek", label: "Seeks out news influencers", definition: "% of those who get news from influencers who say they were looking for it, rather than coming across it.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"":{"":31,"18-49":28,"50plus":40,"men":33,"women":28,"18-29":23,"30-49":32,"50-64":38,"65+":43,"edu-hs":29,"edu-some":31,"edu-grad":34,"race-white":33,"race-black":19,"race-hispanic":33,"race-asian":28,"party-rep":33,"party-dem":30}} },
  { slug: "news_influencer_stumble", label: "Comes across news influencers", definition: "% of those who get news from influencers who say they happen to come across it.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"":{"":69,"18-49":72,"50plus":60,"men":67,"women":72,"18-29":77,"30-49":68,"50-64":62,"65+":57,"edu-hs":71,"edu-some":69,"edu-grad":66,"race-white":67,"race-black":81,"race-hispanic":67,"race-asian":72,"party-rep":66,"party-dem":70}} },
  { slug: "news_influencer_use", label: "Gets news from news influencers", definition: "% who regularly get news from influencers on social media.", period: "2025", document: "pew-news-influencers-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-influencers-fact-sheet/", values: {"":{"":21,"18-29":38,"30-49":23,"50-64":16,"65+":8,"men":20,"women":22,"edu-hs":21,"edu-some":23,"edu-grad":18,"race-white":17,"race-black":28,"race-hispanic":28,"race-asian":27,"party-rep":21,"party-dem":22}} },
  { slug: "news_platform_preference", label: "Prefers this platform for news", definition: "% naming the platform as their preferred way to get news.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"television":{"":34,"men":32,"women":37,"18-29":12,"30-49":23,"50-64":43,"65+":60,"edu-hs":46,"edu-some":34,"edu-grad":21,"race-white":35,"race-black":42,"race-hispanic":33,"race-asian":24,"party-rep":35,"party-dem":33},"radio":{"":5,"men":5,"women":6,"18-29":5,"30-49":6,"50-64":7,"65+":4,"edu-hs":4,"edu-some":5,"edu-grad":7,"race-white":5,"race-black":2,"race-hispanic":6,"race-asian":4,"party-rep":5,"party-dem":5},"print":{"":5,"men":4,"women":6,"18-29":5,"30-49":4,"50-64":4,"65+":8,"edu-hs":5,"edu-some":4,"edu-grad":6,"race-white":6,"race-black":3,"race-hispanic":4,"race-asian":4,"party-rep":4,"party-dem":6},"news_sites":{"":21,"men":23,"women":19,"18-29":19,"30-49":24,"50-64":23,"65+":16,"edu-hs":13,"edu-some":20,"edu-grad":31,"race-white":23,"race-black":15,"race-hispanic":17,"race-asian":26,"party-rep":19,"party-dem":24},"social_media":{"":14,"men":15,"women":13,"18-29":31,"30-49":16,"50-64":6,"65+":3,"edu-hs":15,"edu-some":16,"edu-grad":11,"race-white":12,"race-black":15,"race-hispanic":20,"race-asian":18,"party-rep":16,"party-dem":13},"search":{"":10,"men":10,"women":10,"18-29":13,"30-49":12,"50-64":10,"65+":4,"edu-hs":8,"edu-some":11,"edu-grad":10,"race-white":9,"race-black":11,"race-hispanic":10,"race-asian":12,"party-rep":10,"party-dem":9},"podcasts":{"":6,"men":8,"women":5,"18-29":8,"30-49":9,"50-64":5,"65+":2,"edu-hs":5,"edu-some":6,"edu-grad":9,"race-white":7,"race-black":7,"race-hispanic":3,"race-asian":5,"party-rep":8,"party-dem":5},"newsletters":{"":3,"men":2,"women":3,"18-29":4,"30-49":3,"50-64":2,"65+":2,"edu-hs":2,"edu-some":2,"edu-grad":4,"race-white":2,"race-black":1,"race-hispanic":3,"race-asian":6,"party-rep":3,"party-dem":3},"ai_chatbots":{"18-29":1,"30-49":1,"edu-hs":1,"race-black":1,"race-hispanic":1}} },
  { slug: "news_platform_use", label: "Gets news on this platform", definition: "% who say they get news at least sometimes from the named platform.", period: "2025", document: "pew-news-platform-2025", url: "https://www.pewresearch.org/journalism/fact-sheet/news-platform-fact-sheet/", values: {"television":{"":64,"men":61,"women":67,"18-29":47,"30-49":51,"50-64":74,"65+":87,"edu-hs":69,"edu-some":65,"edu-grad":58,"race-white":63,"race-black":75,"race-hispanic":65,"race-asian":54,"party-rep":65,"party-dem":63},"radio":{"":44,"men":43,"women":46,"18-29":33,"30-49":46,"50-64":52,"65+":44,"edu-hs":45,"edu-some":43,"edu-grad":44,"race-white":45,"race-black":46,"race-hispanic":41,"race-asian":38,"party-rep":47,"party-dem":43},"print":{"":25,"men":24,"women":25,"18-29":18,"30-49":22,"50-64":23,"65+":37,"edu-hs":25,"edu-some":21,"edu-grad":28,"race-white":26,"race-black":26,"race-hispanic":20,"race-asian":25,"party-rep":23,"party-dem":27},"digital":{"":86,"men":88,"women":84,"18-29":93,"30-49":92,"50-64":85,"65+":71,"edu-hs":79,"edu-some":88,"edu-grad":92,"race-white":87,"race-black":82,"race-hispanic":83,"race-asian":91,"party-rep":86,"party-dem":87},"news_sites":{"":65,"men":66,"women":64,"18-29":60,"30-49":68,"50-64":71,"65+":57,"edu-hs":55,"edu-some":65,"edu-grad":75,"race-white":67,"race-black":61,"race-hispanic":58,"race-asian":70,"party-rep":64,"party-dem":68},"social_media":{"":53,"men":50,"women":56,"18-29":76,"30-49":62,"50-64":46,"65+":28,"edu-hs":54,"edu-some":57,"edu-grad":49,"race-white":50,"race-black":56,"race-hispanic":61,"race-asian":62,"party-rep":55,"party-dem":52},"search":{"":63,"men":63,"women":64,"18-29":69,"30-49":68,"50-64":65,"65+":50,"edu-hs":57,"edu-some":67,"edu-grad":67,"race-white":63,"race-black":68,"race-hispanic":59,"race-asian":70,"party-rep":63,"party-dem":65},"podcasts":{"":32,"men":35,"women":28,"18-29":39,"30-49":39,"50-64":29,"65+":18,"edu-hs":27,"edu-some":31,"edu-grad":38,"race-white":30,"race-black":35,"race-hispanic":33,"race-asian":36,"party-rep":33,"party-dem":32},"newsletters":{"":30,"men":29,"women":31,"18-29":28,"30-49":31,"50-64":32,"65+":31,"edu-hs":25,"edu-some":31,"edu-grad":35,"race-white":29,"race-black":40,"race-hispanic":24,"race-asian":40,"party-rep":29,"party-dem":34},"ai_chatbots":{"":9,"men":8,"women":9,"18-29":13,"30-49":11,"50-64":7,"65+":4,"edu-hs":10,"edu-some":8,"edu-grad":9,"race-white":6,"race-black":13,"race-hispanic":14,"race-asian":19,"party-rep":9,"party-dem":9}} },
  { slug: "owns_cellphone", label: "Owns a cellphone", definition: "% who own a cellphone of any kind.", period: "2025", document: "pew-mobile-2025", url: "https://www.pewresearch.org/internet/fact-sheet/mobile/", values: {"":{"":98,"18-29":99,"30-49":99,"50-64":98,"65+":95,"men":97,"women":98,"race-white":98,"race-black":98,"race-hispanic":98,"race-asian":98,"inc-lt30":95,"inc-30-70":98,"inc-70-100":99,"inc-100":99,"edu-hs":97,"edu-some":98,"edu-grad":99,"urban":97,"suburban":99,"rural":97,"party-rep":98,"party-dem":98}} },
  { slug: "owns_featurephone", label: "Owns a cellphone but not a smartphone", definition: "% who own a cellphone that is not a smartphone.", period: "2025", document: "pew-mobile-2025", url: "https://www.pewresearch.org/internet/fact-sheet/mobile/", values: {"":{"18-29":2,"30-49":3,"50-64":7,"65+":16,"men":7,"women":7,"race-white":7,"race-black":12,"race-hispanic":5,"race-asian":3,"inc-lt30":13,"inc-30-70":9,"inc-70-100":3,"inc-100":2,"edu-hs":13,"edu-some":5,"edu-grad":2,"urban":7,"suburban":5,"rural":9,"party-rep":6,"party-dem":6}} },
  { slug: "owns_smartphone", label: "Owns a smartphone", definition: "% who own a smartphone.", period: "2025", document: "pew-mobile-2025", url: "https://www.pewresearch.org/internet/fact-sheet/mobile/", values: {"":{"":91,"18-29":97,"30-49":96,"50-64":90,"65+":78,"men":90,"women":91,"race-white":91,"race-black":85,"race-hispanic":93,"race-asian":96,"inc-lt30":82,"inc-30-70":89,"inc-70-100":96,"inc-100":97,"edu-hs":84,"edu-some":93,"edu-grad":96,"urban":91,"suburban":93,"rural":87,"party-rep":91,"party-dem":92}} },
  { slug: "smartphone_dependent", label: "Smartphone-only internet user", definition: "% who own a smartphone and do not subscribe to home broadband.", period: "2025", document: "pew-mobile-2025", url: "https://www.pewresearch.org/internet/fact-sheet/mobile/", values: {"":{"":16,"18-29":27,"30-49":11,"50-64":15,"65+":17,"race-white":13,"race-black":19,"race-hispanic":28,"race-asian":11,"men":15,"women":17,"inc-lt30":34,"inc-30-70":19,"inc-70-100":10,"inc-100":4,"edu-hs":27,"edu-some":15,"edu-grad":6,"urban":19,"suburban":12,"rural":20}} },
  { slug: "usafacts-avg-debt", label: "Average debt owed per American", definition: "Average debt owed per American. Agency of record: Federal Reserve.", period: "Q2 2026", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":63500}} },
  { slug: "usafacts-avg-wage", label: "Average weekly wage", definition: "Average weekly wage. Agency of record: Bureau of Labor Statistics.", period: "July 2026", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":1290}} },
  { slug: "usafacts-gender-pay-gap", label: "Gender pay gap", definition: "Gender pay gap. Agency of record: Bureau of Labor Statistics.", period: "Q2 2026", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":0}} },
  { slug: "usafacts-homeownership", label: "Homeownership rate", definition: "Homeownership rate. Agency of record: US Census Bureau.", period: "2025", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":65}} },
  { slug: "usafacts-language", label: "People aged 5+ speaking a language other than English at home", definition: "People aged 5+ speaking a language other than English at home. Agency of record: US Census Bureau.", period: "2024", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":74}} },
  { slug: "usafacts-median-hh-income", label: "Median household income", definition: "Median household income. Agency of record: US Census Bureau.", period: "2024", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":81600}} },
  { slug: "usafacts-median-rent", label: "Median rent, including utilities", definition: "Median rent, including utilities. Agency of record: US Census Bureau and Department of Housing and Urban Development.", period: "2024", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":1487}} },
  { slug: "usafacts-population", label: "US population", definition: "US population. Agency of record: US Census Bureau.", period: "2025", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":341}} },
  { slug: "usafacts-poverty", label: "People living in poverty", definition: "People living in poverty. Agency of record: US Census Bureau.", period: "2024", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":35}} },
  { slug: "usafacts-same-sex-households", label: "Households led by a same-sex married couple", definition: "Households led by a same-sex married couple. Agency of record: US Census Bureau.", period: "2024", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":835900}} },
  { slug: "usafacts-unemployment", label: "Unemployment rate", definition: "Unemployment rate. Agency of record: Bureau of Labor Statistics.", period: "August 2026", document: "usafacts-context-2026", url: "https://usafacts.org", values: {"":{"":4}} },
];

export const corpusMetric = (slug: string) => CORPUS_METRICS.find((m) => m.slug === slug);
export const corpusSegment = (slug: string) => CORPUS_SEGMENTS.find((s) => s.slug === slug);
export const corpusDoc = (slug: string) => CORPUS_DOCUMENTS.find((d) => d.slug === slug);

/**
 * How old a figure is, in months, from when its data was COLLECTED
 * rather than when it was published. A survey fielded in June and
 * published in November is five months old on the day it appears, and
 * a page that dates it to November is overstating its freshness.
 */
export function ageInMonths(doc: CorpusDocument, now = new Date()): number | null {
  const basis = doc.fieldEnd ?? doc.published;
  if (!basis) return null;
  const d = new Date(basis);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
}

export type Freshness = "current" | "aging" | "stale";

/** Annual surveys: a year old is normal, two years old is a warning. */
export function freshness(doc: CorpusDocument, now = new Date()): Freshness {
  const m = ageInMonths(doc, now);
  if (m === null) return "aging";
  return m <= 14 ? "current" : m <= 26 ? "aging" : "stale";
}

export const FRESHNESS_META: Record<Freshness, { label: string; color: string; note: string }> = {
  current: { label: "Current", color: "#10b981", note: "The most recent wave of this survey." },
  aging: { label: "Aging", color: "#f59e0b", note: "A newer wave may exist. Checked on the date shown." },
  stale: { label: "Stale", color: "#ef4444", note: "Over two years since collection. Treat as historical." },
};

/** When this corpus was last regenerated from the database. */
export const CORPUS_GENERATED = "2026-09-09";

/** Every figure, flattened. Useful for search and for counting. */
export const CORPUS_CELL_COUNT = CORPUS_METRICS.reduce(
  (n, m) => n + Object.values(m.values).reduce((k, v) => k + Object.keys(v).length, 0),
  0,
);
