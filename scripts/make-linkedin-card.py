#!/usr/bin/env python3
"""make-linkedin-card.py: one glanceable card for the LinkedIn feed.

Usage: python3 scripts/make-linkedin-card.py <spec.json> [--outdir DIR]

Built for a one-second read while someone scrolls: two official logos, one
enormous number, one line of context, and the honest caveat that keeps the
post credible. Dark card on purpose, because the LinkedIn feed is white and
a dark card is the thing that stops the thumb.

Renders 1200x1200 (square) and 1080x1350 (portrait, maximum feed height).
Same local, free toolchain as the video generator: Pillow only.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG = (9, 9, 11)
FG = (245, 246, 248)
MUTED = (150, 156, 166)
EMERALD = (52, 211, 153)
AMBER = (232, 179, 106)
RULE = (40, 42, 48)
MONO = "/System/Library/Fonts/Menlo.ttc"


def font(size, bold=False):
    try:
        return ImageFont.truetype(MONO, size, index=1 if bold else 0)
    except Exception:
        return ImageFont.load_default()


def fit(d, text, f, max_w):
    """Shrink until it fits: never let a headline overflow the card."""
    size = f.size
    while size > 12:
        try:
            ff = ImageFont.truetype(MONO, size, index=1)
        except Exception:
            return f
        if d.textlength(text, font=ff) <= max_w:
            return ff
        size -= 2
    return font(12, True)


def center(d, y, text, f, fill, W):
    d.text(((W - d.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)


def paste_logo(img, path, box_w, box_h, cx, cy):
    logo = Image.open(path).convert("RGBA")
    s = min(box_w / logo.width, box_h / logo.height)
    logo = logo.resize((int(logo.width * s), int(logo.height * s)), Image.LANCZOS)
    img.alpha_composite(logo, (int(cx - logo.width / 2), int(cy - logo.height / 2)))


def render(spec, W, H, path):
    img = Image.new("RGBA", (W, H), BG + (255,))
    d = ImageDraw.Draw(img)
    pad = int(W * 0.075)
    scale = W / 1200

    # kicker rule
    d.text((pad, pad), spec["kicker"].upper(), font=font(int(26 * scale), True), fill=EMERALD)
    date = spec["date"].upper()
    d.text((W - pad - d.textlength(date, font=font(int(26 * scale))), pad),
           date, font=font(int(26 * scale)), fill=MUTED)
    d.line([(pad, pad + int(52 * scale)), (W - pad, pad + int(52 * scale))], fill=RULE, width=2)

    # logo lockup
    top = pad + int(150 * scale)
    paste_logo(img, spec["logos"][0], int(330 * scale), int(96 * scale), W * 0.28, top)
    conn = spec["connector"].upper()
    cf = font(int(24 * scale))
    center(d, top - int(14 * scale), conn, cf, MUTED, W)
    paste_logo(img, spec["logos"][1], int(470 * scale), int(74 * scale), W * 0.74, top)

    # the number: the whole point of the card
    y = top + int(150 * scale)
    bigf = fit(d, spec["big"], font(int(300 * scale), True), W - pad * 2)
    center(d, y, spec["big"], bigf, FG, W)
    y += int(bigf.size * 1.16)
    center(d, y, spec["bigSub"].upper(), font(int(30 * scale)), MUTED, W)

    # supporting facts
    y += int(96 * scale)
    for line in spec["facts"]:
        f = font(int(34 * scale))
        center(d, y, line, f, FG, W)
        y += int(56 * scale)

    # the caveat box: what makes the post trustworthy instead of hype
    box_h = int(112 * scale)
    box_y = H - pad - int(96 * scale) - box_h
    d.rectangle([(pad, box_y), (W - pad, box_y + box_h)], outline=AMBER, width=2)
    center(d, box_y + int(24 * scale), spec["caveat"].upper(), font(int(30 * scale), True), AMBER, W)
    center(d, box_y + int(64 * scale), spec["caveatSub"], font(int(25 * scale)), MUTED, W)

    # footer
    d.line([(pad, H - pad - int(58 * scale)), (W - pad, H - pad - int(58 * scale))], fill=RULE, width=2)
    d.text((pad, H - pad - int(40 * scale)), spec["source"], font=font(int(24 * scale)), fill=MUTED)
    site = spec["site"]
    d.text((W - pad - d.textlength(site, font=font(int(24 * scale), True)), H - pad - int(40 * scale)),
           site, font=font(int(24 * scale), True), fill=FG)

    img.convert("RGB").save(path, quality=96)
    return path


def main():
    spec = json.loads(Path(sys.argv[1]).read_text())
    outdir = Path(sys.argv[sys.argv.index("--outdir") + 1]) if "--outdir" in sys.argv else Path(".")
    outdir.mkdir(parents=True, exist_ok=True)
    slug = spec["slug"]
    for name, (w, h) in {"square": (1200, 1200), "portrait": (1080, 1350)}.items():
        p = render(spec, w, h, outdir / f"{slug}-linkedin-{name}.jpg")
        print(f"wrote {p} ({w}x{h})")


if __name__ == "__main__":
    main()
