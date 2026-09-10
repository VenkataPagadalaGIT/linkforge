#!/usr/bin/env python3
"""
One landing page per question the corpus can actually answer.

Each page is a real query ("who uses TikTok", "how many Americans get news from
AI") answered by a published figure with every cut printed, and every one funnels
into the studio. Generated, so a new metric in the database becomes a new page
rather than a new writing job.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from db import query

PLATFORM = {
 "youtube":"YouTube","facebook":"Facebook","instagram":"Instagram","tiktok":"TikTok",
 "whatsapp":"WhatsApp","reddit":"Reddit","snapchat":"Snapchat","x":"X",
 "threads":"Threads","bluesky":"Bluesky","truthsocial":"Truth Social",
}
TITLE = {
 "ai_chatbots":"AI Chatbots","social_media":"Social Media","search":"Search Engines",
 "news_sites":"News Sites and Apps","television":"Television","podcasts":"Podcasts",
 "newsletters":"Email Newsletters","radio":"Radio","print":"Print",
}
CHANNEL = {
 "ai_chatbots":"AI chatbots","social_media":"social media","search":"search engines",
 "news_sites":"news sites and apps","television":"television","podcasts":"podcasts",
 "newsletters":"email newsletters","radio":"radio","print":"print",
}
ACCESS = {
 "smartphone_dependent": ("How Many Americans Have No Home Broadband?",
   "smartphone-only-no-broadband",
   "Smartphone-only means owning a smartphone and having no home broadband subscription. It decides what will actually load, which is a different question from which platform to post on."),
 "home_broadband": ("Who Has Home Broadband in the US?", "who-has-home-broadband",
   "Home broadband is the clearest divide in the whole corpus: it tracks income harder than any platform does."),
 "internet_use": ("Who Uses the Internet in the US?", "who-uses-the-internet",
   "Near-universal now, which makes the remaining gap the interesting part rather than the headline."),
 "owns_smartphone": ("Who Owns a Smartphone in the US?", "who-owns-a-smartphone",
   "Ownership is close to saturated. What separates groups is whether the phone is their only connection."),
}

rows = query("""SELECT m.slug, COALESCE(o.subject,''), o.value
                FROM observation o JOIN metric m ON m.id=o.metric_id
                WHERE o.segment_id IS NULL
                  AND o.period = (SELECT max(period) FROM observation o2 WHERE o2.metric_id=o.metric_id);""")
national = {}
for slug, subj, val in rows:
    national[(slug, subj)] = int(float(val))

qs = []
for pid, name in PLATFORM.items():
    if ("ever_use", pid) not in national: continue
    qs.append(dict(
        slug=f"who-uses-{pid}", short=f"Who uses {name}", metric="ever_use", subject=pid,
        title=f"Who Uses {name}? US Audience Demographics",
        description=f"The share of US adults who use {name}, cut by age, race, income, education, community type and party. Published figures from Pew Research Center with sample sizes and margins of error on every row.",
        note=f"Every figure is a published cell, not a model. Where Pew does not publish a cut, this page leaves it out rather than filling it in."))

# "How many people use X" is a distinct query from "who uses X", and it is
# where fabrication is worst, so it gets its own page rather than a section.
COUNTED = ["facebook","youtube","tiktok","instagram","snapchat","x","reddit","pinterest","threads"]
for pid in COUNTED:
    if ("ever_use", pid) not in national: continue
    name = PLATFORM.get(pid, pid.title())
    qs.append(dict(
        slug=f"how-many-people-use-{pid}", short=f"How many use {name}",
        metric="ever_use", subject=pid,
        title=f"How Many People Use {name}? What the Numbers Actually Count",
        description=f"{name}'s reported user counts, what each one measures, and the share of US adults who use it. Reported counts are advertising and investor figures; the US share is a probability sample with a published margin of error.",
        note="The reported totals below count accounts an advert can reach, not people. The US figure is a survey of people. Both are here, labelled, because mixing them is how a wrong number gets a citation."))

for cid, label in CHANNEL.items():
    if ("news_platform_use", cid) not in national: continue
    qs.append(dict(
        slug=f"who-gets-news-from-{cid.replace('_','-')}", short=f"News from {label}",
        metric="news_platform_use", subject=cid,
        title=f"Who Gets News From {TITLE.get(cid, label[0].upper()+label[1:])}?",
        description=f"The share of US adults who get news from {label} at least sometimes, by age, race, income, education and party. Pew Research Center, published figures only.",
        note=("AI chatbots entered this survey in 2025 and already show the widest racial spread of any news channel."
              if cid=="ai_chatbots" else
              "Getting news somewhere and preferring it are different questions; both are in the corpus.")))

for mslug, (title, slug, note) in ACCESS.items():
    if (mslug, "") not in national: continue
    qs.append(dict(slug=slug, short=title.rstrip("?"), metric=mslug, subject="",
                   title=title,
                   description=f"{title} Published figures from Pew Research Center, cut by age, race, income, education and community type, with sample sizes and margins of error.",
                   note=note))

def js(o): return json.dumps(o, separators=(",", ":"))
out = ["/**",
       " * One page per question the corpus can answer.",
       " *",
       " * Generated by data/corpus/gen_questions_ts.py. A new metric in the",
       " * database becomes a new page here, not a new writing job.",
       " */",
       "",
       "export interface CorpusQuestion {",
       "  slug: string;",
       "  short: string;",
       "  title: string;",
       "  description: string;",
       "  note: string;",
       "  metric: string;",
       "  subject: string;",
       "}",
       "",
       "export const QUESTIONS: CorpusQuestion[] = ["]
for q in qs:
    out.append("  { " + ", ".join(f"{k}: {js(v)}" for k, v in q.items()) + " },")
out += ["];", "",
        "export const questionBySlug = (s: string) => QUESTIONS.find((q) => q.slug === s);", ""]
dest = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "corpusQuestions.ts")
open(dest, "w").write("\n".join(out))
print(f"{len(qs)} question pages")
for q in qs: print("   /personas/" + q["slug"])
