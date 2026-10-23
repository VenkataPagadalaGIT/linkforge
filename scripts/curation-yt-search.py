"""YouTube search via the public results page (no API, no cost).
Parses ytInitialData for videoRenderer blocks: id, title, channel."""
import json, re, subprocess, urllib.parse, time

ELITE = {
    "3blue1brown": 100, "statquest with josh starmer": 95, "andrej karpathy": 98,
    "mit opencourseware": 92, "stanford online": 90, "harvard university": 90,
    "deeplearningai": 88, "ibm technology": 85, "google for developers": 84,
    "google cloud tech": 82, "google deepmind": 88, "anthropic": 96, "openai": 92,
    "nvidia developer": 84, "nvidia": 80, "amazon web services": 80, "aws developers": 78,
    "freecodecamp.org": 76, "computerphile": 82, "welch labs": 86, "crashcourse": 75,
    "serrano.academy": 80, "hugging face": 78, "microsoft research": 80, "yannic kilcher": 72,
    "two minute papers": 70, "mit introduction to deep learning": 85, "alexander amini": 85,
}

def search(query, limit=25):
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    out = subprocess.run(["curl", "-s", "--max-time", "25",
                          "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                          "-H", "Accept-Language: en-US,en;q=0.9", url],
                         capture_output=True, text=True, timeout=35).stdout
    vids = []
    for m in re.finditer(r'"videoRenderer":\{"videoId":"([^"]{11})"', out):
        start = m.start()
        chunk = out[start:start + 6000]
        t = re.search(r'"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"', chunk)
        c = re.search(r'"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"', chunk)
        if t and c:
            title = json.loads('"' + t.group(1) + '"')
            chan = json.loads('"' + c.group(1) + '"')
            vids.append({"id": m.group(1), "title": title, "channel": chan})
        if len(vids) >= limit:
            break
    return vids

def best_elite(query, topic_words):
    seen = set()
    ranked = []
    for v in search(query):
        if v["id"] in seen: continue
        seen.add(v["id"])
        score = ELITE.get(v["channel"].strip().lower())
        if score is None: continue
        # topical sanity: at least one topic word in the title
        tl = v["title"].lower()
        hit = sum(1 for w in topic_words if w in tl)
        ranked.append((score + hit * 3, v))
    ranked.sort(key=lambda x: -x[0])
    return [v for _, v in ranked[:3]]

if __name__ == "__main__":
    for name in ["gradient descent", "transformer neural network attention", "naive bayes"]:
        words = [w for w in re.split(r"\W+", name.lower()) if len(w) > 3]
        print(f"== {name}")
        for v in best_elite(name + " explained", words):
            print(f"   {v['channel']:35} | {v['title'][:70]} | {v['id']}")
        time.sleep(0.5)
