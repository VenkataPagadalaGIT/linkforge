#!/usr/bin/env python3
"""export_ufi_media.py: the stage clips and slides the User-First Intelligence
guide shows from the brightonSEO San Diego 2026 talk.

Usage: python3 scripts/ufi-media/export_ufi_media.py [video_dir]
       (default video_dir: ~/Desktop/Videos/Brighton SEO)

Clips. Three of the six 16:9 highlight cuts rendered on 2026-10-07 from the
talk recording (render_shorts.py in <video_dir>/source). Each was watched frame
by frame before it was listed here. Left out on purpose:
  1-algorithms-change-users-dont  the title slide is on screen the whole time,
                                  with employer and client logos and a case result
  2-ai-cited-us-anyway            the paper's case study and its traffic figures
  3-nobody-wants-3000-words       employer-site metrics on the stat cards
The captions are burned into the picture; the transcript written beside each
clip is the same caption text, so readers without sound, screen readers and
search engines get the words too.

Slides. Five slides from the public Speaker Deck copy of the deck, downloaded
from Speaker Deck's own image files. Each was opened and checked: none shows a
client, an employer or a retailer name.

Writes public/guides/user-first-intelligence/{clips,slides}/ and
src/data/ufiMedia.ts. Every URL carries ?v=<md5[:8]> because /public files are
cached for a day and a re-cut file under the same name would show stale.
"""
import ast, hashlib, json, re, subprocess, sys, tempfile, urllib.request
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
VID = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop/Videos/Brighton SEO"
OUT = REPO / "public/guides/user-first-intelligence"
WEB = "/guides/user-first-intelligence"
PREFIX = "venkata-pagadala-brightonseo-san-diego-2026-"
DECK_ID = "42500ef2be054df78bf4832f5d091a32"

# (render name, published slug)
CLIPS = [
    ("4-not-a-prompt-not-a-keyword", "its-a-conversation"),
    ("5-5-6-million-queries", "classify-the-queries"),
    ("6-agent-does-60-70-percent", "agents-do-the-gathering"),
]

# Speaker Deck's 0-based image index, the slug, and the alt text (what the slide says).
SLIDES = [
    (3, "zero-volume-is-not-zero-demand",
     "Slide: Zero volume is not zero demand. It means the tool cannot see how people search on different platforms now. Real buyers were asking anyway, and every AI engine was already listening."),
    (15, "what-each-engine-retrieved",
     "Slide: What each engine retrieved. ChatGPT mentioned a Facebook group and dealer pages and priced four dealers; Perplexity cited Reddit threads and dealer pages; Gemini cited Reddit; Google's AI Overview cited Reddit and the Facebook post. It's not about volume or platform. Follow where your users are."),
    (21, "twenty-demand-sources",
     "Slide: The method, sources. Twenty demand sources: search demand, Google Business Profile reviews, YouTube, X, competitors, Reddit, TikTok, wikis, conferences, Facebook groups, Instagram, marketplaces, newsletters, public data, podcasts, earnings calls, app reviews, job postings, research papers and regulations, in five groups: search, social, reviews, market and expert."),
    (23, "five-personas-five-questions",
     "Slide: Five personas, five questions. Same car, same city: the value seeker, the deep researcher, the community buyer, the trend explorer and the industry expert each ask a different question, trust different sources and are won by different content. Research per persona, not per keyword."),
    (27, "pain-point-to-product",
     "Slide: Reviews are demand data too. Pain point to product beats volume: 47,485 reviews scored by theme, with long wait as the pain point. Long wait became digital check-ins and in-app virtual appointments."),
]


def md5(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()[:8]


def run(*cmd: str) -> str:
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def shorts_text() -> dict:
    """name -> (headline, caption text), read from render_shorts.py's SHORTS without running it."""
    tree = ast.parse((VID / "source/render_shorts.py").read_text())
    out = {}
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Assign) and any(getattr(t, "id", None) == "SHORTS" for t in node.targets)):
            continue
        for call in node.value.elts:
            kw = {k.arg: k.value for k in call.keywords}
            segs = [next(k.value.value for k in s.keywords if k.arg == "text") for s in kw["segments"].elts]
            text = re.sub(r"\s+", " ", " ".join(s.replace("|", " ") for s in segs)).strip()
            out[kw["name"].value] = (kw["headline"].value, text)
    return out


def transcript() -> list:
    src = (REPO / "src/data/brightonTranscript.ts").read_text()
    m = re.search(r"export const TRANSCRIPT: TranscriptChapter\[\] = (\[.*\]);", src, re.S)
    return json.loads(m.group(1))


def shingles(text: str, n: int = 3) -> set:
    w = re.findall(r"[a-z0-9']+", text.lower())
    return {" ".join(w[i:i + n]) for i in range(len(w) - n + 1)}


def chapter_of(text: str, chapters: list) -> dict:
    """The 15-minute edit's chapter that shares the most of this clip's words: the clip clock is the long video's, not the edit's."""
    mine = shingles(text)
    def score(c):
        return len(mine & shingles(" ".join(p["text"] for p in c["paragraphs"] if p["speaker"] == "venkata")))
    best = max(chapters, key=score)
    assert score(best) >= 3, f"no chapter shares the opening words of: {text[:60]}"
    return {"at": best["at"], "title": best["title"]}


def main() -> None:
    (OUT / "clips").mkdir(parents=True, exist_ok=True)
    (OUT / "slides").mkdir(parents=True, exist_ok=True)
    texts, chapters = shorts_text(), transcript()

    clips = []
    for name, slug in CLIPS:
        mp4 = OUT / "clips" / f"{PREFIX}{slug}.mp4"
        run("ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(VID / "wide" / f"{name}.mp4"),
            "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "27",
            "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            "-map_metadata", "-1", "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(mp4))
        poster = OUT / "clips" / f"{PREFIX}{slug}.webp"
        im = Image.open(VID / "covers" / f"{name}-wide.jpg").convert("RGB")
        im.save(poster, "WEBP", quality=80, method=6)
        dur = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)))
        headline, text = texts[name]
        clips.append({
            "slug": slug,
            "title": headline,
            "src": f"{WEB}/clips/{mp4.name}?v={md5(mp4)}",
            "poster": {"src": f"{WEB}/clips/{poster.name}?v={md5(poster)}", "width": im.width, "height": im.height},
            "duration": round(dur, 1),
            "bytes": mp4.stat().st_size,
            "transcript": text,
            "chapter": chapter_of(text, chapters),
        })

    slides = []
    with tempfile.TemporaryDirectory() as tmp:
        for idx, slug, alt in SLIDES:
            raw = Path(tmp) / f"slide_{idx}.jpg"
            req = urllib.request.Request(f"https://files.speakerdeck.com/presentations/{DECK_ID}/slide_{idx}.jpg",
                                         headers={"User-Agent": "Mozilla/5.0"})
            raw.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            im = Image.open(raw).convert("RGB")
            out = OUT / "slides" / f"{PREFIX}slide-{idx + 1}-{slug}.webp"
            im.save(out, "WEBP", quality=84, method=6)
            slides.append({"n": idx + 1, "slug": slug, "alt": alt,
                           "src": f"{WEB}/slides/{out.name}?v={md5(out)}", "width": im.width, "height": im.height})

    body = (
        "// GENERATED by scripts/ufi-media/export_ufi_media.py from the brightonSEO San Diego 2026\n"
        "// highlight cuts and the public Speaker Deck. Do not edit by hand; rerun the script.\n\n"
        f"export const UFI_CLIPS = {json.dumps({c['slug']: c for c in clips}, indent=2, ensure_ascii=False)} as const;\n\n"
        f"export const UFI_SLIDES = {json.dumps({s['slug']: s for s in slides}, indent=2, ensure_ascii=False)} as const;\n"
    )
    (REPO / "src/data/ufiMedia.ts").write_text(body)
    for c in clips:
        print(f"clip  {c['slug']}: {c['duration']} s, {c['bytes'] / 1e6:.2f} MB, chapter {c['chapter']}")
    for s in slides:
        print(f"slide {s['n']}: {s['slug']} {s['width']}x{s['height']}")


if __name__ == "__main__":
    main()
