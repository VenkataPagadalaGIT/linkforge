#!/usr/bin/env python3
"""
Catch HSL-triplet tokens used as if they were colours.

globals.css defines tokens as bare HSL components: `--foreground: 0 0% 0%`.
Tailwind wraps them, so `bg-foreground` is correct, but an inline style saying
`background: var(--foreground)` resolves to the literal string `0 0% 0%`, which
is not a colour. CSS drops the declaration silently, nothing is painted, and
the element renders transparent.

That shipped: percentage bars on the question pages had their width set
correctly and no fill at all, so every row showed a number beside an empty
track and nothing looked broken. It is invisible to review because the value
IS there in the markup.

Correct form is hsl(var(--token)), or a Tailwind class.
"""
import re, sys, pathlib

ROOT = pathlib.Path(".")
CSS = [ROOT / "app" / "globals.css", ROOT / "src" / "index.css"]

triplet = set()
for f in CSS:
    if not f.exists():
        continue
    for name, val in re.findall(r"--([\w-]+):\s*([^;]+);", f.read_text()):
        if re.fullmatch(r"[\d.]+\s+[\d.]+%\s+[\d.]+%", val.strip()):
            triplet.add(name)

# A fallback does not save you: `var(--border, rgba(...))` uses the fallback
# only when --border is UNDEFINED, and it is defined, as a triplet. So the
# declaration is still invalid. Match the token followed by comma OR paren;
# the first version required a bare `)` and walked straight past these.
BAD = re.compile(r"(?<!hsl\()var\(--(" + "|".join(sorted(triplet)) + r")\s*[,)]")
bad = []
for f in list(ROOT.glob("src/**/*.tsx")) + list(ROOT.glob("app/**/*.tsx")):
    if "/frontend/" in str(f):
        continue
    for i, line in enumerate(f.read_text().split("\n"), 1):
        for m in BAD.finditer(line):
            # only flag where it is used as a colour value
            # Colour values reach the DOM through css properties AND through
            # props like accent= or color=, which the first version of this
            # check missed: the avatar was passing a bare triplet as a fill.
            if re.search(r"(background|backgroundColor|color|fill|stroke|borderColor|accent|shade|tint)\s*[:=]", line):
                bad.append(f"{f}:{i}  var(--{m.group(1)}) used as a colour; needs hsl(var(--{m.group(1)}))")

print(f"HSL-triplet tokens found: {len(triplet)}")
if bad:
    print(f"CSS TOKEN GATE: FAIL ({len(bad)})")
    for b in bad[:30]:
        print("  x " + b)
    sys.exit(1)
print("CSS TOKEN GATE: PASS (no bare triplet token used as a colour)")
