"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { adminApi, formatApiError, useRequireAdmin } from "@/lib/admin-client";

const NoteContent = dynamic(() => import("@/components/NoteContent"), { ssr: false });

type Pillar = { slug: string; title: string };

interface PostSeo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  h1?: string | null;
  canonical?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  jsonLdType?: string | null;
}

interface PostForm {
  slug: string;
  title: string;
  pillarSlug: string;
  excerpt: string;
  content: string;
  tags: string[];
  date: string;
  coverImage: string;
  status: "draft" | "published" | "scheduled";
  publishAt: string;
  seo: PostSeo;
}

const EMPTY_SEO: PostSeo = {
  metaTitle: "",
  metaDescription: "",
  h1: "",
  canonical: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  twitterCard: "summary_large_image",
  robotsIndex: true,
  robotsFollow: true,
  jsonLdType: "Article",
};

const blank = (): PostForm => ({
  slug: "",
  title: "",
  pillarSlug: "",
  excerpt: "",
  content: "",
  tags: [],
  date: new Date().toISOString().slice(0, 10),
  coverImage: "",
  status: "draft",
  publishAt: "",
  seo: { ...EMPTY_SEO },
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export default function PostEditorClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { status: authStatus } = useRequireAdmin();
  const isNew = slug === "new";

  const [form, setForm] = React.useState<PostForm>(blank);
  const [originalSlug, setOriginalSlug] = React.useState<string>("");
  const [pillars, setPillars] = React.useState<Pillar[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"content" | "preview" | "seo">("content");

  const update = <K extends keyof PostForm>(k: K, v: PostForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const updateSeo = <K extends keyof PostSeo>(k: K, v: PostSeo[K]) =>
    setForm((f) => ({ ...f, seo: { ...f.seo, [k]: v } }));

  React.useEffect(() => {
    if (authStatus !== "authed") return;
    let cancelled = false;
    (async () => {
      try {
        const { data: pl } = await adminApi.get<Pillar[]>("/admin/cms/pillars");
        if (cancelled) return;
        setPillars(pl);
        if (!isNew) {
          const { data } = await adminApi.get(`/admin/cms/posts/${encodeURIComponent(slug)}`);
          if (cancelled) return;
          setOriginalSlug(data.slug);
          setForm({
            slug: data.slug,
            title: data.title || "",
            pillarSlug: data.pillarSlug || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            tags: data.tags || [],
            date: (data.date || "").slice(0, 10),
            coverImage: data.coverImage || "",
            status: (data.status as PostForm["status"]) || "draft",
            publishAt: data.publishAt || "",
            seo: { ...EMPTY_SEO, ...(data.seo || {}) },
          });
        } else if (pl.length > 0) {
          setForm((f) => ({ ...f, pillarSlug: pl[0].slug }));
        }
      } catch (e) {
        if (!cancelled) setErr(formatApiError(e, "Failed to load post."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authStatus, slug, isNew]);

  const onSlugBlur = () => {
    if (!form.slug && form.title) update("slug", slugify(form.title));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) update("tags", [...form.tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => update("tags", form.tags.filter((x) => x !== t));

  const insertAtCursor = (snippet: string) => {
    const el = document.getElementById("post-content-textarea") as HTMLTextAreaElement | null;
    if (!el) { update("content", form.content + snippet); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = form.content.slice(0, start) + snippet + form.content.slice(end);
    update("content", next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  };

  const onSave = async (publishOverride?: PostForm["status"]) => {
    setErr(null); setOkMsg(null);
    if (!form.title.trim()) return setErr("Title is required.");
    if (!form.slug.trim()) return setErr("Slug is required.");
    if (!form.pillarSlug.trim()) return setErr("Pillar is required.");
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: publishOverride || form.status,
        slug: slugify(form.slug),
      };
      if (isNew) {
        await adminApi.post("/admin/cms/posts", payload);
        setOkMsg("Created.");
        router.replace(`/admin/cms/posts/${payload.slug}`);
      } else {
        await adminApi.put(`/admin/cms/posts/${encodeURIComponent(originalSlug)}`, payload);
        setOkMsg("Saved.");
        if (payload.slug !== originalSlug) {
          router.replace(`/admin/cms/posts/${payload.slug}`);
        } else {
          setForm((f) => ({ ...f, status: payload.status as PostForm["status"] }));
        }
      }
    } catch (e) {
      setErr(formatApiError(e, "Failed to save."));
    } finally {
      setSaving(false);
      setTimeout(() => setOkMsg(null), 3000);
    }
  };

  if (authStatus === "checking" || loading) {
    return <div className="p-12 text-muted-foreground">Loading…</div>;
  }

  const previewUrl = form.pillarSlug && form.slug ? `/insights/${form.pillarSlug}/${form.slug}` : null;

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="cms-post-editor">
      <div className="border-b border-foreground/10 sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <Link href="/admin/cms/posts" className="font-mono text-xs text-muted-foreground hover:text-foreground" data-testid="cms-back-to-list">
            ← Posts
          </Link>
          <span className="text-foreground/30">/</span>
          <span className="font-mono text-xs text-muted-foreground truncate">{isNew ? "New post" : originalSlug}</span>
          <div className="flex-1" />
          {okMsg && <span className="text-xs font-mono text-emerald-400/90">{okMsg}</span>}
          {previewUrl && form.status === "published" && (
            <Link href={previewUrl} target="_blank" className="px-3 py-1.5 text-xs font-mono border border-foreground/15 hover:border-foreground/30 transition-colors" data-testid="cms-view-live">
              View ↗
            </Link>
          )}
          <button
            onClick={() => onSave("draft")}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-mono border border-foreground/20 hover:border-foreground/40 transition-colors disabled:opacity-50"
            data-testid="cms-save-draft-btn"
          >
            Save Draft
          </button>
          <button
            onClick={() => onSave("published")}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-mono bg-emerald-500/90 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
            data-testid="cms-publish-btn"
          >
            {saving ? "Saving…" : form.status === "published" ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="min-w-0">
          {err && <div className="border border-rose-500/40 text-rose-300/90 px-4 py-3 text-sm mb-4" data-testid="cms-error">{err}</div>}

          <input
            type="text"
            placeholder="Post title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            onBlur={onSlugBlur}
            className="w-full bg-transparent border-b border-foreground/15 pb-3 mb-4 text-3xl font-semibold tracking-tight focus:border-foreground/40 outline-none"
            data-testid="cms-title-input"
          />

          <div className="flex gap-2 mb-4 border-b border-foreground/10">
            {(["content", "preview", "seo"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  tab === t ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground hover:text-foreground/80"
                }`}
                data-testid={`cms-tab-${t}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "content" && (
            <>
              <textarea
                placeholder="Excerpt — 1–2 sentence summary"
                value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm mb-4 min-h-[60px] resize-vertical focus:border-foreground/40 outline-none"
                data-testid="cms-excerpt-input"
              />

              <div className="flex flex-wrap gap-1.5 mb-2">
                <button onClick={() => insertAtCursor("\n\n## Heading\n\n")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">H2</button>
                <button onClick={() => insertAtCursor("\n\n### Subheading\n\n")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">H3</button>
                <button onClick={() => insertAtCursor("**bold**")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">B</button>
                <button onClick={() => insertAtCursor("_italic_")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">I</button>
                <button onClick={() => insertAtCursor("\n- ")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">• List</button>
                <button onClick={() => insertAtCursor("\n- [ ] ")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">☐ Task</button>
                <button onClick={() => insertAtCursor("\n> ")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">❝ Quote</button>
                <button onClick={() => insertAtCursor("[link text](https://)")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">🔗 Link</button>
                <button onClick={() => { const url = prompt("Image URL?"); if (url) insertAtCursor(`\n\n![](${url})\n\n`); }} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30" data-testid="cms-insert-image">🖼 Image</button>
                <button onClick={() => { const url = prompt("YouTube/Vimeo URL?"); if (url) insertAtCursor(`\n\n${url}\n\n`); }} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30" data-testid="cms-insert-video">▶ Video</button>
                <button onClick={() => insertAtCursor("\n\n```\ncode\n```\n\n")} className="px-2 py-1 text-[10px] font-mono border border-foreground/15 hover:border-foreground/30">{"</>"}</button>
              </div>

              <textarea
                id="post-content-textarea"
                placeholder="Markdown body. Paste image/YouTube/Vimeo URLs to auto-embed."
                value={form.content}
                onChange={(e) => update("content", e.target.value)}
                className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm font-mono leading-relaxed min-h-[480px] resize-vertical focus:border-foreground/40 outline-none"
                data-testid="cms-content-textarea"
              />
              <div className="text-[11px] text-muted-foreground/60 mt-1.5 font-mono">
                {form.content.length} chars · ~{Math.max(1, Math.round((form.content.match(/\b\w+\b/g) || []).length / 230))} min read
              </div>
            </>
          )}

          {tab === "preview" && (
            <div className="border border-foreground/10 p-6 prose prose-invert max-w-none" data-testid="cms-preview-area">
              <h1 className="text-3xl font-semibold mb-2">{form.seo.h1 || form.title || "Untitled"}</h1>
              {form.excerpt && <p className="text-muted-foreground italic mb-6">{form.excerpt}</p>}
              <NoteContent text={form.content || "_Nothing to preview yet._"} preview={false} />
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-5" data-testid="cms-seo-tab">
              <div className="border border-foreground/10 p-5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Search engines</div>
                <Field label="Meta Title" hint={`${(form.seo.metaTitle || form.title || "").length}/60 — what shows in Google`}>
                  <input value={form.seo.metaTitle || ""} onChange={(e) => updateSeo("metaTitle", e.target.value)} placeholder={form.title || "Defaults to post title"} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm" data-testid="cms-seo-metaTitle" />
                </Field>
                <Field label="Meta Description" hint={`${(form.seo.metaDescription || form.excerpt || "").length}/160 — search snippet`}>
                  <textarea value={form.seo.metaDescription || ""} onChange={(e) => updateSeo("metaDescription", e.target.value)} placeholder={form.excerpt || "Defaults to excerpt"} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm min-h-[70px]" data-testid="cms-seo-metaDescription" />
                </Field>
                <Field label="H1 (visible heading)" hint="Defaults to Title if blank">
                  <input value={form.seo.h1 || ""} onChange={(e) => updateSeo("h1", e.target.value)} placeholder={form.title} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm" data-testid="cms-seo-h1" />
                </Field>
                <Field label="Canonical URL" hint="Auto-derived from /insights/{pillar}/{slug} if blank">
                  <input value={form.seo.canonical || ""} onChange={(e) => updateSeo("canonical", e.target.value)} placeholder={previewUrl || ""} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm font-mono" data-testid="cms-seo-canonical" />
                </Field>
              </div>

              <div className="border border-foreground/10 p-5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Social (OG / Twitter)</div>
                <Field label="OG Title"><input value={form.seo.ogTitle || ""} onChange={(e) => updateSeo("ogTitle", e.target.value)} placeholder={form.seo.metaTitle || form.title} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm" data-testid="cms-seo-ogTitle" /></Field>
                <Field label="OG Description"><textarea value={form.seo.ogDescription || ""} onChange={(e) => updateSeo("ogDescription", e.target.value)} placeholder={form.seo.metaDescription || form.excerpt} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm min-h-[60px]" data-testid="cms-seo-ogDescription" /></Field>
                <Field label="OG Image URL" hint="1200×630 recommended">
                  <input value={form.seo.ogImage || ""} onChange={(e) => updateSeo("ogImage", e.target.value)} placeholder="https://…/cover.jpg" className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm font-mono" data-testid="cms-seo-ogImage" />
                  {form.seo.ogImage && <img src={form.seo.ogImage} alt="OG preview" className="mt-2 max-h-32 border border-foreground/10" />}
                </Field>
                <Field label="Twitter Card">
                  <select value={form.seo.twitterCard || "summary_large_image"} onChange={(e) => updateSeo("twitterCard", e.target.value)} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm" data-testid="cms-seo-twitterCard">
                    <option value="summary_large_image">summary_large_image</option>
                    <option value="summary">summary</option>
                  </select>
                </Field>
              </div>

              <div className="border border-foreground/10 p-5">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Indexing & Schema</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.seo.robotsIndex} onChange={(e) => updateSeo("robotsIndex", e.target.checked)} data-testid="cms-seo-index" /> Allow indexing
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.seo.robotsFollow} onChange={(e) => updateSeo("robotsFollow", e.target.checked)} data-testid="cms-seo-follow" /> Allow following links
                  </label>
                </div>
                <Field label="JSON-LD Schema Type">
                  <select value={form.seo.jsonLdType || "Article"} onChange={(e) => updateSeo("jsonLdType", e.target.value)} className="w-full bg-background border border-foreground/15 px-3 py-2 text-sm" data-testid="cms-seo-jsonLdType">
                    <option value="Article">Article</option>
                    <option value="BlogPosting">BlogPosting</option>
                    <option value="NewsArticle">NewsArticle</option>
                    <option value="WebPage">WebPage</option>
                    <option value="FAQPage">FAQPage</option>
                  </select>
                </Field>
              </div>

              <div className="border border-foreground/10 p-5 bg-foreground/[0.02]">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">SERP Preview</div>
                <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg leading-tight">{form.seo.metaTitle || form.title || "Post title"}</div>
                <div className="text-[#006621] dark:text-[#3c8039] text-xs mt-0.5 font-mono">{form.seo.canonical || (previewUrl ? `https://venkatapagadala.com${previewUrl}` : "https://venkatapagadala.com/…")}</div>
                <div className="text-sm text-muted-foreground mt-1">{form.seo.metaDescription || form.excerpt || "Description will appear here."}</div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="border border-foreground/10 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Publish</div>
            <Field label="Status">
              <select value={form.status} onChange={(e) => update("status", e.target.value as PostForm["status"])} className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-sm" data-testid="cms-status-select">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-sm font-mono" data-testid="cms-date-input" />
            </Field>
            {form.status === "scheduled" && (
              <Field label="Publish At">
                <input type="datetime-local" value={form.publishAt} onChange={(e) => update("publishAt", e.target.value)} className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-sm font-mono" data-testid="cms-publishAt-input" />
              </Field>
            )}
          </div>

          <div className="border border-foreground/10 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Routing</div>
            <Field label="Pillar">
              <select value={form.pillarSlug} onChange={(e) => update("pillarSlug", e.target.value)} className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-sm" data-testid="cms-pillar-select">
                {pillars.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
              </select>
            </Field>
            <Field label="Slug" hint="Lowercase, hyphens only">
              <input value={form.slug} onChange={(e) => update("slug", e.target.value)} className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-sm font-mono" data-testid="cms-slug-input" />
            </Field>
            {previewUrl && (
              <div className="text-[10px] font-mono text-muted-foreground/70 break-all mt-1">→ {previewUrl}</div>
            )}
          </div>

          <div className="border border-foreground/10 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Tags</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((t) => (
                <span key={t} className="font-mono text-[10px] border border-foreground/20 px-2 py-0.5 inline-flex items-center gap-1.5">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-muted-foreground hover:text-rose-400" data-testid={`cms-tag-remove-${t}`}>×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag…" className="flex-1 bg-background border border-foreground/15 px-2 py-1.5 text-xs font-mono" data-testid="cms-tag-input" />
              <button onClick={addTag} className="px-2 py-1.5 text-xs font-mono border border-foreground/20 hover:border-foreground/40">+</button>
            </div>
          </div>

          <div className="border border-foreground/10 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Featured Image</div>
            <input value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} placeholder="https://…/cover.jpg" className="w-full bg-background border border-foreground/15 px-2 py-1.5 text-xs font-mono" data-testid="cms-cover-input" />
            {form.coverImage && <img src={form.coverImage} alt="Cover preview" className="mt-2 w-full max-h-40 object-cover border border-foreground/10" />}
          </div>
        </aside>
      </div>
    </div>
  );
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="mb-3">
    <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-1">{label}</label>
    {children}
    {hint && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</div>}
  </div>
);
