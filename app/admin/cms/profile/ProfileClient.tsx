"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btn, btnPrimary } from "@/components/admin/CmsShell";

/**
 * Site profile: what the owner tells agents, shown as the agents will read
 * it. The permission matrix and locked paths here are the same data the
 * API enforces, rendered from the same endpoint, so the screen cannot say
 * one thing while the server does another.
 */

interface Perm {
  create?: boolean; update?: boolean; refresh?: boolean; proposeArchive?: boolean;
  fields?: string[]; note?: string;
}
const FIELD_ORDER = ["body", "title", "seoTitle", "metaDescription", "primaryKeyword", "templateFields", "internalLinks", "sources", "canonical", "robots", "ogImage", "schema"];
interface PageType { id: string; label: string; route: string; agentDraftable?: boolean }
interface Profile {
  profileVersion: string;
  identity: { siteId: string; siteName: string; siteUrl: string; purpose: string; mustNeverBecome: string[] };
  truthFile: { owner: { claimsAllowed: string[]; claimsForbidden: string[] }; claimsPolicy: Record<string, unknown> };
  voice: { bannedPunctuation: string[]; bannedWords: string[]; exemplars: string[] };
  keywordOwnership: Record<string, string>;
  permissions: Record<string, Perm>;
  lockedPaths: { path: string; why: string }[];
  operations: { agentsPaused?: boolean; openDraftCapPerAgent: number; tokenLifetimeDays: number };
}

type Op = "create" | "update" | "refresh" | "proposeArchive";
const OPS: Op[] = ["create", "update", "refresh", "proposeArchive"];
const OP_LABEL: Record<string, string> = {
  create: "Create", update: "Update", refresh: "Refresh", proposeArchive: "Propose archive",
};

function YesNo({ v }: { v: boolean }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
      v ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground/70"
    }`}>
      {v ? "yes" : "no"}
    </span>
  );
}

export default function ProfileClient() {
  const { status: authStatus } = useRequireAdmin();
  const [p, setP] = React.useState<Profile | null>(null);
  const [types, setTypes] = React.useState<PageType[]>([]);
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const [{ data: prof }, { data: ty }] = await Promise.all([
      adminApi.get("/cms/profile"),
      adminApi.get("/cms/types"),
    ]);
    setP(prof);
    setTypes(ty);
  }, []);

  React.useEffect(() => {
    if (authStatus === "authed") void load().catch(() => setMsg("Could not load the profile."));
  }, [authStatus, load]);

  const togglePause = async () => {
    if (!p) return;
    setBusy(true);
    try {
      const next = !p.operations.agentsPaused;
      await adminApi.post("/cms/profile/pause", { paused: next });
      await load();
      setMsg(next
        ? "Agents paused. Every agent write is refused until you resume. Tokens stay valid."
        : "Agents resumed. Drafting is allowed again.");
    } catch {
      setMsg("Could not change the pause state.");
    } finally {
      setBusy(false);
    }
  };

  if (authStatus !== "authed") return null;
  if (!p) return <CmsShell title="Site profile" status={msg}><p className="font-mono text-xs text-muted-foreground">Loading…</p></CmsShell>;

  const paused = !!p.operations.agentsPaused;

  return (
    <CmsShell
      title="Site profile"
      intro="What the owner tells agents. Agents read this at /cms/agent/profile, and the API enforces it: the permission matrix and locked paths below are the same data that refuses or allows every agent call."
      status={msg}
      actions={
        <button type="button" onClick={togglePause} disabled={busy} className={paused ? btnPrimary : btn}>
          {busy ? "Working…" : paused ? "Resume agents" : "Pause all agents"}
        </button>
      }
    >
      {paused && (
        <p role="alert" className="font-mono text-[11px] text-amber-700 dark:text-amber-300 border border-amber-400/60 px-3 py-2 mb-6">
          Agents are paused site-wide. Every agent write returns 403 until you resume.
        </p>
      )}

      <section aria-labelledby="matrix-h" className="mb-10">
        <h2 id="matrix-h" className="font-display text-base font-bold text-foreground mb-1">Permission matrix</h2>
        <p className="font-mono text-[11px] text-muted-foreground mb-3 max-w-4xl">
          Per page type, by operation and by field. A token must also be scoped to the type, and an individual agent can be narrowed further on the Agents screen; this matrix is the ceiling.
          Update means a proposed revision to a published page through the review queue. There is no delete: the strongest action is propose archive, which you decide.
          Canonical, robots and schema are owner-only for every type. Code, templates, routes and navigation are not fields and cannot be granted to anyone.
        </p>
        <div className="overflow-x-auto border border-border">
          <table className="w-full border-collapse min-w-[1400px]">
            <caption className="sr-only">What agents may do per page type, by operation and by field</caption>
            <thead>
              <tr className="bg-secondary/30">
                {["Type", "Route", ...OPS.map((o) => OP_LABEL[o]), ...FIELD_ORDER, "Note"].map((h) => (
                  <th key={h} scope="col" className="text-left p-3 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const perm = p.permissions[t.id] ?? {};
                const draftable = t.agentDraftable !== false;
                return (
                  <tr key={t.id} className="align-top">
                    <td className="p-3 border-b border-border/50 font-mono text-xs text-foreground whitespace-nowrap">
                      {t.label}
                      <span className="block text-[10px] text-muted-foreground/70">{t.id}</span>
                    </td>
                    <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{t.route}</td>
                    {OPS.map((o) => (
                      <td key={o} className="p-3 border-b border-border/50">
                        <YesNo v={o === "create" ? draftable && !!perm.create : !!perm[o]} />
                      </td>
                    ))}
                    {FIELD_ORDER.map((f) => (
                      <td key={f} className="p-2 border-b border-border/50 text-center">
                        <YesNo v={draftable && (perm.fields ?? []).includes(f)} />
                      </td>
                    ))}
                    <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground max-w-xs">
                      {!draftable ? "Not agent-draftable at the type level." : perm.note ?? ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-10 mb-10">
        <section aria-labelledby="locks-h">
          <h2 id="locks-h" className="font-display text-base font-bold text-foreground mb-1">Locked paths</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-3">
            No agent touches these, whatever the type grant says. Locks are checked before permissions.
          </p>
          <ul className="border border-border divide-y divide-border/50">
            {p.lockedPaths.map((l) => (
              <li key={l.path} className="p-3">
                <code className="font-mono text-xs text-foreground">{l.path}</code>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{l.why}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="truth-h">
          <h2 id="truth-h" className="font-display text-base font-bold text-foreground mb-1">Truth file</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-3">
            What agents may and may not claim about the owner. They must not contradict it and must not extend it.
          </p>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">Allowed</h3>
          <ul className="mb-3 space-y-1">
            {p.truthFile.owner.claimsAllowed.map((c) => (
              <li key={c} className="font-mono text-[11px] text-foreground">{c}</li>
            ))}
          </ul>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">Forbidden</h3>
          <ul className="mb-3 space-y-1">
            {p.truthFile.owner.claimsForbidden.map((c) => (
              <li key={c} className="font-mono text-[11px] text-amber-700 dark:text-amber-300">{c}</li>
            ))}
          </ul>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">Claims policy</h3>
          <ul className="space-y-1">
            {Object.entries(p.truthFile.claimsPolicy).map(([k, v]) => (
              <li key={k} className="font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">{k}</span>: {typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <section aria-labelledby="voice-h">
          <h2 id="voice-h" className="font-display text-base font-bold text-foreground mb-2">Voice</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-1">Banned punctuation: <span className="text-foreground">{p.voice.bannedPunctuation.join(", ")}</span></p>
          <p className="font-mono text-[11px] text-muted-foreground mb-1">Banned words: <span className="text-foreground">{p.voice.bannedWords.join(", ")}</span></p>
          <p className="font-mono text-[11px] text-muted-foreground">Write like: {p.voice.exemplars.map((e) => (
            <a key={e} href={e} className="text-foreground underline decoration-border mr-2" target="_blank" rel="noopener noreferrer">{e}</a>
          ))}</p>
        </section>
        <section aria-labelledby="kw-h">
          <h2 id="kw-h" className="font-display text-base font-bold text-foreground mb-2">Keyword ownership</h2>
          <p className="font-mono text-[11px] text-muted-foreground mb-2">One keyword, one page. An agent proposing a page for one of these is proposing cannibalization.</p>
          <ul className="space-y-1">
            {Object.entries(p.keywordOwnership).map(([k, v]) => (
              <li key={k} className="font-mono text-[11px]"><span className="text-foreground">{k}</span> <span className="text-muted-foreground/70">→ {v}</span></li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="ops-h">
          <h2 id="ops-h" className="font-display text-base font-bold text-foreground mb-2">Operations</h2>
          <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
            <li>Profile version: <span className="text-foreground">{p.profileVersion}</span></li>
            <li>Open drafts per agent: <span className="text-foreground">{p.operations.openDraftCapPerAgent}</span></li>
            <li>Token lifetime: <span className="text-foreground">{p.operations.tokenLifetimeDays} days</span></li>
            <li>Agents: <span className="text-foreground">{paused ? "paused" : "active"}</span></li>
            <li>Agents read this at <code>/cms/agent/profile</code>; the source is <code>backend/site_profile.py</code>.</li>
          </ul>
        </section>
      </div>
    </CmsShell>
  );
}
