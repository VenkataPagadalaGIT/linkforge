import json, re, glob, os

def parse(path):
    lines = open(path).read().split("\n")
    fm = {}
    m = re.match(r'^---\n(.*?)\n---', open(path).read(), re.S)
    if m:
        for k in ("title","date","url","description"):
            mm = re.search(rf'^{k}: "(.*?)"', m.group(1), re.M)
            if mm: fm[k] = mm.group(1)
    out, h2, h3, caption = [], None, None, None
    i = 0
    while i < len(lines):
        L = lines[i]
        if L.startswith("## "): h2, h3, caption = L[3:].strip(), None, None
        elif L.startswith("### "): h3, caption = L[4:].strip(), None
        elif re.match(r'^\*%.*\*?$', L.strip()) and "|" not in L:
            caption = L.strip().strip("*")
        elif L.startswith("| ") and i+1 < len(lines) and re.match(r'^\|\s*-{2,}', lines[i+1]):
            header = [c.strip() for c in L.strip().strip("|").split("|")]
            rows, j = [], i+2
            while j < len(lines) and lines[j].startswith("|"):
                rows.append([c.strip() for c in lines[j].strip().strip("|").split("|")])
                j += 1
            # source note: next non-empty lines until blank-blank
            note = ""
            k = j
            while k < len(lines) and k < j+8:
                if "Source:" in lines[k] or "Note:" in lines[k]:
                    note += lines[k].strip() + " "
                k += 1
            out.append({
                "sheet": fm.get("title"), "h2": h2, "h3": h3,
                "caption": caption, "header": header, "rows": rows,
                "note": re.sub(r'\s+', ' ', note).strip()[:400],
            })
            i = j - 1
            caption = None
        i += 1
    return fm, out

allt = []
meta = {}
for f in ["social-media.md", "mobile.md", "internet-broadband.md"]:
    fm, tables = parse(f)
    meta[f] = fm
    allt += tables
    print(f"{f:28} {len(tables):3} tables   {fm.get('date')}")
json.dump({"meta": meta, "tables": allt}, open("pew.json","w"), indent=1)
print("\ntotal tables:", len(allt))
print("\n--- inventory ---")
for t in allt:
    print(f"  {t['sheet'][:22]:24} {str(t['h2'])[:34]:36} {str(t['h3'])[:30]:32} {len(t['rows'])}r x {len(t['header'])}c")
