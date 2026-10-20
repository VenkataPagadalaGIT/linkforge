"""Upload the archive's PUBLIC media to Cloudflare R2 (bucket served at https://media.venkatapagadala.com).

Only items in the tracked public data (src/data/linkedinArchiveData.ts, checked by check-linkedin-data.mjs) are sent:
held, DM and personal media never leave the SSD. Keys mirror the site's URLs: linkedin/<t|n|p|f|v|d>/<idx>.<ext>.
Resumable: an object already in the bucket with the same size is skipped.

Credentials come from the macOS Keychain at run time and are never printed:
  security add-generic-password -a "$USER" -s cloudflare-r2-access-key-id -w
  security add-generic-password -a "$USER" -s cloudflare-r2-secret-access-key -w

Usage (standard library only):
  python3 -I scripts/linkedin/upload-media-r2.py --endpoint https://<account-id>.r2.cloudflarestorage.com \
      --bucket venkatapagadala-media --src "/Volumes/Extreme SSD/LinkedIn-Data/web/linkedin" [--dry-run]
"""
import argparse
import concurrent.futures as cf
import datetime
import hashlib
import hmac
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
TYPES = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4", ".pdf": "application/pdf",
         ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}


def keychain(service):
    r = subprocess.run(["security", "find-generic-password", "-a", os.environ.get("USER", ""), "-s", service, "-w"], capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        sys.exit(f"Keychain item '{service}' not found. Add it with: security add-generic-password -a \"$USER\" -s {service} -w")
    return r.stdout.strip()


def public_ids():
    src = (ROOT / "src/data/linkedinArchiveData.ts").read_text()
    ids = set(re.findall(r'\\?"idx\\?":\\?"(\d{4})', src))
    if not ids:
        sys.exit("no public items found in src/data/linkedinArchiveData.ts")
    return ids


class R2:
    def __init__(self, endpoint, bucket, key_id, secret):
        self.host = urllib.parse.urlparse(endpoint).netloc
        self.base = endpoint.rstrip("/")
        self.bucket, self.key_id, self.secret = bucket, key_id, secret

    def _sign(self, method, key, extra=None):
        now = datetime.datetime.now(datetime.timezone.utc)
        amz_date, day = now.strftime("%Y%m%dT%H%M%SZ"), now.strftime("%Y%m%d")
        path = "/" + self.bucket + "/" + urllib.parse.quote(key, safe="/")
        headers = {"host": self.host, "x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amz_date}
        signed = ";".join(sorted(headers))
        canonical = "\n".join([method, path, "", "".join(f"{k}:{headers[k]}\n" for k in sorted(headers)), signed, "UNSIGNED-PAYLOAD"])
        scope = f"{day}/auto/s3/aws4_request"
        to_sign = "\n".join(["AWS4-HMAC-SHA256", amz_date, scope, hashlib.sha256(canonical.encode()).hexdigest()])
        k = ("AWS4" + self.secret).encode()
        for part in (day, "auto", "s3", "aws4_request"):
            k = hmac.new(k, part.encode(), hashlib.sha256).digest()
        sig = hmac.new(k, to_sign.encode(), hashlib.sha256).hexdigest()
        out = {"x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amz_date,
               "Authorization": f"AWS4-HMAC-SHA256 Credential={self.key_id}/{scope}, SignedHeaders={signed}, Signature={sig}"}
        out.update(extra or {})
        return self.base + path, out

    def size(self, key):
        url, h = self._sign("HEAD", key)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=h, method="HEAD"), timeout=60) as r:
                return int(r.headers.get("Content-Length", -1))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

    def put(self, key, path):
        n = path.stat().st_size
        url, h = self._sign("PUT", key, {"Content-Type": TYPES.get(path.suffix.lower(), "application/octet-stream"),
                                         "Cache-Control": "public, max-age=31536000, immutable", "Content-Length": str(n)})
        with open(path, "rb") as f:
            req = urllib.request.Request(url, data=f, headers=h, method="PUT")
            with urllib.request.urlopen(req, timeout=900) as r:
                if r.status not in (200, 201):
                    raise RuntimeError(f"PUT {key}: HTTP {r.status}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--bucket", default="venkatapagadala-media")
    ap.add_argument("--src", default="/Volumes/Extreme SSD/LinkedIn-Data/web/linkedin")
    ap.add_argument("--prefix", default="linkedin")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()
    if not re.fullmatch(r"https://[0-9a-f]{32}\.r2\.cloudflarestorage\.com/?", a.endpoint):
        sys.exit("endpoint must look like https://<32-hex account id>.r2.cloudflarestorage.com")
    ids, src = public_ids(), pathlib.Path(a.src)
    jobs = []
    for sub in ["t", "n", "p", "f", "d", "v"]:  # images first, videos last
        d = src / sub
        if d.is_dir():
            jobs += [(f"{a.prefix}/{sub}/{p.name}", p) for p in sorted(d.iterdir()) if p.is_file() and p.name[:4] in ids]
    total = sum(p.stat().st_size for _, p in jobs)
    print(f"{len(jobs)} public files, {total / 1e9:.2f} GB, from {len(ids)} public items")
    if a.dry_run:
        return
    r2 = R2(a.endpoint, a.bucket, keychain("cloudflare-r2-access-key-id"), keychain("cloudflare-r2-secret-access-key"))
    done = skipped = failed = 0

    def one(job):
        key, path = job
        for attempt in range(4):
            try:
                if r2.size(key) == path.stat().st_size:
                    return "skip"
                r2.put(key, path)
                return "ok"
            except Exception as e:  # retried; the last error is reported without credentials
                err = f"{type(e).__name__}: {str(e)[:120]}"
        return "fail " + key + " " + err

    with cf.ThreadPoolExecutor(a.workers) as ex:
        for i, res in enumerate(ex.map(one, jobs), 1):
            if res == "ok":
                done += 1
            elif res == "skip":
                skipped += 1
            else:
                failed += 1
                print(res, flush=True)
            if i % 100 == 0 or i == len(jobs):
                print(f"{i}/{len(jobs)}: uploaded {done}, already there {skipped}, failed {failed}", flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
