#!/usr/bin/env python3
"""export_photos.py: the photos on the brightonSEO thank-you page.

Usage: python3 scripts/brightonseo-support/export_photos.py [photo_dir]
       (default photo_dir: ~/Desktop/brightonSEO_SD26_Support/photos)

Reads <photo_dir>/source/. Each photo is turned upright, resized to two widths
and saved as WebP with no metadata at all: phone photos carry GPS coordinates
and the camera model, and neither belongs on a public page. HEIC sources go
through macOS sips first.

Every source was opened and checked against its caption before it was listed
here. Left out on purpose: IMG_4618 (a near copy of IMG_4617 with the slide
cut off) and IMG_4930 (the session before the talk, other speakers on stage).

Writes public/talks/brightonseo-san-diego-2026/photos/<slug>.webp (long edge
1600) and <slug>-sm.webp (long edge 800), and src/data/brightonPhotos.ts.
"""
import hashlib, json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageOps

REPO = Path(__file__).resolve().parents[2]
SRC = (Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop/brightonSEO_SD26_Support/photos") / "source"
OUT = REPO / "public/talks/brightonseo-san-diego-2026/photos"
WEB = "/talks/brightonseo-san-diego-2026/photos"
PREFIX = "venkata-pagadala-brightonseo-san-diego-2026-"
LARGE, SMALL = 1600, 800  # long edge, px

# In page order: the strongest stage shots first, landscape and portrait in
# turn so the row reads evenly, the empty room before the talk near the end,
# the expo hall last. Nobody else in these photos is named: they did not ask to
# be on the page. The optional box crops a photo to 4:3 so every landscape
# slide has the same shape (fractions of width and height: left, top, right, bottom).
PHOTOS = [
    ("chat_stage_pointing.webp", "stage-pointing-to-audience",
     "Venkata Pagadala on the Track 1 stage at brightonSEO San Diego 2026, pointing to the audience, with the agenda slide on the screen beside him",
     "Pointing to the room with the agenda slide up.", None),
    ("chat_stage_track1.webp", "track-1-stage",
     "Venkata Pagadala speaking on stage beside the Track 1 lectern at brightonSEO San Diego 2026",
     "On stage in Track 1.", None),
    # The 16:9 original, cut to 4:3 around the backdrop, the lectern and the agenda screen.
    ("IMG_4933.HEIC", "view-from-audience",
     "View from the audience: Venkata Pagadala at the Track 1 lectern, the agenda slide on the big screen, and attendees photographing it with their phones",
     "From the seats, while the agenda slide was up.", (0.175, 0.0, 0.925, 1.0)),
    ("chat_stage_speaking.webp", "speaking-clicker-in-hand",
     "Venkata Pagadala mid-talk at brightonSEO San Diego 2026, clicker in hand, in front of the sponsor wall",
     "Mid-talk, clicker in hand.", None),
    ("chat_stage_agenda.webp", "agenda-slide",
     "Venkata Pagadala on stage at brightonSEO San Diego 2026 beside the agenda slide: the thesis, two cases, a new dad gets a new car, four engines and one pattern, the method, and building the system",
     "The agenda: six parts, from the thesis to building the system.", None),
    ("chat_stage_close.webp", "speaking-close-up",
     "Close view of Venkata Pagadala speaking at brightonSEO San Diego 2026, wearing his speaker badge",
     "A closer view, mid-talk.", None),
    ("IMG_4617.HEIC", "title-slide-track-1",
     "The Track 1 room at brightonSEO San Diego 2026 before the talk, with the title slide, User First, Algorithm Second, on the screen",
     "The title slide, up in Track 1 before the talk.", None),
    ("chat_expo_selfie.jpg", "expo-hall-selfie",
     "Selfie of Venkata Pagadala, wearing his brightonSEO San Diego speaker badge, with a fellow attendee in the expo hall",
     "Between sessions in the expo hall.", None),
]


def load(path):
    if path.suffix.lower() == ".heic":
        with tempfile.TemporaryDirectory() as tmp:
            jpg = Path(tmp) / "x.jpg"
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "100", str(path), "--out", str(jpg)],
                           check=True, capture_output=True)
            im = Image.open(jpg)
            im.load()
    else:
        im = Image.open(path)
    return ImageOps.exif_transpose(im).convert("RGB")


def fit(im, edge):
    s = edge / max(im.size)
    return im if s >= 1 else im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
rows = []
for src, slug, alt, caption, box in PHOTOS:
    assert "—" not in alt + caption, f"em dash in {slug}"
    im = load(SRC / src)
    if box:
        im = im.crop((round(box[0] * im.width), round(box[1] * im.height), round(box[2] * im.width), round(box[3] * im.height)))
    big, small = fit(im, LARGE), fit(im, SMALL)
    name = PREFIX + slug
    # Saved without exif=: Pillow then writes no metadata, so no GPS and no camera model.
    big.save(OUT / f"{name}.webp", "WEBP", quality=76, method=6)
    small.save(OUT / f"{name}-sm.webp", "WEBP", quality=74, method=6)
    for f in (OUT / f"{name}.webp", OUT / f"{name}-sm.webp"):
        assert not Image.open(f).getexif(), f"metadata left in {f.name}"
    # The site caches public images for a day, so a re-cut photo under the same
    # name would keep showing the old cut. A fingerprint of the bytes in the URL
    # changes exactly when the picture does; the file name stays readable.
    v = lambda f: hashlib.md5((OUT / f).read_bytes()).hexdigest()[:8]
    rows.append({
        "src": f"{WEB}/{name}.webp?v={v(name + '.webp')}", "width": big.width, "height": big.height,
        "srcSm": f"{WEB}/{name}-sm.webp?v={v(name + '-sm.webp')}", "widthSm": small.width, "heightSm": small.height,
        "alt": alt, "caption": caption,
    })
    kb = lambda f: (OUT / f).stat().st_size // 1024
    print(f"{name}: {big.width}x{big.height} {kb(name + '.webp')} KB, {small.width}x{small.height} {kb(name + '-sm.webp')} KB")

TS = lambda v: json.dumps(v, ensure_ascii=False, indent=2)
(REPO / "src/data/brightonPhotos.ts").write_text(f'''/**
 * brightonPhotos.ts: the photos on the brightonSEO San Diego 2026 recap page.
 *
 * GENERATED by scripts/brightonseo-support/export_photos.py. Do not edit by
 * hand: change the list in the script and rerun. src is the large file (long
 * edge {LARGE}), srcSm the grid size (long edge {SMALL}); both are WebP with
 * every bit of metadata stripped, GPS included.
 */

export interface TalkPhoto {{
  src: string;
  width: number;
  height: number;
  srcSm: string;
  widthSm: number;
  heightSm: number;
  alt: string;
  caption: string;
}}

export const PHOTOS: TalkPhoto[] = {TS(rows)};
''')
print(len(rows), "photos")
