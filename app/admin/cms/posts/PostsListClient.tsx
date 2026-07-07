"use client";

import * as React from "react";
import Link from "next/link";
import { adminApi, formatApiError, useRequireAdmin } from "@/lib/admin-client";

type Pillar = { slug: string; title: string };
type Post = {
  slug: string;
  title: string;
  pillarSlug: string;
  excerpt?: string;
  status?: string;
  date?: string;
  updatedAt?: string;
  tags?: string[];
};

const STATUS_PILL: Record<string, string> = {
  published: "border-emerald-400/40 text-emerald-300/90",
  draft: "border-amber-400/40 text-amber-300/90",
  scheduled: "border-sky-400/40 text-sky-300/90",
};

export default function PostsListClient() {
  const { status: authStatus } = useRequireAdmin();
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [pillars, setPillars] = React.useState<Pillar[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("all");
  const [pillarFilter, setPillarFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const reload = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [p, pl] = await Promise.all([
        adminApi.get<Post[]>("/admin/cms/posts"),
        adminApi.get<Pillar[]>("/admin/cms/pillars"),
      ]);
      setPosts(p.data);
      setPillars(pl.data);
    } catch (e) {
      setErr(formatApiError(e, "Failed to load posts."));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (authStatus === "authed") reload();
  }, [authStatus, reload]);

  const onDelete = async (slug: string) => {
    if (!confirm(`Delete post "${slug}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/admin/cms/posts/${slug}`);
      reload();
    } catch (e) {
      alert(formatApiError(e, "Failed to delete."));
    }
  };

  const filtered = posts.filter((p) => {
    if (filter !== "all" && (p.status || "draft") !== filter) return false;
    if (pillarFilter !== "all" && p.pillarSlug !== pillarFilter) return false;
    if (search && !`${p.title} ${p.slug} ${(p.tags || []).join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (authStatus === "checking") return <div className="p-12 text-muted-foreground">Checking auth…</div>;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="cms-posts-page">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[11px] font-mono text-muted-foreground/70 mb-1">CMS</div>
            <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create, edit, and publish blog posts. Changes go live instantly — no redeploy.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin"
              className="px-3 py-2 text-xs font-mono border border-foreground/15 hover:border-foreground/30 transition-colors"
              data-testid="cms-back-to-dashboard"
            >
              ← Dashboard
            </Link>
            <Link
              href="/admin/cms/posts/new"
              className="px-4 py-2 text-xs font-mono bg-foreground text-background hover:bg-foreground/85 transition-colors"
              data-testid="cms-new-post-btn"
            >
              + New Post
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <input
            type="search"
            placeholder="Search title, slug, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border border-foreground/15 px-3 py-2 text-sm font-mono w-64"
            data-testid="cms-search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-background border border-foreground/15 px-3 py-2 text-sm font-mono"
            data-testid="cms-status-filter"
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className="bg-background border border-foreground/15 px-3 py-2 text-sm font-mono"
            data-testid="cms-pillar-filter"
          >
            <option value="all">All pillars</option>
            {pillars.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {posts.length}</span>
        </div>

        {err && <div className="border border-rose-500/40 text-rose-300/90 px-4 py-3 text-sm mb-4">{err}</div>}
        {loading ? (
          <div className="p-12 text-muted-foreground text-center">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-muted-foreground text-center border border-dashed border-foreground/15">
            No posts match your filters.
          </div>
        ) : (
          <div className="border border-foreground/10">
            {filtered.map((p) => {
              const status = p.status || "draft";
              return (
                <div
                  key={p.slug}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.02] transition-colors"
                  data-testid={`cms-post-row-${p.slug}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${STATUS_PILL[status] || "border-foreground/20 text-foreground/70"}`}>
                        {status}
                      </span>
                      <Link
                        href={`/admin/cms/posts/${encodeURIComponent(p.slug)}`}
                        className="font-medium hover:underline truncate"
                        data-testid={`cms-post-edit-${p.slug}`}
                      >
                        {p.title}
                      </Link>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground/70 truncate">
                      {p.pillarSlug} / {p.slug} · {p.date || "no date"} {p.tags && p.tags.length > 0 ? "· " + p.tags.slice(0, 4).join(", ") : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {status === "published" && (
                      <Link
                        href={`/insights/${p.pillarSlug}/${p.slug}`}
                        target="_blank"
                        className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30 transition-colors"
                        data-testid={`cms-post-view-${p.slug}`}
                      >
                        View ↗
                      </Link>
                    )}
                    <button
                      onClick={() => onDelete(p.slug)}
                      className="px-2 py-1 text-[10px] font-mono border border-rose-500/30 text-rose-300/80 hover:bg-rose-500/10 transition-colors"
                      data-testid={`cms-post-delete-${p.slug}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
