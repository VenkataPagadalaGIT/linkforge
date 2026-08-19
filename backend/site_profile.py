"""site_profile.py: what the OWNER tells agents about this site.

Everything here is information an agent cannot derive from the site
itself: who the owner is and what may be claimed, how the site sounds,
what each section is for, which keyword belongs to which page, what an
agent may do per page type, and which pages are locked outright.

One profile per site. venkatapagadala.com is the reference. A second
client is a second profile, not a second codebase: Omniscite's agent reads
/cms/agent/profile and behaves accordingly.

The default lives in code so it is versioned and reviewable; the owner can
override any key through PUT /cms/profile and the merge is shallow per
top-level section.
"""
from __future__ import annotations

from typing import Any, Dict

PROFILE_VERSION = "2026-08-19.1"

# Operations an agent can be granted, per page type. There is no "delete":
# the strongest thing an agent can do is proposeArchive, which a human
# decides. Hard delete does not exist for anyone; archive is the only path.
OPS = ["create", "update", "refresh", "proposeArchive"]

# The on-page fields a grant can name. Every write an agent makes is
# classified into one of these, and refused if the grant lacks it.
# Code, templates, components, routes and navigation are deliberately not
# fields: there is no grant that reaches them.
FIELD_GROUPS = {
    "body":            "Blocks: paragraphs, headings, lists, callouts, figures",
    "title":           "The page title (H1)",
    "seoTitle":        "<title> tag",
    "metaDescription": "Meta description",
    "primaryKeyword":  "Target keyword",
    "canonical":       "Canonical URL (owner-only by default)",
    "robots":          "Robots directive (owner-only by default)",
    "ogImage":         "Social share image",
    "schema":          "Structured-data override (owner-only by default)",
    "templateFields":  "The type's declared extra fields (category, company, faqs...)",
    "internalLinks":   "Links to other pages on this site",
    "sources":         "Citations with URL and fetch receipt",
}

# What an agent may write on a brand-new draft vs. on a revision of a
# published page differs by what the profile grants; these are the groups
# that are safe to grant freely and the ones that should stay owner-only.
DEFAULT_CONTENT_FIELDS = ["body", "title", "seoTitle", "metaDescription", "primaryKeyword",
                          "templateFields", "internalLinks", "sources"]
OWNER_ONLY_FIELDS = ["canonical", "robots", "schema"]

DEFAULT_SITE_PROFILE: Dict[str, Any] = {
    "profileVersion": PROFILE_VERSION,

    "identity": {
        "siteId": "venkatapagadala-com",
        "siteName": "Venkata Pagadala",
        "siteUrl": "https://venkatapagadala.com",
        "owner": "Venkata Pagadala",
        "purpose": (
            "A personal research site: AI systems explained with primary sources, "
            "interactive 3D explainers, an AI encyclopedia, an AI learning roadmap, "
            "dated AI industry updates, and the owner's publications."
        ),
        "audience": "Technical readers, AI practitioners, hiring managers, and search and answer engines.",
        "successLooksLike": [
            "A reader learns something true and can check the source.",
            "A page ranks for one query it owns and is cited by answer engines for it.",
            "Nothing on the site contradicts anything else on the site.",
        ],
        "mustNeverBecome": [
            "A content farm of near-duplicate explainers competing for the same query.",
            "A newsroom that paraphrases press releases without a primary source.",
            "A place where the owner is quoted saying things the owner did not say.",
        ],
    },

    # The truth file. Agents must not contradict it and must not extend it.
    "truthFile": {
        "owner": {
            "name": "Venkata Pagadala",
            "role": "SEO and AI systems practitioner; builder of Omniscite",
            "location": "United States",
            "claimsAllowed": [
                "Author of the guides, explainers and notebook entries on this site.",
                "Publishes on SSRN under author id 6512878.",
            ],
            "claimsForbidden": [
                "Any employer, title, degree, award or affiliation not listed here.",
                "Any statement attributed to the owner that is not on this site.",
                "Any revenue, pricing, valuation or money figure about the owner or Omniscite.",
            ],
        },
        "claimsPolicy": {
            "numbersNeedASource": True,
            "moneyFiguresNeverGuessed": True,
            "dateEveryEvent": True,
            "reportedVsOfficial": "Reported deals and rumours are labelled reported; official only when the company has said so.",
            "unverifiableGoesOnAList": "If it cannot be pinned to a primary source it goes in a clearly marked unverified list, never silently dropped, never silently asserted.",
        },
        "preferredSources": [
            "Primary: the company or lab's own announcement, paper, docs or filing.",
            "Court and regulator documents.",
            "Peer reviewed papers and their official preprints.",
            "Bloomberg, Reuters, FT, WSJ for reported deals, always labelled reported.",
        ],
        "bannedSources": [
            "Content farms, AI generated aggregators, and any page with no author and no date.",
            "Another site's summary of a primary source when the primary source is available.",
        ],
    },

    "voice": {
        "person": "First person singular for opinion, third person for reporting.",
        "tense": "Present for how things work, past for what happened.",
        "readingLevel": "Clear to a strong general reader; technical terms defined once, on first use.",
        "tone": "Direct, plain, specific. Confident where the evidence is, explicit where it is not.",
        "bannedPunctuation": ["em dash"],
        "bannedWords": ["delve", "leverage", "in today's world", "game-changer", "revolutionary", "seamless", "robust", "cutting-edge"],
        "bannedPatterns": [
            "Forced rule of three.",
            "Formulaic opener that restates the title.",
            "Closing paragraph that summarises what was just said.",
            "Hedging stacks: 'may potentially possibly'.",
        ],
        "opinionLabel": "Opinion is set apart under a heading such as 'My view' and carries a caveat or bear case.",
        "aiDisclosure": "Agent-drafted pages are reviewed and approved by the owner before publication; provenance is recorded on the page record.",
        "exemplars": [
            "/guides/how-llms-work",
            "/guides/how-neural-networks-work",
            "/ai-updates/anthropic-copyright-settlement-final-approval",
        ],
        "antiExemplars": [
            {"text": "In today's rapidly evolving AI landscape, it is crucial to delve into...", "why": "Opener restates nothing; two banned phrases; says nothing specific."},
            {"text": "This groundbreaking, revolutionary model is a game-changer.", "why": "Three adjectives, zero evidence."},
        ],
    },

    "topicMap": {
        "pillars": [
            {"id": "how-ai-works", "label": "How AI works", "homes": ["guide", "concept", "lecture"], "purpose": "Evergreen mechanism explanations with primary sources."},
            {"id": "ai-industry", "label": "AI industry", "homes": ["ai-update", "insight"], "purpose": "Dated events and the owner's analysis of them."},
            {"id": "learning-path", "label": "Learning path", "homes": ["roadmap-topic"], "purpose": "An ordered syllabus that points at guides and concepts."},
            {"id": "people", "label": "People", "homes": ["contributor"], "purpose": "The top-100 contributors album, credited photos only."},
            {"id": "owner-work", "label": "The owner's work", "homes": ["publication", "notebook"], "purpose": "Papers, conference notes, and working observations."},
        ],
        "offLimits": [
            "Medical, legal or financial advice.",
            "Politics outside of AI policy and regulation.",
            "Anything about the owner's employer or clients beyond what the truth file allows.",
        ],
        "doNotMention": [],
    },

    # One keyword, one page. An agent proposing a page for a keyword that
    # already has an owner is proposing cannibalization.
    "keywordOwnership": {
        "how llms work": "/guides/how-llms-work",
        "how neural networks work": "/guides/how-neural-networks-work",
        "hvac troubleshooting": "/guides/hvac-system-troubleshooting",
        "knowledge graph vs vector database": "/guides/graph-types-for-ai-agents",
        "ai encyclopedia": "/notebook/ai/encyclopedia",
        "ai learning roadmap": "/notebook/ai/roadmap",
    },

    # What an agent may do, per type. Absent type = nothing. "fields" is
    # the list of FIELD_GROUPS an agent may write; anything it touches
    # outside that list is refused, on create and on revision alike.
    "permissions": {
        "ai-update":     {"create": True,  "update": True,  "refresh": False, "proposeArchive": False,
                          "fields": DEFAULT_CONTENT_FIELDS},
        "concept":       {"create": True,  "update": True,  "refresh": True,  "proposeArchive": True,
                          "fields": DEFAULT_CONTENT_FIELDS},
        "insight":       {"create": True,  "update": False, "refresh": False, "proposeArchive": False,
                          "fields": ["body", "title", "seoTitle", "metaDescription", "sources", "internalLinks"]},
        "notebook":      {"create": True,  "update": True,  "refresh": False, "proposeArchive": False,
                          "fields": ["body", "title", "seoTitle", "metaDescription", "templateFields", "sources", "internalLinks"]},
        "roadmap-topic": {"create": False, "update": True,  "refresh": True,  "proposeArchive": False,
                          "fields": ["body", "templateFields", "internalLinks", "sources"],
                          "note": "May update outcomes and resources. May not rename a week or touch its SEO."},
        "guide":         {"create": False, "update": False, "refresh": False, "proposeArchive": False,
                          "fields": [],
                          "note": "Brief only. Guides are hand-built with 3D scenes; an agent may propose one, not write one."},
        "contributor":   {"create": False, "update": True,  "refresh": False, "proposeArchive": False,
                          "fields": ["body", "sources"],
                          "note": "May correct facts with a source. May never change the title, the photo, or any field."},
        "publication":   {"create": False, "update": False, "refresh": False, "proposeArchive": False,
                          "fields": [], "note": "Owner's own papers. Owner-only."},
        "lecture":       {"create": False, "update": False, "refresh": False, "proposeArchive": False,
                          "fields": []},
        "hub":           {"create": False, "update": False, "refresh": False, "proposeArchive": False,
                          "fields": [], "note": "Navigation. Owner-only, and not agent-draftable at the type level either."},
    },

    # Pages no agent touches, whatever the type permission says.
    "lockedPaths": [
        {"path": "/", "why": "Home page. Content, titles, schema and the living portrait are owner-only."},
        {"path": "/guides/how-llms-work", "why": "Flagship 3D guide; hand-built and expert-reviewed."},
        {"path": "/guides/how-neural-networks-work", "why": "Flagship 3D guide with live in-browser training."},
        {"path": "/guides/hvac-system-troubleshooting", "why": "Hand-built 3D troubleshooter."},
        {"path": "/about", "why": "The owner's own words about the owner."},
        {"path": "/publications", "why": "The owner's papers."},
        {"path": "/notebook/ai/map", "why": "Ontology with 1,245 reviewed edges; edited by script, not by prose agents."},
    ],

    "updateRules": {
        "staleAfterDays": {"ai-update": 365, "concept": 270, "roadmap-topic": 180, "notebook": 540},
        "staleTriggers": ["a cited source now 404s", "ranking dropped out of top 20 for its owned keyword", "a newer primary source supersedes a claim"],
        "minorEditMaxChangedWords": 120,
        "rewriteNeedsBrief": True,
        "neverShrinkBelowPercent": 80,
        "diffRequiredInReview": True,
        "slugFrozenAfterPublish": True,
        "typeFrozenAfterPublish": True,
    },

    "editorial": {
        "quotes": "At most one quote per page from any one source, under 25 words, in quotation marks, attributed.",
        "images": "Only images the site has rights to. Every image carries alt text and, for people, a credit.",
        "attribution": "Inline link to the primary source at the point of the claim, plus a sources block.",
        "accessibility": "Heading order never skips a level; colour is never the only carrier of meaning; every interactive has a text fallback.",
        "languageRegion": "US English.",
    },

    "operations": {
        "approver": "owner",
        "cadence": "Agents may file at any time; the owner reviews in batches.",
        "openDraftCapPerAgent": 25,
        "tokenLifetimeDays": 90,
        "killSwitch": "Revoke all tokens on the Agents screen, or set agentsPaused in the profile.",
        "agentsPaused": False,
        "escalation": "A draft the agent is unsure about is filed with a clarification request, not a guess.",
    },
}


def effective_permissions(profile: Dict[str, Any], token: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """What THIS token may do: the profile's grant per type, intersected
    with the token's own grant if it has one. A token can only narrow the
    profile, never widen it, so the owner's matrix is always the ceiling.
    """
    out: Dict[str, Dict[str, Any]] = {}
    overrides = token.get("permissions") or {}
    for t in token.get("allowedTypes", []):
        base = profile.get("permissions", {}).get(t)
        if not base:
            continue
        ov = overrides.get(t) or {}
        eff = {op: bool(base.get(op)) and bool(ov.get(op, True)) for op in OPS}
        base_fields = list(base.get("fields", []))
        eff["fields"] = [f for f in base_fields if f in ov.get("fields", base_fields)]
        if base.get("note"):
            eff["note"] = base["note"]
        out[t] = eff
    return out


def classify_write(payload: Dict[str, Any]) -> set:
    """Map the keys an agent sent to FIELD_GROUPS, so a grant can be
    checked against what was actually written rather than what was
    claimed."""
    groups = set()
    if payload.get("blocks"):
        groups.add("body")
    if payload.get("title"):
        groups.add("title")
    seo = payload.get("seo") or {}
    for k in ("seoTitle", "metaDescription", "primaryKeyword", "canonical", "robots", "ogImage"):
        if seo.get(k) is not None:
            groups.add(k)
    if seo.get("schemaOverride") is not None:
        groups.add("schema")
    if payload.get("fields"):
        groups.add("templateFields")
    if payload.get("internalLinks"):
        groups.add("internalLinks")
    if payload.get("sources"):
        groups.add("sources")
    return groups


def agent_may(profile: Dict[str, Any], op: str, type_id: str, path: str | None = None,
              token: Dict[str, Any] | None = None) -> tuple[bool, str]:
    """Single decision point for 'can this agent do this to that'.

    Order matters and is deliberate: the pause switch first, then page
    locks, then the per-type permission. A locked page stays locked even
    if its type is wide open, because locks are the owner's last word.
    """
    if profile.get("operations", {}).get("agentsPaused"):
        return False, "agents are paused site-wide"
    if path:
        for lock in profile.get("lockedPaths", []):
            under = lock["path"] != "/" and path.startswith(lock["path"].rstrip("/") + "/")
            if path == lock["path"] or under:
                return False, f"{path} is locked: {lock['why']}"
    perms = profile.get("permissions", {}).get(type_id)
    if not perms:
        return False, f"no permissions defined for type {type_id}"
    if token is not None:
        perms = effective_permissions(profile, token).get(type_id)
        if not perms:
            return False, f"{type_id} is outside this agent's scope"
    if not perms.get(op):
        note = perms.get("note")
        return False, f"{op} is not permitted on {type_id}" + (f" ({note})" if note else "")
    return True, "ok"


def fields_refused(profile: Dict[str, Any], token: Dict[str, Any], type_id: str,
                   payload: Dict[str, Any], op: str = "create") -> list:
    """Which field groups in this write are outside the agent's grant.

    On create, the title is implied: a page cannot exist without one, so
    a grant that allows create allows naming the new page. On a revision
    the title is a real change to a live page, and needs the grant.
    """
    eff = effective_permissions(profile, token).get(type_id, {})
    allowed = set(eff.get("fields", []))
    written = classify_write(payload)
    if op == "create":
        written.discard("title")
    return sorted(written - allowed)
