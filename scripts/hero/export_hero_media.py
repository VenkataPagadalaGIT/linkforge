#!/usr/bin/env python3
"""export_hero_media.py: the home banner's twin portrait media.

Usage: python3 scripts/hero/export_hero_media.py [source_dir] [--debug DIR]
       (default source_dir: ~/Desktop/Videos/Hero)

Sources, made with the Higgsfield connector on 2026-10-23 from the owner's own
photo (public/venkata-pagadala.jpeg) and approved by him:
  living-kling4-c1d29ffe.mp4          Kling 4.0, start and end frame = the photo:
                                      breathing, blinks, a warm smile; loops
  twin/ai-living-kling4-5321de90.mp4  Kling 4.0 video edit of that loop, with the
                                      android still (twin/ai-twin-gpt25-21f8a211.png,
                                      GPT Image 2.5) as reference: the same frames,
                                      the same motion, synthetic skin, cyan circuits
The alternates (alt-*, and the second edit bbe9d240) stay in the folder, unused.

The edit re-renders the whole frame, so its blazer and background differ from
the human loop by a few levels and its plaid by a pixel. The banner shows the
two side by side, split by a moving seam, so any difference outside the face
would show as a tear. The twin is therefore composited: the human frame
everywhere, and the edit only inside a feathered head-and-neck mask measured
from where the two clips actually differ. Across the seam only the face changes.

Both halves get the same loop crossfade (the edit's last frame does not
quite match its first), and they are packed side by side into ONE video, so
the halves are frame-locked: two video elements would drift apart.

Writes to public/hero/:
  venkata-pagadala-twin.{webm,mp4}  1440x720, no audio: human left, twin right
  venkata-pagadala-ai.jpg           the twin's first frame, 800x800: the dust
                                    samples its AI colours from it, and it is the
                                    still for reduced motion and Save-Data
and src/data/heroPortrait.ts with the URLs (each with ?v=<md5[:8]>, because
/public files are cached for a day).
"""
import hashlib, json, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parents[2]
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
DEBUG = Path(sys.argv[sys.argv.index("--debug") + 1]) if "--debug" in sys.argv else None
if DEBUG and str(DEBUG) in ARGS:
    ARGS.remove(str(DEBUG))
SRC = Path(ARGS[0]) if ARGS else Path.home() / "Desktop/Videos/Hero"
OUT = REPO / "public/hero"
WEB = "/hero"
HUMAN = SRC / "living-kling4-c1d29ffe.mp4"
TWIN = SRC / "twin/ai-living-kling4-5321de90.mp4"
SIZE = 720
FPS = 24
# frames blended across the loop point: the edit's end and start differ slightly
XFADE = 8


def run(*cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw).stdout


def v(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()[:8]


def frames(src: Path, size: int, pick: list | None = None) -> np.ndarray:
    """Frames as uint8 RGB, (n, size, size, 3): all of them, or only the indices in pick, in that order."""
    vf = f"scale={size}:{size}:flags=lanczos"
    if pick is not None:
        vf = "select='" + "+".join(f"eq(n\\,{i})" for i in sorted(set(pick))) + "'," + vf
    raw = run("ffmpeg", "-nostdin", "-v", "error", "-i", str(src), "-vf", vf, "-fps_mode", "passthrough",
              "-f", "rawvideo", "-pix_fmt", "rgb24", "-")
    out = np.frombuffer(raw, np.uint8).reshape(-1, size, size, 3)
    if pick is None:
        return out
    order = sorted(set(pick))
    return out[[order.index(i) for i in pick]]


def head_mask(h: np.ndarray, a: np.ndarray) -> np.ndarray:
    """Where the edit changed the person, as a feathered 0..1 mask, (size, size).

    The mean difference over the whole clip, thresholded inside the head box;
    each row is filled between its outermost changed pixels (a silhouette, not
    speckle), the row edges are smoothed, and the edge is grown and feathered
    so the blend lands on the background, where both clips agree.
    """
    n, s = len(h), h.shape[1]
    diff = np.zeros((s, s), np.float32)
    for i in range(n):
        diff += np.abs(a[i].astype(np.float32) - h[i]).mean(axis=2)
    diff /= n
    # PIL blurs 8-bit images only; the threshold sits far below 255, so nothing is lost
    diff = np.asarray(Image.fromarray(np.clip(diff, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), np.float32)
    x0, x1, y0, y1 = int(0.26 * s), int(0.74 * s), int(0.03 * s), int(0.47 * s)
    hot = np.zeros_like(diff, bool)
    hot[y0:y1, x0:x1] = diff[y0:y1, x0:x1] > 14
    lefts, rights = np.full(s, -1.0), np.full(s, -1.0)
    for y in range(s):
        xs = np.flatnonzero(hot[y])
        if len(xs) > 6:
            lefts[y], rights[y] = xs[0], xs[-1]
    rows = np.flatnonzero(lefts >= 0)
    top, bot = rows[0], rows[-1]

    def smooth(e):
        # rows with no hit borrow their neighbours; then a running median over +-6 rows
        e = e.copy()
        idx = np.arange(s)
        ok = e >= 0
        e[top:bot + 1] = np.interp(idx[top:bot + 1], idx[ok], e[ok])
        out = e.copy()
        for y in range(top, bot + 1):
            out[y] = np.median(e[max(top, y - 6):min(bot, y + 6) + 1])
        return out

    L, R = smooth(lefts), smooth(rights)
    m = np.zeros((s, s), np.uint8)
    for y in range(top, bot + 1):
        m[y, int(L[y]):int(R[y]) + 1] = 255
    img = Image.fromarray(m).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(7))
    img = img.filter(ImageFilter.GaussianBlur(7))
    return np.asarray(img, np.float32) / 255.0


def looped(frame, n: int, k: int):
    """Seamless loop of length n - k: the first k frames blend in from the last k, which are dropped."""
    def at(i: int) -> np.ndarray:
        if i < k:
            w = (i + 1) / (k + 1)
            return (1 - w) * frame(n - k + i) + w * frame(i)
        return frame(i)
    return at


def encode(count: int, wid: int, hgt: int, make, stem: str) -> dict:
    """Streams count frames from make(i) through a lossless master into VP9 and H.264."""
    webm, mp4 = OUT / f"{stem}.webm", OUT / f"{stem}.mp4"
    with tempfile.TemporaryDirectory() as tmp:
        master = Path(tmp) / "master.mkv"
        proc = subprocess.Popen(["ffmpeg", "-nostdin", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{wid}x{hgt}",
                                 "-r", str(FPS), "-i", "-", "-c:v", "ffv1", str(master)], stdin=subprocess.PIPE)
        for i in range(count):
            proc.stdin.write(np.clip(make(i) + 0.5, 0, 255).astype(np.uint8).tobytes())
        proc.stdin.close()
        if proc.wait() != 0:
            raise SystemExit("ffmpeg master encode failed")
        run("ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(master), "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36",
            "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", str(webm))
        run("ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(master), "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
            "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(mp4))
    return {"webm": f"{WEB}/{webm.name}?v={v(webm)}", "mp4": f"{WEB}/{mp4.name}?v={v(mp4)}", "duration": round(count / FPS, 3),
            "frames": count, "kb": {"webm": round(webm.stat().st_size / 1024), "mp4": round(mp4.stat().st_size / 1024)}}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    h, a = frames(HUMAN, SIZE), frames(TWIN, SIZE)
    n = min(len(h), len(a))
    h, a = h[:n], a[:n]
    mask = head_mask(h, a)
    m = mask[:, :, None]
    # the edit's room and blazer run a few levels off; match them to the human
    # clip outside the mask, so the feathered edge blends like for like
    outside = mask < 0.02
    sh, sa = np.zeros(3), np.zeros(3)
    for i in range(n):
        sh += h[i][outside].sum(0)
        sa += a[i][outside].sum(0)
    gain = (sh / np.maximum(1, sa)).astype(np.float32)

    human = looped(lambda i: h[i].astype(np.float32), n, XFADE)
    twin = looped(lambda i: h[i] * (1 - m) + np.clip(a[i] * gain, 0, 255) * m, n, XFADE)
    count = n - XFADE
    data = {"twin": encode(count, 2 * SIZE, SIZE, lambda i: np.concatenate([human(i), twin(i)], axis=1), "venkata-pagadala-twin")}

    # the twin's first frame at 800 px: the same mask, blend and crossfade weight
    big = 800
    hb = frames(HUMAN, big, [n - XFADE, 0]).astype(np.float32)
    ab = frames(TWIN, big, [n - XFADE, 0]).astype(np.float32)
    mb = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((big, big), Image.BILINEAR), np.float32)[:, :, None] / 255
    tb = hb * (1 - mb) + np.clip(ab * gain, 0, 255) * mb
    w = 1 / (XFADE + 1)
    first = (1 - w) * tb[0] + w * tb[1]
    still = OUT / "venkata-pagadala-ai.jpg"
    Image.fromarray(np.clip(first + 0.5, 0, 255).astype(np.uint8)).save(still, "JPEG", quality=88, optimize=True)
    data["aiStill"] = {"src": f"{WEB}/{still.name}?v={v(still)}", "width": big, "height": big}

    if DEBUG:
        DEBUG.mkdir(parents=True, exist_ok=True)
        Image.fromarray((mask * 255).astype(np.uint8)).save(DEBUG / "mask.png")
        half = SIZE // 2
        for i in (0, 40, 80):
            sp = human(i).copy()
            sp[:, half:] = twin(i)[:, half:]
            Image.fromarray(np.clip(sp + 0.5, 0, 255).astype(np.uint8)).save(DEBUG / f"split_{i:03d}.png")
        for name, f in (("human", human), ("twin", twin)):
            steps = [float(np.abs(f(i + 1) - f(i)).mean()) for i in range(0, count - 1, 4)]
            print(f"{name}: loop jump {float(np.abs(f(0) - f(count - 1)).mean()):.2f}, mean step {np.mean(steps):.2f}")
        print(f"colour gain {gain.round(3).tolist()}")

    body = (
        "// GENERATED by scripts/hero/export_hero_media.py from the Higgsfield clips in ~/Desktop/Videos/Hero.\n"
        "// Do not edit by hand; rerun the script.\n\n"
        f"export const HERO_PORTRAIT = {json.dumps(data, indent=2)} as const;\n"
    )
    (REPO / "src/data/heroPortrait.ts").write_text(body)
    print(json.dumps(data, indent=1))


if __name__ == "__main__":
    main()
