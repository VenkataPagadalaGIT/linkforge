"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi, clearToken, formatApiError, useRequireAdmin } from "@/lib/admin-client";

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
  const router = useRouter();
  const { status, email } = useRequireAdmin();

  const [tab, setTab] = React.useState<"contacts" | "subscribers">("contacts");
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [subs, setSubs] = React.useState<Subscriber[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
  }, []);

  React.useEffect(() => {
    if (status === "authed") loadAll();
  }, [status, loadAll]);

  const logout = async () => {
    try {
      await adminApi.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearToken();
    router.replace("/admin/login");
  };

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

  if (status !== "authed") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground/60">
        {status === "checking" ? "Checking session…" : "Redirecting…"}
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-muted-foreground/60 uppercase mb-2 font-mono">
              Mono Mind · Admin
            </p>
            <h1 className="font-display text-4xl font-bold text-foreground text-glow">Dashboard</h1>
            <p className="text-xs text-muted-foreground font-mono mt-2">
              Signed in as <span className="text-foreground">{email}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/cms/posts"
              className="border border-foreground/30 hover:border-foreground/60 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-foreground transition-all"
              data-testid="admin-cms-link"
            >
              CMS · Posts
            </Link>
            <button
              onClick={loadAll}
              disabled={loading}
              className="border border-border/40 hover:border-foreground/40 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
              data-testid="admin-refresh"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={logout}
              className="border border-border/40 hover:border-destructive/50 hover:text-destructive-foreground px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground transition-all"
              data-testid="admin-logout"
            >
              Sign out
            </button>
          </div>
        </div>

        {err && (
          <div
            className="mb-8 text-[11px] font-mono text-destructive-foreground/90 border border-destructive/50 bg-destructive/10 px-4 py-3"
            role="alert"
            data-testid="admin-error"
          >
            {err}
          </div>
        )}

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
                <p className="text-[9px] tracking-[0.2em] text-muted-foreground/50 uppercase font-mono mb-2">
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
              <thead className="text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
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
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground/50">
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
                      <td className="px-4 py-3 text-muted-foreground">{c.subject || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground/60">{c.source || "—"}</td>
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
              <thead className="text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
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
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground/50">
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
                    <td className="px-4 py-3 text-muted-foreground">{s.source || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.tag || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
