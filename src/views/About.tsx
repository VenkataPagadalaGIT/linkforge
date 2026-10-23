import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Mail, MapPin, Quote } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import PageSidebar from "@/components/PageSidebar";
import PaperCover from "@/components/research/PaperCover";
import SocialIcon from "@/components/profile/SocialIcon";
import { jsonLdScript } from "@/lib/jsonld";
import { accessNote, authorRole, citationLine, GOOGLE_SCHOLAR_URL, linkedPapers } from "@/data/research";
import { BRIGHTONSEO_2026, KIND_LABEL, RECOGNITION, TALKS, byDateDesc, formatTalkDate, linkVerb } from "@/data/talks";
import { LINKEDIN_COUNTS } from "@/data/linkedinArchiveServer";
import { UNIVERSE_PATH } from "@/data/universe";
import {
  COLLEAGUE_RECS,
  FOCUS_AREAS,
  GUEST_ARTICLE,
  LINKEDIN_STATS,
  LINKEDIN_URL,
  PEER_QUOTES,
  PROFILE,
  RECOMMENDATIONS_URL,
  SOCIAL_PROFILES,
  socialUrl,
  yearsInSearch,
  type SourcedStat,
} from "@/data/profile";

/* ── Derived from the data, never typed ─────────────────────────────── */

const media = TALKS.filter((t) => t.kind !== "workshop").sort(byDateDesc);
const latestMedia = media.filter((t) => t.thumb).slice(0, 4);
/** Peer-reviewed first, then newest first: the order a reader weighs them in. */
const papers = [...linkedPapers].sort(
  (a, b) => Number(b.review === "peer-reviewed") - Number(a.review === "peer-reviewed") || b.year.localeCompare(a.year),
);
const peerReviewed = linkedPapers.filter((p) => p.review === "peer-reviewed");
const preprints = linkedPapers.filter((p) => p.review === "preprint");
const archived = LINKEDIN_COUNTS.posts + LINKEDIN_COUNTS.articles;
/** TALKS plus the brightonSEO talk, which is kept apart as the featured item. */
const talksTotal = TALKS.length + 1;
const recommendationsCount = LINKEDIN_STATS.find((s) => s.href === RECOMMENDATIONS_URL)?.value ?? "";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ── Career, as LinkedIn and the owner's résumé record it ───────────── */

const experiences = [
  {
    company: "AT&T",
    role: "Lead Technical Product Manager, Automation, AI & SEO",
    period: "March 2025 to Present",
    location: "Atlanta, Georgia",
    achievements: [
      "Built AI-powered metadata automation with knowledge graphs and content guardrails (legal, brand voice), scaling to 100K+ pages with multi-model LLM testing",
      "Shipped RAG-based internal linking engine using vector embeddings, cosine similarity, and entity recognition for intelligent link recommendations",
      "Built topic clustering system using vector embeddings to map content relationships for programmatic recommendations",
      "Led AI-powered internal search chatbot using RAG architecture for Answer Engine Optimization (AEO)",
      "Architected unified JSON-LD schema system across fragmented engineering teams with dynamic generation from CMS/catalog feeds",
      "Established enterprise crawl infrastructure (Botify 50M+ crawls) with SEO observability, Akamai CDN caching, and Core Web Vitals optimization",
      "Built market share content optimization tool with nationwide and geo-focused analysis (state, city, zip) and L1-L6 classification",
      "Unlocked 3-year content roadmap through systematic market share analysis with automated internal linking and schema validation",
    ],
  },
  {
    company: "CoStar Group (Apartments.com)",
    role: "SEO Product Manager",
    period: "Oct 2022 to March 2025",
    location: "Atlanta, Georgia",
    achievements: [
      "Owned technical SEO across 5 properties (40M+ pages); shipped AI-powered content translation (GPT-4) across 1M+ pages",
      "Led cross-functional team of 6 in sprint-based development; built analytics dashboards (BigQuery, SQL, PowerBI)",
    ],
  },
  {
    company: "American Addiction Centers",
    role: "Senior SEO Software Developer",
    period: "Apr 2019 to Oct 2022",
    location: "San Diego, California",
    achievements: [
      "Led PHP to React.js migration; implemented JSON-LD structured data across 1M+ page healthcare portfolio",
    ],
  },
  { company: "Dyad Ventures", role: "Search Marketing Strategist", period: "Jan 2018 to Feb 2019", location: "", achievements: [] },
  { company: "Sprout for Business", role: "SEO Manager", period: "Apr 2016 to Dec 2017", location: "", achievements: [] },
  { company: "New England College", role: "Graduate Assistant", period: "2016", location: "", achievements: [] },
  { company: "Visakhapatnam Steel Plant", role: "Software Developer", period: "2014 to 2015", location: "Visakhapatnam, India", achievements: [] },
];

/** Scale of the work at the companies above, as the owner reports it. */
const SCALE = [
  { value: "160B+", label: "Digital assets handled" },
  { value: "50M+", label: "Pages managed" },
  { value: "25M+", label: "Pages audited bi-weekly" },
  { value: "5.3M", label: "Keywords classified" },
];

const DEGREES = [
  { title: "M.S. Computer Information Systems (GPA 4.0)", sub: "New England College" },
  { title: "MBA", sub: "National Institute of Business Management" },
  { title: "B.E. Computer Science", sub: "KL University" },
];

const CERTIFICATES = [
  { title: "Disruptive Strategy", sub: "Harvard University" },
  { title: "Cyber Security", sub: "Massachusetts Institute of Technology (MIT)" },
];

const skills = [
  "MCP", "A2A", "Claude Code", "RAG Systems", "Knowledge Graphs",
  "Vector Embeddings", "Cosine Similarity", "Topic Clustering",
  "LLM Optimization", "GPT-4", "Claude", "Entity Recognition", "NLP", "AI Agents",
  "JSON-LD", "Canonical Tags", "Crawl Budget", "Log File Analysis",
  "Core Web Vitals", "hreflang", "Site Migrations", "Sitemaps",
  "Google Cloud Knowledge Graph API", "Botify", "Screaming Frog",
  "Ahrefs", "Semrush", "Google Search Console", "BigQuery", "SQL",
  "Python", "GA4", "PowerBI",
];

/* ── Questions, written as people search for them ───────────────────── */

const papersSentence = papers
  .map((p) => {
    const where = p.review === "preprint" ? `a preprint on ${p.venue}` : p.venue;
    const detail = [p.publisher, p.year, authorRole(p).toLowerCase()].filter(Boolean).join(", ");
    return `${where} (${detail})`;
  })
  .join("; ");

const FAQ: { q: string; a: string }[] = [
  {
    q: "Who is Venkata Pagadala?",
    a: `I'm a product leader and researcher in search intelligence. I'm ${PROFILE.role} at ${PROFILE.employer} in Atlanta, I publish research on how AI is changing search, and I speak about it at conferences and on podcasts.`,
  },
  {
    q: "What is search intelligence?",
    a: "Reading demand from everywhere people express it, not only the search box, and turning it into decisions: what to build, what to publish, and how to show up when an AI system answers instead of a results page. It joins classic SEO, AI visibility, knowledge graphs and agents.",
  },
  {
    q: "What does Venkata Pagadala do at AT&T?",
    a: "I lead product work on automation, AI and SEO: AI-assisted metadata at scale with legal and brand guardrails, retrieval-based internal linking, topic clustering, structured data, and the crawl infrastructure underneath. The career section above lists the details.",
  },
  {
    q: "Where has Venkata Pagadala published research?",
    a: `${papers.length} papers so far: ${papersSentence}. Each one links to its publisher from Research & Talks.`,
  },
  {
    q: "Can I invite Venkata Pagadala to speak or join a podcast?",
    a: "Yes. Use the contact page or message me on LinkedIn. Bios and a headshot for organizers are on my profile page.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const tocSections = [
  { label: "About", id: "about" },
  { label: "By the numbers", id: "numbers" },
  { label: "What I work on", id: "work" },
  { label: "How I got here", id: "story" },
  { label: "What peers say", id: "peers" },
  { label: "Speaking", id: "speaking" },
  { label: "Research", id: "research" },
  { label: "Recognition", id: "recognition" },
  { label: "Experience", id: "experience" },
  { label: "Education", id: "education" },
  { label: "Skills", id: "skills" },
  { label: "Questions", id: "faq" },
  { label: "Get in touch", id: "contact" },
];

/* ── Small pieces ───────────────────────────────────────────────────── */

const linkCls =
  "text-foreground underline decoration-border hover:decoration-foreground underline-offset-4 transition-colors";
const btnPrimary =
  "inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase px-4 py-2.5 bg-foreground text-background hover:opacity-90 transition-opacity";
const btnSecondary =
  "inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase px-4 py-2.5 border border-border text-foreground hover:border-foreground/40 hover:bg-foreground/5 transition-colors";

function SectionHead({ n, label, id, title, children }: { n: string; label: string; id: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-3 uppercase">
        {`{${n}}`} · {label}
      </p>
      <h2 id={id} className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow text-balance">
        {title}
      </h2>
      {children && <p className="font-mono text-sm text-muted-foreground leading-relaxed mt-4 max-w-3xl">{children}</p>}
    </header>
  );
}

function Ext({ href, children, className = linkCls }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function StatBox({ stat }: { stat: SourcedStat }) {
  const inner = (
    <>
      <span className="block font-display text-2xl sm:text-4xl font-bold text-foreground text-glow tabular-nums">{stat.value}</span>
      <span className="block font-mono text-[11px] text-foreground/85 tracking-wider uppercase mt-2 leading-snug">{stat.label}</span>
      <span className="block font-mono text-[10px] text-muted-foreground mt-auto pt-3 leading-relaxed">{stat.source}</span>
    </>
  );
  const cls = "border border-border p-4 sm:p-5 flex flex-col h-full border-glow-hover transition-colors";
  if (!stat.href) return <div className={cls}>{inner}</div>;
  return stat.href.startsWith("/") ? (
    <Link href={stat.href} className={`${cls} hover:bg-secondary/20`}>{inner}</Link>
  ) : (
    <a href={stat.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:bg-secondary/20`}>{inner}</a>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

const About = () => {
  const years = yearsInSearch();
  const NUMBERS: SourcedStat[] = [
    { value: `${years}+`, label: "Years in search", source: "First search role in April 2016", href: "#experience" },
    ...LINKEDIN_STATS.filter((s) => s.href !== RECOMMENDATIONS_URL),
    {
      value: String(archived),
      label: "Posts and articles, archived here",
      source: `LinkedIn, ${LINKEDIN_COUNTS.firstYear} to ${LINKEDIN_COUNTS.lastYear}`,
      href: UNIVERSE_PATH,
    },
    {
      value: String(linkedPapers.length),
      label: "Published papers",
      source: `${peerReviewed.length} peer-reviewed, ${preprints.length} ${preprints.length === 1 ? "preprint" : "preprints"}`,
      href: "#research",
    },
    { value: String(talksTotal), label: "Talks, podcasts and interviews", source: "Each linked to its recording", href: "#speaking" },
    ...LINKEDIN_STATS.filter((s) => s.href === RECOMMENDATIONS_URL),
  ];

  const FACTS: { k: string; v: ReactNode }[] = [
    { k: "Role", v: `${PROFILE.role} at ${PROFILE.employer}` },
    { k: "Field", v: PROFILE.field },
    { k: "Based in", v: PROFILE.location },
    { k: "In search since", v: "2016" },
    {
      k: "Research",
      v: `${plural(peerReviewed.length, "peer-reviewed paper")}, ${plural(preprints.length, "preprint")}`,
    },
    { k: "On stage", v: `${BRIGHTONSEO_2026.event}, plus ${plural(media.length, "podcast, interview and talk", "podcasts, interviews and talks")}` },
  ];

  const [featuredQuote, ...otherQuotes] = PEER_QUOTES;

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }} />
      <div className="max-w-6xl mx-auto">
        <div className="lg:flex lg:gap-10">
          <PageSidebar sections={tocSections} shareTitle="About Venkata Pagadala: AI product leader and researcher" />

          <div className="flex-1 min-w-0">
            {/* ── Hero ── */}
            <section id="about" aria-labelledby="about-h" className="scroll-mt-28 mb-20">
              <Breadcrumbs className="mb-6" trail={[{ href: "/", label: "Home" }, { label: "About" }]} />
              <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">{"{01}"} · About</p>

              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,280px)] gap-10 items-start">
                <div>
                  <h1 id="about-h" className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground text-glow text-balance">
                    About Venkata Pagadala
                  </h1>
                  <p className="font-display text-xl sm:text-2xl text-foreground/85 mt-4 text-balance">
                    I build AI systems that understand search demand, and publish the research behind them.
                  </p>
                  <p className="font-mono text-sm leading-relaxed text-muted-foreground mt-6 max-w-2xl">
                    I&apos;m {PROFILE.role} at {PROFILE.employer}. My field is search intelligence: how people search, how
                    AI systems answer, and how to build the systems that serve both. I ship production systems at work,
                    write up what they teach me in papers and talks, and share the rest in public.
                  </p>

                  <dl className="grid sm:grid-cols-2 border-t border-l border-border mt-8">
                    {FACTS.map((f) => (
                      <div key={f.k} className="border-b border-r border-border px-4 py-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{f.k}</dt>
                        <dd className="font-mono text-xs text-foreground mt-1 leading-relaxed">{f.v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-wrap gap-3 mt-8">
                    <Link href="/research-and-talks" className={btnPrimary}>
                      Research &amp; Talks
                    </Link>
                    <Link href="/profile" className={btnSecondary}>
                      Profile and bios
                    </Link>
                    <Link href="/contact" className={btnSecondary}>
                      Contact
                    </Link>
                    <Ext href={LINKEDIN_URL} className={btnSecondary}>
                      LinkedIn <ArrowUpRight size={12} aria-hidden="true" />
                    </Ext>
                  </div>
                </div>

                <figure className="m-0">
                  <div className="aspect-square border border-border overflow-hidden bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={PROFILE.photo.src}
                      alt="Venkata Pagadala"
                      width={PROFILE.photo.width}
                      height={PROFILE.photo.height}
                      loading="eager"
                      fetchPriority="high"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  <figcaption className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-3">
                    <MapPin size={11} aria-hidden="true" /> {PROFILE.location}
                  </figcaption>
                </figure>
              </div>
            </section>

            {/* ── Numbers ── */}
            <section id="numbers" aria-labelledby="numbers-h" className="mb-20 scroll-mt-28">
              <SectionHead n="02" label="By the numbers" id="numbers-h" title="The record, with sources">
                Every number names where it comes from. The ones about this site are counted from its own data, so they
                change when the data does.
              </SectionHead>
              <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {NUMBERS.map((s) => (
                  <li key={s.label}>
                    <StatBox stat={s} />
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Focus areas ── */}
            <section id="work" aria-labelledby="work-h" className="mb-20 scroll-mt-28">
              <SectionHead n="03" label="Focus" id="work-h" title="What do I work on?">
                Four threads, one question underneath: what do people actually need, and how do they find it now that AI
                answers first?
              </SectionHead>
              <div className="grid md:grid-cols-2 gap-4">
                {FOCUS_AREAS.map((f, i) => (
                  <article key={f.id} className="border border-border p-6 flex flex-col border-glow-hover">
                    <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase mb-3">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="font-display text-xl font-bold text-foreground leading-snug">{f.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3">{f.body}</p>
                    <ul className="mt-auto pt-5 space-y-1.5">
                      {f.links.map((l) => (
                        <li key={l.href} className="font-mono text-[11px]">
                          {l.href.startsWith("/") ? (
                            <Link href={l.href} className={linkCls}>
                              {l.label}
                            </Link>
                          ) : (
                            <Ext href={l.href}>{l.label} ↗</Ext>
                          )}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            {/* ── Story ── */}
            <section id="story" aria-labelledby="story-h" className="mb-20 scroll-mt-28">
              <SectionHead n="04" label="Story" id="story-h" title="How did I get here?" />
              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,220px)] gap-10">
                <div className="space-y-5 font-mono text-sm leading-relaxed text-muted-foreground max-w-2xl">
                  <p>
                    I started as a software developer at Visakhapatnam Steel Plant in India, then did a master&apos;s in
                    Computer Information Systems at New England College, where I also worked as a graduate assistant.
                  </p>
                  <p>
                    My first search job, in 2016, was SEO Manager at Sprout for Business. After Dyad Ventures I spent
                    three and a half years at American Addiction Centers in San Diego as a senior SEO software developer,
                    leading a PHP to React migration and structured data across a healthcare portfolio of more than a
                    million pages.
                  </p>
                  <p>
                    At CoStar Group I worked on SEO product for Apartments.com and its sister sites: five properties, more
                    than 40 million pages, and GPT-4 translation shipped across more than a million of them. Since March
                    2025 I have led automation, AI and SEO product work at AT&amp;T.
                  </p>
                  <p className="text-foreground/85">
                    The thread through all of it: demand is bigger than the numbers keyword tools report, and AI is
                    changing where people find answers. So I build systems that see the whole of that demand, publish the
                    research behind them, and share what I learn in public, on LinkedIn since 2016 and now on stage and in
                    journals.
                  </p>
                </div>
                <ol className="border-l border-border pl-5 space-y-4 self-start" aria-label="Milestones">
                  {[
                    ["2014", "Software developer"],
                    ["2016", "First search role"],
                    ["2019", "SEO engineering at scale"],
                    ["2022", "SEO product, Apartments.com"],
                    ["2023", "First journal paper"],
                    ["2025", "AI product lead, AT&T"],
                    ["2026", "brightonSEO San Diego, Springer Nature"],
                  ].map(([y, t]) => (
                    <li key={y} className="relative">
                      <span className="absolute -left-[23px] top-1.5 w-1.5 h-1.5 bg-foreground" aria-hidden="true" />
                      <span className="block font-mono text-[10px] tracking-[0.2em] text-muted-foreground">{y}</span>
                      <span className="block font-mono text-xs text-foreground">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── Peers ── */}
            <section id="peers" aria-labelledby="peers-h" className="mb-20 scroll-mt-28">
              <SectionHead n="05" label="In their words" id="peers-h" title="What do peers say?">
                Short quotes from public posts and comments, and from recommendations on my LinkedIn profile. Each one links
                to where it was said.
              </SectionHead>

              <div className="grid md:grid-cols-2 gap-4">
                <figure className="md:col-span-2 border border-border p-6 sm:p-8 border-glow-hover">
                  <Quote size={18} className="text-muted-foreground mb-4" aria-hidden="true" />
                  <blockquote className="font-display text-2xl sm:text-3xl font-bold leading-snug text-foreground text-balance">
                    &ldquo;{featuredQuote.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 font-mono text-xs">
                    <span className="text-foreground font-semibold">{featuredQuote.name}</span>
                    <span className="text-muted-foreground">, {featuredQuote.role}</span>
                    <span className="block text-[11px] text-muted-foreground mt-1.5">
                      {featuredQuote.about} ·{" "}
                      <Ext href={featuredQuote.url} className={`${linkCls} whitespace-nowrap`}>
                        LinkedIn, {formatTalkDate(featuredQuote.date)} ↗
                      </Ext>
                    </span>
                  </figcaption>
                </figure>
                {otherQuotes.map((q) => (
                  <figure key={q.name} className="border border-border p-6 flex flex-col border-glow-hover">
                    <blockquote className="font-display text-lg leading-snug text-foreground text-balance">
                      &ldquo;{q.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-auto pt-5 font-mono text-xs">
                      <span className="text-foreground font-semibold">{q.name}</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">{q.role}</span>
                      <span className="block text-[10px] text-muted-foreground mt-2 leading-relaxed">
                        {q.about} ·{" "}
                        <Ext href={q.url} className={`${linkCls} whitespace-nowrap`}>
                          LinkedIn, {formatTalkDate(q.date)} ↗
                        </Ext>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-12 mb-5">
                <h3 className="font-display text-xl font-bold text-foreground">From colleagues</h3>
                <Ext
                  href={RECOMMENDATIONS_URL}
                  className="font-mono text-[11px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  All {recommendationsCount} recommendations on LinkedIn ↗
                </Ext>
              </div>
              <ul className="grid md:grid-cols-2 gap-x-8 border-t border-border">
                {COLLEAGUE_RECS.map((r) => (
                  <li key={r.name} className="py-5 border-b border-border">
                    <p className="font-mono text-sm text-foreground leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
                    <p className="font-mono text-[11px] text-muted-foreground mt-2 leading-relaxed">
                      <span className="text-foreground">{r.name}</span>, {r.title}
                      {r.together ? ` · worked together at ${r.together}` : ""} · {formatTalkDate(r.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Speaking ── */}
            <section id="speaking" aria-labelledby="speaking-h" className="mb-20 scroll-mt-28">
              <SectionHead n="06" label="Speaking" id="speaking-h" title="Where have I spoken?">
                Conference talks, podcasts, webinars and interviews, newest first. Every recording is linked.
              </SectionHead>

              <article className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] border border-border mb-6">
                <Link
                  href={`/research-and-talks#${BRIGHTONSEO_2026.slug}`}
                  className="group relative block aspect-video overflow-hidden bg-card border-b md:border-b-0 md:border-r border-border"
                  aria-label={`Watch ${BRIGHTONSEO_2026.title} at ${BRIGHTONSEO_2026.event}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/talks/thumbs/brightonseo-on-stage-2026.jpg"
                    alt=""
                    width={640}
                    height={360}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute left-3 top-3 bg-background/90 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                    Featured talk
                  </span>
                </Link>
                <div className="p-6 flex flex-col">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    {BRIGHTONSEO_2026.event} · {BRIGHTONSEO_2026.track} ·{" "}
                    <time dateTime={BRIGHTONSEO_2026.startDate}>{formatTalkDate(BRIGHTONSEO_2026.startDate.slice(0, 10))}</time>
                  </p>
                  <h3 className="font-display text-2xl font-bold text-foreground leading-snug text-balance">
                    {BRIGHTONSEO_2026.title}
                  </h3>
                  <p className="font-mono text-xs text-foreground/85 mt-1">{BRIGHTONSEO_2026.tagline}</p>
                  <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3">{BRIGHTONSEO_2026.summary}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-auto pt-5 font-mono text-[11px]">
                    <Link href={`/research-and-talks#${BRIGHTONSEO_2026.slug}`} className={linkCls}>
                      Watch the talk
                    </Link>
                    {BRIGHTONSEO_2026.links
                      .filter((l) => !l.internal)
                      .map((l) => (
                        <Ext key={l.url} href={l.url}>
                          {l.label} ↗
                        </Ext>
                      ))}
                  </div>
                </div>
              </article>

              <ul className="grid sm:grid-cols-2 gap-4">
                {latestMedia.map((t) => {
                  const primary = t.links[0];
                  const verb = primary ? linkVerb(primary.url) : "Open";
                  return (
                    <li key={t.slug} className="border border-border flex flex-col border-glow-hover">
                      {primary && t.thumb && (
                        <a
                          href={primary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="group relative block aspect-video overflow-hidden border-b border-border bg-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={t.thumb}
                            alt=""
                            width={640}
                            height={360}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          <span className="absolute right-2 bottom-2 bg-background/90 border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                            {verb}
                            {t.minutes ? ` · ${t.minutes} min` : ""}
                          </span>
                        </a>
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                          {t.outlet} · <time dateTime={t.date}>{formatTalkDate(t.date)}</time> · {KIND_LABEL[t.kind]}
                        </p>
                        <h3 className="font-display text-base font-semibold text-foreground leading-snug text-balance">
                          {primary ? <Ext href={primary.url} className="hover:underline decoration-border underline-offset-4">{t.title}</Ext> : t.title}
                        </h3>
                        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-2">{t.summary}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 font-mono text-[11px]">
                <Link href="/research-and-talks#media" className={linkCls}>
                  All {talksTotal} talks, podcasts and interviews
                </Link>
              </p>
            </section>

            {/* ── Research ── */}
            <section id="research" aria-labelledby="research-h" className="mb-20 scroll-mt-28">
              <SectionHead n="07" label="Research" id="research-h" title="What have I published?">
                {plural(peerReviewed.length, "peer-reviewed paper")} and {plural(preprints.length, "preprint")}, each shown
                by its real first page and linked to the publisher.
              </SectionHead>
              <ol className="border-t border-border">
                {papers.map((p) => {
                  const access = accessNote(p);
                  return (
                    <li
                      key={p.slug}
                      className="grid grid-cols-[minmax(0,88px)_minmax(0,1fr)] sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-5 py-6 border-b border-border"
                    >
                      <PaperCover paper={p} />
                      <div className="min-w-0">
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-2">
                          <span className={p.review === "peer-reviewed" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>
                            {p.review === "peer-reviewed" ? "Peer reviewed" : "Preprint"}
                          </span>
                          <span className="text-muted-foreground"> · {p.year}</span>
                          {access && <span className="text-muted-foreground"> · {access}</span>}
                        </p>
                        <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-snug text-balance">
                          <Ext href={p.doiUrl ?? p.url} className="hover:underline decoration-border underline-offset-4">
                            {p.title}
                          </Ext>
                        </h3>
                        <p className="font-mono text-[11px] text-foreground/85 mt-2">{citationLine(p)}</p>
                        {authorRole(p) && <p className="font-mono text-[10px] text-muted-foreground mt-1">{authorRole(p)}</p>}
                        <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-3">{p.summary}</p>
                      </div>
                    </li>
                  );
                })}
                <li className="grid grid-cols-[minmax(0,88px)_minmax(0,1fr)] sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-5 py-6 border-b border-border">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground pt-1">Guest article</div>
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      {GUEST_ARTICLE.outlet} · {formatTalkDate(GUEST_ARTICLE.date)}
                    </p>
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-snug text-balance">
                      <Ext href={GUEST_ARTICLE.url} className="hover:underline decoration-border underline-offset-4">
                        {GUEST_ARTICLE.title}
                      </Ext>
                    </h3>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mt-2">
                      The brightonSEO method in writing: how to research demand that search volume does not show.
                    </p>
                  </div>
                </li>
              </ol>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-5 font-mono text-[11px]">
                <Link href="/publications" className={linkCls}>
                  Full records and abstracts
                </Link>
                <Ext href={GOOGLE_SCHOLAR_URL}>Google Scholar profile ↗</Ext>
              </div>
            </section>

            {/* ── Recognition ── */}
            <section id="recognition" aria-labelledby="recognition-h" className="mb-20 scroll-mt-28">
              <SectionHead n="08" label="Recognition" id="recognition-h" title="Who has named the work?">
                Lists, citations and credits, each worded the way its source words it, and no stronger.
              </SectionHead>
              <ul className="border-t border-border">
                {[...RECOGNITION].sort(byDateDesc).map((r) => (
                  <li key={r.slug} className="py-5 border-b border-border grid sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-x-5 gap-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
                      <time dateTime={r.date}>{formatTalkDate(r.date)}</time>
                    </p>
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground leading-snug">
                        <Ext href={r.url} className="hover:underline decoration-border underline-offset-4">
                          {r.claim}
                        </Ext>
                      </h3>
                      <p className="font-mono text-[11px] text-muted-foreground mt-1">
                        {r.source}
                        {r.publishedOn ? ` on ${r.publishedOn}` : ""}
                      </p>
                      {r.quote && (
                        <blockquote className="font-mono text-[11px] text-muted-foreground leading-relaxed mt-2 border-l-2 border-border pl-3">
                          &ldquo;{r.quote}&rdquo;
                        </blockquote>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Experience ── */}
            <section id="experience" aria-labelledby="experience-h" className="mb-20 scroll-mt-28">
              <SectionHead n="09" label="Experience" id="experience-h" title="Career timeline" />
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12" aria-label="Scale of the work">
                {SCALE.map((s) => (
                  <li key={s.label} className="border border-border p-5 text-center border-glow-hover">
                    <span className="block font-display text-2xl sm:text-3xl font-bold text-foreground text-glow">{s.value}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground tracking-wider uppercase mt-2">{s.label}</span>
                  </li>
                ))}
              </ul>
              <div className="relative">
                <div className="absolute left-0 md:left-8 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
                <ol className="space-y-8">
                  {experiences.map((exp) => (
                    <li key={exp.company + exp.period} className="relative pl-8 md:pl-20">
                      <div className="absolute left-0 md:left-8 top-2 w-2 h-2 -translate-x-[3px] bg-foreground" aria-hidden="true" />
                      <div className={`border border-border border-glow-hover ${exp.achievements.length ? "p-6 sm:p-8" : "px-6 py-4"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <div>
                            <h3 className={`font-display font-bold text-foreground ${exp.achievements.length ? "text-xl sm:text-2xl" : "text-lg"}`}>
                              {exp.company}
                            </h3>
                            <p className="font-mono text-sm text-muted-foreground mt-1">{exp.role}</p>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground tracking-wider shrink-0">{exp.period}</p>
                        </div>
                        {exp.location && (
                          <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase mt-3">{exp.location}</p>
                        )}
                        {exp.achievements.length > 0 && (
                          <ul className="space-y-2 mt-4">
                            {exp.achievements.map((a) => (
                              <li key={a} className="font-mono text-xs text-muted-foreground leading-relaxed flex gap-3">
                                <span className="text-foreground/40 mt-0.5 shrink-0" aria-hidden="true">
                                  ▸
                                </span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── Education ── */}
            <section id="education" aria-labelledby="education-h" className="mb-20 scroll-mt-28">
              <SectionHead n="10" label="Education" id="education-h" title="Education and certificates" />
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Degrees</h3>
                  <ul className="space-y-3">
                    {DEGREES.map((d) => (
                      <li key={d.title} className="border border-border p-5 border-glow-hover">
                        <span className="block font-display text-lg font-semibold text-foreground">{d.title}</span>
                        <span className="block font-mono text-xs text-muted-foreground mt-1">{d.sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Certificates</h3>
                  <ul className="space-y-3">
                    {CERTIFICATES.map((d) => (
                      <li key={d.title} className="border border-border p-5 border-glow-hover">
                        <span className="block font-display text-lg font-semibold text-foreground">{d.title}</span>
                        <span className="block font-mono text-xs text-muted-foreground mt-1">{d.sub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── Skills ── */}
            <section id="skills" aria-labelledby="skills-h" className="mb-20 scroll-mt-28">
              <SectionHead n="11" label="Skills" id="skills-h" title="Skills and tools" />
              <ul className="flex flex-wrap gap-2.5">
                {skills.map((skill) => (
                  <li
                    key={skill}
                    className="font-mono text-xs border border-border px-3.5 py-2 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors border-glow-hover"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" aria-labelledby="faq-h" className="mb-20 scroll-mt-28">
              <SectionHead n="12" label="Questions" id="faq-h" title="Questions people ask" />
              <dl className="border-t border-border">
                {FAQ.map((f) => (
                  <div key={f.q} className="py-5 border-b border-border grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-8 gap-y-2">
                    <dt className="font-display text-base font-semibold text-foreground">{f.q}</dt>
                    <dd className="font-mono text-xs text-muted-foreground leading-relaxed">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── Contact ── */}
            <section id="contact" aria-labelledby="contact-h" className="scroll-mt-28">
              <div className="border border-border p-6 sm:p-10 bg-card/20">
                <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-3 uppercase">{"{13}"} · Contact</p>
                <h2 id="contact-h" className="font-display text-3xl sm:text-4xl font-bold text-foreground text-glow text-balance">
                  Working on search, AI visibility or agents?
                </h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mt-4 max-w-2xl">
                  I&apos;m glad to talk about products, research, speaking and podcasts. Organizers: bios and a headshot
                  are on{" "}
                  <Link href="/profile#bios" className={linkCls}>
                    my profile page
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-3 mt-7">
                  <Link href="/contact" className={btnPrimary}>
                    Get in touch
                  </Link>
                  <a href={`mailto:${PROFILE.email}`} className={btnSecondary}>
                    <Mail size={12} aria-hidden="true" /> Email
                  </a>
                  <Ext href={socialUrl("linkedin")} className={btnSecondary}>
                    LinkedIn <ArrowUpRight size={12} aria-hidden="true" />
                  </Ext>
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-3 mt-8 pt-6 border-t border-border" aria-label="Elsewhere">
                  {SOCIAL_PROFILES.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <SocialIcon id={s.id} size={14} />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
