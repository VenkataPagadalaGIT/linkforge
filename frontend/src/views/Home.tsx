"use client";
import { Link } from "@/lib/router-shim";
import { ArrowDown, ArrowRight, Linkedin } from "lucide-react";
import { linkedPapers } from "@/data/research";
import WireframeGrid from "@/components/WireframeGrid";
import FloatingBlocks from "@/components/FloatingBlocks";
import TypewriterText from "@/components/TypewriterText";
import SolutionsGraph from "@/components/SolutionsGraph";
import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import ServicesShowcase from "@/components/ServicesShowcase";
import SEO from "@/components/SEO";
import SystemAssemblyNav from "@/components/SystemAssemblyNav";
import PortraitAssemblyLazy from "@/components/home/PortraitAssemblyLazy";

const Home = () => {

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <SEO
        title="Venkata Pagadala · AI Product Owner & Technical SEO Lead"
        description="Venkata Pagadala · AI Product Owner, Technical SEO Lead, and Published Researcher. Building production AI systems, knowledge graphs, and enterprise search at scale. 10+ years scaling organic search for Fortune 500 brands."
        canonical="https://venkatapagadala.com"
      />
      <div className="relative min-h-screen flex flex-col items-center justify-center">
      <WireframeGrid />
      <FloatingBlocks />

      <div className="relative z-10 px-6 max-w-6xl w-full pt-24 pb-16 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-14">
        {/* The portrait carries no frame, no caption, no card: the face is
            crisp at its centre and dissolves outward into drifting
            photo-coloured dust that belongs to the same quiet system as the
            background. Interactions are discovered, not labelled: the
            pointer breaks pieces loose, a click shatters and heals it. */}
        <div className="shrink-0 order-first lg:order-last w-[min(38vh,300px)] h-[min(38vh,300px)] lg:w-[420px] lg:h-[420px]">
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
          AI Systems · Business Research · Search
        </p>

        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 mb-6">
          {[
            { label: "Impressions", value: "404K+" },
            { label: "Followers", value: "18K+" },
            { label: "Connections", value: "500+" },
            { label: "Reach", value: "132K+" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <span className="font-mono text-sm sm:text-base font-bold text-foreground">{stat.value}</span>
              <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="h-8 flex items-center justify-center lg:justify-start">
          <TypewriterText
            words={[
              "AI Systems Architect",
              "Published Researcher",
              "Business & Market Intelligence",
              "AI Consultant",
              "Forward Deployment Engineer & SEO",
              "Building the Future of Search",
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
          <a
            href="https://www.linkedin.com/in/venkata-pagadala/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-foreground/30 px-8 py-3 font-mono text-xs tracking-widest uppercase text-foreground/70 hover:text-foreground hover:border-foreground/60 transition-all group"
          >
            <Linkedin size={16} className="group-hover:text-foreground transition-all" />
            Follow
          </a>
          <button
            type="button"
            onClick={() => {
              // The arrow promises "further down this page", so honour that:
              // ride to the end of the document rather than navigating away,
              // and respect a reduced-motion preference on the way.
              const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: reduce ? "auto" : "smooth",
              });
            }}
            aria-label="Scroll to the bottom of the page"
            className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mt-2 bg-transparent border-0 cursor-pointer"
          >
            <span className="font-mono text-xs tracking-widest uppercase">Explore</span>
            <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
        </div>
      </div>

      {/* Bottom coordinates */}
      <div className="absolute bottom-8 left-8 font-mono text-[10px] text-muted-foreground/40">
        33.7490° N, 84.3880° W
      </div>
      <div className="absolute bottom-8 right-8 font-mono text-[10px] text-muted-foreground/40">
        ATLANTA, GA
      </div>
      </div>

      {/* Services Showcase */}
      <ServicesShowcase />

      {/* Interactive Capability Graph */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-16">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 uppercase mb-3">
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
                    <span className="font-mono text-[10px] text-muted-foreground/40">{paper.year}</span>
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
