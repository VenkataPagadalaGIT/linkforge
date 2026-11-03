#!/usr/bin/env node
/**
 * Production start wrapper for Emergent K8s deployment.
 *
 * Behavior:
 *  - If `.next/BUILD_ID` exists, skip build (image already pre-built) and
 *    start the production server immediately.
 *  - Otherwise, run `next build` first, then `next start`.
 *
 * Why this matters:
 *  - The 1Gi K8s pod has tight memory headroom. Running `next build`
 *    concurrently with the FastAPI backend pushes peak combined RSS over 1Gi
 *    and causes an OOM-kill / CrashLoopBackOff (HTTP 520 health checks).
 *  - If the docker image build already produced `.next/`, skipping the
 *    runtime rebuild eliminates the OOM risk entirely.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync, spawn } = require("child_process");

const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
const hasBuild = fs.existsSync(buildIdPath);

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  return res.status ?? 1;
}

if (!hasBuild) {
  console.log("[start-prod] No .next/BUILD_ID found — running next build...");
  const code = run("./node_modules/.bin/next", ["build"], {
    NODE_OPTIONS: "--max-old-space-size=450",
  });
  if (code !== 0) {
    console.error(`[start-prod] next build exited with code ${code}`);
    process.exit(code);
  }
} else {
  console.log("[start-prod] .next/BUILD_ID found — skipping build, starting server.");
}

console.log("[start-prod] Starting next server on 0.0.0.0:3000...");
const child = spawn(
  "./node_modules/.bin/next",
  ["start", "-p", "3000", "-H", "0.0.0.0"],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
