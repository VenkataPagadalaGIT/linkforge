import json, re
d = json.load(open("pew.json"))
T = d["tables"]

SEG = {
 "Ages 18-29":"18-29","30-49":"30-49","50-64":"50-64","65+":"65+",
 "Men":"men","Women":"women",
 "White":"race-white","Black":"race-black","Hispanic":"race-hispanic","Asian*":"race-asian",
 "Less than $30,000":"inc-lt30","$30,000- $69,999":"inc-30-70","$30,000-$69,999":"inc-30-70",
 "$70,000- $99,999":"inc-70-100","$100,000+":"inc-100",
 "Less than $30,000 (NPORS)":"inc-lt30","$30,000- $69,999 (NPORS)":"inc-30-70",
 "$70,000- $99,999 (NPORS)":"inc-70-100","$100,000+ (NPORS)":"inc-100",
 "High school or less":"edu-hs","Some college":"edu-some","College graduate":"edu-grad",
 "Urban":"urban","Suburban":"suburban","Rural":"rural",
 "Rep/Lean Rep":"party-rep","Dem/Lean Dem":"party-dem",
}
PLAT = {"YouTube":"youtube","Facebook":"facebook","Instagram":"instagram","TikTok":"tiktok",
 "WhatsApp":"whatsapp","Reddit":"reddit","Snapchat":"snapchat","X (formerly Twitter)":"x",
 "Threads":"threads","Bluesky":"bluesky","Truth Social":"truthsocial"}

def num(s):
    s = (s or "").replace("%","").strip()
    return int(s) if re.fullmatch(r'\d+', s) else None

# ---- platform reach across all 7 dimensions ----
reach = {p: {} for p in PLAT.values()}
for t in T:
    if t["sheet"] != "Social Media Fact Sheet": continue
    if not t["h3"] or t["h3"].startswith("Which"): continue
    hdr = t["header"]
    for row in t["rows"]:
        pid = PLAT.get(row[0])
        if not pid: continue
        for i, col in enumerate(hdr[1:], 1):
            s = SEG.get(col)
            v = num(row[i]) if i < len(row) else None
            if s and v is not None: reach[pid][s] = v

# ---- tech access metrics ----
METRICS = {
 "internet":     ("Internet use", "Uses the internet"),
 "broadband":    ("Home broadband use", "Subscribes to home broadband"),
 "smartphone-dep":("Smartphone dependency", "Smartphone-only: owns a smartphone, no home broadband"),
}
access = {k: {} for k in METRICS}
for t in T:
    h3 = t["h3"] or ""
    for key,(prefix,_) in METRICS.items():
        if not h3.startswith(prefix + " by"): continue
        hdr = t["header"]
        last = None
        for r in reversed(t["rows"]):
            if any(num(c) is not None for c in r[1:]): last = r; break
        if not last: continue
        for i,col in enumerate(hdr[1:],1):
            s = SEG.get(col); v = num(last[i]) if i < len(last) else None
            if s and v is not None: access[key].setdefault(s, v)

# cellphone / smartphone ownership (mobile fact sheet, row-labelled)
own = {"cellphone":{}, "smartphone":{}, "featurephone":{}}
OWN = {"Cellphone":"cellphone","Smartphone":"smartphone","Cellphone, but not a smartphone":"featurephone"}
for t in T:
    if t["sheet"]!="Mobile Fact Sheet" or t["h2"]!="Who owns cellphones and smartphones?": continue
    hdr = t["header"]
    for row in t["rows"]:
        k = OWN.get(row[0])
        if not k: continue
        for i,col in enumerate(hdr[1:],1):
            s = SEG.get(col); v = num(row[i]) if i < len(row) else None
            if s and v is not None: own[k][s] = v

json.dump({"reach":reach,"access":access,"own":own}, open("built.json","w"), indent=1)
for p,c in reach.items(): print(f"{p:12} {len(c)} cells")
print()
for k,c in access.items(): print(f"{k:14} {len(c)} cells  overall-check {sorted(c.items())[:2]}")
for k,c in own.items(): print(f"{k:14} {len(c)} cells")
