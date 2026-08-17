"use client";
import * as React from "react";
import { adminApi, useRequireAdmin } from "@/lib/admin-client";
import CmsShell, { btn, btnPrimary, focusRing } from "@/components/admin/CmsShell";

/**
 * The review queue: where an agent's work meets a human decision.
 *
 * Everything needed to decide is on screen at once: what the agent wrote,
 * which sources it fetched, the resolved SEO the reader will actually get,
 * and every gate with its verdict. Approving without seeing the gates would
 * be the same mistake as publishing without them.
 */

interface GateCheck { name: string; ok: boolean; detail?: string }
interface QueueItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: string;
  blocks: { kind: string; text?: string }[];
  provenance: {
    author: string;
    agentName?: string;
    model?: string;
    humanOversight: string;
    sources: { url: string; quote?: string; fetchedAt?: string; httpStatus?: number }[];
  };
  resolvedSeo: {
    seoTitle: string;
    seoTitleLength: number;
    metaDescription: string;
    canonical: string;
    robots: string;
    schemaType: string;
    route: string;
    resolvedFrom: Record<string, string>;
  };
  gates: { passed: boolean; checks: GateCheck[]; failed: string[] };
}

/**
 * Second line of defence on source URLs.
 *
 * The API rejects anything that is not http, https or site-relative, but
 * this screen renders agent-supplied strings as hrefs on the one browser
 * session that can publish. React escapes text and does not escape hrefs,
 * so `javascript:` would run on click. Old rows written before the API
 * rule existed are the reason this cannot be assumed away.
 */
function isSafeHref(url: string): boolean {
  return /^(https?:\/\/|\/)/i.test(url.trim());
}

export default function ReviewQueueClient() {
  const { status: authStatus } = useRequireAdmin();
  const [items, setItems] = React.useState<QueueItem[]>([]);
  const [msg, setMsg] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  /** `note` survives the reload that follows a decision. Without it the
   *  outcome was replaced by the queue count before it could be read. */
  const load = React.useCallback(async (note?: string) => {
    try {
      const { data } = await adminApi.get("/cms/review");
      setItems(data);
      const count = `${data.length} draft${data.length === 1 ? "" : "s"} awaiting review`;
      setMsg(note ? `${note} ${count}.` : count);
    } catch {
      setMsg("Could not load the review queue.");
    }
  }, []);

  React.useEffect(() => {
    if (authStatus === "authed") void load();
  }, [authStatus, load]);

  const decide = async (id: string, action: "approve" | "reject" | "archive") => {
    setBusy(id);
    try {
      let note: string;
      if (action === "approve") {
        await adminApi.post(`/cms/pages/${id}/approve`, {});
        note = "Published. Gates passed and a human approved it.";
      } else if (action === "archive") {
        await adminApi.post(`/cms/pages/${id}/archive`, {});
        note = "Archived. It leaves the queue but stays in the audit trail.";
      } else {
        await adminApi.post(`/cms/pages/${id}/reject`, { notes: "Sent back for revision" });
        note = "Sent back to draft.";
      }
      await load(note);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const failed = (detail as { failed?: string[] })?.failed;
      setMsg(failed?.length
        ? `Blocked by gates: ${failed.join(", ")}. Fix the draft, then approve.`
        : "That action did not complete.");
    } finally {
      setBusy(null);
    }
  };

  if (authStatus !== "authed") return null;

  return (
    <CmsShell
      title="Review queue"
      intro="Drafts submitted by agents or saved by you. Nothing here is public. Approving runs the gates again on the server, so a failing draft cannot be published even from this screen."
      status={msg}
      actions={<button type="button" onClick={load} className={btn}>Refresh</button>}
    >
      {items.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground border border-border p-6">
          Nothing waiting. When an Omniscite agent submits a draft it appears here.
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => {
            const open = openId === it.id;
            return (
              <li key={it.id} className="border border-border">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1">
                        {it.type} · /{it.slug}
                      </p>
                      <h2 className="font-display text-lg font-bold text-foreground">{it.title}</h2>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2 py-1 border ${
                        it.gates.passed
                          ? "border-emerald-400/60 text-emerald-700 dark:text-emerald-300"
                          : "border-amber-400/60 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {it.gates.passed ? "gates pass" : `${it.gates.failed.length} gate issue${it.gates.failed.length === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  {/* provenance: who wrote this and on what evidence */}
                  <dl className="grid sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Author</dt>
                      <dd className="font-mono text-xs text-foreground">
                        {it.provenance.author === "agent"
                          ? `${it.provenance.agentName ?? "agent"}${it.provenance.model ? ` (${it.provenance.model})` : ""}`
                          : "human"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Oversight</dt>
                      <dd className="font-mono text-xs text-foreground">{it.provenance.humanOversight}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Sources</dt>
                      <dd className="font-mono text-xs text-foreground">{it.provenance.sources.length}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : it.id)}
                    aria-expanded={open}
                    aria-controls={`detail-${it.id}`}
                    className={btn}
                  >
                    {open ? "Hide detail" : "Show content, SEO and gates"}
                  </button>

                  {open && (
                    <div id={`detail-${it.id}`} className="mt-5 grid lg:grid-cols-2 gap-6">
                      <section aria-label="Draft content and sources">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Content</h3>
                        <div className="border border-border/70 p-3 mb-4 max-h-56 overflow-y-auto">
                          {it.blocks.map((b, i) => (
                            <p key={i} className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-2">
                              <span className="text-muted-foreground/70">[{b.kind}]</span> {b.text}
                            </p>
                          ))}
                        </div>
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Sources</h3>
                        <ul className="space-y-1.5">
                          {it.provenance.sources.map((s) => (
                            <li key={s.url}>
                              {isSafeHref(s.url) ? (
                                <a
                                  href={s.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-mono text-[11px] text-foreground/85 hover:text-foreground underline decoration-border ${focusRing}`}
                                >
                                  {s.url}
                                </a>
                              ) : (
                                <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                                  {s.url} (blocked: not an http or https URL)
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-muted-foreground/70">
                                {s.httpStatus ? ` · HTTP ${s.httpStatus}` : ""}{s.fetchedAt ? ` · ${s.fetchedAt.slice(0, 10)}` : ""}
                              </span>
                            </li>
                          ))}
                          {it.provenance.sources.length === 0 && (
                            <li className="font-mono text-[11px] text-amber-700 dark:text-amber-300">
                              No sources attached. An agent draft without sources should not be published.
                            </li>
                          )}
                        </ul>
                      </section>

                      <section aria-label="Resolved SEO and gate results">
                        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">
                          Resolved SEO (what the reader gets)
                        </h3>
                        <table className="w-full mb-4">
                          <tbody>
                            {[
                              ["Title", `${it.resolvedSeo.seoTitle} (${it.resolvedSeo.seoTitleLength})`, it.resolvedSeo.resolvedFrom.seoTitle],
                              ["Description", it.resolvedSeo.metaDescription, it.resolvedSeo.resolvedFrom.metaDescription],
                              ["Canonical", it.resolvedSeo.canonical, it.resolvedSeo.resolvedFrom.canonical],
                              ["Robots", it.resolvedSeo.robots, it.resolvedSeo.resolvedFrom.robots],
                              ["Schema", it.resolvedSeo.schemaType, "type"],
                            ].map(([k, v, from]) => (
                              <tr key={k as string} className="border-b border-border/40 align-top">
                                <th scope="row" className="text-left py-1.5 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
                                  {k}
                                </th>
                                <td className="py-1.5 font-mono text-[11px] text-foreground break-words">{v}</td>
                                <td className="py-1.5 pl-2 font-mono text-[9px] uppercase text-muted-foreground/70 whitespace-nowrap">
                                  from {from}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-2">Gates</h3>
                        <ul className="space-y-1">
                          {it.gates.checks.map((c) => (
                            <li key={c.name} className="font-mono text-[11px] flex gap-2">
                              <span className={c.ok ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                                {c.ok ? "pass" : "fail"}
                              </span>
                              <span className="text-muted-foreground">
                                {c.name}
                                {c.detail ? ` (${c.detail})` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
                  <button
                    type="button"
                    disabled={busy === it.id}
                    onClick={() => decide(it.id, "approve")}
                    className={btnPrimary}
                  >
                    {busy === it.id ? "Working…" : "Approve and publish"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === it.id}
                    onClick={() => decide(it.id, "reject")}
                    className={btn}
                  >
                    Send back to draft
                  </button>
                  <button
                    type="button"
                    disabled={busy === it.id}
                    onClick={() => decide(it.id, "archive")}
                    className={btn}
                  >
                    Archive
                  </button>
                  {!it.gates.passed && (
                    <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">
                      Approval will be refused until the gates pass.
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CmsShell>
  );
}
