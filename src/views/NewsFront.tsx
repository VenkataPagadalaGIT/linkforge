/**
 * NewsFront: /ai-updates as a newspaper front page, "Tech & Business: News and Updates" (owner, 2026-10-30).
 * The conventions are a broadsheet's (masthead, date line, double rule, section bar, a lead package, a Latest rail,
 * ruled columns, serif headlines); the name and the design are this site's own.
 *
 * A server component with no client state: the whole page, every link included, is in the HTML a crawler reads.
 */
import { Link } from "@/lib/router-shim";
import type { FrontLead, FrontPage, FrontStory } from "@/lib/news-front";

const AP_MONTHS = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
/** Newspaper dates: "Oct. 30, 2026". */
const apDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return `${AP_MONTHS[m - 1]} ${day}, ${y}`;
};
const fullDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

const SECTION_LABEL: Record<FrontStory["section"], string> = {
  business: "Business",
  technology: "Technology",
  research: "Research",
  policy: "Policy",
  events: "Event files",
};

function Kicker({ story, live }: { story: FrontStory; live?: boolean }) {
  return (
    <p className="mb-1.5 flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {story.logo && <img src={story.logo.src} alt={story.logo.alt} width={16} height={16} className="h-4 w-auto" loading="lazy" decoding="async" />}
      {live && <span className="text-red-600 dark:text-red-400">Live</span>}
      <span>{story.kicker}</span>
    </p>
  );
}

function Meta({ story, prefix }: { story: FrontStory; prefix?: string }) {
  return (
    <p className="mt-2 font-sans text-[11px] text-muted-foreground">
      {prefix ? `${prefix} ` : ""}
      <time dateTime={story.date}>{apDate(story.date)}</time>
      {story.readMin ? ` · ${story.readMin} min read` : ""}
    </p>
  );
}

/** The two-company lockup an M&A story carries, light and dark versions. */
function Logos({ story }: { story: FrontStory }) {
  const l = story.logos;
  if (!l) return null;
  const pair = (mode: "onLight" | "onDark", cls: string) => (
    <div className={`${cls} flex-wrap items-center justify-center gap-x-3 gap-y-2`}>
      <img src={l.left[mode]} alt={l.left.name} style={{ height: l.left.height }} className="w-auto" loading="lazy" decoding="async" />
      {l.connector && <span className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">{l.connector}</span>}
      <img src={l.right[mode]} alt={l.right.name} style={{ height: l.right.height }} className="w-auto" loading="lazy" decoding="async" />
    </div>
  );
  return (
    <div className="mb-3 border border-border px-4 py-5">
      {pair("onLight", "flex dark:hidden")}
      {pair("onDark", "hidden dark:flex")}
    </div>
  );
}

function Picture({ story }: { story: FrontStory }) {
  if (!story.image) return null;
  return (
    <Link href={story.href} className="mb-3 block" tabIndex={-1} aria-hidden="true">
      <img
        src={story.image.src}
        alt=""
        width={story.image.width}
        height={story.image.height}
        className="aspect-video w-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </Link>
  );
}

function Stat({ story }: { story: FrontStory }) {
  if (!story.stat) return null;
  return (
    <p className="mt-3 flex items-baseline gap-2">
      <span className="font-serif text-2xl font-bold text-foreground">{story.stat.stat}</span>
      <span className="font-sans text-[11px] leading-snug text-muted-foreground">{story.stat.label}</span>
    </p>
  );
}

function Story({ story, size }: { story: FrontStory; size: "md" | "sm" }) {
  return (
    <article>
      <Picture story={story} />
      <Logos story={story} />
      <Kicker story={story} />
      <h3 className={`font-serif font-bold leading-snug text-foreground ${size === "md" ? "text-xl sm:text-[22px]" : "text-lg"}`}>
        <Link href={story.href} className="hover:underline underline-offset-4 decoration-1">
          {story.title}
        </Link>
      </h3>
      <p className={`mt-2 font-serif leading-relaxed text-muted-foreground ${size === "md" ? "text-[15px] line-clamp-5" : "text-sm line-clamp-4"}`}>
        {story.summary}
      </p>
      <Stat story={story} />
      <Meta story={story} />
    </article>
  );
}

function Lead({ lead }: { lead: FrontLead }) {
  return (
    <article className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <Kicker story={lead} live={lead.live} />
        <h3 className="font-serif text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          <Link href={lead.href} className="hover:underline underline-offset-4 decoration-1">
            {lead.title}
          </Link>
        </h3>
        <p className="mt-3 font-serif text-base leading-relaxed text-muted-foreground sm:text-[17px]">{lead.summary}</p>
        <ul className="mt-4 space-y-1.5 font-sans text-[13px] font-semibold text-foreground">
          <li>
            <Link href={lead.href} className="hover:underline underline-offset-4">Read the event file, with all {lead.sourceCount} sources →</Link>
          </li>
          <li>
            <Link href={lead.feedHref} className="hover:underline underline-offset-4">Watch the story as a feed →</Link>
          </li>
        </ul>
        <Meta story={lead} prefix="Updated" />
      </div>
      {lead.numbers.length > 0 && (
        <div className="border-t border-border pt-4 md:col-span-2 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <p className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">By the numbers</p>
          <dl>
            {lead.numbers.map((n) => (
              <div key={n.label} className="border-b border-border py-3 last:border-b-0">
                <dd className="font-serif text-[28px] font-bold leading-tight text-foreground">{n.value}</dd>
                <dt className="mt-0.5 font-sans text-[12px] text-muted-foreground">{n.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-2 font-sans text-[11px] text-muted-foreground">Each figure is quoted from its source in the event file.</p>
        </div>
      )}
    </article>
  );
}

const NOTEBOOK_LINKS = [
  { label: "AI Notebook", note: "chapters, timeline, contributors", href: "/notebook/ai" },
  { label: "Business Notebook", note: "notes and every company file", href: "/notebook/business" },
  { label: "Conference Notebook", note: "talks and speakers, by conference", href: "/notebook/conference" },
  { label: "The AI Intelligence Graph", note: "the AI economy as one graph", href: "/notebook/ai/graph" },
  { label: "All Guides", note: "every guide, grouped by subject", href: "/guides" },
  { label: "Knowledge Graph Feeds", note: "each story read from every platform", href: "/feeds" },
];

export default function NewsFront({ front }: { front: FrontPage }) {
  const { lead, top, sections, latest, updatedAt } = front;
  // The rail shows the newest eight so it ends near the lead package; every story is also below, in its section.
  const LATEST_MAX = 8;
  const rail = latest.slice(0, LATEST_MAX);
  const nav = [
    { id: "top-stories", label: "Top stories" },
    ...sections.map((s) => ({ id: s.id, label: s.title })),
    { id: "latest", label: "Latest" },
    { id: "notebooks", label: "From the notebooks" },
  ];
  return (
    <div className="min-h-screen bg-background pb-20 pt-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 border-b border-border py-2 font-sans text-[11px] text-muted-foreground">
          <span>Updated {fullDate(updatedAt)}</span>
          <span className="hidden sm:inline">{latest.length} stories, every one with its sources</span>
        </div>

        <header className="pb-4 pt-6 text-center">
          <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Notebooks · News and Updates</p>
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">Tech &amp; Business</h1>
          <p className="mt-3 font-serif text-sm italic text-muted-foreground sm:text-base">
            News and updates on AI, technology and business. Every story carries its primary sources.
          </p>
        </header>
        <div className="border-t border-foreground/80" />
        <div className="mt-[3px] border-t border-foreground/80" />

        <nav aria-label="Sections" className="flex gap-6 overflow-x-auto border-b border-border py-2.5 font-sans text-[12px] font-semibold text-foreground sm:justify-center">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="whitespace-nowrap hover:underline underline-offset-4">
              {n.label}
            </a>
          ))}
        </nav>

        <section id="top-stories" aria-labelledby="top-stories-h" className="mt-6 grid scroll-mt-24 lg:grid-cols-12">
          <h2 id="top-stories-h" className="sr-only">Top stories</h2>
          <div className="lg:col-span-9 lg:border-r lg:border-border lg:pr-6">
            {lead && <Lead lead={lead} />}
            {top.length > 0 && (
              <div className={`grid gap-6 sm:grid-cols-2 ${lead ? "mt-6 border-t border-border pt-6" : ""}`}>
                {top.map((s, i) => (
                  <div key={s.id} className={i === 1 ? "sm:border-l sm:border-border sm:pl-6" : ""}>
                    <Story story={s} size="md" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside id="latest" aria-labelledby="latest-h" className="mt-10 scroll-mt-24 lg:col-span-3 lg:mt-0 lg:pl-6">
            <h2 id="latest-h" className="mb-1 border-b-2 border-foreground pb-1 font-sans text-[12px] font-bold uppercase tracking-wider text-foreground">
              Latest
            </h2>
            <ol className="divide-y divide-border">
              {rail.map((s) => (
                <li key={s.id} className="py-2.5">
                  <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                    <time dateTime={s.date}>{apDate(s.date)}</time> · {SECTION_LABEL[s.section]}
                  </p>
                  <Link href={s.href} className="mt-0.5 block font-serif text-[15px] font-semibold leading-snug text-foreground hover:underline underline-offset-4">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ol>
            {latest.length > rail.length && (
              <p className="border-t border-border pt-2.5 font-sans text-[11px] text-muted-foreground">
                All {latest.length} stories are below, by section.
              </p>
            )}
          </aside>
        </section>

        {sections.map((sec) => {
          const cards = sec.stories.slice(0, 4);
          const more = sec.stories.slice(4);
          return (
            <section key={sec.id} id={sec.id} aria-labelledby={`${sec.id}-h`} className="mt-12 scroll-mt-24">
              <h2 id={`${sec.id}-h`} className="mb-5 flex items-baseline justify-between border-t-2 border-foreground pt-2 font-sans text-[13px] font-bold uppercase tracking-wider text-foreground">
                {sec.title}
                <span className="font-normal normal-case tracking-normal text-muted-foreground">{sec.stories.length} {sec.stories.length === 1 ? "story" : "stories"}</span>
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((s, i) => (
                  <div key={s.id} className={i % 4 !== 0 ? "lg:border-l lg:border-border lg:pl-6" : ""}>
                    <Story story={s} size="sm" />
                  </div>
                ))}
              </div>
              {more.length > 0 && (
                <ul className="mt-6 grid gap-x-6 border-t border-border sm:grid-cols-2 lg:grid-cols-3">
                  {more.map((s) => (
                    <li key={s.id} className="flex gap-3 border-b border-border py-3">
                      {s.image && (
                        <img src={s.image.src} alt="" width={96} height={54} className="h-[54px] w-24 shrink-0 object-cover" loading="lazy" decoding="async" />
                      )}
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                          {s.kicker} · <time dateTime={s.date}>{apDate(s.date)}</time>
                        </p>
                        <Link href={s.href} className="mt-0.5 block font-serif text-base font-semibold leading-snug text-foreground hover:underline underline-offset-4">
                          {s.title}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <section id="notebooks" aria-labelledby="notebooks-h" className="mt-14 scroll-mt-24 border-t-2 border-foreground pt-2">
          <h2 id="notebooks-h" className="mb-4 font-sans text-[13px] font-bold uppercase tracking-wider text-foreground">From the notebooks</h2>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {NOTEBOOK_LINKS.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="font-serif text-lg font-bold text-foreground hover:underline underline-offset-4">
                  {n.label}
                </Link>
                <p className="font-sans text-[12px] text-muted-foreground">{n.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
