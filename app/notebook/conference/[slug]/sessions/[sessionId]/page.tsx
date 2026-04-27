import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionDetail, { type SessionDetailContext } from "@/views/SessionDetail";
import { conferences, getConferenceBySlug, type Session } from "@/data/conferences";

interface Params {
  slug: string;
  sessionId: string;
}

interface Props {
  params: Params;
}

// Render on-demand at request time so we don't build 91 SSG pages into memory.
// SEO is preserved: bots get fully-rendered HTML on first hit.
export const dynamic = "force-dynamic";

const sessionKey = (dayDate: string, s: Session) =>
  `${dayDate}__${s.start}__${s.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

function findSession(slug: string, sessionId: string): SessionDetailContext | null {
  const c = getConferenceBySlug(slug);
  if (!c) return null;
  // Flatten with day index for prev/next
  const flat: { day: (typeof c.days)[number]; session: Session; sessionId: string; dayIndex: number }[] = [];
  c.days.forEach((d, di) => {
    d.sessions.forEach((s) => {
      flat.push({ day: d, session: s, sessionId: sessionKey(d.date, s), dayIndex: di });
    });
  });
  const idx = flat.findIndex((f) => f.sessionId === sessionId);
  if (idx === -1) return null;
  const cur = flat[idx];
  const prev = idx > 0 ? flat[idx - 1] : undefined;
  const next = idx < flat.length - 1 ? flat[idx + 1] : undefined;
  return {
    conference: c,
    session: cur.session,
    sessionId: cur.sessionId,
    dayDate: cur.day.date,
    dayIndex: cur.dayIndex,
    dayTheme: cur.day.theme,
    prev: prev
      ? { sessionId: prev.sessionId, title: prev.session.title, start: prev.session.start }
      : undefined,
    next: next
      ? { sessionId: next.sessionId, title: next.session.title, start: next.session.start }
      : undefined,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = findSession(params.slug, params.sessionId);
  if (!ctx) return { title: "Session not found" };
  const title = `${ctx.session.title} · ${ctx.conference.name} ${ctx.conference.edition || ctx.conference.year}`;
  const desc = ctx.session.description || ctx.session.title;
  const url = `/notebook/conference/${ctx.conference.slug}/sessions/${ctx.sessionId}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { url, title, description: desc },
  };
}

export default function Page({ params }: Props) {
  const ctx = findSession(params.slug, params.sessionId);
  if (!ctx) notFound();
  return <SessionDetail ctx={ctx} />;
}
