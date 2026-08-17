"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btn, btnPrimary, inputClass, Field } from "@/components/admin/CmsShell";

/**
 * Agents: issue and revoke the tokens research agents use to file drafts.
 *
 * A token is scoped to specific page types and can only reach the draft
 * endpoints. There is no publish route for it to call, so the worst a
 * leaked token can do is fill the review queue with drafts a human then
 * rejects. The raw token is shown exactly once and stored only as a hash.
 */

interface TokenRow {
  id: string; name: string; allowedTypes: string[]; active: boolean; createdAt: string;
}
interface PageType { id: string; label: string }

export default function AgentTokensClient() {
  const { status: authStatus } = useRequireAdmin();
  const [rows, setRows] = React.useState<TokenRow[]>([]);
  const [types, setTypes] = React.useState<PageType[]>([]);
  const [name, setName] = React.useState("Omniscite research agent");
  const [selected, setSelected] = React.useState<string[]>(["ai-update"]);
  const [issued, setIssued] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(async () => {
    const [{ data: t }, { data: ty }] = await Promise.all([
      adminApi.get("/cms/agent-tokens"),
      adminApi.get("/cms/types"),
    ]);
    setRows(t);
    setTypes(ty);
  }, []);

  React.useEffect(() => {
    if (authStatus === "authed") void load().catch(() => setMsg("Could not load agents."));
  }, [authStatus, load]);

  const issue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await adminApi.post("/cms/agent-tokens", { name, allowedTypes: selected });
      setIssued(data.token);
      setMsg("Token issued. Copy it now: it is stored only as a hash and cannot be shown again.");
      await load();
    } catch {
      setMsg("Could not issue a token.");
    }
  };

  const revoke = async (id: string) => {
    await adminApi.post(`/cms/agent-tokens/${id}/revoke`, {});
    setMsg("Token revoked. That agent can no longer file drafts.");
    await load();
  };

  if (authStatus !== "authed") return null;

  return (
    <CmsShell
      title="Agents"
      intro="Tokens for research agents such as Omniscite. Each token is scoped to page types and can only create drafts and submit them for review. No token can publish."
      status={msg}
    >
      <div className="grid lg:grid-cols-2 gap-10 max-w-5xl">
        <section aria-labelledby="issue-h">
          <h2 id="issue-h" className="font-display text-base font-bold text-foreground mb-3">Issue a token</h2>
          <form onSubmit={issue}>
            <Field label="Agent name" id="agent-name" hint="Shown on every draft this agent files.">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </Field>

            <fieldset className="mb-4">
              <legend className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Page types this agent may draft
              </legend>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {types.map((t) => {
                  const on = selected.includes(t.id);
                  return (
                    <label key={t.id} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setSelected((prev) => (on ? prev.filter((x) => x !== t.id) : [...prev, t.id]))
                        }
                        className="accent-current"
                      />
                      {t.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <button type="submit" className={btnPrimary}>Issue token</button>
          </form>

          {issued && (
            <div className="border border-emerald-400/40 bg-emerald-400/[0.05] p-4 mt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-2">
                Copy this now
              </p>
              <code className="block font-mono text-[11px] text-foreground break-all mb-3">{issued}</code>
              <button
                type="button"
                onClick={() => { void navigator.clipboard?.writeText(issued); setMsg("Token copied to the clipboard."); }}
                className={btn}
              >
                Copy token
              </button>
            </div>
          )}
        </section>

        <section aria-labelledby="live-h">
          <h2 id="live-h" className="font-display text-base font-bold text-foreground mb-3">Active agents</h2>
          {rows.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground border border-border p-4">No agent tokens yet.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="border border-border p-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-foreground">
                      {r.name}{" "}
                      <span className={`ml-1 text-[9px] uppercase tracking-wider px-1 py-0.5 border ${
                        r.active
                          ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300"
                          : "border-border text-muted-foreground/70"
                      }`}>
                        {r.active ? "active" : "revoked"}
                      </span>
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/70">
                      {r.allowedTypes.length} type{r.allowedTypes.length === 1 ? "" : "s"} · issued {r.createdAt?.slice(0, 10)}
                    </p>
                  </div>
                  {r.active && (
                    <button type="button" onClick={() => revoke(r.id)} className={btn}>Revoke</button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border border-border p-4 mt-6">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
              What an agent can and cannot do
            </h3>
            <ul className="space-y-1 font-mono text-[11px] text-muted-foreground">
              <li>Can: read the schema, create drafts, attach sources, run gates, submit for review.</li>
              <li>Cannot: publish, edit a published page, change globals, issue tokens, or see other agents&apos; drafts.</li>
            </ul>
          </div>
        </section>
      </div>
    </CmsShell>
  );
}
