#!/usr/bin/env python3
"""Generate the news layer TypeScript from the database. No hand-typed numbers."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from db import query

LABEL = {
 "television":"Television","radio":"Radio","print":"Print","digital":"Digital devices",
 "news_sites":"News sites or apps","social_media":"Social media","search":"Search",
 "podcasts":"Podcasts","newsletters":"Email newsletters","ai_chatbots":"AI chatbots",
}
ORDER = ["digital","news_sites","search","television","social_media","radio",
         "podcasts","newsletters","print","ai_chatbots"]

rows = query("""SELECT m.slug, o.subject, COALESCE(sg.slug,''), o.value
                FROM observation o JOIN metric m ON m.id=o.metric_id
                LEFT JOIN segment sg ON sg.id=o.segment_id
                WHERE m.slug IN ('news_platform_use','news_platform_preference')
                  AND o.period='2025';""")

use, pref = {}, {}
for metric, subj, seg, val in rows:
    (use if metric == "news_platform_use" else pref).setdefault(subj, {})[seg] = int(float(val))

out = ['/**',
       ' * Where people get news, and which channel they prefer.',
       ' *',
       ' * Generated from research_corpus by data/corpus/gen_news_ts.py. Do not',
       ' * hand-edit: re-run the generator instead.',
       ' *',
       ' * Source: Pew Research Center News Platform Fact Sheet, 2025-09-25.',
       ' * AI chatbots appear here for the first time: 9% of US adults get news',
       ' * that way, and 19% of Asian adults do.',
       ' */',
       'export interface NewsChannel {',
       '  id: string;',
       '  label: string;',
       '  /** % of US adults who get news here at least sometimes. */',
       '  overall: number;',
       '  /** % naming it their PREFERRED way to get news. */',
       '  preferred?: number;',
       '  /** segmentId -> %. Absent means that cut is not published. */',
       '  by: Record<string, number>;',
       '}',
       '',
       'export const NEWS_CHANNELS: NewsChannel[] = [']
for cid in ORDER:
    if cid not in use: continue
    cells = use[cid]
    body = ", ".join(f'"{k}": {v}' for k, v in sorted(cells.items()) if k)
    p = pref.get(cid, {}).get("")
    out.append(f'  {{ id: "{cid}", label: "{LABEL[cid]}", overall: {cells.get("", 0)},'
               + (f' preferred: {p},' if p is not None else '')
               + f' by: {{ {body} }} }},')
out.append('];')

dest = os.path.join(os.path.dirname(__file__), "..", "..", "src", "data", "newsChannels.ts")
open(dest, "w").write("\n".join(out) + "\n")
print(f"wrote {len(use)} channels to src/data/newsChannels.ts")
