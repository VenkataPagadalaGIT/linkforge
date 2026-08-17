"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btnPrimary, inputBase, inputClass, focusRing, Field } from "@/components/admin/CmsShell";

/**
 * Pages: every content type in one list, filterable, with the resolved SEO
 * visible without opening anything. The old CMS answered "how many posts";
 * this answers "what is published, what is waiting, and is its SEO sane".
 */

interface PageType { id: string; label: string; schemaType: string; route: string }
interface PageRow {
  id: string; type: string; slug: string; title: string; status: string;
  updatedAt?: string;
  provenance?: { author?: string; agentName?: string };
  seo?: { seoTitle?: string; metaDescription?: string };
}

const STATUS_STYLE: Record<string, string> = {
  published: "border-emerald-400/60 text-emerald-700 dark:text-emerald-300",
  in_review: "border-amber-400/60 text-amber-700 dark:text-amber-300",
  draft: "border-border text-muted-foreground",
  archived: "border-border text-muted-foreground/70",
};

export default function PagesListClient() {
  const { status: authStatus } = useRequireAdmin();
  const [types, setTypes] = React.useState<PageType[]>([]);
  const [rows, setRows] = React.useState<PageRow[]>([]);
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [q, setQ] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newType, setNewType] = React.useState("ai-update");
  const [newTitle, setNewTitle] = React.useState("");

  /**
   * `note` carries a confirmation through the reload that follows an action.
   * Without it, "Draft created." was overwritten by the row count a moment
   * later, so the live region announced a number instead of the outcome and
   * the only feedback the owner got vanished before it could be read.
   */
  const load = React.useCallback(async (note?: string) => {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (q) params.set("q", q);
    try {
      const { data } = await adminApi.get(`/cms/pages?${params}`);
      setRows(data);
      const count = `${data.length} page${data.length === 1 ? "" : "s"}`;
      setMsg(note ? `${note} ${count} shown.` : count);
    } catch {
      setMsg("Could not load pages.");
    }
  }, [typeFilter, statusFilter, q]);

  React.useEffect(() => {
    if (authStatus !== "authed") return;
    adminApi.get("/cms/types").then(({ data }) => setTypes(data)).catch(() => undefined);
  }, [authStatus]);

  React.useEffect(() => {
    if (authStatus === "authed") void load();
  }, [authStatus, load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await adminApi.post("/cms/pages", {
        type: newType,
        slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title: newTitle,
        status: "draft",
      });
      setNewTitle("");
      await load("Draft created.");
    } catch {
      setMsg("Could not create that page.");
    } finally {
      setCreating(false);
    }
  };

  if (authStatus !== "authed") return null;

  return (
    <CmsShell
      title="Pages"
      intro="Every content type in one place. Filter by type or status, and see the SEO title each page will actually ship with."
      status={msg}
    >
      <form onSubmit={create} className="border border-border p-4 mb-6 grid sm:grid-cols-[200px_1fr_auto] gap-3 items-end">
        <Field label="New page type" id="new-type">
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className={inputClass}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Title" id="new-title" hint="The slug is derived from this and frozen once published.">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={inputClass} placeholder="Working title" />
        </Field>
        <div className="mb-4">
          <button type="submit" disabled={creating} className={btnPrimary}>
            {creating ? "Creating…" : "Create draft"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-3 mb-4" role="search">
        <label className="sr-only" htmlFor="filter-q">Search pages</label>
        <input
          id="filter-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or slug"
          className={`${inputBase} w-full sm:w-72`}
        />
        <label className="sr-only" htmlFor="filter-type">Filter by type</label>
        <select id="filter-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputBase} w-full sm:w-52`}>
          <option value="">All types</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <label className="sr-only" htmlFor="filter-status">Filter by status</label>
        <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputBase} w-full sm:w-44`}>
          <option value="">All except archived</option>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground border border-border p-6">
          No pages yet for this filter. Create one above, or let an agent draft one.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full border-collapse min-w-[820px]">
            <caption className="sr-only">Content pages with type, status, author and SEO title</caption>
            <thead>
              <tr className="bg-secondary/30">
                {["Title", "Type", "Status", "Author", "SEO title", "Updated"].map((h) => (
                  <th key={h} scope="col" className="text-left p-3 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-secondary/10">
                  <td className="p-3 border-b border-border/50">
                    <span className="font-mono text-xs text-foreground">{r.title}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground/70">/{r.slug}</span>
                  </td>
                  <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{r.type}</td>
                  <td className="p-3 border-b border-border/50">
                    <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${STATUS_STYLE[r.status] ?? ""}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">
                    {r.provenance?.author === "agent" ? (r.provenance.agentName ?? "agent") : "human"}
                  </td>
                  <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">
                    {r.seo?.seoTitle ?? <span className="text-muted-foreground/70">falls back to type pattern</span>}
                  </td>
                  <td className="p-3 border-b border-border/50 font-mono text-[10px] text-muted-foreground/70 whitespace-nowrap">
                    {r.updatedAt?.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="font-mono text-[10px] text-muted-foreground/70 mt-4">
        Drafts waiting on you appear in the{" "}
        <a href="/admin/cms/review" className={`text-foreground underline decoration-border ${focusRing}`}>review queue</a>.
      </p>
    </CmsShell>
  );
}
