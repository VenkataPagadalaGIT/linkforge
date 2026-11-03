#!/usr/bin/env python3
"""Brand and accessibility gate. See docs/BRAND_GUIDELINES.md.

Two mechanical rules, both born from measured failures on the live site:

  PALE_ACCENT   text-<hue>-200/300 on a text element without a dark: partner.
                amber-300 on white measured 1.44:1; nobody can read that.
  DIM_TEXT      text-muted-foreground below /70. The /50 labels measured
                4.09:1 in dark and 4.47:1 in light; the floor that passes
                both themes is /70.

Exceptions live in scripts/brand-exceptions.txt as "<path>:<pattern>  # why".
Exit 1 on any unexcepted violation, so preflight can gate on it.
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PALE = re.compile(
    r"(?<!dark:)\btext-(amber|sky|emerald|green|yellow|cyan|lime|orange|rose|"
    r"violet|fuchsia|teal|blue|red|purple|pink|indigo)-(100|200|300)(/\d+)?\b"
)
DIM = re.compile(r"\btext-muted-foreground/(10|15|20|25|30|35|40|45|50|55|60|65)\b")

def exceptions():
    path = os.path.join(REPO, "scripts", "brand-exceptions.txt")
    out = set()
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.split("#")[0].strip()
            if line:
                out.add(line)
    return out

def main():
    allow = exceptions()
    violations = []
    for root in ("src", "app"):
        for dirpath, _, files in os.walk(os.path.join(REPO, root)):
            if "frontend" in dirpath:
                continue
            for fn in files:
                if not fn.endswith(".tsx"):
                    continue
                path = os.path.join(dirpath, fn)
                rel = os.path.relpath(path, REPO)
                for i, line in enumerate(open(path, encoding="utf-8"), 1):
                    for rule, pat in (("PALE_ACCENT", PALE), ("DIM_TEXT", DIM)):
                        for m in pat.finditer(line):
                            key = f"{rel}:{m.group(0)}"
                            if key in allow:
                                continue
                            violations.append(f"{rule:12} {rel}:{i}  {m.group(0)}")
    if violations:
        print(f"BRAND GATE: FAIL ({len(violations)})")
        for v in violations[:40]:
            print("  x " + v)
        if len(violations) > 40:
            print(f"  ... and {len(violations) - 40} more")
        return 1
    print("BRAND GATE: PASS (accent pairs and text-opacity floor hold site-wide)")
    return 0

if __name__ == "__main__":
    sys.exit(main())

def check_platform_contrast():
    """
    Platform brand colours must be visible on BOTH grounds.

    X (#E7E9EA) and Snapchat (#FFFC00) shipped at 1.2:1 and 1.1:1 against
    white, which is not a faint bar, it is no bar at all: on light themes the
    chart silently lost two rows and nothing looked broken. PLATFORM_LIGHT
    carries a legible stand-in for those, and this asserts every platform
    clears 1.6:1 on the ground it is actually painted on.
    """
    import re as _re
    src = open("src/data/personas.ts").read()
    block = src[src.index("export const PLATFORMS: Platform[] = ["):]
    block = block[: block.index("];")]
    lt = {}
    if "PLATFORM_LIGHT" in src:
        lb = src[src.index("export const PLATFORM_LIGHT"):]
        lb = lb[: lb.index("};")]
        lt = dict(_re.findall(r'(\w+):\s*"(#[0-9A-Fa-f]{6})"', lb))

    def lum(h):
        h = h.lstrip("#")
        c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
        f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
        return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2])

    bad = []
    for pid, _name, col in _re.findall(r'id: "([^"]+)", name: "([^"]+)", color: "([^"]+)"', block):
        on_dark = (lum(col) + 0.05) / 0.05
        light_col = lt.get(pid, col)
        on_light = 1.05 / (lum(light_col) + 0.05)
        if on_dark < 1.6:
            bad.append(f"{pid} {col} only {on_dark:.1f}:1 on dark")
        if on_light < 1.6:
            bad.append(f"{pid} {light_col} only {on_light:.1f}:1 on light; add a PLATFORM_LIGHT entry")
    return bad


_pf = check_platform_contrast()
if _pf:
    print("BRAND GATE: FAIL (platform colour contrast)")
    for b in _pf:
        print("  x " + b)
    raise SystemExit(1)
