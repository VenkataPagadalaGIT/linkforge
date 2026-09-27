#!/usr/bin/env node
// Publish news without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
//
//   node scripts/cms/publish-news.mjs check              validate content/ai-updates.json
//   node scripts/cms/publish-news.mjs publish            check, write to the `content` branch, refresh the site, verify live
//   node scripts/cms/publish-news.mjs publish --dry-run  show what publish would do, change nothing
//   node scripts/cms/publish-news.mjs init               create the `content` branch (once)
//
// publish and init write to GitHub: Claude runs them only on the owner's
// explicit "publish" / "push". Uses the owner's `gh` login for the write,
// and the refresh secret from the macOS Keychain (vp-content-revalidate) or
// CONTENT_REVALIDATE_SECRET. Never prints the secret.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateNews } from "../../src/lib/news-validate.ts";
import { signContent } from "../../src/lib/content-signature.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FILE = "content/ai-updates.json";
const REPO = process.env.CONTENT_REPO || "VenkataPagadalaGIT/linkforge";
const BRANCH = process.env.CONTENT_BRANCH || "content";
const SITE = (process.env.SITE_URL || "https://venkatapagadala.com").replace(/\/$/, "");
const args = process.argv.slice(2);
const cmd = args[0];
const dryRun = args.includes("--dry-run");

const gh = (...a) => execFileSync("gh", a, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

function localCopy() {
  return JSON.parse(readFileSync(join(ROOT, FILE), "utf8"));
}

/** The copy now published on the content branch: { data, sha }, or null if the branch or file is missing. */
function publishedCopy() {
  try {
    const meta = JSON.parse(gh("api", `repos/${REPO}/contents/${FILE}?ref=${BRANCH}`));
    return { data: JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")), sha: meta.sha };
  } catch {
    return null;
  }
}

/** The baseline for "changed": the published copy, else the last committed copy. */
function baseline(published) {
  if (published) return published.data;
  try {
    return JSON.parse(git("show", `HEAD:${FILE}`));
  } catch {
    return undefined;
  }
}

function report(check) {
  for (const i of check.issues) console.log(`  ${i.level === "block" ? "BLOCK" : "warn "}  ${i.message}`);
  console.log(`  changed or new: ${check.changed.length ? check.changed.join(", ") : "none"}`);
  console.log(`  removed: ${check.removed.length ? check.removed.join(", ") : "none"}`);
  console.log(check.ok ? "  checks passed" : "  checks FAILED: nothing will be published");
}

function refreshSecret() {
  if (process.env.CONTENT_REVALIDATE_SECRET) return process.env.CONTENT_REVALIDATE_SECRET;
  try {
    return execFileSync("security", ["find-generic-password", "-s", "vp-content-revalidate", "-a", "venkatapagadala.com", "-w"],
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

async function refresh(secret) {
  const body = JSON.stringify({ tags: ["news"] });
  const res = await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-content-signature": signContent(secret, body, Date.now()) },
    body,
  });
  return { status: res.status, text: await res.text() };
}

const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Poll the live site until each change shows: new or changed titles present, removed slugs 404. */
async function verifyLive(data, check, timeoutMs = 120_000) {
  const bySlug = new Map(data.map((u) => [u.slug, u]));
  const pending = new Set([...check.changed, ...check.removed]);
  const until = Date.now() + timeoutMs;
  while (pending.size && Date.now() < until) {
    for (const slug of [...pending]) {
      const res = await fetch(`${SITE}/ai-updates/${slug}`, { headers: { "cache-control": "no-cache" } }).catch(() => null);
      if (!res) continue;
      const html = unescape(await res.text());
      const want = bySlug.get(slug);
      if (want ? res.status === 200 && html.includes(want.title) : res.status === 404) pending.delete(slug);
    }
    if (pending.size) await new Promise((r) => setTimeout(r, 5000));
  }
  return [...pending];
}

async function main() {
  if (cmd === "check") {
    const published = publishedCopy();
    const check = validateNews(localCopy(), baseline(published));
    console.log(`News check (${FILE}, compared with ${published ? `the published copy on ${BRANCH}` : "the last committed copy"}):`);
    report(check);
    process.exit(check.ok ? 0 : 1);
  }
  if (cmd === "init") {
    const head = git("rev-parse", "HEAD").trim();
    if (publishedCopy()) return console.log(`The ${BRANCH} branch already has ${FILE}.`);
    if (dryRun) return console.log(`Would create ${BRANCH} at ${head.slice(0, 8)} on ${REPO}.`);
    gh("api", `repos/${REPO}/git/refs`, "-f", `ref=refs/heads/${BRANCH}`, "-f", `sha=${head}`);
    return console.log(`Created ${BRANCH} at ${head.slice(0, 8)}. Push HEAD first if it is not on GitHub yet.`);
  }
  if (cmd === "publish") {
    const data = localCopy();
    const published = publishedCopy();
    if (!published) {
      console.log(`No published copy on ${BRANCH} yet. Run: node scripts/cms/publish-news.mjs init`);
      process.exit(1);
    }
    const check = validateNews(data, published.data);
    console.log("News check:");
    report(check);
    if (!check.ok) process.exit(1);
    if (!check.changed.length && !check.removed.length) return console.log("Nothing changed; nothing to publish.");
    const message = `Publish news: ${[...check.changed, ...check.removed.map((s) => `remove ${s}`)].join(", ")}`;
    if (dryRun) return console.log(`Dry run: would commit "${message}" to ${BRANCH}, refresh ${SITE}, and verify live.`);
    const secret = refreshSecret();
    if (!secret) {
      console.log("No refresh secret in the Keychain (vp-content-revalidate) or CONTENT_REVALIDATE_SECRET; see the setup in docs/NO_DEPLOY_PUBLISHING.md.");
      process.exit(1);
    }
    const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
    gh("api", "-X", "PUT", `repos/${REPO}/contents/${FILE}`, "-f", `message=${message}`, "-f", `content=${content}`,
      "-f", `branch=${BRANCH}`, "-f", `sha=${published.sha}`);
    console.log(`Committed to ${BRANCH}: ${message}`);
    const r = await refresh(secret);
    console.log(`Refresh: HTTP ${r.status} ${r.text.slice(0, 120)}`);
    if (r.status !== 200) process.exit(1);
    const stuck = await verifyLive(data, check);
    if (stuck.length) {
      console.log(`Not showing live yet after 2 minutes: ${stuck.join(", ")}`);
      process.exit(1);
    }
    return console.log("Live: every change shows on the site. No deploy was needed.");
  }
  console.log("Usage: node scripts/cms/publish-news.mjs check | publish [--dry-run] | init [--dry-run]");
  process.exit(2);
}

main().catch((e) => {
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
