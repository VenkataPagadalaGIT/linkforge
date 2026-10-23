"use client";
import { Link } from "@/lib/router-shim";
import { ArrowRight, Linkedin, Mail } from "lucide-react";
import { linkedPapers } from "@/data/research";
import TypewriterText from "@/components/TypewriterText";
import SolutionsGraph from "@/components/SolutionsGraph";
import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import ServicesShowcase from "@/components/ServicesShowcase";
import SEO from "@/components/SEO";
import SystemAssemblyNav from "@/components/SystemAssemblyNav";
import PortraitAssemblyLazy from "@/components/home/PortraitAssemblyLazy";
import HomeUniverse from "@/components/home/HomeUniverse";
import AboutMarquee from "@/components/home/AboutMarquee";
import WebScene from "@/components/home/WebScene";
import { LINKEDIN_STATS, PROFILE, compactStat, yearsInSearch } from "@/data/profile";

/** The hero's numbers, read from the same sourced record the About page shows. */
const stat = (prefix: string) => LINKEDIN_STATS.find((s) => s.label.startsWith(prefix))?.value ?? "";

const Home = () => {

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <SEO
        title="Venkata Pagadala · AI Product Owner & Technical SEO Lead"
        description="Venkata Pagadala · AI Product Owner, Technical SEO Lead, and Published Researcher. Building production AI systems, knowledge graphs, and enterprise search at scale. 10+ years scaling organic search for Fortune 500 brands."
        canonical="https://venkatapagadala.com"
      />
      <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* The room, its webs and the two spiders (replaces the old panels and blocks here only) */}
      <WebScene />

      <div className="relative z-10 px-6 max-w-6xl w-full pt-24 pb-4 lg:pb-0 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-14">
        {/* The portrait carries no frame, no caption, no card: the face is
            crisp at its centre and dissolves outward into drifting
            photo-coloured dust that belongs to the same quiet system as the
            background. Interactions are discovered, not labelled: the
            pointer breaks pieces loose, a click shatters and heals it. */}
        {/* Anchor target: the 3D menu and the /3d hub link here by name.
            Without it those entries pointed at "/" and appeared to do
            nothing when clicked from the homepage itself. scroll-mt clears
            the fixed navbar so the face is not hidden under it. */}
        <div
          id="living-portrait"
          className="shrink-0 order-first lg:order-last w-[min(38vh,300px)] h-[min(38vh,300px)] lg:w-[420px] lg:h-[420px] scroll-mt-24"
        >
          <PortraitAssemblyLazy />
        </div>

        <div className="text-center lg:text-left min-w-0">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
          [ Portfolio ]
        </p>

        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground text-glow mb-2">
          Venkata Pagadala
        </h1>
        <p className="font-mono text-xs sm:text-sm text-foreground/50 mb-4 tracking-wide">
          User-First Intelligence · Agentic AI · AI Search
        </p>

        {/* Each number opens its source on the About page. */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mb-6">
          {[
            { label: "Impressions", value: compactStat(stat("Post impressions")) },
            { label: "Followers", value: compactStat(stat("LinkedIn followers")) },
            { label: "Reach", value: compactStat(stat("Members reached")) },
            { label: "Years in search", value: `${yearsInSearch()}+` },
          ].map((item) => (
            <a
              key={item.label}
              href="/about#numbers"
              title="Sources on the About page"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span className="font-mono text-sm sm:text-base font-bold text-foreground">{item.value}</span>
              <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-wider">{item.label}</span>
            </a>
          ))}
        </div>

        <div className="h-8 flex items-center justify-center lg:justify-start">
          <TypewriterText
            words={[
              "User-First Intelligence",
              "Agentic AI Systems",
              "Published Researcher",
              "AI Product Leader at AT&T",
              "Enterprise SEO & AI Search",
              "Speaker & Podcast Guest",
            ]}
            className="font-mono text-sm sm:text-base text-foreground/60"
          />
        </div>

        <div className="mt-10 flex flex-col items-center lg:items-start gap-5">
          <a
            href="https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7434105581101133824"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#0A66C2] text-white px-8 py-3 font-mono text-xs tracking-widest uppercase hover:bg-[#004182] transition-all rounded-full shadow-[0_0_25px_rgba(10,102,194,0.3)] hover:shadow-[0_0_35px_rgba(10,102,194,0.5)]"
          >
            <Linkedin size={16} />
            Subscribe on LinkedIn
          </a>
          {/* One button; the email sits under it as a plain link. */}
          <a
            href={`mailto:${PROFILE.email}`}
            className="inline-flex items-center gap-2 font-mono text-xs tracking-wider text-foreground/70 hover:text-foreground transition-colors"
          >
            <Mail size={14} aria-hidden="true" />
            {PROFILE.email}
          </a>
        </div>
        </div>
      </div>

      {/* Every About section, one click from the hero. On wide screens this band
          stretches to the bottom of the screen and the room draws the web inside
          it, so the whole web sits in the first screen, behind and below the name
          and photo; on phones the sections ride a slow row. The band lets the
          pointer through to the web. */}
      <div data-web-band className="relative z-10 w-full max-w-6xl px-6 pb-16 pointer-events-none md:min-h-[300px] md:flex-1">
        <div className="md:hidden pointer-events-auto">
          <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase text-center mb-3">
            About me · pick a section
          </p>
          <AboutMarquee />
        </div>
      </div>

      {/* Bottom coordinates */}
      <div className="absolute bottom-8 left-8 font-mono text-[10px] text-muted-foreground/70">
        33.7490° N, 84.3880° W
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-[10px] text-muted-foreground/70">
        ATLANTA, GA
      </div>
      </div>

      {/* User First Needs: the framework at the center of the site and its research, one button under the banner. */}
      <section aria-labelledby="home-ufi-h" className="relative z-10 border-y border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-center md:flex-row md:justify-between md:text-left">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The framework at the center of this site</p>
            <h2 id="home-ufi-h" className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              User-First Intelligence
            </h2>
            <p className="mt-2 font-mono text-sm leading-relaxed text-muted-foreground">
              Understand people before algorithms: who they are, where they ask, what they need, and what to build for them.
            </p>
          </div>
          <a
            href="/guides/user-first-intelligence"
            className="inline-flex shrink-0 items-center gap-3 border-2 border-foreground bg-foreground px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-background hover:text-foreground"
          >
            User First Needs
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </section>

      {/* My LinkedIn as a 3D universe (loads when scrolled near) */}
      <HomeUniverse />

      {/* Services Showcase */}
      <ServicesShowcase />

      {/* Interactive Capability Graph */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-16">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/70 uppercase mb-3">
              Interactive Explorer
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow mb-3">
              The Full Capability Graph
            </h2>
            <p className="font-mono text-xs text-muted-foreground max-w-xl mx-auto">
              36 capabilities across AI systems, search optimization, and growth engineering. Explore the graph to see how they connect.
            </p>
          </div>
        </ScrollReveal>
        <SolutionsGraph />
      </div>

      {/* Published research: the credential almost nobody in this field has,
          so it earns a place on the homepage rather than only on /publications */}
      <div className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <ScrollReveal>
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-3 uppercase">
              Published Research
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-glow mb-3">
              Peer-reviewed, not just practiced
            </h2>
            <p className="font-mono text-xs text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Work published in academic venues and indexed where researchers actually look.
              Every paper below opens in full.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-3">
            {linkedPapers.map((paper, i) => (
              <ScrollReveal key={paper.url} delay={i * 60}>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col h-full border border-border p-5 hover:bg-secondary/20 border-glow-hover transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-widest uppercase text-foreground/50">
                      {paper.host}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/70">{paper.year}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground mb-2 leading-snug">
                    {paper.shortTitle}
                  </h3>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-4 flex-1">
                    {paper.summary}
                  </p>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground/70 group-hover:text-foreground transition-colors">
                    Read the paper <ArrowRight size={12} />
                  </span>
                </a>
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-6">
            <Link
              to="/publications"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All publications and research systems <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* System Assembly Navigation Hub */}
      <SystemAssemblyNav />
    </div>
  );
};

export default Home;
