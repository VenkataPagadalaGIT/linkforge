"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btn, btnPrimary, inputBase, inputClass, Field } from "@/components/admin/CmsShell";

/**
 * Agents: the operations console for every program that writes here.
 *
 * Three tabs, because three questions:
 *   Active    who can write right now, what exactly each may touch, how
 *             much they have done, when they were last seen
 *   Activity  who did what, where, when, and whether it was allowed;
 *             the answer to "something is wrong, who did that"
 *   Revoked   the record of credentials that no longer work
 *
 * A token is scoped to page types; its grant per type (operations and the
 * field groups it may write) can be narrowed below the site profile here,
 * never widened. The raw token is shown once and stored as a hash.
 */

interface Grant { create: boolean; update: boolean; refresh: boolean; proposeArchive: boolean; fields: string[]; note?: string }
interface TokenRow {
  id: string; name: string; allowedTypes: string[]; active: boolean;
  createdAt: string; expiresAt?: string; lastSeenAt?: string; revokedAt?: string;
  stats: { draft: number; inReview: number; published: number; archived: number; refused: number };
  effectivePermissions: Record<string, Grant>;
  permissions?: Record<string, Partial<Grant>>;
}
interface PageType { id: string; label: string; agentDraftable?: boolean }
interface Activity {
  id: string; ts: string; action: string; result: "ok" | "refused" | "error";
  actor: { kind: string; id?: string; name?: string };
  target: { pageId?: string; type?: string; slug?: string; path?: string; tokenId?: string; name?: string };
  detail?: string;
}
interface Summary {
  agentsSeenLastHour: number; agentsActive: number; actions24h: number; refused24h: number; awaitingReview: number;
  busiestAgents24h: { id: string; name: string; actions: number; refused: number }[];
}

type Op = "create" | "update" | "refresh" | "proposeArchive";
const OPS: Op[] = ["create", "update", "refresh", "proposeArchive"];
const OP_LABEL: Record<string, string> = { create: "Create", update: "Update", refresh: "Refresh", proposeArchive: "Propose archive" };
const FIELD_ORDER = ["body", "title", "seoTitle", "metaDescription", "primaryKeyword", "templateFields", "internalLinks", "sources", "canonical", "robots", "ogImage", "schema"];

function ago(iso?: string): string {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Chip({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
      on ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground/70"
    }`}>{children}</span>
  );
}

export default function AgentTokensClient() {
  const { status: authStatus } = useRequireAdmin();
  const [tab, setTab] = React.useState<"active" | "activity" | "revoked">("active");
  const [rows, setRows] = React.useState<TokenRow[]>([]);
  const [types, setTypes] = React.useState<PageType[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [msg, setMsg] = React.useState("");

  // issue form
  const [showIssue, setShowIssue] = React.useState(false);
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>(["ai-update"]);
  const [issued, setIssued] = React.useState<string | null>(null);
  const [whoami, setWhoami] = React.useState<Record<string, unknown> | null>(null);

  // per-agent detail
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Record<string, Partial<Grant>> | null>(null);

  // activity filters
  const [actFilter, setActFilter] = React.useState({ q: "", result: "", actorId: "" });
  const [activity, setActivity] = React.useState<Activity[]>([]);

  const load = React.useCallback(async () => {
    const [{ data: t }, { data: ty }, { data: s }] = await Promise.all([
      adminApi.get("/cms/agent-tokens"),
      adminApi.get("/cms/types"),
      adminApi.get("/cms/activity/summary"),
    ]);
    setRows(t);
    setTypes(ty);
    setSummary(s);
  }, []);

  const loadActivity = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (actFilter.q) params.set("q", actFilter.q);
    if (actFilter.result) params.set("result", actFilter.result);
    if (actFilter.actorId) params.set("actorId", actFilter.actorId);
    params.set("limit", "300");
    const { data } = await adminApi.get(`/cms/activity?${params}`);
    setActivity(data);
  }, [actFilter]);

  React.useEffect(() => {
    if (authStatus === "authed") void load().catch(() => setMsg("Could not load agents."));
  }, [authStatus, load]);

  React.useEffect(() => {
    if (authStatus === "authed" && tab === "activity") void loadActivity().catch(() => setMsg("Could not load activity."));
  }, [authStatus, tab, loadActivity]);

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await adminApi.post("/cms/agent-tokens", { name, allowedTypes: selected });
      setIssued(data.token);
      setMsg("Token issued. Copy it now: it is stored only as a hash and cannot be shown again.");
      try {
        const base = adminApi.defaults.baseURL ?? "";
        const r = await fetch(`${base}/cms/agent/whoami`, { headers: { "X-Agent-Token": data.token } });
        setWhoami(r.ok ? await r.json() : null);
      } catch { setWhoami(null); }
      await load();
    } catch {
      setMsg("Could not issue a token.");
    }
  };

  const revoke = async (id: string) => {
    await adminApi.post(`/cms/agent-tokens/${id}/revoke`, {});
    setMsg("Token revoked. That agent can no longer authenticate.");
    if (openId === id) setOpenId(null);
    await load();
  };

  const startEdit = (r: TokenRow) => {
    // seed the editor from the effective grant, so what you see is what you narrow
    const seed: Record<string, Partial<Grant>> = {};
    for (const t of r.allowedTypes) {
      const g = r.effectivePermissions[t];
      if (g) seed[t] = { create: g.create, update: g.update, refresh: g.refresh, proposeArchive: g.proposeArchive, fields: [...g.fields] };
    }
    setEditing(seed);
    setOpenId(r.id);
  };

  const savePerms = async (id: string) => {
    if (!editing) return;
    try {
      await adminApi.put(`/cms/agent-tokens/${id}/permissions`, editing);
      setMsg("Permissions saved. The agent sees the new grant on its next call.");
      setEditing(null);
      await load();
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setMsg(detail ? `Not saved: ${detail}` : "Could not save permissions.");
    }
  };

  if (authStatus !== "authed") return null;

  const active = rows.filter((r) => r.active);
  const revoked = rows.filter((r) => !r.active);
  const draftable = types.filter((t) => t.agentDraftable !== false);

  const TabBtn = ({ id, label, count }: { id: typeof tab; label: string; count?: number }) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      onClick={() => setTab(id)}
      className={`font-mono text-[11px] uppercase tracking-wider px-4 py-2 border-b-2 transition-colors ${
        tab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}{typeof count === "number" ? ` (${count})` : ""}
    </button>
  );

  return (
    <CmsShell
      title="Agents"
      intro="Every program that can write to this site, what each may touch, and a log of everything they did. No token can publish."
      status={msg}
      actions={
        <button type="button" onClick={() => setShowIssue((v) => !v)} aria-expanded={showIssue} aria-controls="issue-form" className={btnPrimary}>
          {showIssue ? "Cancel" : "Issue token"}
        </button>
      }
    >
      {/* at-a-glance */}
      {summary && (
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6" data-testid="agents-summary">
          {[
            ["Active now", `${summary.agentsSeenLastHour} of ${summary.agentsActive}`, "seen in the last hour"],
            ["Actions, 24h", String(summary.actions24h), "agent and admin"],
            ["Refused, 24h", String(summary.refused24h), "locks, grants, auth"],
            ["Awaiting review", String(summary.awaitingReview), "drafts in the queue"],
            ["Busiest, 24h", summary.busiestAgents24h[0]?.name ?? "none", summary.busiestAgents24h[0] ? `${summary.busiestAgents24h[0].actions} actions` : ""],
          ].map(([k, v, h]) => (
            <div key={k} className="border border-border px-3 py-2">
              <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">{k}</dt>
              <dd className="font-display text-lg font-bold text-foreground leading-tight truncate">{v}</dd>
              <dd className="font-mono text-[10px] text-muted-foreground/70">{h}</dd>
            </div>
          ))}
        </dl>
      )}

      {showIssue && (
        <form id="issue-form" onSubmit={issue} className="border border-border p-4 mb-6">
          <div className="grid md:grid-cols-[260px_1fr_auto] gap-4 items-start">
            <Field label="Agent name" id="agent-name" hint="Shown on every draft and every log row.">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Omniscite research agent" autoFocus />
            </Field>
            <fieldset>
              <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Page types this agent may draft</legend>
              <div className="grid sm:grid-cols-3 gap-1">
                {draftable.map((t) => {
                  const on = selected.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={on} className="accent-current"
                        onChange={() => setSelected((prev) => (on ? prev.filter((x) => x !== t.id) : [...prev, t.id]))} />
                      {t.label}
                    </label>
                  );
                })}
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">Hub pages are owner-only and cannot be granted.</p>
            </fieldset>
            <div className="pt-[1.35rem]">
              <button type="submit" disabled={!name.trim() || selected.length === 0} className={btnPrimary}>Issue</button>
            </div>
          </div>
          {issued && (
            <div className="border border-emerald-400/40 bg-emerald-400/[0.05] p-4 mt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-2">Copy this now</p>
              <code className="block font-mono text-[11px] text-foreground break-all mb-3">{issued}</code>
              <button type="button" onClick={() => { void navigator.clipboard?.writeText(issued); setMsg("Token copied to the clipboard."); }} className={btn}>Copy token</button>
            </div>
          )}
          {whoami && (
            <div className="border border-border p-4 mt-4" data-testid="agent-whoami">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">What this agent sees (live GET /cms/agent/whoami)</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                Can publish: <span className="text-foreground">{whoami.canPublish ? "yes" : "no"}</span> ·
                Locked: <span className="text-foreground">{(whoami.lockedPaths as string[] | undefined)?.join(", ")}</span>
              </p>
              <ul className="mt-2 space-y-1">
                {Object.entries((whoami.scope as { grants?: Record<string, Grant> })?.grants ?? {}).map(([t, g]) => (
                  <li key={t} className="font-mono text-[11px]">
                    <span className="text-foreground">{t}</span>{" "}
                    <span className="text-muted-foreground">may {OPS.filter((o) => g[o]).map((o) => OP_LABEL[o].toLowerCase()).join(", ") || "do nothing"}</span>
                    <span className="text-muted-foreground/70"> · fields: {g.fields.join(", ") || "none"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}

      <div role="tablist" aria-label="Agent views" className="flex gap-1 border-b border-border mb-4">
        <TabBtn id="active" label="Active" count={active.length} />
        <TabBtn id="activity" label="Activity log" />
        <TabBtn id="revoked" label="Revoked" count={revoked.length} />
      </div>

      {/* ---------------- ACTIVE ---------------- */}
      {tab === "active" && (
        <div role="tabpanel" id="panel-active" aria-labelledby="tab-active">
          {active.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground border border-border p-6">No active agents. Issue a token to connect one.</p>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse min-w-[980px]">
                <caption className="sr-only">Active agents with scope, activity and last seen</caption>
                <thead>
                  <tr className="bg-secondary/30">
                    {["Agent", "Scope", "Drafts", "In review", "Published", "Refused", "Last seen", "Expires", ""].map((h) => (
                      <th key={h} scope="col" className="text-left p-3 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((r) => {
                    const open = openId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr className="align-top hover:bg-secondary/10">
                          <td className="p-3 border-b border-border/50">
                            <button type="button" onClick={() => (open ? (setOpenId(null), setEditing(null)) : setOpenId(r.id))}
                              aria-expanded={open} aria-controls={`agent-${r.id}`}
                              className="font-mono text-xs text-foreground underline decoration-border text-left">
                              {r.name}
                            </button>
                            <span className="block font-mono text-[10px] text-muted-foreground/70">{r.id}</span>
                          </td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">{r.allowedTypes.join(", ")}</td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-foreground">{r.stats.draft}</td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-foreground">{r.stats.inReview}</td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-foreground">{r.stats.published}</td>
                          <td className={`p-3 border-b border-border/50 font-mono text-[11px] ${r.stats.refused > 0 ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{r.stats.refused}</td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{ago(r.lastSeenAt)}</td>
                          <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{r.expiresAt?.slice(0, 10) ?? "never"}</td>
                          <td className="p-3 border-b border-border/50 whitespace-nowrap">
                            <button type="button" onClick={() => startEdit(r)} className={`${btn} mr-2`}>Permissions</button>
                            <button type="button" onClick={() => revoke(r.id)} className={btn}>Revoke</button>
                          </td>
                        </tr>
                        {open && (
                          <tr id={`agent-${r.id}`}>
                            <td colSpan={9} className="p-4 border-b border-border bg-secondary/10">
                              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                                Effective permissions for {r.name}{editing ? " (editing: untick to narrow; you cannot grant beyond the site profile)" : ""}
                              </p>
                              <div className="overflow-x-auto">
                                <table className="border-collapse">
                                  <thead>
                                    <tr>
                                      <th scope="col" className="text-left p-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Type</th>
                                      {OPS.map((o) => <th key={o} scope="col" className="text-left p-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{OP_LABEL[o]}</th>)}
                                      <th scope="col" className="text-left p-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Fields it may write</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.allowedTypes.map((t) => {
                                      const g = r.effectivePermissions[t];
                                      if (!g) return null;
                                      const ed = editing?.[t];
                                      return (
                                        <tr key={t} className="align-top">
                                          <td className="p-2 font-mono text-[11px] text-foreground">{t}</td>
                                          {OPS.map((o) => (
                                            <td key={o} className="p-2">
                                              {ed ? (
                                                <label className="inline-flex items-center gap-1 font-mono text-[10px]">
                                                  <input type="checkbox" className="accent-current" checked={!!ed[o]} disabled={!g[o] && !ed[o]}
                                                    onChange={(e) => setEditing((prev) => ({ ...prev!, [t]: { ...prev![t], [o]: e.target.checked } }))} />
                                                  <span className="sr-only">{OP_LABEL[o]} on {t}</span>
                                                </label>
                                              ) : <Chip on={g[o]}>{g[o] ? "yes" : "no"}</Chip>}
                                            </td>
                                          ))}
                                          <td className="p-2">
                                            {ed ? (
                                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                {FIELD_ORDER.filter((f) => g.fields.includes(f) || (ed.fields ?? []).includes(f)).map((f) => (
                                                  <label key={f} className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                                                    <input type="checkbox" className="accent-current" checked={(ed.fields ?? []).includes(f)}
                                                      onChange={(e) => setEditing((prev) => {
                                                        const cur = new Set(prev![t].fields ?? []);
                                                        e.target.checked ? cur.add(f) : cur.delete(f);
                                                        return { ...prev!, [t]: { ...prev![t], fields: FIELD_ORDER.filter((x) => cur.has(x)) } };
                                                      })} />
                                                    {f}
                                                  </label>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="font-mono text-[11px] text-muted-foreground">{g.fields.join(", ") || "none"}</span>
                                            )}
                                            {g.note && <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">{g.note}</p>}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <p className="font-mono text-[10px] text-muted-foreground/70 mt-2">
                                Never grantable, for anyone: code, templates, components, routes, navigation, canonical, robots, schema, slug or type of a published page, publish. There is no delete; the strongest action is propose archive, which a human decides.
                              </p>
                              {editing ? (
                                <div className="mt-3 flex gap-2">
                                  <button type="button" onClick={() => savePerms(r.id)} className={btnPrimary}>Save permissions</button>
                                  <button type="button" onClick={() => setEditing(null)} className={btn}>Cancel</button>
                                </div>
                              ) : (
                                <div className="mt-3">
                                  <button type="button" onClick={() => { setActFilter({ q: "", result: "", actorId: r.id }); setTab("activity"); }} className={btn}>
                                    Show this agent&apos;s activity
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- ACTIVITY ---------------- */}
      {tab === "activity" && (
        <div role="tabpanel" id="panel-activity" aria-labelledby="tab-activity">
          <div className="flex flex-wrap items-center gap-2 mb-3" role="search">
            <label className="sr-only" htmlFor="act-q">Search activity</label>
            <input id="act-q" value={actFilter.q} onChange={(e) => setActFilter((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search agent, slug, path or reason" className={`${inputBase} w-full sm:w-72`} />
            <label className="sr-only" htmlFor="act-result">Filter by result</label>
            <select id="act-result" value={actFilter.result} onChange={(e) => setActFilter((f) => ({ ...f, result: e.target.value }))} className={`${inputBase} w-full sm:w-40`}>
              <option value="">All results</option>
              <option value="ok">Allowed</option>
              <option value="refused">Refused</option>
              <option value="error">Errors</option>
            </select>
            <label className="sr-only" htmlFor="act-actor">Filter by agent</label>
            <select id="act-actor" value={actFilter.actorId} onChange={(e) => setActFilter((f) => ({ ...f, actorId: e.target.value }))} className={`${inputBase} w-full sm:w-56`}>
              <option value="">All actors</option>
              {rows.map((r) => <option key={r.id} value={r.id}>{r.name}{r.active ? "" : " (revoked)"}</option>)}
            </select>
            <button type="button" onClick={() => void loadActivity()} className={btn}>Refresh</button>
          </div>
          {activity.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground border border-border p-6">Nothing matches. Every agent call and every admin decision is logged; widen the filter.</p>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse min-w-[980px]">
                <caption className="sr-only">Activity log: who did what, where, when, and whether it was allowed</caption>
                <thead>
                  <tr className="bg-secondary/30">
                    {["When", "Actor", "Action", "Result", "Target", "Detail"].map((h) => (
                      <th key={h} scope="col" className="text-left p-3 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id} className="align-top hover:bg-secondary/10">
                      <td className="p-3 border-b border-border/50 font-mono text-[10px] text-muted-foreground whitespace-nowrap" title={a.ts}>{a.ts.replace("T", " ").slice(0, 19)}</td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-foreground whitespace-nowrap">
                        {a.actor.name ?? "unknown"}
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/70">{a.actor.kind}</span>
                      </td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{a.action}</td>
                      <td className="p-3 border-b border-border/50">
                        <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${
                          a.result === "ok" ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300"
                          : a.result === "refused" ? "border-amber-400/60 text-amber-700 dark:text-amber-300"
                          : "border-red-400/60 text-red-700 dark:text-red-300"}`}>{a.result}</span>
                      </td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">
                        {a.target.path ?? (a.target.slug ? `${a.target.type ?? ""}/${a.target.slug}` : a.target.name ?? a.target.tokenId ?? "")}
                      </td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground max-w-md break-words">{a.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- REVOKED ---------------- */}
      {tab === "revoked" && (
        <div role="tabpanel" id="panel-revoked" aria-labelledby="tab-revoked">
          {revoked.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground border border-border p-6">No revoked tokens.</p>
          ) : (
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse min-w-[720px]">
                <caption className="sr-only">Revoked agent tokens</caption>
                <thead>
                  <tr className="bg-secondary/30">
                    {["Agent", "Scope", "Issued", "Revoked", "Published while active", "Refused"].map((h) => (
                      <th key={h} scope="col" className="text-left p-3 border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revoked.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="p-3 border-b border-border/50 font-mono text-xs text-foreground">{r.name}<span className="block text-[10px] text-muted-foreground/70">{r.id}</span></td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">{r.allowedTypes.join(", ")}</td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{r.createdAt?.slice(0, 10)}</td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{r.revokedAt?.slice(0, 10) ?? "before logging began"}</td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-foreground">{r.stats.published}</td>
                      <td className="p-3 border-b border-border/50 font-mono text-[11px] text-muted-foreground">{r.stats.refused}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </CmsShell>
  );
}
