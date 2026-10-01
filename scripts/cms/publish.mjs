#!/usr/bin/env node
// Publish content without a deploy (docs/NO_DEPLOY_PUBLISHING.md).
//
//   node scripts/cms/publish.mjs check news|seo|business     validate the file
//   node scripts/cms/publish.mjs publish news|seo            check, write to the `content` branch, refresh the site, verify live
//   node scripts/cms/publish.mjs publish news|seo --dry-run  show what publish would do, change nothing
//   node scripts/cms/publish.mjs verify news|seo             check that the live site shows what the file says
//   node scripts/cms/publish.mjs init                        create the `content` branch (once)
//
// news is content/ai-updates.json (the articles); seo is
// content/seo-overrides.json (page titles, descriptions, canonicals, robots);
// business is content/business.json (Business Notebook notes, companies, people).
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
import { validateSeo } from "../../src/lib/seo-validate.ts";
import { validateBusiness } from "../../src/lib/business-validate.ts";
import { signContent } from "../../src/lib/content-signature.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const REPO = process.env.CONTENT_REPO || "VenkataPagadalaGIT/linkforge";
const BRANCH = process.env.CONTENT_BRANCH || "content";
const SITE = (process.env.SITE_URL || "https://venkatapagadala.com").replace(/\/$/, "");
const RULES = JSON.parse(readFileSync(join(ROOT, "cms/rules.json"), "utf8"));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const [cmd, kindName] = args;
const dryRun = process.argv.includes("--dry-run");

const gh = (...a) => execFileSync("gh", a, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function fetchPage(path) {
  const res = await fetch(`${SITE}${path}`, { headers: { "cache-control": "no-cache" }, redirect: "manual" }).catch(() => null);
  if (!res) return { status: 0, html: "" };
  return { status: res.status, html: unescape(await res.text()) };
}

/** The four SEO fields as the live page renders them. */
function seoFields(html) {
  const meta = (name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  return {
    title: html.match(/<title>([^<]*)<\/title>/)?.[1],
    description: meta("description"),
    canonical: canonical && new URL(canonical, SITE).pathname,
    robots: meta("robots"),
  };
}

/** "article:slug" and friends to the page they live on. */
const businessHref = (key) => {
  const [type, slug] = key.split(":");
  return type === "company" ? `/notebook/business/companies/${slug}` : type === "person" ? `/notebook/business/people/${slug}` : `/notebook/business/${slug}`;
};

const notFoundPage = (p) => p.status !== 200 || p.html.includes("<title>Not found");

const KINDS = {
  news: {
    file: "content/ai-updates.json",
    label: "News",
    validate: (data, published) => validateNews(data, published),
    name: (slug) => slug,
    refreshBody: () => ({ tags: ["news"] }),
    /** Nothing to check on the live site before publishing an article. */
    beforePublish: async () => [],
    /** Changed articles show their title; removed ones are gone. */
    isLive: async (data, id, removed) => {
      const want = data.find((u) => u.slug === id);
      const p = await fetchPage(`/ai-updates/${id}`);
      return removed ? p.status === 404 || notFoundPage(p) : p.status === 200 && p.html.includes(want.title);
    },
  },
  seo: {
    file: "content/seo-overrides.json",
    label: "Page SEO",
    validate: (data, published) => validateSeo(data, RULES, { published }),
    name: (path) => path,
    refreshBody: (check) => ({ tags: ["seo"], paths: [...check.changed, ...check.removed] }),
    /** Every changed page, and every canonical it points at, must be a live page. */
    beforePublish: async (data, check) => {
      const problems = [];
      for (const path of check.changed) {
        if (notFoundPage(await fetchPage(path))) problems.push(`${path} is not a live page on ${SITE}`);
        const c = data.pages[path].canonical;
        const target = c && new URL(c, SITE).pathname;
        if (target && target !== path && notFoundPage(await fetchPage(target))) {
          problems.push(`${path}: its canonical ${c} is not a live page`);
        }
      }
      return problems;
    },
    /** Changed pages render every field the file sets; removed ones still answer. */
    isLive: async (data, path, removed) => {
      const p = await fetchPage(path);
      if (removed) return p.status === 200;
      if (p.status !== 200) return false;
      const live = seoFields(p.html);
      const want = { ...data.pages[path] };
      if (want.canonical) want.canonical = new URL(want.canonical, SITE).pathname;
      return Object.entries(want).every(([f, v]) => live[f] === v);
    },
  },
  business: {
    file: "content/business.json",
    label: "Business Notebook",
    validate: (data, published) => validateBusiness(data, published),
    refreshBody: (check) => ({ tags: ["business"], paths: [...check.changed, ...check.removed].map(businessHref) }),
    /** New pages cannot be live before they are published: nothing to check first. */
    beforePublish: async () => [],
    /** Changed items show their title or name; removed ones answer 404. */
    isLive: async (data, key, removed) => {
      const p = await fetchPage(businessHref(key));
      if (removed) return p.status === 404 || notFoundPage(p);
      const [type, slug] = key.split(":");
      const list = { article: data.articles, company: data.companies, person: data.people }[type];
      const item = list.find((x) => x.slug === slug);
      return p.status === 200 && p.html.includes(item.title ?? item.name);
    },
  },
};

function localCopy(kind) {
  return JSON.parse(readFileSync(join(ROOT, kind.file), "utf8"));
}

/** The copy now published on the content branch: { data, sha }, or null if the branch or file is missing. */
function publishedCopy(kind) {
  try {
    const meta = JSON.parse(gh("api", `repos/${REPO}/contents/${kind.file}?ref=${BRANCH}`));
    return { data: JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")), sha: meta.sha };
  } catch {
    return null;
  }
}

function branchExists() {
  try {
    gh("api", `repos/${REPO}/branches/${BRANCH}`);
    return true;
  } catch {
    return false;
  }
}

/** The baseline for "changed": the published copy, else the last committed copy. */
function baseline(kind, published) {
  if (published) return published.data;
  try {
    return JSON.parse(git("show", `HEAD:${kind.file}`));
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

async function refresh(secret, body) {
  const text = JSON.stringify(body);
  const res = await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-content-signature": signContent(secret, text, Date.now()) },
    body: text,
  });
  return { status: res.status, text: await res.text() };
}

/** Poll the live site until every change shows; returns what did not. */
async function verifyLive(kind, data, check, timeoutMs = 120_000) {
  const pending = new Map([...check.changed.map((id) => [id, false]), ...check.removed.map((id) => [id, true])]);
  const until = Date.now() + timeoutMs;
  while (pending.size && Date.now() < until) {
    for (const [id, removed] of [...pending]) if (await kind.isLive(data, id, removed)) pending.delete(id);
    if (pending.size) await sleep(5000);
  }
  return [...pending.keys()];
}

async function main() {
  if (cmd === "init") {
    const head = git("rev-parse", "HEAD").trim();
    if (branchExists()) return console.log(`The ${BRANCH} branch already exists on ${REPO}.`);
    if (dryRun) return console.log(`Would create ${BRANCH} at ${head.slice(0, 8)} on ${REPO}.`);
    gh("api", `repos/${REPO}/git/refs`, "-f", `ref=refs/heads/${BRANCH}`, "-f", `sha=${head}`);
    return console.log(`Created ${BRANCH} at ${head.slice(0, 8)}. Push HEAD first if it is not on GitHub yet.`);
  }
  const kind = KINDS[kindName];
  if (!kind || !["check", "publish", "verify"].includes(cmd)) {
    console.log("Usage: node scripts/cms/publish.mjs check|publish|verify news|seo|business [--dry-run], or init [--dry-run]");
    process.exit(2);
  }
  const data = localCopy(kind);
  if (cmd === "verify") {
    const ids = kindName === "seo" ? Object.keys(data.pages)
      : kindName === "business" ? [...data.articles.map((x) => `article:${x.slug}`), ...data.companies.map((x) => `company:${x.slug}`), ...data.people.map((x) => `person:${x.slug}`)]
      : data.map((u) => u.slug);
    const stuck = [];
    for (const id of ids) if (!(await kind.isLive(data, id, false))) stuck.push(id);
    console.log(stuck.length ? `Not live on ${SITE}: ${stuck.join(", ")}` : `Live on ${SITE}: all ${ids.length} entries show what the file says.`);
    process.exit(stuck.length ? 1 : 0);
  }
  const published = publishedCopy(kind);
  if (cmd === "check") {
    const check = kind.validate(data, baseline(kind, published));
    console.log(`${kind.label} check (${kind.file}, compared with ${published ? `the published copy on ${BRANCH}` : "the last committed copy"}):`);
    report(check);
    if (kindName === "seo") console.log("  (publish also checks that each changed page is live)");
    process.exit(check.ok ? 0 : 1);
  }
  if (!published && !branchExists()) {
    console.log(`No ${BRANCH} branch on ${REPO} yet. Run: node scripts/cms/publish.mjs init`);
    process.exit(1);
  }
  const check = kind.validate(data, baseline(kind, published));
  console.log(`${kind.label} check:`);
  report(check);
  if (!check.ok) process.exit(1);
  if (!check.changed.length && !check.removed.length) return console.log("Nothing changed; nothing to publish.");
  const problems = await kind.beforePublish(data, check);
  for (const p of problems) console.log(`  BLOCK  ${p}`);
  if (problems.length) {
    console.log("  live checks FAILED: nothing will be published");
    process.exit(1);
  }
  const message = `Publish ${kind.label.toLowerCase()}: ${[...check.changed, ...check.removed.map((s) => `remove ${s}`)].join(", ")}`;
  if (dryRun) return console.log(`Dry run: would commit "${message}" to ${BRANCH}, refresh ${SITE}, and verify live.`);
  const secret = refreshSecret();
  if (!secret) {
    console.log("No refresh secret in the Keychain (vp-content-revalidate) or CONTENT_REVALIDATE_SECRET; see the setup in docs/NO_DEPLOY_PUBLISHING.md.");
    process.exit(1);
  }
  const content = Buffer.from(JSON.stringify(data, null, 2) + "\n").toString("base64");
  gh("api", "-X", "PUT", `repos/${REPO}/contents/${kind.file}`, "-f", `message=${message}`, "-f", `content=${content}`,
    "-f", `branch=${BRANCH}`, ...(published ? ["-f", `sha=${published.sha}`] : []));
  console.log(`Committed to ${BRANCH}: ${message}`);
  const r = await refresh(secret, kind.refreshBody(check));
  console.log(`Refresh: HTTP ${r.status} ${r.text.slice(0, 120)}`);
  if (r.status === 503) {
    console.log("The site has no refresh secret yet (Railway CONTENT_REVALIDATE_SECRET), so it picks the change up on its own:");
    console.log("within 5 minutes for news, within about 2 hours for page SEO. Set the secret to make it about a minute.");
    process.exit(1);
  }
  if (r.status !== 200) process.exit(1);
  const stuck = await verifyLive(kind, data, check);
  if (stuck.length) {
    console.log(`Not showing live yet after 2 minutes: ${stuck.join(", ")}`);
    process.exit(1);
  }
  return console.log("Live: every change shows on the site. No deploy was needed.");
}

main().catch((e) => {
  console.error(`Failed: ${e.message}`);
  process.exit(1);
});
