"use client";
import { Link, useParams } from "@/lib/router-shim";
import ScrollReveal from "@/components/ScrollReveal";
import PageSidebar from "@/components/PageSidebar";
import SEO from "@/components/SEO";
import { aiUpdates, CATEGORY_META, type UpdateCategory } from "@/data/aiUpdates";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Tag } from "lucide-react";
import { useState, useMemo } from "react";

const ALL_CATEGORIES: (UpdateCategory | "all")[] = ["all", "product-launch", "research", "industry", "open-source", "policy"];

const tocSections = [
  { label: "Latest Updates", id: "updates" },
];

const AIUpdatesIndex = () => {
  const [filter, setFilter] = useState<UpdateCategory | "all">("all");

  const filtered = useMemo(
    () => filter === "all" ? aiUpdates : aiUpdates.filter((u) => u.category === filter),
    [filter]
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <SEO
        title="AI Updates March 2026 — Latest AI News & Product Launches | Venkata Pagadala"
        description="Stay updated with the latest AI news — product launches from NVIDIA, Google, OpenAI, Meta, Cloudflare, and more. Curated AI updates for March 2026."
        canonical="https://venkatapagadala.com/ai-updates"
        breadcrumbs={[
          { name: "Home", url: "https://venkatapagadala.com" },
          { name: "AI Updates", url: "https://venkatapagadala.com/ai-updates" },
        ]}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "AI Updates March 2026",
          description: "Curated AI news covering product launches, research breakthroughs, and industry developments.",
          url: "https://venkatapagadala.com/ai-updates",
          author: { "@type": "Person", name: "Venkata Pagadala" },
          dateModified: "2026-03-19",
        }}
      />
      <div className="max-w-7xl mx-auto px-6 lg:flex lg:gap-10">
        <div className="flex-1 min-w-0">
          <ScrollReveal>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft size={12} /> Home
            </Link>

            <div className="mb-10">
              <p className="font-mono text-[11px] text-muted-foreground/50 uppercase tracking-[0.3em] mb-3">
                AI Intelligence Feed
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-3">
                AI Updates — March 2026
              </h1>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Curated AI news covering product launches, research breakthroughs, open-source releases, and industry developments from NVIDIA, Google, OpenAI, Meta, Anthropic, Cloudflare, and more.
              </p>
            </div>
          </ScrollReveal>

          {/* Category filters */}
          <ScrollReveal>
            <div className="flex flex-wrap gap-2 mb-10">
              {ALL_CATEGORIES.map((cat) => {
                const isActive = filter === cat;
                const label = cat === "all" ? "All" : CATEGORY_META[cat].label;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 border transition-all ${
                      isActive
                        ? "border-foreground text-foreground bg-foreground/5"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Updates list */}
          <div id="updates" className="scroll-mt-28 space-y-6">
            {filtered.map((update, i) => {
              const catMeta = CATEGORY_META[update.category];
              return (
                <ScrollReveal key={update.id} delay={i * 80}>
                  <Link
                    to={`/ai-updates/${update.slug}`}
                    className="block border border-border p-6 sm:p-8 hover:border-foreground/30 transition-all group"
                  >
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span
                        className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border"
                        style={{ borderColor: catMeta.color, color: catMeta.color }}
                      >
                        {catMeta.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/40 flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(update.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/30">{update.company}</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-xl font-bold text-foreground group-hover:text-glow transition-all mb-2">
                      {update.title}
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-3">
                      {update.summary}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {update.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="font-mono text-[9px] text-muted-foreground/30 border border-border/50 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-mono text-sm text-muted-foreground/40">No updates in this category yet.</p>
            </div>
          )}
        </div>

        <PageSidebar sections={tocSections} shareTitle="AI Updates March 2026 — Latest AI News" />
      </div>
    </div>
  );
};

export default AIUpdatesIndex;
