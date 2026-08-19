"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, formatApiError, useRequireAdmin } from "@/lib/admin-client";
import AdminForbidden from "@/components/admin/AdminForbidden";
import CmsShell, { btn } from "@/components/admin/CmsShell";

type Contact = {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  source?: string | null;
  created_at: string;
};
type Subscriber = {
  id: string;
  email: string;
  source?: string | null;
  tag?: string | null;
  created_at: string;
};
type Overview = {
  contact_submissions: number;
  newsletter_subscribers: number;
  contributors: number;
  updates: number;
  pillars: number;
  posts: number;
};

export default function DashboardClient() {
  const { status, email } = useRequireAdmin();

  const [tab, setTab] = React.useState<"contacts" | "subscribers">("contacts");
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [subs, setSubs] = React.useState<Subscriber[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [awaiting, setAwaiting] = React.useState<number | null>(null);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [o, c, s] = await Promise.all([
        adminApi.get<Overview>("/admin/overview"),
        adminApi.get<Contact[]>("/admin/contact-submissions"),
        adminApi.get<Subscriber[]>("/admin/newsletter-subscribers"),
      ]);
      setOverview(o.data);
      setContacts(c.data);
      setSubs(s.data);
    } catch (e) {
      setErr(formatApiError(e, "Failed to load admin data."));
    } finally {
      setLoading(false);
    }

    // Separate from the block above on purpose: a draft count is useful but
    // never important enough to blank the dashboard if the CMS is unreachable.
    try {
      const { data } = await adminApi.get<unknown[]>("/cms/review");
      setAwaiting(data.length);
    } catch {
      setAwaiting(null);
    }
  }, []);

  React.useEffect(() => {
    if (status === "authed") loadAll();
  }, [status, loadAll]);

  const exportCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "forbidden") return <AdminForbidden />;
  if (status !== "authed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground/70">
        {status === "checking" ? "Checking session…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <CmsShell
      title="Dashboard"
      intro={email ? `Signed in as ${email}` : undefined}
      actions={
        <button
          onClick={loadAll}
          disabled={loading}
          className={btn}
          data-testid="admin-refresh"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      }
    >

        {err && (
          <div
            className="mb-8 text-[11px] font-mono text-destructive-foreground/90 border border-destructive/50 bg-destructive/10 px-4 py-3"
            role="alert"
            data-testid="admin-error"
          >
            {err}
          </div>
        )}

        {/* Agentic CMS: the way into every content type, not just posts. */}
        <section aria-labelledby="agentic-h" className="border border-border/40 p-5 mb-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
            <h2 id="agentic-h" className="font-display text-lg font-bold text-foreground">
              Agentic CMS
            </h2>
            {awaiting !== null && (
              <p
                className={`font-mono text-[11px] ${
                  awaiting > 0 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
                }`}
                data-testid="admin-awaiting-review"
              >
                {awaiting === 0
                  ? "Nothing awaiting review"
                  : `${awaiting} draft${awaiting === 1 ? "" : "s"} awaiting your review`}
              </p>
            )}
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mb-4 max-w-2xl leading-relaxed">
            Ten page types, SEO that cascades from globals to page type to page, and publish gates
            that run again on the server at approval. Agents can draft and submit here. Only you can
            publish.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: "/admin/cms/review", label: "Review queue", note: "Approve or send back agent drafts" },
              { href: "/admin/cms/pages", label: "Pages", note: "Every content type in one list" },
              { href: "/admin/cms/globals", label: "Global SEO", note: "One edit changes every page" },
              { href: "/admin/cms/agents", label: "Agents", note: "Issue and revoke agent tokens" },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="block border border-border/40 hover:border-foreground/50 p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground mb-1">
                  {c.label}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground/80 leading-relaxed">{c.note}</p>
              </Link>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted-foreground/70 mt-4">
            The older post editor is still here:{" "}
            <Link href="/admin/cms/posts" className="text-foreground underline decoration-border" data-testid="admin-cms-link">
              CMS · Posts
            </Link>
            .
          </p>
        </section>

        {/* Overview tiles */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-10" data-testid="admin-overview">
          {overview &&
            [
              { k: "Contacts", v: overview.contact_submissions },
              { k: "Subscribers", v: overview.newsletter_subscribers },
              { k: "Contributors", v: overview.contributors },
              { k: "Updates", v: overview.updates },
              { k: "Pillars", v: overview.pillars },
              { k: "Posts", v: overview.posts },
            ].map((t) => (
              <div
                key={t.k}
                className="border border-border/40 px-4 py-5 bg-card/20"
                data-testid={`admin-tile-${t.k.toLowerCase()}`}
              >
                <p className="text-[9px] tracking-[0.2em] text-muted-foreground/70 uppercase font-mono mb-2">
                  {t.k}
                </p>
                <p className="font-display text-3xl font-bold text-foreground text-glow">{t.v}</p>
              </div>
            ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { k: "contacts", l: `Contacts (${contacts.length})` },
            { k: "subscribers", l: `Subscribers (${subs.length})` },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`border px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-all ${
                tab === t.k
                  ? "border-foreground text-foreground bg-foreground/10"
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`admin-tab-${t.k}`}
            >
              {t.l}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={() =>
                tab === "contacts"
                  ? exportCSV(contacts as unknown as Record<string, unknown>[], "contacts.csv")
                  : exportCSV(subs as unknown as Record<string, unknown>[], "subscribers.csv")
              }
              className="border border-border/40 hover:border-foreground/40 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-all"
              data-testid="admin-export-csv"
            >
              Export CSV
            </button>
          </div>
        </div>

        {tab === "contacts" && (
          <div className="border border-border/40 overflow-x-auto" data-testid="admin-contacts-table">
            <table className="w-full font-mono text-xs">
              <thead className="text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground/70">
                      No submissions yet.
                    </td>
                  </tr>
                )}
                {contacts.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr
                      className="border-b border-border/20 hover:bg-foreground/5 cursor-pointer"
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      data-testid={`admin-contact-row-${c.id}`}
                    >
                      <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-foreground">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <a href={`mailto:${c.email}`} className="hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                          {c.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.subject || "none"}</td>
                      <td className="px-4 py-3 text-muted-foreground/70">{c.source || "none"}</td>
                    </tr>
                    {expanded === c.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={5} className="px-4 py-4 text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {c.message}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "subscribers" && (
          <div className="border border-border/40 overflow-x-auto" data-testid="admin-subs-table">
            <table className="w-full font-mono text-xs">
              <thead className="text-[10px] tracking-[0.2em] text-muted-foreground/70 uppercase">
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">Tag</th>
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground/70">
                      No subscribers yet.
                    </td>
                  </tr>
                )}
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border/20 hover:bg-foreground/5" data-testid={`admin-sub-row-${s.id}`}>
                    <td className="px-4 py-3 text-muted-foreground/80 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-foreground">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.source || "none"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.tag || "none"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </CmsShell>
  );
}
