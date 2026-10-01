#!/usr/bin/env python3
"""make-update-video.py: a 30-second narrated video for an AI Update.

Usage: python3 scripts/make-update-video.py <spec.json> [--outdir public/videos]

Everything is local and free: macOS `say` for the voiceover, Pillow for the
frames, ffmpeg to assemble. No API keys, no per-render cost, no upload of
our copy to a third party.

The spec is JSON so the pipeline is reusable for every future story:

  {
    "slug": "stripe-openrouter-acquisition-7-billion",
    "kicker": "AI UPDATE",
    "date": "August 16, 2026",
    "voice": "Samantha", "rate": 165,
    "logos": ["/abs/path/stripe.png", "/abs/path/openrouter.png"],
    "logoConnector": "reportedly acquires",
    "scenes": [
      {"say": "spoken sentence", "lines": ["ON-SCREEN", "second line"],
       "big": "$7B+", "sub": "caption under the big number"}
    ]
  }

Each scene's on-screen duration is measured from its OWN synthesized audio,
so narration and picture can never drift apart. A WebVTT caption file is
written alongside from the same script text, so the spoken words and the
captions cannot disagree either.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 30
BG = (9, 9, 11)
FG = (245, 246, 248)
MUTED = (150, 156, 166)
EMERALD = (52, 211, 153)
AMBER = (232, 179, 106)
RULE = (38, 40, 46)

MONO = "/System/Library/Fonts/Menlo.ttc"
DISPLAY = "/System/Library/Fonts/SFNSMono.ttf"


def font(size, bold=False):
    try:
        return ImageFont.truetype(MONO, size, index=1 if bold else 0)
    except Exception:
        return ImageFont.load_default()


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def say_to_wav(text, wav_path, voice, rate):
    """macOS TTS -> aiff -> wav. Returns duration in seconds."""
    aiff = wav_path.with_suffix(".aiff")
    run(["say", "-v", voice, "-r", str(rate), "-o", str(aiff), text])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff),
         "-ar", "44100", "-ac", "1", str(wav_path)])
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=nw=1:nk=1", str(wav_path)])
    aiff.unlink(missing_ok=True)
    return float(out.stdout.strip())


def paste_logo(img, path, box_w, box_h, xy):
    logo = Image.open(path).convert("RGBA")
    scale = min(box_w / logo.width, box_h / logo.height)
    logo = logo.resize((max(1, int(logo.width * scale)), max(1, int(logo.height * scale))), Image.LANCZOS)
    img.alpha_composite(logo, (int(xy[0] - logo.width / 2), int(xy[1] - logo.height / 2)))


def center_text(d, y, text, f, fill):
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return w


def render_scene(scene, spec, idx, path):
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)

    # chrome: kicker top-left, date top-right, hairline, site bottom-right
    d.text((64, 54), spec.get("kicker", "AI UPDATE"), font=font(20, True), fill=EMERALD)
    date = spec.get("date", "")
    d.text((W - 64 - d.textlength(date, font=font(20)), 54), date, font=font(20), fill=MUTED)
    d.line([(64, 96), (W - 64, 96)], fill=RULE, width=2)
    d.line([(64, H - 78), (W - 64, H - 78)], fill=RULE, width=2)
    site = "venkatapagadala.com"
    d.text((W - 64 - d.textlength(site, font=font(18)), H - 58), site, font=font(18), fill=MUTED)
    d.text((64, H - 58), f"{idx + 1}/{len(spec['scenes'])}", font=font(18), fill=MUTED)

    y = 190
    if scene.get("logos"):
        # the deal lockup: two official marks with a connector between them
        paste_logo(img, spec["logos"][0], 300, 84, (W * 0.29, 268))
        paste_logo(img, spec["logos"][1], 430, 64, (W * 0.71, 268))
        conn = spec.get("logoConnector", "acquires").upper()
        cf = font(19)
        d.text(((W - d.textlength(conn, font=cf)) / 2, 258), conn, font=cf, fill=MUTED)
        y = 380

    if scene.get("big"):
        bf = font(150, True)
        center_text(d, y, scene["big"], bf, FG)
        y += 178
        if scene.get("sub"):
            center_text(d, y, scene["sub"].upper(), font(22), MUTED)
            y += 54

    for line in scene.get("lines", []):
        bold = line.startswith("*")
        txt = line.lstrip("*")
        f = font(38 if bold else 30, bold)
        center_text(d, y, txt, f, AMBER if bold else FG)
        y += 58 if bold else 48

    img.convert("RGB").save(path, quality=95)


def main():
    spec = json.loads(Path(sys.argv[1]).read_text())
    outdir = Path(sys.argv[sys.argv.index("--outdir") + 1]) if "--outdir" in sys.argv else Path("public/videos")
    outdir.mkdir(parents=True, exist_ok=True)
    work = Path("/tmp/upd-video")
    work.mkdir(exist_ok=True)

    voice = spec.get("voice", "Samantha")
    rate = spec.get("rate", 165)

    # 1. narration per scene, measured
    parts, durations = [], []
    for i, sc in enumerate(spec["scenes"]):
        wav = work / f"vo{i}.wav"
        dur = say_to_wav(sc["say"], wav, voice, rate)
        pad = spec.get("scenePad", 0.45)
        parts.append(wav)
        durations.append(dur + pad)
        print(f"  scene {i + 1}: {dur:.2f}s narration (+{pad}s hold)")

    # 2. frames
    frames = []
    for i, sc in enumerate(spec["scenes"]):
        p = work / f"scene{i}.jpg"
        render_scene(sc, spec, i, p)
        frames.append(p)

    # 3. concat list with per-scene durations
    lst = work / "list.txt"
    lines = []
    for p, dur in zip(frames, durations):
        lines.append(f"file '{p}'")
        lines.append(f"duration {dur:.3f}")
    lines.append(f"file '{frames[-1]}'")  # concat demuxer needs the last frame repeated
    lst.write_text("\n".join(lines))

    # 4. narration track: silence-padded segments in order
    aud = work / "vo.wav"
    inputs = []
    for p, dur in zip(parts, durations):
        inputs += ["-i", str(p)]
    filt = "".join(f"[{i}:a]apad=pad_dur={spec.get('scenePad', 0.45)}[a{i}];" for i in range(len(parts)))
    filt += "".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1[out]"
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", filt, "-map", "[out]", str(aud)])

    # 5. mux
    slug = spec["slug"]
    mp4 = outdir / f"{slug}-30s.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-i", str(aud), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS),
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", str(mp4)])

    # 6. poster from the first frame
    poster = outdir / f"{slug}-30s-poster.png"
    Image.open(frames[0]).save(poster)

    # 7. captions from the same script, so words and captions cannot disagree
    vtt = ["WEBVTT", ""]
    t = 0.0
    def ts(s):
        return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}"
    for sc, dur in zip(spec["scenes"], durations):
        vtt += [f"{ts(t)} --> {ts(t + dur)}", sc["say"], ""]
        t += dur
    (outdir / f"{slug}-30s.vtt").write_text("\n".join(vtt))

    total = sum(durations)
    print(f"\nwrote {mp4} ({total:.1f}s)")
    print(f"wrote {poster}")
    print(f"wrote {outdir / (slug + '-30s.vtt')}")


if __name__ == "__main__":
    main()
