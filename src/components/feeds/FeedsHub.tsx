import { EVENTS } from "@/data/events";

const CHAPTERS = [
  ["happened", "What happened", "the story in one screen"],
  ["impact", "The impact", "the money, customers, markets"],
  ["details", "The details", "how it happened, who did it"],
  ["graph", "How it connects", "the knowledge graph"],
  ["theories", "Theories", "true or false? swipe to guess"],
  ["next", "What's next", "the dates to watch"],
  ["sources", "Sources", "every video, post and story"],
] as const;

/** Knowledge Graph Feeds: every topic we read from every platform, as a feed people can swipe, with the full page one tap away. */
export default function FeedsHub() {
  const feeds = Object.values(EVENTS).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const top = feeds[0];
  const hero = top?.featured ? top.sources.find((s) => s.id === top.featured) : undefined;
  return (
    <div className="min-h-screen bg-[#05060a] pb-20 pt-24 text-white" style={{ background: "radial-gradient(900px 500px at 10% 0%, rgba(239,68,68,0.20), transparent 70%), radial-gradient(800px 500px at 100% 20%, rgba(37,99,235,0.18), transparent 70%), #05060a" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#25F4EE]"><span className="text-[#ef4444]">●</span> Knowledge Graph Feeds</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">Every story, read from every platform, checked against its sources.</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/75">Swipe a topic like social media: what happened, the impact, the details, the theories (guess true or false), what comes next, then every source. The full page is always one tap away.</p>

        {top && (
          <section className="relative mt-8 overflow-hidden rounded-3xl border border-white/10" aria-label="Featured feed">
            {hero?.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.thumb} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#05060a] via-[#05060a]/80 to-transparent" />
            <div className="relative max-w-2xl p-6 sm:p-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">Live feed · updated {top.updatedAt.slice(0, 10)}</p>
              <h2 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{top.title}</h2>
              {top.summary && <p className="mt-3 text-sm leading-relaxed text-white/85">{top.summary.split(/(?<=\.)\s/)[0]}</p>}
              <p className="mt-3 font-mono text-[11px] text-white/60">{top.sources.length} sources · {top.claims.length} claims checked · {top.groups.length} platforms · {top.graph.nodes.length}-node knowledge graph</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href={`/feeds/${top.slug}`} className="rounded-full bg-white px-5 py-2.5 font-mono text-xs font-bold text-black hover:bg-[#ef4444] hover:text-white">Start the feed</a>
                <a href={`/feeds/${top.slug}?chapter=theories`} className="rounded-full bg-white/15 px-5 py-2.5 font-mono text-xs text-white hover:bg-white/25">Play true or false</a>
                <a href={`/notebook/events/${top.slug}`} className="rounded-full bg-white/15 px-5 py-2.5 font-mono text-xs text-white hover:bg-white/25">Read the full page</a>
              </div>
            </div>
          </section>
        )}

        {top && (
          <section className="mt-10" aria-label="Jump into a chapter">
            <h2 className="mb-3 font-display text-lg font-bold">Jump into a chapter</h2>
            <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
              {CHAPTERS.map(([id, label, sub], i) => (
                <a key={id} href={`/feeds/${top.slug}?chapter=${id}`} className="group w-[180px] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition hover:border-[#25F4EE]/60">
                  <span className="font-display text-4xl font-black text-transparent" style={{ WebkitTextStroke: "1.5px rgba(239,68,68,0.9)" }}>{i + 1}</span>
                  <span className="mt-2 block font-display text-base font-bold">{label}</span>
                  <span className="block font-mono text-[10px] text-white/60">{sub}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10" aria-label="All feeds">
          <h2 className="mb-3 font-display text-lg font-bold">Live feeds <span className="font-mono text-[10px] font-normal text-white/50">{feeds.length}</span></h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {feeds.map((f) => {
              const pic = f.featured ? f.sources.find((s) => s.id === f.featured)?.thumb : null;
              return (
                <a key={f.slug} href={`/feeds/${f.slug}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition hover:border-[#ef4444]/60">
                  {pic && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pic} alt={`${f.title}: featured video frame`} className="aspect-video w-full object-cover opacity-90 transition group-hover:scale-[1.03]" />
                  )}
                  <span className="block p-4">
                    <span className="block font-display text-lg font-bold">{f.title}</span>
                    <span className="mt-1 block font-mono text-[10px] text-white/60">{f.sources.length} sources · {f.claims.length} claims · updated {f.updatedAt.slice(0, 10)}</span>
                  </span>
                </a>
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[10px] text-white/50">More feeds are being built. Each one comes from the same pipeline: every platform read, every claim checked against its primary source.</p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="How it works">
          {[
            ["We read everything", "Official statements, investigators, news, YouTube, TikTok, Instagram, X, Reddit and Hacker News, with transcripts for the most-watched videos."],
            ["We check every claim", "Each claim people are making gets a verdict, with the exact words of its primary source."],
            ["You swipe the story", "Story first, then the theories as a true-or-false round, then every source. The full page and the data files are always there."],
          ].map(([h, t]) => (
            <div key={h} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-display text-base font-bold">{h}</p>
              <p className="mt-1 text-sm text-white/70">{t}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
