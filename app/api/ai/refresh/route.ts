import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

// "Pull latest" for the AI graph's free pipelines, on localhost only: runs one pipeline through the logged runner, then
// regenerates the data files (the dev server reloads them). It answers 404 unless AI_LOCAL_REFRESH=1 and the request
// comes to localhost, so a deployed build never runs anything. Paid pipelines are not on the list: they run only from
// the command line with the owner's approval and a cap in code.
export const dynamic = "force-dynamic";

const FREE = new Set(["jobs", "site", "attention", "tone", "market", "github_releases", "feeds", "research_people", "photos"]);
const GENERATE = "python3 gen_ontology_intel_ts.py >/dev/null && python3 gen_ontology_360_ts.py >/dev/null && python3 gen_freshness_ts.py";

type Run = { started: number; finished: number | null; code: number | null; tail: string };
const g = globalThis as unknown as { __aiRefreshRuns?: Map<string, Run> };
const runs = (g.__aiRefreshRuns ??= new Map<string, Run>());

function allowed(req: Request) {
  if (process.env.AI_LOCAL_REFRESH !== "1") return false;
  const host = req.headers.get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

export async function GET(req: Request) {
  if (!allowed(req)) return new NextResponse(null, { status: 404 });
  return NextResponse.json(Object.fromEntries(runs), { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  if (!allowed(req)) return new NextResponse(null, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { pipeline?: string };
  const pipeline = body.pipeline ?? "";
  if (!FREE.has(pipeline)) return NextResponse.json({ error: "not a free pipeline" }, { status: 400 });
  // One pull at a time: two generators writing the same data files at once would race.
  if ([...runs.values()].some((r) => r.finished === null)) return NextResponse.json({ error: "another pull is running" }, { status: 409 });
  const run: Run = { started: Date.now(), finished: null, code: null, tail: "" };
  runs.set(pipeline, run);
  // Homebrew's Python first, the one the scripts are run with from the terminal (macOS's own python3 is older).
  const env = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}` };
  const child = spawn("zsh", ["-c", `python3 run_pipelines.py --only ${pipeline} && ${GENERATE}`], { cwd: path.join(process.cwd(), "data", "corpus"), env });
  const keep = (d: Buffer) => {
    run.tail = (run.tail + d.toString()).slice(-800);
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  child.on("close", (code) => {
    run.finished = Date.now();
    run.code = code;
  });
  return NextResponse.json({ started: pipeline }, { status: 202 });
}
