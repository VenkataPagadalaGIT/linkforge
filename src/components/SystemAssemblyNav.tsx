"use client";
import { Link } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";

interface NavCard {
  id: string;
  label: string;
  category: string;
  icon: string;
  path: string;
  description: string;
  cardNumber: string;
  network: string;
  schema: string;
  pages: string;
  keyword: string;
}

const navCards: NavCard[] = [
  {
    id: "notebook",
    label: "AI Notebook",
    category: "CORE MODULE",
    icon: "◎",
    path: "/notebook/ai",
    description: "Complete AI knowledge hub — research, frameworks, and deep dives.",
    cardNumber: "ART · COURSE · FAQ · BREAD",
    network: "MONO",
    schema: "Article + Course",
    pages: "50+",
    keyword: "Best AI Notebook 2026",
  },
  {
    id: "contributors",
    label: "Top 100 Contributors",
    category: "DIRECTORY",
    icon: "◇",
    path: "/ai-contributors",
    description: "2026 Edition · The definitive index of AI researchers and leaders.",
    cardNumber: "PROF · NEWS · BREAD · LIST",
    network: "MIND",
    schema: "ProfilePage",
    pages: "100",
    keyword: "Best 100 AI Contributors 2026",
  },
  {
    id: "roadmap",
    label: "Free AI Roadmap",
    category: "LEARNING",
    icon: "△",
    path: "/notebook/ai/roadmap",
    description: "18-week zero-to-hero AI curriculum. Foundations to applied engineering.",
    cardNumber: "COURSE · BREAD · HOW · FAQ",
    network: "MONO",
    schema: "Course (Free)",
    pages: "18 wks",
    keyword: "Free AI Roadmap March 2026",
  },
  {
    id: "encyclopedia",
    label: "AI Encyclopedia",
    category: "REFERENCE",
    icon: "▽",
    path: "/notebook/ai/encyclopedia",
    description: "110 core AI concepts — attention mechanisms to zero-shot learning.",
    cardNumber: "FAQ · DEFN · BREAD · ART",
    network: "MIND",
    schema: "FAQPage",
    pages: "110",
    keyword: "AI Encyclopedia Concepts",
  },
  {
    id: "solutions",
    label: "Solutions & SEO",
    category: "ENGINE",
    icon: "⬡",
    path: "/solutions",
    description: "Enterprise search optimization and AI-powered visibility strategies.",
    cardNumber: "SERV · OFFER · BREAD · ORG",
    network: "MONO",
    schema: "Service + Offer",
    pages: "8",
    keyword: "AI SEO Solutions",
  },
  {
    id: "experience",
    label: "Experience",
    category: "DRIVE",
    icon: "◈",
    path: "/experience",
    description: "10+ years scaling organic search for Fortune 500 brands and startups.",
    cardNumber: "PERSON · ORG · BREAD · EXP",
    network: "MIND",
    schema: "Person + Org",
    pages: "1",
    keyword: "AI SEO Consultant",
  },
  {
    id: "insights",
    label: "Insights & Blog",
    category: "SENSOR",
    icon: "◆",
    path: "/insights",
    description: "Essays, case studies, and thought leadership on AI and search.",
    cardNumber: "NEWS · ART · BREAD · BLOG",
    network: "MONO",
    schema: "NewsArticle",
    pages: "25+",
    keyword: "AI SEO Insights Blog",
  },
  {
    id: "research",
    label: "Research",
    category: "NAV",
    icon: "✦",
    path: "/research",
    description: "Published papers and ongoing research in AI systems and NLP.",
    cardNumber: "SCHOL · ART · CITE · BREAD",
    network: "MIND",
    schema: "ScholarlyArticle",
    pages: "12",
    keyword: "AI NLP Research Papers",
  },
  {
    id: "projects",
    label: "Projects",
    category: "WEAPON",
    icon: "✧",
    path: "/projects",
    description: "Production AI systems, tools, and open-source contributions.",
    cardNumber: "SOFT · CODE · BREAD · REPO",
    network: "MONO",
    schema: "SoftwareApp",
    pages: "10",
    keyword: "AI Open Source Projects",
  },
  {
    id: "contact",
    label: "Contact",
    category: "SHIELD",
    icon: "○",
    path: "/contact",
    description: "Get in touch for collaborations, speaking, or consulting.",
    cardNumber: "CONTACT · ORG · LOCAL · BREAD",
    network: "MIND",
    schema: "ContactPage",
    pages: "1",
    keyword: "Contact AI Consultant",
  },
];

const CreditCard = ({ card }: { card: NavCard }) => {
  return (
    <Link
      to={card.path}
      aria-label={`${card.label} — ${card.description}`}
      title={card.description}
      className="group block focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40"
    >
      <article
        className="relative overflow-hidden border border-border/50 bg-[hsl(0_0%_5%)] transition-colors duration-300 group-hover:bg-card group-hover:border-foreground/20 group-focus-visible:bg-card group-focus-visible:border-foreground/20"
        style={{ aspectRatio: "86 / 54" }}
      >
        {/* Top edge line */}
        <div
          className="absolute top-0 inset-x-0 h-px opacity-40 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, hsl(var(--foreground) / 0.25) 50%, transparent 95%)",
          }}
        />

        <div className="relative p-3 h-full flex flex-col justify-between">
          {/* Row 1: Category + Network */}
          <div className="flex items-start justify-between">
            <span
              className="font-mono tracking-[0.3em] uppercase text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-300"
              style={{ fontSize: 7 }}
            >
              {card.category}
            </span>
            <span
              className="font-mono font-bold tracking-[0.15em] text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors duration-300"
              style={{ fontSize: 8 }}
            >
              {card.network}
            </span>
          </div>

          {/* Row 2: Chip + Schema */}
          <div className="flex items-center gap-2 mt-1.5">
            <div
              className="relative flex-shrink-0 border border-foreground/15 group-hover:border-foreground/30 transition-colors duration-300"
              style={{
                width: 26,
                height: 18,
                background:
                  "linear-gradient(135deg, hsl(0 0% 18%), hsl(0 0% 12%))",
              }}
            >
              <div className="absolute inset-[2px] border border-foreground/10" />
              <div className="absolute top-1/2 left-[2px] right-[2px] h-px bg-foreground/10" />
              <div className="absolute left-1/2 top-[2px] bottom-[2px] w-px bg-foreground/10" />
            </div>

            <span
              className="font-mono text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors duration-300"
              style={{ fontSize: 7, letterSpacing: "0.08em" }}
            >
              {card.schema}
            </span>
          </div>

          {/* Row 3: Schema codes */}
          <p
            className="font-mono tracking-[0.2em] text-foreground/15 group-hover:text-foreground/50 mt-1 transition-colors duration-300"
            style={{ fontSize: 8 }}
          >
            {card.cardNumber}
          </p>

          {/* Row 4: Name + Pages */}
          <div className="flex items-end justify-between mt-auto">
            <div className="min-w-0">
              <p
                className="font-mono text-foreground/10 group-hover:text-muted-foreground/50 truncate transition-colors duration-300 mb-px"
                style={{ fontSize: 6, letterSpacing: "0.04em" }}
              >
                {card.keyword}
              </p>
              <h3
                className="font-mono font-semibold tracking-wide text-foreground/45 group-hover:text-foreground/95 transition-colors duration-300"
                style={{ fontSize: 10 }}
              >
                {card.label}
              </h3>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p
                className="font-mono uppercase text-foreground/[0.08] group-hover:text-foreground/25 transition-colors duration-300"
                style={{ fontSize: 5, letterSpacing: "0.12em" }}
              >
                PAGES
              </p>
              <p
                className="font-mono text-foreground/15 group-hover:text-foreground/50 transition-colors duration-300"
                style={{ fontSize: 9 }}
              >
                {card.pages}
              </p>
            </div>
          </div>
        </div>

        {/* Watermark icon */}
        <div
          aria-hidden="true"
          className="absolute bottom-3 right-3 text-foreground/[0.02] group-hover:text-foreground/[0.06] transition-colors duration-300 pointer-events-none"
          style={{ fontSize: 22 }}
        >
          {card.icon}
        </div>

        {/* SR-only description for crawlers + screen readers */}
        <span className="sr-only">{card.description}</span>
      </article>
    </Link>
  );
};

const SystemAssemblyNav = () => {
  return (
    <nav
      aria-label="Knowledge Architecture"
      className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-16 pb-12"
    >
      {/* Header */}
      <ScrollReveal>
        <header className="text-center mb-8">
          <p className="font-mono text-[9px] tracking-[0.5em] text-muted-foreground/25 uppercase mb-3">
            [ System Assembly ]
          </p>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Knowledge Architecture
          </h2>
          <p className="font-mono text-[10px] text-muted-foreground/35 max-w-lg mx-auto leading-relaxed">
            Ten interconnected knowledge modules. Hover to inspect. Click to navigate.
          </p>

          {/* Stats bar */}
          <ul className="flex items-center justify-center gap-8 mt-5 list-none">
            {[
              { label: "Modules", value: "10" },
              { label: "Concepts", value: "110" },
              { label: "Contributors", value: "100" },
            ].map((stat) => (
              <li key={stat.label} className="text-center">
                <p className="font-mono text-base font-semibold text-foreground/70">{stat.value}</p>
                <p className="font-mono text-[8px] tracking-[0.3em] text-muted-foreground/20 uppercase mt-0.5">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </header>
      </ScrollReveal>

      {/* Credit Card Grid — pure CSS, fully crawlable */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 list-none p-0 m-0">
        {navCards.map((card) => (
          <li key={card.id}>
            <CreditCard card={card} />
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground/15 uppercase">
          10 modules · Interconnected Knowledge System
        </p>
      </div>
    </nav>
  );
};

export default SystemAssemblyNav;
