/**
 * The signed "refresh" message that tells the site to re-read published
 * content (docs/NO_DEPLOY_PUBLISHING.md). The publisher signs, the site's
 * /api/revalidate route verifies. The message can only trigger a re-read of
 * the repo's own file, never carry content, so even a leaked secret cannot
 * change what the site shows.
 *
 * Header: x-content-signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "t.body">
 * Pure (node:crypto only), so plain `node` tests and the publisher use it too.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_SKEW_SECONDS = 300;
export const MIN_SECRET_LENGTH = 32;

export function signContent(secret: string, body: string, nowMs: number): string {
  const t = Math.floor(nowMs / 1000);
  const v1 = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

export type SignatureVerdict =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "missing" | "malformed" | "stale" | "bad-signature" };

export function verifyContentSignature(opts: {
  secret: string | undefined;
  header: string | null | undefined;
  body: string;
  nowMs: number;
}): SignatureVerdict {
  const secret = opts.secret || "";
  if (secret.length < MIN_SECRET_LENGTH) return { ok: false, reason: "not-configured" };
  if (!opts.header) return { ok: false, reason: "missing" };
  const m = /^t=(\d{1,12}),v1=([0-9a-f]{64})$/.exec(opts.header.trim());
  if (!m) return { ok: false, reason: "malformed" };
  const t = Number(m[1]);
  if (Math.abs(Math.floor(opts.nowMs / 1000) - t) > MAX_SKEW_SECONDS) return { ok: false, reason: "stale" };
  const expected = createHmac("sha256", secret).update(`${t}.${opts.body}`).digest();
  const given = Buffer.from(m[2], "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "bad-signature" };
  return { ok: true };
}
