import json
b = json.load(open("built.json"))
reach, access, own = b["reach"], b["access"], b["own"]

CORE = ["men","women","18-29","30-49","50-64","65+","inc-lt30","inc-30-70","inc-70-100","inc-100","edu-hs","edu-some","edu-grad"]
RACE = ["race-white","race-black","race-hispanic","race-asian"]
CTX  = ["urban","suburban","rural","party-rep","party-dem"]

PLATS = [
 ("youtube","YouTube","#FF0000",84),("facebook","Facebook","#1877F2",71),
 ("instagram","Instagram","#E4405F",50),("tiktok","TikTok","#FE2C55",37),
 ("whatsapp","WhatsApp","#25D366",32),("reddit","Reddit","#FF4500",26),
 ("snapchat","Snapchat","#FFFC00",25),("x","X","#E7E9EA",21),
 ("threads","Threads","#A855F7",8),("bluesky","Bluesky","#0085FF",4),
 ("truthsocial","Truth Social","#5448EE",3),
]

def cells(pid, keys):
    parts = []
    for k in keys:
        v = reach[pid].get(k)
        if v is None: continue
        kk = f'"{k}"' if not k.isidentifier() or "-" in k else k
        parts.append(f"{kk}: {v}")
    return ", ".join(parts)

out = []
out.append("export const PLATFORMS: Platform[] = [")
for pid,name,col,ov in PLATS:
    out.append(f'  {{ id: "{pid}", name: "{name}", color: "{col}", overall: {ov} }},')
out.append("];")
P = "\n".join(out)

R = ["export const REACH: Record<string, Record<string, number>> = {"]
for pid,_,_,_ in PLATS: R.append(f"  {pid}: {{ {cells(pid, CORE)} }},")
R.append("};")
R = "\n".join(R)

RR = ["export const RACE_REACH: Record<string, Record<string, number>> = {"]
for pid,_,_,_ in PLATS: RR.append(f"  {pid}: {{ {cells(pid, RACE)} }},")
RR.append("};")
RR = "\n".join(RR)

CR = ["export const CONTEXT_REACH: Record<string, Record<string, number>> = {"]
for pid,_,_,_ in PLATS: CR.append(f"  {pid}: {{ {cells(pid, CTX)} }},")
CR.append("};")
CR = "\n".join(CR)

MET = [
 ("internet","Uses the internet","internet",96,"internet-broadband"),
 ("broadband","Has home broadband at home","broadband",78,"internet-broadband"),
 ("smartphone","Owns a smartphone","smartphone",91,"mobile"),
 ("cellphone","Owns a cellphone of any kind","cellphone",98,"mobile"),
 ("featurephone","Owns a cellphone but not a smartphone","featurephone",7,"mobile"),
 ("smartphone-dep","Smartphone-only: owns a smartphone but has no home broadband","smartphone-dep",16,"mobile"),
]
A = ["export const TECH_ACCESS: TechMetric[] = ["]
for mid,label,key,ov,sheet in MET:
    d = access.get(key) or own.get(key) or {}
    body = ", ".join(f'"{k}": {v}' for k,v in d.items())
    A.append(f'  {{ id: "{mid}", label: "{label}", overall: {ov}, sheet: "{sheet}", by: {{ {body} }} }},')
A.append("];")
A = "\n".join(A)

open("blocks.ts","w").write("\n\n".join([P,R,RR,CR,A]))
print(open("blocks.ts").read()[:2000])
