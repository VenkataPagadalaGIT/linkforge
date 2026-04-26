// Source of truth for speaker profiles. Reusable across conferences.
// `name` MUST match the `speaker` field in conferences.ts so the join works.

import { conferences, type Session, type SessionType } from "./conferences";

export type DayTrack = "The Science" | "The Psychology" | "The Ecosystem" | "The Future";

export interface Speaker {
  slug: string;
  name: string;
  role: string;
  company: string;
  photo: string;
  linkedin?: string;
  podcastUrl?: string;
  website?: string;
  dayTrack?: DayTrack;
  bio: string;
}

export interface SpeakerTalk {
  conferenceSlug: string;
  conferenceName: string;
  conferenceEdition?: string;
  conferenceDateLabel: string;
  city: string;
  dayDate: string;
  dayTheme?: string;
  start: string;
  end: string;
  type: SessionType;
  title: string;
  description?: string;
  takeaways?: string[];
  sessionId: string;
}

export const speakers: Speaker[] = [
  {
    slug: "mike-king",
    name: "Mike King",
    role: "Founder & CEO",
    company: "iPullRank",
    photo: "https://seoweek.org/wp-content/uploads/2026/01/Frame-1597879909-1.png",
    linkedin: "https://www.linkedin.com/in/michaelkingphilly/",
    podcastUrl: "https://seoweek.org/mike-king-2026/",
    dayTrack: "The Science",
    bio: "Founder and CEO of iPullRank, organizer of SEO Week, and one of the loudest voices arguing that 'AI-powered SEO tools' are mostly cosplay. Builds open-source relevance systems for enterprise search and shapes how the industry thinks about retrieval engineering.",
  },
  {
    slug: "ray-martinez",
    name: "Ray Martinez",
    role: "VP of SEO",
    company: "Archer Education",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Ray-Martinez-_-Reveal-3.png",
    linkedin: "https://www.linkedin.com/in/raymond-martinez-seo/",
    podcastUrl: "https://seoweek.org/ray-martinez-2026/",
    dayTrack: "The Ecosystem",
    bio: "VP of SEO at Archer Education, building student-first knowledge graphs with custom schema and entity-gap analysis. Specializes in AEO playbooks for higher-ed brands competing inside AI Web Search and LLM fetch.",
  },
  {
    slug: "ross-simmonds",
    name: "Ross Simmonds",
    role: "Founder & CEO",
    company: "Foundation",
    photo: "https://seoweek.org/wp-content/uploads/2026/01/Ross-Simmonds-_-Reveal.png",
    linkedin: "https://www.linkedin.com/in/rosssimmonds/",
    podcastUrl: "https://seoweek.org/ross-simmonds-2026/",
    dayTrack: "The Ecosystem",
    bio: "Founder and CEO of Foundation. Pioneer of distribution-first content marketing and 'inception moments' — planting brands deep in the memory layer of every LLM so that ChatGPT, Claude, and Gemini recommend them by default.",
  },
  {
    slug: "angela-clark",
    name: "Angela Clark",
    role: "Senior Content Strategist",
    company: "iPullRank",
    photo: "https://seoweek.org/wp-content/uploads/2026/04/Angela-clark-2-1.png",
    linkedin: "https://www.linkedin.com/in/angelawilson8/",
    dayTrack: "The Psychology",
    bio: "Senior Content Strategist at iPullRank. Researches the psychological tension between professional identity and AI-mandated workflows, and builds frameworks for strengthening human expertise while leveraging AI tools.",
  },
  {
    slug: "andrea-volpini",
    name: "Andrea Volpini",
    role: "Co-founder & CEO",
    company: "WordLift",
    photo: "https://seoweek.org/wp-content/uploads/2026/01/Andrea-Volpini-_-Reveal.png",
    linkedin: "https://www.linkedin.com/in/volpini/",
    dayTrack: "The Science",
    bio: "Co-founder and CEO of WordLift. Pushes the limits of context windows, retrieval over knowledge graphs (RLM-on-KG), and TurboQuant — proving that staged retrieval beats brute-force million-token prompts.",
  },
  {
    slug: "wil-reynolds",
    name: "Wil Reynolds",
    role: "Founder & CEO",
    company: "Seer Interactive",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Wil-Reynolds-_-Reveal.png",
    linkedin: "https://www.linkedin.com/in/wilreynolds/",
    podcastUrl: "https://seoweek.org/wil-reynolds-2026/",
    dayTrack: "The Psychology",
    bio: "Founder and CEO of Seer Interactive. Champions a value-first pivot from SEO to GEO and teaches teams how to discover the prompts customers actually ask — then sell that intent up the chain to budget holders.",
  },
  {
    slug: "azeem-ahmad",
    name: "Azeem Ahmad",
    role: "Strategy Director",
    company: "Reflect Digital",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Azeem-Ahmad-_-Reveal.png",
    linkedin: "https://www.linkedin.com/in/azeema1",
    dayTrack: "The Psychology",
    bio: "Strategy Director at Reflect Digital. Studies the Default Effect and Status Quo Bias as platforms evolve, mapping the generational divide in discovery and how to adjust tactics for delegated, agent-driven choices.",
  },
  {
    slug: "crystal-carter",
    name: "Crystal Carter",
    role: "Head of AI Search & SEO Communications",
    company: "Wix",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Crystal-Carter-_-Reveal.png",
    linkedin: "https://www.linkedin.com/in/crystal-carter-digital/",
    dayTrack: "The Future",
    bio: "Heads AI Search and SEO communications at Wix. Decodes how AI agents are taking over the messy middle of the funnel and how brands stay top-of-mind through validation moments.",
  },
  {
    slug: "noah-learner",
    name: "Noah Learner",
    role: "Director of Innovation",
    company: "Sterling Sky",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Noah-Learner-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/noahlearner",
    dayTrack: "The Science",
    bio: "Director of Innovation at Sterling Sky. Built SEOLoop with no dev team using AI; teaches a product-thinking playbook for spotting the processes that should be software and shipping them.",
  },
  {
    slug: "zach-chahalis",
    name: "Zach Chahalis",
    role: "Sr Director SEO & Data Analytics",
    company: "iPullRank",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Zach-Chahalis-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/zacharychahalis/",
    dayTrack: "The Ecosystem",
    bio: "Senior Director of SEO and Data Analytics at iPullRank. Designs AI-search metrics that reflect how systems actually interpret content, then translates them into controlled experiments and editorial strategy.",
  },
  {
    slug: "dale-bertrand",
    name: "Dale Bertrand",
    role: "President",
    company: "Fire&Spark",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Dale-Bertrand-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/dalebertrand/",
    dayTrack: "The Science",
    bio: "President of Fire&Spark. Replaces vanity traffic reporting with revenue-first GEO metrics, connecting AI-search performance to CFO-level ROI.",
  },
  {
    slug: "annie-cushing",
    name: "Annie Cushing",
    role: "Founder",
    company: "Annielytics",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Annie-Cushing-_-Reveal-2.png",
    linkedin: "https://www.linkedin.com/in/anniecushing/",
    dayTrack: "The Science",
    bio: "Founder of Annielytics. Long-time analytics specialist now teaching SEOs and devs how to disaster-proof AI-assisted code — speed without discipline creates fragility.",
  },
  {
    slug: "jori-ford",
    name: "Jori Ford",
    role: "Chief Marketing & Product Officer",
    company: "FoodBoss",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Jori-Ford-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/chicagoseopro/",
    dayTrack: "The Science",
    bio: "CMO and CPO at FoodBoss. Created the Hybrid Engine Score — a weekly, measurable system that separates real signal from noise across rankings, AI Overviews, and assistant retrieval.",
  },
  {
    slug: "amanda-milligan",
    name: "Amanda Milligan",
    role: "Content & Growth Manager",
    company: "Semrush",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Amanda-Milligan-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/amandamilligan/",
    podcastUrl: "https://seoweek.org/amanda-milligan-2026/",
    dayTrack: "The Psychology",
    bio: "Content and Growth Manager at Semrush. Reframes content quality for the AI era: pages that drive rankings, visibility, and engagement together — the trifecta that wins in 2026.",
  },
  {
    slug: "krishna-madhavan",
    name: "Krishna Madhavan",
    role: "Principal Product Manager",
    company: "Microsoft AI",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Krishna-Madhavan_Reveal.webp",
    linkedin: "https://www.linkedin.com/in/kmadhavan7/",
    podcastUrl: "https://seoweek.org/krishna-madhavan-2026/",
    dayTrack: "The Science",
    bio: "Principal Product Manager at Microsoft AI. Architects the invisible, converged web — the layer where text, images, video, and structured data are interpreted, trusted, and reused inside modern AI pipelines.",
  },
  {
    slug: "metehan-yesilyurt",
    name: "Metehan Yeşilyurt",
    role: "Co-Founder & CGO",
    company: "AEO Vision",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Metehen-Yesilhert-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/metehanyesilyurt/",
    dayTrack: "The Science",
    bio: "Co-Founder and Chief Growth Officer at AEO Vision. Spent a year reverse-engineering how ChatGPT, Perplexity, and Google AI choose citations — proving entropy reduction is the new SEO.",
  },
  {
    slug: "ryan-jones",
    name: "Ryan Jones",
    role: "SVP SEO · Founder",
    company: "Razorfish · SERPrecon",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Ryan-Jones_Reveal.webp",
    linkedin: "https://www.linkedin.com/in/jonesy/",
    dayTrack: "The Future",
    bio: "SVP of SEO at Razorfish and founder of SERPrecon. Bases tactics on patents and information-retrieval theory, with hard case studies on how AI Overviews move the needle on actual sales.",
  },
  {
    slug: "carrie-rose",
    name: "Carrie Rose",
    role: "CEO & Founder",
    company: "Rise at Seven",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Carrie-Rose-_-Reveal-2.png",
    linkedin: "https://www.linkedin.com/in/carrieroseballoch/",
    dayTrack: "The Ecosystem",
    bio: "CEO and Founder of Rise at Seven. Combines creative campaigns with technical SEO for brands like JDsports, Red Bull, Ninja, Airalo, and Kroger — small creative changes, big discovery wins.",
  },
  {
    slug: "john-doherty",
    name: "John Doherty",
    role: "Founder",
    company: "JFD Coaching",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/John-Doherty-_-Reveal-1.png",
    linkedin: "https://www.linkedin.com/in/johnfdoherty/",
    dayTrack: "The Psychology",
    bio: "Founder of JFD Coaching. Argues AI commoditized 'good enough' execution — the future belongs to smaller, faster teams that lean into Empathy, Ethics, and Taste, evolving from Doer to Architect.",
  },
  {
    slug: "jeff-coyle",
    name: "Jeff Coyle",
    role: "SVP, Strategy",
    company: "Siteimprove",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Jeff-Coyle_Reveal.webp",
    linkedin: "https://www.linkedin.com/in/jeffcoyle/",
    dayTrack: "The Science",
    bio: "SVP of Strategy at Siteimprove. Breaks AI search into the underlying pipeline — crawlability, rendering, semantic structure, retrieval, synthesis, and citation reuse — so visibility reporting measures mechanism, not appearance.",
  },
  {
    slug: "alex-halliday",
    name: "Alex Halliday",
    role: "Founder & CEO",
    company: "AirOps",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Alex-Halliday_Reveal-2.png",
    linkedin: "https://www.linkedin.com/in/alexhalliday/",
    dayTrack: "The Psychology",
    bio: "Founder and CEO of AirOps. Shows what AI search actually rewards — brand context, humans in the loop, and performance checks — and the three-part system the best content teams are quietly building.",
  },
  {
    slug: "lisa-paasche",
    name: "Lisa Paasche",
    role: "Founder",
    company: "EKTE",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Lisa-Paasche-_-Reveal.webp",
    linkedin: "https://www.linkedin.com/in/lisapaasche/",
    dayTrack: "The Future",
    bio: "Founder of EKTE. Neuroscience-informed leadership coach for high-stress, high-performance environments — treats nervous-system regulation as a measurable performance lever.",
  },
  {
    slug: "ruth-burr-reedy",
    name: "Ruth Burr Reedy",
    role: "Director of SEO Solutions",
    company: "Microsoft",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Ruth-Burr-Reedy_Reveal.png",
    linkedin: "https://www.linkedin.com/in/ruthburr",
    dayTrack: "The Ecosystem",
    bio: "Director of SEO Solutions at Microsoft. Maps how enterprise organizations are restructuring teams for AI and agentic search — which skills to hone, which job descriptions are dying, and how cross-channel collaboration must evolve.",
  },
  {
    slug: "bianca-anderson",
    name: "Bianca Anderson",
    role: "Growth Strategist",
    company: "Stellar Search Signals",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/Bianca-Anderson_Reveal.png",
    linkedin: "https://www.linkedin.com/in/bianca-anderson/",
    dayTrack: "The Psychology",
    bio: "Growth Strategist at Stellar Search Signals. Frames the influence gap most SEO orgs ignore — AEO and GEO live outside our direct control, and that demands a constraints-first playbook.",
  },
  {
    slug: "james-cadwallader",
    name: "James Cadwallader",
    role: "Co-Founder & CEO",
    company: "Profound",
    photo: "https://seoweek.org/wp-content/uploads/2026/02/James-Cadwallader_Reveal.png",
    linkedin: "https://www.linkedin.com/in/jsca/",
    dayTrack: "The Future",
    bio: "Co-Founder and CEO of Profound. Argues SEO and AEO can coexist — what matters is shaping sentiment, positioning, and accuracy of how AI talks about your brand, not just whether you appear.",
  },
  {
    slug: "angela-skane",
    name: "Angela Skane",
    role: "Content & SEO Strategy Manager",
    company: "Network Solutions",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Angela-Skane_Reveal-2.png",
    linkedin: "https://www.linkedin.com/in/angelaskane/",
    dayTrack: "The Ecosystem",
    bio: "Content and SEO Strategy Manager at Network Solutions. Translates the psychological levers behind TikTok Shop's content formulas into written SEO that converts on Google, GPT, and other LLMs.",
  },
  {
    slug: "christian-ward",
    name: "Christian Ward",
    role: "Chief Data Officer",
    company: "Yext",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Christian-Ward_Reveal-1.png",
    linkedin: "https://www.linkedin.com/in/wardchristianj/",
    dayTrack: "The Future",
    bio: "Chief Data Officer at Yext. Ran Elo-style chess rankings on 21.6M local results and 17.2M AI citations across four models — exposing the blind spot in every brand-down AI-search study.",
  },
  {
    slug: "paul-shapiro",
    name: "Paul Shapiro",
    role: "Lead Product Manager, Web Intelligence",
    company: "Uber",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Paul-Shapiro_Reveal-2.png",
    linkedin: "https://www.linkedin.com/in/paulnshapiro/",
    dayTrack: "The Future",
    bio: "Lead Product Manager for Web Intelligence at Uber. Lives inside agentic systems — Claude Code, n8n, OpenClaw — and surfaces the patterns emerging across planning, research, drafting, and monitoring workflows.",
  },
  {
    slug: "jordan-leschinsky",
    name: "Jordan Leschinsky",
    role: "VP Strategy",
    company: "Vayner Media",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Jordan-Leschinsky_Reveal.webp",
    linkedin: "https://www.linkedin.com/in/jordan-leschinsky",
    dayTrack: "The Future",
    bio: "VP of Strategy at Vayner Media. Argues owned content is just the entry fee — true AI visibility is driven by Earned PR, Earned Social, and Earned Content working as one architecture.",
  },
  {
    slug: "brie-anderson",
    name: "Brie Anderson",
    role: "Founder",
    company: "BEAST Analytics",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Brie-Anderson_Reveal.png",
    linkedin: "https://www.linkedin.com/in/brieeanderson/",
    dayTrack: "The Ecosystem",
    bio: "Founder of BEAST Analytics. Connects SEO work to revenue using the data teams already have — coining the SECRO role: search engine conversion-rate optimizer.",
  },
  {
    slug: "sam-torres",
    name: "Sam Torres",
    role: "Sr Mgr Tech SEO",
    company: "Pipedrive",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Sam-Torres_Reveal-1.png",
    linkedin: "https://www.linkedin.com/in/samantha-torres-seo/",
    dayTrack: "The Ecosystem",
    bio: "Senior Manager of Technical SEO at Pipedrive. Treats ML as research infrastructure — embeddings, clustering, LLM pipelines — and ships ready-to-run notebooks instead of half-baked prompts.",
  },
  {
    slug: "scott-stouffer",
    name: "Scott Stouffer",
    role: "Co-Founder & CTO",
    company: "Market Brew",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Scott-Stouffer_Reveal.webp",
    linkedin: "https://www.linkedin.com/in/scottstouffer/",
    dayTrack: "The Science",
    bio: "Co-Founder and CTO of Market Brew. Measures a brand's mathematical identity — the similarity space AI uses to retrieve brands by — and aligns content to that signature instead of chasing keywords.",
  },
  {
    slug: "garrett-sussman",
    name: "Garrett Sussman",
    role: "Director of Marketing",
    company: "iPullRank",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Garrett-Sussman_Reveal.png",
    linkedin: "https://www.linkedin.com/in/garrettsussman/",
    dayTrack: "The Psychology",
    bio: "Director of Marketing at iPullRank. Year-long experimenter on persona cues, seeded context, and connected data — and how each one quietly changes brand recommendations across AI Search.",
  },
  {
    slug: "brie-moreau",
    name: "Brie Moreau",
    role: "Founder",
    company: "White Light Digital Marketing",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Brie-Moreau_Reveal.png",
    linkedin: "https://www.linkedin.com/in/briemoreau/",
    dayTrack: "The Ecosystem",
    bio: "Founder of White Light Digital Marketing. 1,000+ hours of R&D analyzing 2M+ AI citations across ChatGPT, Claude, and Gemini — separating real visibility signals from the noise authoritative sites are losing to.",
  },
  {
    slug: "brian-cosgrove",
    name: "Brian Cosgrove",
    role: "Principal",
    company: "BrainDo",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Brian-Cosgrove_Reveal.png",
    linkedin: "https://www.linkedin.com/in/brianjcosgrove/",
    dayTrack: "The Ecosystem",
    bio: "Principal at BrainDo. Fights on three fronts: rebuilding measurement baselines, moving from being mentioned to being the answer, and writing agent-first directives for the AI agents bumbling around your site.",
  },
  {
    slug: "brittan-king",
    name: "Brittan King",
    role: "Fractional CRO",
    company: "iPullRank",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Brittan-King_Reveal.png",
    linkedin: "https://www.linkedin.com/in/brittanbright/",
    dayTrack: "The Psychology",
    bio: "Fractional Chief Revenue Officer at iPullRank. Helps teams navigate fear, uncertainty, and doubt in a perpetually shifting paradigm — practical tactics for staying centered while the ground keeps moving.",
  },
  {
    slug: "ilana-gershteyn",
    name: "Ilana Gershteyn",
    role: "Director of SEO",
    company: "Edmunds.com",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Ilana-Fraines_Reveal-1.png",
    linkedin: "https://www.linkedin.com/in/ilana-fraines/",
    dayTrack: "The Psychology",
    bio: "Director of SEO at Edmunds.com. Three Ds for surviving a Google drop — discipline, diagnosis, direction — without panic-driven 'fixes' that make things worse.",
  },
  {
    slug: "ian-lurie",
    name: "Ian Lurie",
    role: "The Digital Marketing Nerd",
    company: "Ian Lurie LLC",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/Ian-Lurie_Reveal.png",
    linkedin: "https://www.linkedin.com/in/ianlurie/",
    dayTrack: "The Future",
    bio: "Independent consultant and self-described Digital Marketing Nerd. Argues teaching is a marketing superpower across every search surface — and shares the one teaching recipe that always works (except when it doesn't).",
  },
  {
    slug: "john-shehata",
    name: "John Shehata",
    role: "CEO & Founder",
    company: "NewzDash",
    photo: "https://seoweek.org/wp-content/uploads/2026/03/John-Shehata_Reveal.png",
    linkedin: "https://www.linkedin.com/in/johnshehata/",
    dayTrack: "The Ecosystem",
    bio: "CEO and Founder of NewzDash. Decodes the core signals behind Google Discover visibility, why traffic drops, and the two strategies that actually grow and sustain Discover performance.",
  },
];

// ===== Helpers =====
const _bySlug = new Map(speakers.map((s) => [s.slug, s] as const));
const _byName = new Map(speakers.map((s) => [s.name, s] as const));

export const getSpeakerBySlug = (slug: string): Speaker | undefined => _bySlug.get(slug);
export const getSpeakerByName = (name?: string): Speaker | undefined =>
  name ? _byName.get(name) : undefined;

const sessionKey = (dayDate: string, s: Session) =>
  `${dayDate}__${s.start}__${s.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

export function getSpeakerTalks(speakerName: string): SpeakerTalk[] {
  const out: SpeakerTalk[] = [];
  conferences.forEach((c) => {
    c.days.forEach((d) => {
      d.sessions.forEach((s) => {
        if (s.speaker === speakerName) {
          out.push({
            conferenceSlug: c.slug,
            conferenceName: c.name,
            conferenceEdition: c.edition,
            conferenceDateLabel: c.dateLabel,
            city: c.city,
            dayDate: d.date,
            dayTheme: d.theme,
            start: s.start,
            end: s.end,
            type: s.type,
            title: s.title,
            description: s.description,
            takeaways: s.takeaways,
            sessionId: sessionKey(d.date, s),
          });
        }
      });
    });
  });
  // newest first by parsing the day date
  out.sort((a, b) => new Date(b.dayDate).getTime() - new Date(a.dayDate).getTime());
  return out;
}
