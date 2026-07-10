/**
 * Puppeteer-based SSG: render every known route to fully-hydrated HTML.
 *
 * Runs AFTER `vite build`. Spins up a local static server over `dist/`,
 * visits each route in headless Chrome, waits for React to hydrate, then
 * saves `document.documentElement.outerHTML` to `dist/<route>/index.html`.
 *
 * Result: crawlers and users both get real HTML on first fetch. React
 * still hydrates client-side for interactivity.
 */

import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, existsSync, statSync } from "node:fs";
import puppeteer, { type Browser } from "puppeteer";
import { buildRouteSpecs } from "./vite-plugin-prerender-noscript";

const DIST_DIR = path.resolve(process.cwd(), "dist");
// Bound to an OS-assigned ephemeral port (see startStaticServer) to avoid
// EADDRINUSE conflicts in containerized build environments where the default
// Vite preview port (4173) may already be occupied.
let PORT = 0;
const HYDRATION_TIMEOUT_MS = 15000;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function startStaticServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        let filePath = path.join(DIST_DIR, urlPath);

        // Directory → index.html
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }

        // SPA fallback: unknown route → serve dist/index.html (React Router takes over)
        if (!existsSync(filePath)) {
          filePath = path.join(DIST_DIR, "index.html");
        }

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
        res.setHeader("Cache-Control", "no-store");
        createReadStream(filePath).pipe(res);
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err));
      }
    });
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        PORT = address.port;
      }
      resolve(server);
    });
    server.on("error", reject);
  });
}

async function prerenderRoute(
  browser: Browser,
  routePath: string
): Promise<string> {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(HYDRATION_TIMEOUT_MS);
  page.setDefaultTimeout(HYDRATION_TIMEOUT_MS);

  try {
    await page.goto(`http://127.0.0.1:${PORT}${routePath}`, {
      waitUntil: "networkidle0",
    });

    // Wait for React to populate #root. The shell has <div id="root"></div>
    // which becomes non-empty once App mounts.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return !!root && root.childElementCount > 0;
      },
      { timeout: HYDRATION_TIMEOUT_MS }
    );

    // Small grace period for lazy-loaded content (charts, images, helmet meta)
    await new Promise((r) => setTimeout(r, 400));

    const html = await page.evaluate(() => {
      // Strip Vite's HMR client if present (it wouldn't be in prod, defensive)
      return "<!doctype html>\n" + document.documentElement.outerHTML;
    });

    return html;
  } finally {
    await page.close();
  }
}

async function main() {
  const specs = await buildRouteSpecs();

  // Include home route, which the noscript plugin skips (it's already
  // `dist/index.html`). SSG should overwrite it with real hydrated HTML.
  const paths = ["/", ...specs.map((s) => s.path)];

  console.log(`[ssg] starting static server on an ephemeral port`);
  const server = await startStaticServer();
  console.log(`[ssg] static server listening on :${PORT}`);

  console.log(`[ssg] launching headless Chrome`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let ok = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (const routePath of paths) {
    try {
      const html = await prerenderRoute(browser, routePath);
      const cleanPath = routePath === "/" ? "" : routePath.replace(/^\//, "");
      const targetDir = path.join(DIST_DIR, cleanPath);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, "index.html"), html, "utf-8");
      ok++;
      if (ok % 20 === 0) {
        console.log(`[ssg] ${ok}/${paths.length} rendered`);
      }
    } catch (err) {
      failed++;
      console.warn(`[ssg] failed ${routePath}: ${(err as Error).message}`);
    }
  }

  await browser.close();
  server.close();

  const secs = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[ssg] done — ${ok} ok, ${failed} failed, ${secs}s`);

  if (failed > 0 && ok === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[ssg] fatal:", err);
  process.exit(1);
});
