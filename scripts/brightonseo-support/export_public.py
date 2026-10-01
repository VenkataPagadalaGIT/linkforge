#!/usr/bin/env python3
"""export_public.py: fill the brightonSEO thank-you page from PUBLIC sources only.

Usage: python3 scripts/brightonseo-support/export_public.py [capture_dir]
       (default capture_dir: ~/Desktop/brightonSEO_SD26_Support)

Reads only what LinkedIn serves to anyone, signed out: the public embed of each
post (linkedin.com/embed/feed/update/<urn>), captured into the capture folder's
data/embeds*.json and screenshots/. Nothing read through a signed-in session is
used here: no commenter lists, no members-only posts, no analytics. Those wait
for the owner's approval of the full export.

Writes src/data/brightonSupport.ts and
public/talks/brightonseo-san-diego-2026/posts/<id>.webp.
"""
import datetime as dt
import json, re, sys, unicodedata
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image

REPO = Path(__file__).resolve().parents[2]
CAP = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop/brightonSEO_SD26_Support"
IMG_DIR = REPO / "public/talks/brightonseo-san-diego-2026/posts"
WEB = "/talks/brightonseo-san-diego-2026/posts"
PT = ZoneInfo("America/Los_Angeles")
TALK = dt.datetime(2026, 9, 15, 9, 15, tzinfo=PT)
DAY_END = dt.datetime(2026, 9, 16, 23, 59, tzinfo=PT)
CAPTURED = "2026-09-25"

# Venkata's own talk posts (public embed ids), in order, with their public URLs.
OWN = [
    ("7499662299528507392", "Announcement", "https://www.linkedin.com/posts/venkata-pagadala_brightonseo-brightonseo2026-ugcPost-7499662299528507392-76hy/"),
    ("7503658894251143168", "Teaser: search volume is a direction, not a strategy", "https://www.linkedin.com/feed/update/urn:li:activity:7503658894251143168/"),
    ("7505748802889293824", "Talk day: thank you, mom", "https://www.linkedin.com/feed/update/urn:li:activity:7505748802889293824/"),
    ("7506370624076959745", "Recap: user first, algorithm second", "https://www.linkedin.com/feed/update/urn:li:ugcPost:7506370624076959745/"),
]
NEXT_OWN = ("7508230968919343105", "Next talk: The FCDC Expert Series", "https://www.linkedin.com/feed/update/urn:li:activity:7508230968919343105/")
NEXT_OTHERS = {"7508173183313854465"}  # The FCDC's own post about the next talk
NOT_BRIGHTON = {"7440156851566092288", "7451292004195405824"}  # March webinar, April SSRN paper
PAGES = {"Link Building HQ", "The FCDC"}
EXTRA_URLS = {  # public post URLs found through Google
    "7504180805749870592": "https://www.linkedin.com/posts/smith-shah3107_if-you-are-heading-to-brightonseo-san-diego-activity-7504180807519977473-LMzY",
    "7504219680488800257": "https://www.linkedin.com/posts/amal-alexander-305780131_brightonseo-san-diego-2026-schedule-activity-7504219680488800257-wtsw",
    "7504180780173082626": "https://www.linkedin.com/posts/kunjal-chawhan_brightonseo-san-diego-2026-schedule-activity-7504180780173082626-Yqhs",
}

# People who supported, guided or mentored the talk without posting about it,
# named by Venkata on 2026-09-25 with their profiles. They go into the one
# alphabetical thank-you list exactly like everyone else: no separate group, no
# label. Each name is spelled the way its public profile shows it (emoji and
# "(SEO)"-style decorations dropped), checked against the profile capture.
HELPERS = [
    ("Madhavi Maddula", "https://www.linkedin.com/in/madhavi-maddula/"),
    ("Victor Pan", "https://www.linkedin.com/in/victorpan/"),
    ("Wil Reynolds", "https://www.linkedin.com/in/wilreynolds/"),
    ("Raga Kotha", "https://www.linkedin.com/in/raga-kotha9/"),
    ("Jean-Guy Leconte", "https://www.linkedin.com/in/jean-guy-leconte-7342941/"),
    ("Venkata Siva Kumar Kondeti", "https://www.linkedin.com/in/venkata-siva-kumar-kondeti-27bb4622/"),
    ("Yeswanth Kumar Pagadala", "https://www.linkedin.com/in/yeswanth-kumar-pagadala-931786a5/"),
    ("Divyamanasa Pasumarthy", "https://www.linkedin.com/in/divyamanasapasumarthy/"),
    ("Ruthvik Pagadala", "https://www.linkedin.com/in/ruthvik-pagadala-a96b9441a/"),
    ("Maddula Tejaswi", "https://www.linkedin.com/in/maddula-tejas/"),
    ("Zach Doty", "https://www.linkedin.com/in/zldoty/"),
    ("Balvinder Singh", "https://www.linkedin.com/in/balvinder-singh-10bb4a225/"),
    ("Karimjon Umarov", "https://www.linkedin.com/in/karimjon-umarov-b2417a59/"),
    ("Jon Buschlen", "https://www.linkedin.com/in/jonbuschlen/"),
    ("Ejiro Esiri", "https://www.linkedin.com/in/ejiroesiri/"),
    ("Philip Mastroianni", "https://www.linkedin.com/in/philipmastroianni/"),
    ("Zach Chahalis", "https://www.linkedin.com/in/zacharychahalis/"),
    ("Zak Perez", "https://www.linkedin.com/in/zakperez/"),
    ("Russ Macumber", "https://www.linkedin.com/in/russmacumber/"),
    ("Callie Collins", "https://www.linkedin.com/in/callie-collins-2bb46821b/"),
    ("Pedro Angel", "https://www.linkedin.com/in/pedro-angel-2618061aa/"),
    ("Logan Young", "https://www.linkedin.com/in/logan-young-812ab6209/"),
    ("Anu Jagga Narang", "https://www.linkedin.com/in/ajnarang/"),
    ("Sabitha Venugopal", "https://www.linkedin.com/in/sabitha-venugopal-mba-586aa78/"),
    ("Krinal Mehta", "https://www.linkedin.com/in/krinal/"),
    ("Alison Delamota", "https://www.linkedin.com/in/alisondelamota/"),
    ("Neil Burtt", "https://www.linkedin.com/in/neilburtt/"),
    ("Karen Krause", "https://www.linkedin.com/in/karen-krause-2691698b/"),
    ("David Bell", "https://www.linkedin.com/in/dbellgo/"),
    ("Jordan Koene", "https://www.linkedin.com/in/jordankoene/"),
    ("Elle Santos", "https://www.linkedin.com/in/ellesantos/"),
    ("Jennifer Haley", "https://www.linkedin.com/in/jennifer-nicole-haley/"),
    ("Amir Yazdi", "https://www.linkedin.com/in/amiryazdi/"),
    ("Kelly LaVoie, MS, RD, LDN", "https://www.linkedin.com/in/kelly-lavoie-rd/"),
    ("Taylor Galla", "https://www.linkedin.com/in/taylorgalla/"),
    ("Chris Sullivan", "https://www.linkedin.com/in/chris1sullivan/"),
    ("Dre de Vera", "https://www.linkedin.com/in/dredevera/"),
    ("Duncan Sze", "https://www.linkedin.com/in/duncansze/"),
    ("Samantha Torres", "https://www.linkedin.com/in/samantha-torres-seo/"),
    ("Joseph Gibbie", "https://www.linkedin.com/in/joseph-gibbie/"),
    ("Joe Edakkunnathu", "https://www.linkedin.com/in/joeedakkunnathu/"),
    ("Damian Yupari", "https://www.linkedin.com/in/damian-yupari/"),
    ("Kelvin Newman", "https://www.linkedin.com/in/kelvinnewman/"),
    ("Carmen Aragones", "https://www.linkedin.com/in/carmen-jim%C3%A9nez-aragon%C3%A9s/"),
    ("Satish Mohan", "https://www.linkedin.com/in/satish-mohan-0b99232/"),
    ("Gireesh Subramanya", "https://www.linkedin.com/in/gireesh-subramanya/"),
    ("Sowmya Varanasi", "https://www.linkedin.com/in/sowmya-varanasi-52282a6b/"),
    ("Nitin Manchanda", "https://www.linkedin.com/in/nitman/"),
    ("Angela Skane", "https://www.linkedin.com/in/angelaskane/"),
    ("Ray Grieselhuber", "https://www.linkedin.com/in/raygrieselhuber/"),
    ("Amit Patel", "https://www.linkedin.com/in/amit-patel-7bba9b7b/"),
    # Shown publicly with a last initial only; kept that way.
    ("Jason W.", "https://www.linkedin.com/in/jwilson415/"),
    ("Takeru Muroya", "https://www.linkedin.com/in/%F0%9F%87%AF%F0%9F%87%B5takeru-muroya-32143080/"),
    ("Jordan Choo", "https://www.linkedin.com/in/jordanchoo/"),
    ("Bryan Grossbauch", "https://www.linkedin.com/in/bryan-grossbauch/"),
    ("Andrew Ansley", "https://www.linkedin.com/in/andrew-ansley-marketing/"),
]

# Where each poster's name links: the profile slug in their post URL
# (linkedin.com/posts/<slug>_...), except pages, whose post URLs carry none.
PAGE_PROFILES = {"Link Building HQ": "https://www.linkedin.com/company/linkbuildinghq/"}


def posted(i):
    return dt.datetime.fromtimestamp((int(i) >> 22) / 1000, tz=dt.timezone.utc).astimezone(PT)

def phase(t):
    return "before" if t < TALK else ("day" if t <= DAY_END else "after")

def plain(s):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", s or "")).strip()

def short(text, limit):
    t = plain(text)
    return t if len(t) <= limit else t[: limit - 1].rsplit(" ", 1)[0].rstrip(" |,·-:;") + "…"

AGE = re.compile(r"^\d+(h|d|w|mo|yr)(\s+Edited)?$")
def parse(lines):
    name = lines[0]
    head = "" if AGE.match(lines[1]) or re.fullmatch(r"[\d,]+ followers", lines[1]) else lines[1]
    i = lines.index("LinkedIn") + 1 if "LinkedIn" in lines[:6] else 3
    j = len(lines)
    while j > i and lines[j - 1] in ("Like", "Comment", "Share", "Play Video"): j -= 1
    if j > i and re.fullmatch(r"\d+ Comments?", lines[j - 1]): j -= 1
    if j > i and re.fullmatch(r"[\d,]+", lines[j - 1]): j -= 1
    body = [x for x in lines[i:j] if x not in ("Play Video", "Activate to view larger image,")]
    return name, head, "\n".join(body)

# Where the first sentence naming Venkata needs its neighbours to make sense,
# the quote is chosen by hand: exact passages from the post, joined with an
# ellipsis where they are not adjacent. Each passage is checked against the text.
QUOTES = {
    "7504401287434747904": ["Some people teach you SEO. Some people teach you how to think. For me, Venkata Pagadala has always been the second kind."],
    "7505171629438554112": ["My friend Venkata Pagadala is speaking at brightonSEO San Diego, and I liked a point he shared ahead of his talk: “Search volume is a direction, not a strategy.”"],
    "7505681691353640960": ["Shout out to Venkata Pagadala at brightonSEO. His work is interesting, challenging, and gets you to think deeply about search."],
    "7505684231650672641": ["Real SEO opportunities hide in the data. Venkata Pagadala unpacked 5.8M queries to find them, live in Track 1."],
    "7506435669020372992": ["It was great seeing the new voices take the stage. Natasha Post and Venkata Pagadala killed."],
    "7506380235593035777": ["We had an awesome time at Brightonseo San diego!", "Great meeting :", "Venkata Pagadala", "and many others!"],
    "7506779557631422464": ["Sitting in the audience I could see it happening in real time while watching Natasha Post and Venkata Pagadala do their first big talks. I'm SO SO proud of you both!!!"],
    "7507691320958672898": ["Amazing people, amazing energy, and a great few days in California. Venkata Pagadala Raymond Martinez Noah Learner", "and I'm sorry for the Linkedin limits because I actually have a longer list!"],
}

def quote(text, post_id=None, limit=190):
    if post_id in QUOTES:
        body = plain(text)
        for frag in QUOTES[post_id]:
            assert plain(frag) in body, f"quote for {post_id} not found verbatim: {frag[:60]}"
        return " … ".join(plain(f) for f in QUOTES[post_id])
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text or "") if s.strip()]
    pick = next((s for s in sents if re.search(r"Venkata|Pagadala", s)), sents[0] if sents else "")
    return short(pick, limit)

def image(post_id, rel):
    im = Image.open(CAP / rel).convert("RGB")
    box = im.convert("L").point(lambda v: 255 if v < 246 else 0).getbbox()
    if box:
        im = im.crop((0, 0, im.width, min(im.height, box[3] + 6)))
    im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    im.save(IMG_DIR / f"{post_id}.webp", "WEBP", quality=78, method=6)
    return {"src": f"{WEB}/{post_id}.webp", "width": im.width, "height": im.height}

embeds = {}
for f in sorted((CAP / "data").glob("embeds*.json")):
    for e in json.loads(f.read_text()):
        if e.get("status") == 200 and e.get("lines") and e.get("screenshot"):
            embeds[e["id"]] = e
urls = {r["id"]: r["url"] for r in json.loads((CAP / "inventory.json").read_text())} | EXTRA_URLS
num = lambda v: int(str(v).replace(",", "") or 0)

posts = []
own_ids = {o[0] for o in OWN} | {NEXT_OWN[0]}
for i, e in embeds.items():
    if i in own_ids or i in NOT_BRIGHTON:
        continue
    name, head, body = parse(e["lines"])
    t = posted(i)
    posts.append({
        "id": i, "author": plain(name), "authorType": "page" if name in PAGES else "person", "headline": short(head, 80),
        "posted": t.strftime("%Y-%m-%dT%H:%M"), "phase": "next" if i in NEXT_OTHERS else phase(t),
        "reactions": num(e["react"]), "comments": num(e["comm"]), "public": True,
        "url": urls.get(i) or f"https://www.linkedin.com/feed/update/urn:li:activity:{i}/", "quote": quote(body, i),
        "image": image(i, e["screenshot"]),
    })
posts.sort(key=lambda p: p["posted"])

def own(i, label, url):
    e = embeds[i]
    return {"label": label, "posted": posted(i).strftime("%Y-%m-%dT%H:%M"), "reactions": num(e["react"]), "comments": num(e["comm"]), "url": url,
            "image": image(i, e["screenshot"])}
mine = [own(*o) for o in OWN]
next_talk = own(*NEXT_OWN)

wall = [p for p in posts if p["phase"] != "next"]
authors = {p["author"] for p in wall}
names = sorted(authors | {h[0] for h in HELPERS}, key=str.casefold)

# Every name links to its LinkedIn profile; a helper's URL is the one Venkata gave.
profiles = {}
for p in wall:
    m = re.search(r"linkedin\.com/posts/([^_/]+)_", p["url"])
    profiles.setdefault(p["author"], PAGE_PROFILES.get(p["author"]) or (m and f"https://www.linkedin.com/in/{m.group(1)}/"))
for name, url in HELPERS:
    profiles.setdefault(name, url)
missing = [n for n in names if not profiles.get(n)]
assert not missing, f"no LinkedIn profile for {missing}"
thank_you = [{"name": n, "url": profiles[n]} for n in names]
totals = {
    "captured": CAPTURED, "posts": len(wall), "authors": len(authors),
    "before": sum(p["phase"] == "before" for p in wall), "day": sum(p["phase"] == "day" for p in wall), "after": sum(p["phase"] == "after" for p in wall),
    "talkPosts": len(wall) + len(mine),
    "reactions": sum(p["reactions"] for p in wall) + sum(m["reactions"] for m in mine),
    "comments": sum(p["comments"] for p in wall) + sum(m["comments"] for m in mine),
    # The same totals split: Venkata's own talk posts, and the posts by others.
    "myPosts": len(mine),
    "myReactions": sum(m["reactions"] for m in mine), "myComments": sum(m["comments"] for m in mine),
    "theirReactions": sum(p["reactions"] for p in wall), "theirComments": sum(p["comments"] for p in wall),
    "commenters": 0, "helpers": len({h[0] for h in HELPERS} - authors), "people": len(names),
}
assert totals["myReactions"] + totals["theirReactions"] == totals["reactions"]
assert totals["myComments"] + totals["theirComments"] == totals["comments"]

TS = lambda v: json.dumps(v, ensure_ascii=False, indent=2)
src = (REPO / "src/data/brightonSupport.ts").read_text()
head_end = src.index("export const SUPPORT_POSTS")
(REPO / "src/data/brightonSupport.ts").write_text(src[:head_end] + f'''export const SUPPORT_POSTS: SupportPost[] = {TS(posts)};

export const MY_TALK_POSTS: MyTalkPost[] = {TS(mine)};

export const NEXT_TALK_POST: MyTalkPost | null = {TS(next_talk)};

/** Everyone who posted about the talk or helped shape it: one alphabetical list, nobody set apart, each name to its LinkedIn. */
export const THANK_YOU: ThankYou[] = {TS(thank_you)};

/** Totals over the talk posts: the posts by others plus Venkata's own. Public sources only. */
export const SUPPORT_TOTALS = {TS(totals)};
''')
print(json.dumps(totals))
for p in posts:
    print(f'{p["posted"][:10]} {p["phase"]:6} {p["author"][:24]:24} | {p["quote"]}')
