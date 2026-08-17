"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btnPrimary, inputClass, Field } from "@/components/admin/CmsShell";

/**
 * Global SEO: the top of the cascade.
 *
 * Every page falls back to these values, so one edit here changes the whole
 * site without touching a single page. This is the layer the old CMS did
 * not have, which is why metadata had to be written per page type in code.
 */
export default function GlobalsClient() {
  const { status: authStatus } = useRequireAdmin();
  const [g, setG] = React.useState<Record<string, unknown>>({});
  const [msg, setMsg] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (authStatus !== "authed") return;
    adminApi.get("/cms/globals").then(({ data }) => setG(data)).catch(() => setMsg("Could not load globals."));
  }, [authStatus]);

  const set = (k: string, v: unknown) => setG((prev) => ({ ...prev, [k]: v }));
  const org = (g.organization as Record<string, unknown>) ?? {};

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await adminApi.put("/cms/globals", g);
      setG(data);
      setMsg("Saved. Every page that falls back to these values now uses them.");
    } catch {
      setMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (authStatus !== "authed") return null;

  const desc = String(g.defaultMetaDescription ?? "");

  return (
    <CmsShell
      title="Global SEO"
      intro="Site-wide defaults. A page uses its own value when it has one, otherwise its page type, otherwise these. Changing a value here updates every page that inherits it."
      status={msg}
    >
      <form onSubmit={save} className="grid lg:grid-cols-2 gap-x-10 max-w-5xl">
        <section aria-labelledby="identity-h">
          <h2 id="identity-h" className="font-display text-base font-bold text-foreground mb-3">Identity</h2>
          <Field label="Site name" id="siteName">
            <input value={String(g.siteName ?? "")} onChange={(e) => set("siteName", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Site URL" id="siteUrl" hint="Used to build canonicals for every page.">
            <input value={String(g.siteUrl ?? "")} onChange={(e) => set("siteUrl", e.target.value)} className={inputClass} />
          </Field>
          <Field
            label="Title template"
            id="titleTemplate"
            hint="Tokens: {page} and {site}. Pages whose own title already contains a separator are left alone."
          >
            <input value={String(g.titleTemplate ?? "")} onChange={(e) => set("titleTemplate", e.target.value)} className={inputClass} />
          </Field>
          <Field
            label="Default meta description"
            id="defaultMetaDescription"
            hint={`${desc.length} characters. Aim for 140 to 160; the gate enforces it on publish.`}
          >
            <textarea
              value={desc}
              onChange={(e) => set("defaultMetaDescription", e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
        </section>

        <section aria-labelledby="crawl-h">
          <h2 id="crawl-h" className="font-display text-base font-bold text-foreground mb-3">Crawling and sharing</h2>
          <Field label="Robots policy" id="robotsPolicy" hint="Site-wide default. A page can override it.">
            <select value={String(g.robotsPolicy ?? "index,follow")} onChange={(e) => set("robotsPolicy", e.target.value)} className={inputClass}>
              <option value="index,follow">index, follow</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </Field>
          <Field label="Default OG image" id="defaultOgImage">
            <input value={String(g.defaultOgImage ?? "")} onChange={(e) => set("defaultOgImage", e.target.value)} className={inputClass} />
          </Field>

          <h2 className="font-display text-base font-bold text-foreground mb-3 mt-6">Organization schema</h2>
          <Field label="Organization name" id="orgName">
            <input
              value={String(org.name ?? "")}
              onChange={(e) => set("organization", { ...org, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Logo path" id="orgLogo">
            <input
              value={String(org.logo ?? "")}
              onChange={(e) => set("organization", { ...org, logo: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="sameAs profiles" id="orgSameAs" hint="One URL per line. Emitted in Organization JSON-LD site-wide.">
            <textarea
              value={((org.sameAs as string[]) ?? []).join("\n")}
              onChange={(e) => set("organization", { ...org, sameAs: e.target.value.split("\n").filter(Boolean) })}
              rows={3}
              className={inputClass}
            />
          </Field>
        </section>

        <div className="lg:col-span-2 border-t border-border pt-4 mt-2">
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : "Save global settings"}
          </button>
        </div>
      </form>
    </CmsShell>
  );
}
