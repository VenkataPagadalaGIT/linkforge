"use client";
import { Link } from "@/lib/router-shim";
import { ArrowDown, ArrowRight, Linkedin } from "lucide-react";
import WireframeGrid from "@/components/WireframeGrid";
import FloatingBlocks from "@/components/FloatingBlocks";
import TypewriterText from "@/components/TypewriterText";
import SolutionsGraph from "@/components/SolutionsGraph";
import ScrollReveal from "@/components/ScrollReveal";
import Holographic3DWrapper from "@/components/Holographic3DWrapper";
import ServicesShowcase from "@/components/ServicesShowcase";
import SEO from "@/components/SEO";
import SystemAssemblyNav from "@/components/SystemAssemblyNav";

const Home = () => {

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      <SEO
        title="Venkata Pagadala — AI Product Owner & Technical SEO Lead"
        description="Venkata Pagadala — AI Product Owner, Technical SEO Lead, and Published Researcher. Building production AI systems, knowledge graphs, and enterprise search at scale. 10+ years scaling organic search for Fortune 500 brands."
        canonical="https://venkatapagadala.com"
      />
      <div className="relative min-h-screen flex flex-col items-center justify-center">
      <WireframeGrid />
      <FloatingBlocks />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-6 uppercase">
          [ Portfolio ]
        </p>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-foreground text-glow mb-2">
          Venkata Pagadala
        </h1>
        <p className="font-mono text-xs sm:text-sm text-foreground/50 mb-4 tracking-wide">
          AI Systems · Business Research · Search
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
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

        <div className="h-8 flex items-center justify-center">
          <TypewriterText
            words={[
              "AI Systems Architect",
              "Published Researcher",
              "Business & Market Intelligence",
              "Enterprise SEO & Automation",
              "Building the Future of Search",
            ]}
            className="font-mono text-sm sm:text-base text-foreground/60"
          />
        </div>

        <div className="mt-16 flex flex-col items-center gap-5">
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
          <Link
            to="/about"
            className="inline-flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mt-2"
          >
            <span className="font-mono text-xs tracking-widest uppercase">Explore</span>
            <ArrowDown size={16} className="group-hover:translate-y-1 transition-transform" />
          </Link>
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
              36 capabilities across AI systems, search optimization, and growth engineering — explore the graph to see how they connect.
            </p>
          </div>
        </ScrollReveal>
        <SolutionsGraph />
      </div>

      {/* System Assembly Navigation Hub */}
      <SystemAssemblyNav />
    </div>
  );
};

export default Home;
