#!/usr/bin/env python3
"""The Learn catalog: every resource on the AI Roadmap and in the AI Encyclopedia as one row, checked, with a real image,
in Postgres, generating the site's data.

src/data/aiRoadmap.ts and src/data/aiEncyclopedia.ts + encyclopediaResources.ts stay the curated lists. This reads them,
gives each distinct URL one record (format, platform, creator, image, access, where it sits), checks that the link still
works and still goes where it says, stores each check, and writes src/data/learnCatalog.ts, which the Learn feed and the
search read.

  python3 learn_catalog.py check     read the roadmap, check every link (free: HTTP and YouTube oEmbed), load Postgres
  python3 learn_catalog.py gen       write src/data/learnCatalog.ts from Postgres
  python3 learn_catalog.py report    print what needs a human look: dead links, unverified ones, title mismatches
  python3 learn_catalog.py --check   preflight gate: the generated file still matches the roadmap (no database needed)

A failed or refused request is never treated as a dead link: only a 404 or 410, or YouTube saying the video is gone.
"""
import concurrent.futures as cf
import hashlib
import html
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
OUT = ROOT / "src/data/learnCatalog.ts"
SCHEMA = HERE / "learn_schema.sql"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
CTX = ssl.create_default_context()
LISTS = [("bestVideos", "video"), ("bestCourses", "course"), ("books", "book"), ("githubRepos", "repo")]
CACHE = HERE / "raw" / "learn_checks.jsonl"
PAPER_HOSTS = ("arxiv.org", "doi.org", "aclanthology.org", "openreview.net", "papers.nips.cc", "proceedings.neurips.cc", "proceedings.mlr.press", "dl.acm.org", "ieeexplore.ieee.org", "jmlr.org", "semanticscholar.org", "nature.com", "science.org", "biorxiv.org", "pubmed.ncbi.nlm.nih.gov")
STOP = set("the a an of and to in for on with by from at is what how your you it this that as or be are free full course video guide intro introduction tutorial explained official".split())


def read_roadmap():
    """The roadmap's own data, read by running the TypeScript, so nothing here can parse it differently from the site."""
    p = subprocess.run(["npx", "tsx", "scripts/dump-roadmap.ts"], cwd=ROOT, capture_output=True, text=True, timeout=180)
    if p.returncode != 0:
        raise SystemExit("could not read the roadmap:\n" + p.stderr[-1500:])
    return json.loads(p.stdout.strip().splitlines()[-1])


def rid(url):
    return "r" + hashlib.sha1(url.encode()).hexdigest()[:9]


def youtube_of(url):
    """{'id': ...} for a video, {'list': ...} for a playlist, {} for a channel or anything else on YouTube."""
    u = urllib.parse.urlsplit(url)
    host = u.netloc.replace("www.", "").replace("m.", "")
    q = urllib.parse.parse_qs(u.query)
    if host == "youtu.be":
        return {"id": u.path.strip("/")[:11]}
    if host != "youtube.com":
        return None
    if u.path.startswith("/watch") and q.get("v"):
        return {"id": q["v"][0][:11], **({"list": q["list"][0]} if q.get("list") else {})}
    if u.path.startswith("/playlist") and q.get("list"):
        return {"list": q["list"][0]}
    if u.path.startswith(("/embed/", "/shorts/", "/live/")):
        return {"id": u.path.split("/")[2][:11]}
    return {}


def format_of(url, listed):
    """The list it sits in says the format, except a video list can hold a course page and any list can hold a repo."""
    host = urllib.parse.urlsplit(url).netloc.replace("www.", "")
    if youtube_of(url) is not None:
        return "video"
    if host == "github.com":
        return "repo"
    if any(host == h or host.endswith("." + h) for h in PAPER_HOSTS) or urllib.parse.urlsplit(url).path.lower().endswith(".pdf") and listed != "book":
        return "paper"
    if listed == "video":
        return "course"
    return listed


def platform_of(url):
    """Where it lives, in the name people know it by. A reader can keep one, four or all of these."""
    if url.startswith("/"):
        return "This site"
    host = urllib.parse.urlsplit(url).netloc.lower().replace("www.", "")
    if youtube_of(url) is not None:
        return "YouTube"
    if host == "github.com":
        return "GitHub"
    if host in BRANDS:
        return BRANDS[host]
    if host.endswith(".github.io"):
        return host.split(".")[0]
    parts = host.split(".")
    root = ".".join(parts[-2:]) if len(parts) > 2 else host
    return BRANDS.get(root, root)


BRANDS = {"coursera.org": "Coursera", "deeplearning.ai": "DeepLearning.AI", "learn.deeplearning.ai": "DeepLearning.AI", "amazon.com": "Amazon", "udemy.com": "Udemy", "edx.org": "edX", "fast.ai": "fast.ai", "course.fast.ai": "fast.ai", "huggingface.co": "Hugging Face", "kaggle.com": "Kaggle", "arxiv.org": "arXiv", "khanacademy.org": "Khan Academy", "freecodecamp.org": "freeCodeCamp", "openai.com": "OpenAI", "academy.openai.com": "OpenAI", "anthropic.com": "Anthropic", "docs.anthropic.com": "Anthropic", "ai.google": "Google", "developers.google.com": "Google", "cloud.google.com": "Google", "ibm.com": "IBM", "microsoft.com": "Microsoft", "learn.microsoft.com": "Microsoft", "stanford.edu": "Stanford", "cs231n.stanford.edu": "Stanford", "web.stanford.edu": "Stanford", "mit.edu": "MIT", "ocw.mit.edu": "MIT", "pytorch.org": "PyTorch", "tensorflow.org": "TensorFlow", "wikipedia.org": "Wikipedia", "en.wikipedia.org": "Wikipedia", "medium.com": "Medium", "aws.amazon.com": "AWS", "nvidia.com": "NVIDIA", "developer.nvidia.com": "NVIDIA", "blogs.nvidia.com": "NVIDIA", "doi.org": "DOI", "distill.pub": "Distill", "jalammar.github.io": "Jay Alammar", "lilianweng.github.io": "Lilian Weng", "towardsdatascience.com": "Towards Data Science", "machinelearningmastery.com": "Machine Learning Mastery", "wandb.ai": "Weights & Biases", "pinecone.io": "Pinecone", "langchain.com": "LangChain", "python.langchain.com": "LangChain", "docs.langchain.com": "LangChain", "claude.com": "Anthropic", "platform.openai.com": "OpenAI", "cookbook.openai.com": "OpenAI", "ai.meta.com": "Meta", "research.google": "Google", "blog.google": "Google", "deepmind.google": "Google DeepMind", "scikit-learn.org": "scikit-learn"}


def creator_of(url, authors, names, channel, hint=None):
    if authors:
        people = [names.get(a) for a in authors if names.get(a)]
        if people:
            return ", ".join(people)
    if channel or hint:
        return channel or hint
    if url.startswith("/"):
        return "Venkata Pagadala"
    u = urllib.parse.urlsplit(url)
    host = u.netloc.replace("www.", "")
    if host == "github.com":
        return "/".join(u.path.strip("/").split("/")[:2]) or "GitHub"
    return BRANDS.get(host, host)


def http_get(url, limit=400_000, timeout=25):
    """One GET with redirects. Returns (status, final_url, body, error). An error is not a verdict on the page."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/json,*/*", "Accept-Language": "en-US,en;q=0.9"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            return r.status, r.geturl(), r.read(limit), None
    except urllib.error.HTTPError as e:
        return e.code, url, b"", None
    except Exception as e:  # noqa: BLE001 network failures are recorded, never read as absence
        return None, url, b"", f"{type(e).__name__}: {e}"[:200]


def good_image(url):
    """A real picture: the host answers with an image of real size. A tracking pixel or a logo sprite is no cover."""
    if not url or url.startswith("data:"):
        return None
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "image/*,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=15, context=CTX) as r:
            kind = (r.headers.get("content-type") or "").lower()
            body = r.read(6000)
        return url if kind.startswith("image/") and len(body) >= 2500 else None
    except Exception:  # noqa: BLE001 no picture is a fallback card, never a failure of the resource
        return None


def page_image(url, text):
    """The picture the page itself offers for link previews: the same one X or Slack would show."""
    for pat in (r'<meta[^>]+(?:property|name)=["\'](?:og:image(?::secure_url)?|twitter:image(?::src)?)["\'][^>]+content=["\']([^"\']+)', r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:og:image|twitter:image)'):
        m = re.search(pat, text, re.I)
        if m:
            src = urllib.parse.urljoin(url, html.unescape(m.group(1)).strip())
            if "arxiv-logo" in src:
                return None
            return good_image(src)
    return None


def fixed_image(url):
    """Hosts with a known picture for every page, no page fetch needed."""
    u = urllib.parse.urlsplit(url)
    host = u.netloc.replace("www.", "")
    if host == "github.com":
        parts = u.path.strip("/").split("/")
        if len(parts) >= 2:
            return good_image(f"https://opengraph.githubassets.com/1/{parts[0]}/{parts[1]}")
    if host.endswith("amazon.com"):
        m = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", url)
        if m:
            return good_image(f"https://images-na.ssl-images-amazon.com/images/P/{m.group(1)}.01.LZZZZZZZ.jpg")
    return None


def words(s):
    return {w for w in re.findall(r"[a-z0-9]+", (s or "").lower()) if w not in STOP and len(w) > 1}


def check(row):
    """Status: ok, dead (a real 404/410 or YouTube says gone), unverified (refused or failed: says nothing)."""
    url = row["url"]
    out = {"status": "unverified", "http": None, "final_url": url, "page_title": None, "channel": None, "embeddable": None, "overlap": None, "note": None, "image": None}
    if url.startswith("/"):
        # One of this site's own pages: the route coverage and link gates check those.
        out.update(status="ok", page_title=row["title"])
        return out
    yt = youtube_of(url)
    if yt:
        code, _, body, err = http_get("https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(url, safe=""), timeout=20)
        out["http"] = code
        if code == 200:
            d = json.loads(body.decode("utf-8", "replace"))
            out.update(status="ok", page_title=d.get("title"), channel=d.get("author_name"), embeddable=True, image=d.get("thumbnail_url"))
        elif code in (401, 403):
            out.update(status="ok", embeddable=False, note="embedding disabled by the channel: opens on YouTube", image=f"https://i.ytimg.com/vi/{yt['id']}/hqdefault.jpg" if yt.get("id") else None)
        elif code in (400, 404):
            out.update(status="dead", note="YouTube says this video or playlist is gone")
        else:
            out["note"] = err or f"oEmbed answered {code}"
    else:
        for attempt in range(2):
            code, final, body, err = http_get(url)
            if code is not None and code not in (429, 500, 502, 503, 504):
                break
            time.sleep(2 + attempt * 3)
        if code is None and "SSL" in (err or ""):
            c = subprocess.run(["curl", "-sL", "-o", "/dev/null", "-A", UA, "--max-time", "25", "-w", "%{http_code} %{url_effective}", url], capture_output=True, text=True)
            if c.returncode == 0 and c.stdout.strip():
                head, _, eff = c.stdout.strip().partition(" ")
                code, final, err = int(head), eff or url, None
        out.update(http=code, final_url=final)
        if code is None:
            out["note"] = err
        elif code in (404, 410):
            out.update(status="dead", note=f"answered {code}")
        elif code >= 400:
            out["note"] = f"refused automated check ({code})"
        else:
            text = body.decode("utf-8", "replace")
            m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
            t = html.unescape(re.sub(r"\s+", " ", m.group(1)).strip())[:200] if m else None
            out.update(status="ok", page_title=t)
            out["image"] = fixed_image(url) or page_image(final, text)
            orig, fin = urllib.parse.urlsplit(url), urllib.parse.urlsplit(final)
            if t and re.search(r"(checking your browser|captcha|just a moment|attention required|are you a robot|verify you are)", t, re.I):
                out.update(status="unverified", page_title=None, note="a bot check answered instead of the page")
            elif t and re.search(r"(page not found|not found|404|no longer available|does(n.t| not) exist)", t, re.I):
                out.update(status="dead", note=f"answered 200 but the page says: {t[:80]}")
            elif len(orig.path) > 8 and fin.path in ("", "/") and orig.netloc.replace("www.", "") != "":
                out.update(status="dead", note="redirects to the site's home page")
    if out["page_title"]:
        a, b = words(row["title"]), words(out["page_title"])
        out["overlap"] = round(len(a & b) / max(1, min(len(a), len(b))), 2)
    return out


def catalog(data):
    """One row per distinct URL, plus where it sits (a roadmap topic or an Encyclopedia concept), in order."""
    rows, placements = {}, []
    def add(url, title, fmt, topic, key, pos, access=None, authors=None, hint=None):
        url = url.strip()
        i = rid(url)
        if i not in rows:
            rows[i] = {"id": i, "url": url, "title": title, "format": format_of(url, fmt), "access": access, "authors": authors or [], "hint": hint}
        placements.append({"resource": i, "topic": topic, "list": key, "pos": pos})
    for t in data["topics"]:
        pos = 0
        for key, fmt in LISTS:
            for r in t.get(key) or []:
                add(r["url"], r["title"], fmt, t["id"], key, pos, r.get("access"), r.get("authors"))
                pos += 1
    for c in data.get("concepts", []):
        pos, topic = 0, "c-" + c["id"]
        for v in (data.get("videos") or {}).get(c["id"], []):
            add(v["url"], v["title"], "video", topic, "videos", pos, hint=v.get("channel"))
            pos += 1
        for g in (data.get("guides") or {}).get(c["id"], []):
            add(g["url"], g["title"], "guide", topic, "guides", pos, hint=g.get("brand"))
            pos += 1
        for m in c.get("learnMore") or []:
            add(m["url"], m["title"], "guide", topic, "learnMore", pos)
            pos += 1
    return rows, placements


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def cmd_check():
    from db import sql
    data = read_roadmap()
    rows, placements = catalog(data)
    print(f"{len(data['topics'])} topics, {len(data.get('concepts', []))} concepts, {len(placements)} placements, {len(rows)} distinct resources", flush=True)
    # Every result is written as it arrives, so a stopped run resumes instead of asking every host again.
    results = {}
    fresh_after = time.time() - 2 * 86400
    if CACHE.exists():
        for line in CACHE.read_text().splitlines():
            c = json.loads(line)
            if c["at"] >= fresh_after and c["id"] in rows and rows[c["id"]]["url"] == c["url"]:
                results[c["id"]] = c["result"]
    todo = [r for r in rows.values() if r["id"] not in results]
    print(f"{len(results)} checked in the last 2 days, {len(todo)} to check", flush=True)
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    with CACHE.open("a") as f, cf.ThreadPoolExecutor(10) as ex:
        futs = {ex.submit(check, r): r for r in todo}
        for n, fu in enumerate(cf.as_completed(futs), 1):
            r = futs[fu]
            try:
                results[r["id"]] = fu.result()
            except Exception as e:  # noqa: BLE001 one bad URL must not stop a thousand good checks
                results[r["id"]] = {"status": "unverified", "http": None, "final_url": r["url"], "page_title": None, "channel": None, "embeddable": None, "overlap": None, "note": f"{type(e).__name__}: {e}"[:200], "image": None}
            f.write(json.dumps({"id": r["id"], "url": r["url"], "at": time.time(), "result": results[r["id"]]}) + "\n")
            f.flush()
            if n % 100 == 0:
                print(f"  checked {n}/{len(todo)}", flush=True)
    now = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    stmts = [SCHEMA.read_text(), "DELETE FROM learn.placement;"]
    for r in rows.values():
        c = results[r["id"]]
        creator = creator_of(r["url"], r["authors"], data["names"], c["channel"], r.get("hint"))
        stmts.append(
            "INSERT INTO learn.resource (id,url,title,format,access,creator,authors,status,embeddable,checked_at,platform,image) VALUES ("
            + ",".join([q(r["id"]), q(r["url"]), q(r["title"]), q(r["format"]), q(r["access"]), q(creator), q(json.dumps(r["authors"])) + "::jsonb", q(c["status"]), q(c["embeddable"]), q(now) + "::timestamptz", q(platform_of(r["url"])), q(c.get("image"))])
            + ") ON CONFLICT (id) DO UPDATE SET url=EXCLUDED.url,title=EXCLUDED.title,format=EXCLUDED.format,access=EXCLUDED.access,creator=EXCLUDED.creator,authors=EXCLUDED.authors,status=EXCLUDED.status,embeddable=EXCLUDED.embeddable,checked_at=EXCLUDED.checked_at,platform=EXCLUDED.platform,image=EXCLUDED.image;"
        )
        stmts.append(
            "INSERT INTO learn.link_check (resource,checked_at,status,http,final_url,page_title,channel,overlap,note) VALUES ("
            + ",".join([q(r["id"]), q(now) + "::timestamptz", q(c["status"]), q(c["http"]), q(c["final_url"]), q(c["page_title"]), q(c["channel"]), q(c["overlap"]), q(c["note"])])
            + ") ON CONFLICT DO NOTHING;"
        )
    for p in placements:
        stmts.append(f"INSERT INTO learn.placement (resource,topic,list,pos) VALUES ({q(p['resource'])},{q(p['topic'])},{q(p['list'])},{p['pos']}) ON CONFLICT DO NOTHING;")
    stmts.append("DELETE FROM learn.resource r WHERE NOT EXISTS (SELECT 1 FROM learn.placement p WHERE p.resource = r.id);")
    sql("\n".join(stmts), timeout=600)
    by = {}
    for c in results.values():
        by[c["status"]] = by.get(c["status"], 0) + 1
    print("loaded:", by, "with images:", sum(1 for c in results.values() if c.get("image")), flush=True)


def cmd_report():
    from db import query
    show = lambda rows: print("\n".join(" | ".join(r) for r in rows) or "(none)")
    show(query("""SELECT status, format, count(*) FROM learn.resource GROUP BY 1,2 ORDER BY 1,2;"""))
    print("--- dead")
    show(query("""SELECT r.title, r.url, c.note FROM learn.resource r JOIN learn.link_check c ON c.resource=r.id AND c.checked_at=r.checked_at WHERE r.status='dead' ORDER BY 1;"""))
    print("--- unverified")
    show(query("""SELECT split_part(split_part(r.url,'//',2),'/',1) host, count(*), min(c.note) FROM learn.resource r JOIN learn.link_check c ON c.resource=r.id AND c.checked_at=r.checked_at WHERE r.status='unverified' GROUP BY 1 ORDER BY 2 DESC;"""))
    print("--- title does not match the page (overlap < 0.25)")
    show(query("""SELECT r.format, c.overlap, r.title, c.page_title, r.url FROM learn.resource r JOIN learn.link_check c ON c.resource=r.id AND c.checked_at=r.checked_at WHERE r.status='ok' AND c.overlap < 0.25 ORDER BY 2,1;"""))


def rows_for_site():
    from db import query
    # json_agg puts a newline between elements and query() splits on lines, so flatten it first.
    res = json.loads(query("""SELECT replace(coalesce(json_agg(t ORDER BY t.id),'[]')::text, E'\\n', ' ') FROM (SELECT id,url,title,format,access,creator,authors,status,embeddable,platform,image,to_char(checked_at AT TIME ZONE 'UTC','YYYY-MM-DD') checked FROM learn.resource) t;""")[0][0])
    pl = json.loads(query("""SELECT replace(coalesce(json_agg(p ORDER BY p.topic,p.pos),'[]')::text, E'\\n', ' ') FROM learn.placement p;""")[0][0])
    return res, pl


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def render(data, res, pl):
    by_topic = {}
    for p in pl:
        by_topic.setdefault(p["topic"], []).append(p["resource"])
    label = {p["label"]: p["id"] for p in data["phases"]}
    def phase_id(s):
        s = re.sub(r"^[^A-Za-z]+", "", s)
        return label.get(s) or next((v for k, v in label.items() if s in k or k in s), "foundations")
    topics = []
    for t in sorted(data["topics"], key=lambda x: x["order"]):
        topics.append({
            "id": t["id"], "topic": t["topic"], "description": t["description"], "phase": phase_id(t["phase"]), "path": "roadmap",
            "difficulty": t["difficulty"], "order": t["order"], "week": t["week"], **({"milestone": True} if t.get("isMilestone") else {}),
            "tools": t.get("tools") or "", "proTips": t.get("proTips") or "", "resources": list(dict.fromkeys(by_topic.get(t["id"], []))),
        })
    cats = [c["label"] for c in data.get("categories", [])]
    ordered = sorted(data.get("concepts", []), key=lambda c: (cats.index(c["category"]) if c["category"] in cats else 99, c.get("rank", 0)))
    for n, c in enumerate(ordered):
        topics.append({
            "id": "c-" + c["id"], "topic": c["concept"], "description": c["description"], "phase": "enc-" + slug(c["category"]), "path": "encyclopedia",
            "difficulty": c["difficulty"], "order": 1000 + n, "week": 0, "emoji": c.get("emoji") or "", "page": f"/notebook/ai/encyclopedia/{c['id']}",
            "keyTerms": c.get("keyTerms") or [], "tools": "", "proTips": c.get("realWorldApps") or "", "resources": list(dict.fromkeys(by_topic.get("c-" + c["id"], []))),
        })
    resources = []
    for r in sorted(res, key=lambda x: x["id"]):
        y = youtube_of(r["url"])
        item = {"id": r["id"], "url": r["url"], "title": r["title"], "format": r["format"], "creator": r["creator"], "platform": r.get("platform") or "", "status": r["status"]}
        if r.get("image"):
            item["image"] = r["image"]
        if r.get("access"):
            item["access"] = r["access"]
        if y:
            item["youtube"] = y
            if r.get("embeddable") is False:
                item["noEmbed"] = True
        resources.append(item)
    phases = [{"id": p["id"], "label": re.sub(r"^Phase \d+:\s*", "", p["label"]), "n": i + 1, "color": p["color"], "path": "roadmap"} for i, p in enumerate(data["phases"])]
    phases += [{"id": "enc-" + slug(c["label"]), "label": c["label"], "n": i + 1, "color": c["color"], "path": "encyclopedia", "emoji": c.get("emoji") or ""} for i, c in enumerate(data.get("categories", []))]
    checked = max((r["checked"] for r in res), default="")
    return (
        "// GENERATED by data/corpus/learn_catalog.py from Postgres (learn.*); do not edit. The curated lists themselves are\n"
        "// src/data/aiRoadmap.ts and src/data/aiEncyclopedia.ts + encyclopediaResources.ts: edit them there, then run the\n"
        "// catalog's check and gen steps. Server only: the browser reads this through /feeds/learn.json, on demand.\n"
        "export type LearnFormat = \"video\" | \"course\" | \"book\" | \"repo\" | \"guide\" | \"paper\";\n"
        "export type LearnLevel = \"beginner\" | \"intermediate\" | \"advanced\";\n"
        "export interface LearnResource { id: string; url: string; title: string; format: LearnFormat; creator: string; platform: string; status: \"ok\" | \"dead\" | \"unverified\"; image?: string; access?: \"paid\" | \"freemium\"; youtube?: { id?: string; list?: string }; noEmbed?: boolean }\n"
        "export interface LearnTopic { id: string; topic: string; description: string; phase: string; path: \"roadmap\" | \"encyclopedia\"; difficulty: LearnLevel; order: number; week: number; milestone?: boolean; emoji?: string; page?: string; keyTerms?: string[]; tools: string; proTips: string; resources: string[] }\n"
        "export interface LearnPhase { id: string; label: string; n: number; color: string; path: \"roadmap\" | \"encyclopedia\"; emoji?: string }\n"
        f"export const LEARN_CHECKED_AT = {json.dumps(checked)};\n"
        f"export const LEARN_PHASES: LearnPhase[] = {json.dumps(phases, ensure_ascii=False)};\n"
        f"export const LEARN_TOPICS: LearnTopic[] = {json.dumps(topics, ensure_ascii=False, separators=(',', ':'))};\n"
        f"export const LEARN_RESOURCES: LearnResource[] = {json.dumps(resources, ensure_ascii=False, separators=(',', ':'))};\n"
    )


def cmd_gen():
    data = read_roadmap()
    res, pl = rows_for_site()
    OUT.write_text(render(data, res, pl))
    print(f"wrote {OUT.relative_to(ROOT)}: {len(res)} resources, {len(data['topics'])} topics")


def cmd_gate():
    """No database: the file must list exactly the roadmap's URLs and topics."""
    data = read_roadmap()
    rows, _ = catalog(data)
    if not OUT.exists():
        raise SystemExit("src/data/learnCatalog.ts is missing: run learn_catalog.py check, then gen")
    text = OUT.read_text()
    urls = set(re.findall(r'"url":"([^"]+)"', text))
    want = {r["url"] for r in rows.values()}
    missing, extra = want - urls, urls - want
    tids = set(re.findall(r'\{"id":"([^"]+)","topic":', text))
    gone = ({t["id"] for t in data["topics"]} | {"c-" + c["id"] for c in data.get("concepts", [])}) ^ tids
    if missing or extra or gone:
        raise SystemExit(f"learnCatalog.ts is stale against the roadmap: {len(missing)} URLs missing, {len(extra)} extra, topics differ: {sorted(gone)[:5]}. Run learn_catalog.py check, then gen")
    print(f"ok: learnCatalog.ts matches the roadmap ({len(want)} resources, {len(tids)} topics)")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    {"check": cmd_check, "gen": cmd_gen, "report": cmd_report, "--check": cmd_gate}.get(arg, lambda: sys.exit(__doc__))()
