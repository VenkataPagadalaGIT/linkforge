import json, re
d = json.load(open("pew.json"))
src = open("/Users/venkatapagadala/Desktop/mono-mind-stage/src/data/personas.ts").read()

# pull REACH + RACE_REACH out of the TS
def grab(name):
    i = src.index(f"export const {name}")
    body = src[i:]
    depth, j, started = 0, 0, False
    for j,ch in enumerate(body):
        if ch == "{": depth += 1; started = True
        elif ch == "}":
            depth -= 1
            if started and depth == 0: break
    txt = body[body.index("{"):j+1]
    txt = re.sub(r'//.*', '', txt)
    txt = re.sub(r'/\*.*?\*/', '', txt, flags=re.S)
    txt = re.sub(r'(\w[\w-]*)\s*:', lambda m: f'"{m.group(1)}":', txt)
    txt = re.sub(r'"(\d+)":', r'"\1":', txt)
    txt = txt.replace(",}", "}").replace(",\n}", "\n}")
    txt = re.sub(r',(\s*[}\]])', r'\1', txt)
    return json.loads(txt)

reach = grab("REACH"); race = grab("RACE_REACH")
shipped = {}
for pid, cells in reach.items():
    for seg, v in cells.items(): shipped[(pid, seg)] = v
for pid, cells in race.items():
    for seg, v in cells.items(): shipped[(pid, seg)] = v

PLAT = {"YouTube":"youtube","Facebook":"facebook","Instagram":"instagram","TikTok":"tiktok",
        "WhatsApp":"whatsapp","Reddit":"reddit","Snapchat":"snapchat","X (formerly Twitter)":"x"}
SEG = {"Ages 18-29":"18-29","30-49":"30-49","50-64":"50-64","65+":"65+",
       "Men":"men","Women":"women","White":"race-white","Black":"race-black",
       "Hispanic":"race-hispanic","Asian*":"race-asian",
       "Less than $30,000":"inc-lt30","$30,000- $69,999":"inc-30-70","$70,000- $99,999":"inc-70-100","$100,000+":"inc-100",
       "High school or less":"edu-hs","Some college":"edu-some","College graduate":"edu-grad"}

fresh, same, diffs, missing = {}, 0, [], []
for t in d["tables"]:
    if t["sheet"] != "Social Media Fact Sheet" or not t["h3"] or t["h3"].startswith("Which"): continue
    hdr = t["header"]
    for row in t["rows"]:
        pid = PLAT.get(row[0])
        if not pid: continue
        for ci, col in enumerate(hdr[1:], start=1):
            seg = SEG.get(col)
            if not seg or ci >= len(row): continue
            v = row[ci].replace("%","").strip()
            if not v: continue
            v = int(v)
            fresh[(pid,seg)] = v
            if (pid,seg) in shipped:
                if shipped[(pid,seg)] == v: same += 1
                else: diffs.append((pid,seg,shipped[(pid,seg)],v))
            else: missing.append((pid,seg,v))

print(f"cells compared : {same+len(diffs)}")
print(f"IDENTICAL      : {same}")
print(f"DIFFERENT      : {len(diffs)}")
for x in diffs: print("   MISMATCH", x)
print(f"in Pew, not shipped: {len(missing)}")
# shipped cells NOT in the fresh pull
extra = [k for k in shipped if k not in fresh]
print(f"shipped, not in this pull: {len(extra)} -> {sorted(set(s for _,s in extra))}")
