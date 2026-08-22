"""agentic_cms.py: the Agentic CMS API.

Mounted into server.py. Everything the spec in docs/AGENTIC_CMS_SPEC.md
calls for, in one module:

  - a page-type registry (10 types) that doubles as the JSON contract an
    agent reads before it writes
  - a three-level SEO cascade: globals -> page type -> page, each falling
    back to the one above
  - pages with typed blocks, versions, and provenance
  - a review queue: draft, in_review, published, archived
  - an agent surface with NO publish endpoint. Agents draft and submit.
    Only an authenticated human approves. That is enforced by the absence
    of the route, not by a policy an agent could talk itself around.
  - gate results recorded on the page, so approving is an informed act

Storage is Mongo (collections: cms_pages, cms_globals, cms_agent_tokens,
cms_versions), matching the rest of this backend.
"""
from __future__ import annotations

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from site_profile import (DEFAULT_SITE_PROFILE, FIELD_GROUPS, OPS, PROFILE_VERSION,
                          agent_may, effective_permissions, fields_refused)

# ---------------------------------------------------------------- #
#  Page type registry: the contract for humans and agents alike
# ---------------------------------------------------------------- #

BLOCK_KINDS = [
    "p", "h2", "h3", "list", "callout", "code", "image", "figure",
    "comparison", "termcard", "faq", "related", "sources", "details",
    "interactive", "video",
]

PAGE_TYPES: Dict[str, Dict[str, Any]] = {
    "ai-update": {
        "placement": {
            "useWhen": "A dated, newsworthy event at a named company or lab: a release, a deal, a ruling, a paper with a date. It will age, and that is fine.",
            "neverFor": "Evergreen explanation, opinion essays, definitions, tutorials. If the piece would still be accurate in a year with no date on it, it is not an update.",
            "examples": ["/ai-updates/anthropic-copyright-settlement-final-approval", "/ai-updates/stripe-openrouter-acquisition"],
            "decidedBy": "category",
        },
        "label": "AI Update",
        "route": "/ai-updates/{slug}",
        "schemaType": "Article",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.7, "changefreq": "monthly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p"],
        "extraFields": [
            {"name": "company", "type": "text", "required": True},
            {"name": "category", "type": "select",
             "options": ["product-launch", "research", "industry", "open-source", "policy"]},
            {"name": "highlights", "type": "repeater", "of": ["stat", "label"]},
            {"name": "takeaways", "type": "list"},
            {"name": "myView", "type": "richlist",
             "help": "Analysis, labelled as opinion. Bear case goes in caveat."},
            {"name": "documents", "type": "repeater", "of": ["label", "source", "url"]},
            {"name": "videos", "type": "repeater", "of": ["label", "url", "duration"]},
        ],
    },
    "guide": {
        "placement": {
            "useWhen": "A long evergreen explainer of how something works, with a structure a reader can follow end to end and ideally an interactive 3D scene.",
            "neverFor": "News, short definitions, listicles, opinion. A guide under 1,500 words is probably a concept.",
            "examples": ["/guides/how-llms-work", "/guides/how-neural-networks-work"],
            "decidedBy": None,
        },
        "label": "Guide / 3D Explainer",
        "route": "/guides/{slug}",
        "schemaType": "TechArticle",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.9, "changefreq": "monthly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p", "sources"],
        "extraFields": [
            {"name": "kicker", "type": "text"},
            {"name": "deck", "type": "textarea"},
            {"name": "readingTime", "type": "text"},
            {"name": "terms", "type": "repeater", "of": ["term", "oneLiner", "inDepth"]},
            {"name": "faqs", "type": "repeater", "of": ["q", "a"]},
            {"name": "interactive", "type": "text", "help": "3D scene id"},
        ],
    },
    "concept": {
        "placement": {
            "useWhen": "One term, defined once, in plain words, with a difficulty level and links to prerequisites. The encyclopedia is one page per concept.",
            "neverFor": "Multi-concept tutorials, news, anything with a date. If it needs more than one H2 to explain, it is a guide.",
            "examples": ["/notebook/ai/encyclopedia/attention", "/notebook/ai/encyclopedia/embeddings"],
            "decidedBy": "category",
        },
        "label": "Encyclopedia Concept",
        "route": "/notebook/ai/encyclopedia/{slug}",
        "schemaType": "DefinedTerm",
        "titlePattern": "{title} · AI Encyclopedia",
        "sitemap": {"priority": 0.7, "changefreq": "monthly"},
        "inLlmsTxt": False,  # covered by the hub pattern, see the spec
        "requiredBlocks": [],
        "extraFields": [
            {"name": "category", "type": "select", "required": True},
            {"name": "difficulty", "type": "select",
             "options": ["beginner", "intermediate", "advanced"], "required": True},
            {"name": "keyTerms", "type": "tags"},
            {"name": "prerequisites", "type": "references"},
            {"name": "resources", "type": "repeater", "of": ["title", "url", "kind"]},
        ],
    },
    "insight": {
        "placement": {
            "useWhen": "Opinion and analysis in the author's voice, organised under a pillar. The reader should be able to disagree with it.",
            "neverFor": "Neutral reporting, reference material, definitions.",
            "examples": [],
            "decidedBy": "pillar",
        },
        "label": "Insight / Essay",
        "route": "/insights/{pillar}/{slug}",
        "schemaType": "BlogPosting",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.7, "changefreq": "monthly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p"],
        "extraFields": [{"name": "pillar", "type": "reference", "required": True}],
    },
    "notebook": {
        "placement": {
            "useWhen": "Working notes: a conference session, a business observation, an experiment log. Less polished than a guide, more personal than an update.",
            "neverFor": "Anything meant to rank as a definitive reference; that is a guide or a concept.",
            "examples": ["/notebook/conference/speakers/mike-king"],
            "decidedBy": "section",
        },
        "label": "Notebook Entry",
        "route": "/notebook/{section}/{slug}",
        "schemaType": "Article",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.6, "changefreq": "monthly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p"],
        "extraFields": [
            {"name": "section", "type": "select", "options": ["ai", "business", "conference"]},
            {"name": "eventDate", "type": "date"},
        ],
    },
    "roadmap-topic": {
        "placement": {
            "useWhen": "One week or elective in the AI learning roadmap: outcomes, resources, order. It is a syllabus entry, not an article.",
            "neverFor": "Explaining the topic itself. The roadmap points at guides and concepts; it does not replace them.",
            "examples": ["/notebook/ai/roadmap#week-03-attention"],
            "decidedBy": "week",
        },
        "label": "Roadmap Topic",
        "route": "/notebook/ai/roadmap#{slug}",
        "schemaType": "LearningResource",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.5, "changefreq": "yearly"},
        "inLlmsTxt": False,
        "requiredBlocks": [],
        "extraFields": [
            {"name": "week", "type": "number"},
            {"name": "outcomes", "type": "list"},
            {"name": "resources", "type": "repeater", "of": ["title", "url", "free"]},
        ],
    },
    "contributor": {
        "placement": {
            "useWhen": "A person in the top-100 AI contributors album: who, what they did, a credited photo.",
            "neverFor": "Companies, products, or anyone not in the album. Never without a photo credit.",
            "examples": ["/ai-contributors/geoffrey-hinton"],
            "decidedBy": None,
        },
        "label": "Contributor Profile",
        "route": "/ai-contributors/{slug}",
        "schemaType": "Person",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.5, "changefreq": "yearly"},
        "inLlmsTxt": False,
        "requiredBlocks": [],
        "extraFields": [
            {"name": "org", "type": "text"},
            {"name": "photo", "type": "media", "help": "credit required"},
            {"name": "photoCredit", "type": "text", "required": True},
        ],
    },
    "publication": {
        "placement": {
            "useWhen": "A paper or article by the site owner with a venue, an abstract and ideally a DOI.",
            "neverFor": "Third-party papers. Those are sources on a guide, not publications.",
            "examples": ["/publications#agentic-seo"],
            "decidedBy": None,
        },
        "label": "Publication / Paper",
        "route": "/publications#{slug}",
        "schemaType": "ScholarlyArticle",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.6, "changefreq": "yearly"},
        "inLlmsTxt": True,
        "requiredBlocks": [],
        "extraFields": [
            {"name": "venue", "type": "text", "required": True},
            {"name": "abstract", "type": "textarea"},
            {"name": "doi", "type": "url"},
            {"name": "jel", "type": "text"},
        ],
    },
    "hub": {
        # Hubs are navigation. An agent that can create one can reshape the
        # site's information architecture, which is an owner decision.
        "agentDraftable": False,
        "placement": {
            "useWhen": "A landing page whose job is to list other pages by a query. It has little body copy of its own.",
            "neverFor": "Anything an agent should create unasked. Hubs change navigation; they are owner-initiated.",
            "examples": ["/guides", "/ai-updates"],
            "decidedBy": None,
        },
        "label": "Hub / Landing",
        "route": "/{slug}",
        "schemaType": "CollectionPage",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.8, "changefreq": "weekly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p"],
        "extraFields": [{"name": "query", "type": "json", "help": "which pages this hub lists"}],
    },
    "lecture": {
        "placement": {
            "useWhen": "A structured course: ordered lessons with video, minutes, a transcript and captions.",
            "neverFor": "A single explainer with no lesson structure; that is a guide.",
            "examples": [],
            "decidedBy": None,
        },
        "label": "Lecture / Course",
        "route": "/learn/{slug}",
        "schemaType": "Course",
        "titlePattern": "{title}",
        "sitemap": {"priority": 0.7, "changefreq": "monthly"},
        "inLlmsTxt": True,
        "requiredBlocks": ["p"],
        "extraFields": [
            {"name": "lessons", "type": "repeater", "of": ["title", "video", "minutes"]},
            {"name": "transcript", "type": "textarea"},
            {"name": "captionsUrl", "type": "url"},
        ],
    },
}

DEFAULT_GLOBALS: Dict[str, Any] = {
    "siteName": "Venkata Pagadala",
    "siteUrl": "https://venkatapagadala.com",
    "titleTemplate": "{page} · {site}",
    # 149 chars. A shorter default would be inherited by every page that
    # writes no description of its own, and would then fail our own
    # 140-160 gate at publish time.
    "defaultMetaDescription": (
        "AI systems, research, and search, explained with primary sources: "
        "interactive 3D explainers, verified references, and notes on how the work was done."
    ),
    "defaultOgImage": "/og-image.png",
    "robotsPolicy": "index,follow",
    "organization": {
        "name": "Venkata Pagadala",
        "logo": "/favicon.png",
        "sameAs": [
            "https://www.linkedin.com/in/venkata-pagadala/",
            "https://ssrn.com/author=6512878",
        ],
    },
    "verification": {},
    "updatedAt": None,
}

# ---------------------------------------------------------------- #
#  Models
# ---------------------------------------------------------------- #

Status = Literal["draft", "in_review", "published", "archived"]

# Statuses a caller may write directly through create or patch. Publishing
# and archiving are state transitions with rules attached, so they are
# reachable only through their own routes, where those rules run.
WritableStatus = Literal["draft", "in_review"]

SAFE_URL = re.compile(r"^(https?://|/)", re.IGNORECASE)

# How many drafts one agent token may hold open at once, and how long a
# token lives before it must be reissued.
DEFAULT_AGENT_DRAFT_CAP = 25
DEFAULT_AGENT_TOKEN_DAYS = 90


def safe_url(v: Optional[str], field: str = "url") -> Optional[str]:
    """Reject any URL scheme that executes when a link is clicked.

    A source URL is written by an agent and rendered as an href on the
    owner's review screen. React escapes text but happily renders
    href="javascript:...", so without this an agent could put script in
    front of the one human who is trusted to approve its work. Only http,
    https, and site-relative paths are allowed.
    """
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not SAFE_URL.match(v):
        raise ValueError(
            f"{field} must start with http://, https:// or /  (got {v[:32]!r})"
        )
    return v


class Block(BaseModel):
    kind: str
    text: Optional[str] = None
    items: Optional[List[str]] = None
    title: Optional[str] = None
    url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

    @field_validator("kind")
    @classmethod
    def _kind(cls, v):
        # The renderer maps kinds to components. A kind it has never heard
        # of is either dropped silently or, worse, handed to a fallback that
        # trusts it. Refusing here keeps the data and the renderer in step.
        if v not in BLOCK_KINDS:
            raise ValueError(f"unknown block kind {v!r}; allowed: {', '.join(BLOCK_KINDS)}")
        return v

    @field_validator("url")
    @classmethod
    def _url(cls, v):
        return safe_url(v, "block url")


class Seo(BaseModel):
    """Page level only. Empty fields fall back to type, then globals."""
    seoTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    canonical: Optional[str] = None
    robots: Optional[str] = None
    ogImage: Optional[str] = None
    primaryKeyword: Optional[str] = None
    schemaOverride: Optional[str] = None

    @field_validator("canonical", "ogImage")
    @classmethod
    def _url(cls, v):
        return safe_url(v, "seo url")


class InternalLink(BaseModel):
    toSlug: str
    anchorText: str
    relation: str = "related"


class SourceRef(BaseModel):
    url: str
    quote: Optional[str] = None
    fetchedAt: Optional[str] = None
    httpStatus: Optional[int] = None

    @field_validator("url")
    @classmethod
    def _url(cls, v):
        checked = safe_url(v, "source url")
        if not checked:
            raise ValueError("source url is required")
        return checked


class Provenance(BaseModel):
    author: str = "human"
    agentId: Optional[str] = None
    model: Optional[str] = None
    humanOversight: Literal["none", "reviewed", "edited", "authored"] = "authored"
    sources: List[SourceRef] = Field(default_factory=list)
    gateResults: Optional[Dict[str, Any]] = None


class PageUpsert(BaseModel):
    type: str
    slug: str
    title: str
    # WritableStatus, not Status. With Status here, POST /cms/pages
    # {"status": "published"} put a page live without running a single
    # gate, which made "approve is the only path to published" false.
    status: WritableStatus = "draft"
    seo: Seo = Field(default_factory=Seo)
    blocks: List[Block] = Field(default_factory=list)
    fields: Dict[str, Any] = Field(default_factory=dict)
    internalLinks: List[InternalLink] = Field(default_factory=list)
    provenance: Provenance = Field(default_factory=Provenance)


ROBOTS_VALUES = {"index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"}


class GlobalsPatch(BaseModel):
    """Validated globals.

    This used to be Dict[str, Any] written straight to Mongo. Two things
    made that worse than untidy: siteUrl builds every canonical on the
    site, and robotsPolicy is inherited by every page that does not
    override it, so one typo here could deindex everything.
    """
    siteName: Optional[str] = None
    siteUrl: Optional[str] = None
    titleTemplate: Optional[str] = None
    defaultMetaDescription: Optional[str] = None
    robotsPolicy: Optional[str] = None
    defaultOgImage: Optional[str] = None
    organization: Optional[Dict[str, Any]] = None

    @field_validator("siteUrl")
    @classmethod
    def _site_url(cls, v):
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("siteUrl must be absolute, starting with http:// or https://")
        return v.rstrip("/") if v else v

    @field_validator("defaultOgImage")
    @classmethod
    def _og(cls, v):
        return safe_url(v, "defaultOgImage")

    @field_validator("robotsPolicy")
    @classmethod
    def _robots(cls, v):
        if v and v.replace(" ", "") not in ROBOTS_VALUES:
            raise ValueError(f"robotsPolicy must be one of: {', '.join(sorted(ROBOTS_VALUES))}")
        return v.replace(" ", "") if v else v


class PagePatch(BaseModel):
    """Every field optional, and only the fields actually sent are written.

    PageUpsert is a full document, so using it for PUT meant a caller who
    saved just the SEO tab reset blocks to [] and provenance to empty,
    destroying an agent's sources. A partial patch cannot do that.
    """
    type: Optional[str] = None
    slug: Optional[str] = None
    title: Optional[str] = None
    status: Optional[WritableStatus] = None
    seo: Optional[Seo] = None
    blocks: Optional[List[Block]] = None
    fields: Optional[Dict[str, Any]] = None
    internalLinks: Optional[List[InternalLink]] = None
    provenance: Optional[Provenance] = None


class AgentDraft(BaseModel):
    type: str
    title: str
    slug: Optional[str] = None
    summary: Optional[str] = None
    blocks: List[Block] = Field(default_factory=list)
    fields: Dict[str, Any] = Field(default_factory=dict)
    seo: Seo = Field(default_factory=Seo)
    sources: List[SourceRef] = Field(default_factory=list)
    model: Optional[str] = None


class AgentRevision(BaseModel):
    """A proposed change to a published page. Only the parts being changed
    need to be sent; the rest is carried from the original."""
    pageId: str
    changeSummary: str
    title: Optional[str] = None
    blocks: Optional[List[Block]] = None
    fields: Optional[Dict[str, Any]] = None
    seo: Seo = Field(default_factory=Seo)
    sources: List[SourceRef] = Field(default_factory=list)
    model: Optional[str] = None


# ---------------------------------------------------------------- #
#  Helpers
# ---------------------------------------------------------------- #

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def validate_fields(type_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    """Check a page's `fields` against its type's extraFields.

    Unknown keys are refused, and a select must hold one of its options.
    This is the line between "the agent fills in the template" and "the
    agent invents its own": a stray key renders as nothing and a bad select
    value renders as a broken filter, and both look like a site bug rather
    than a content mistake when they reach the page.

    Required-ness is not checked here, because a draft is allowed to be
    incomplete; the publish gate enforces it at approval.
    """
    spec = {f["name"]: f for f in PAGE_TYPES.get(type_id, {}).get("extraFields", [])}
    unknown = [k for k in fields if k not in spec]
    if unknown:
        raise HTTPException(
            422, f"fields not in the {type_id} template: {', '.join(sorted(unknown))}; "
                 f"allowed: {', '.join(sorted(spec)) or 'none'}")
    for k, v in fields.items():
        f = spec[k]
        if f.get("type") == "select" and f.get("options") and v not in (None, "") \
                and v not in f["options"]:
            raise HTTPException(
                422, f"field {k!r} must be one of {f['options']}, got {v!r}")
        if f.get("type") == "number" and v not in (None, "") and not isinstance(v, (int, float)):
            raise HTTPException(422, f"field {k!r} must be a number, got {v!r}")
    return fields


def resolve_seo(page: Dict[str, Any], globals_doc: Dict[str, Any]) -> Dict[str, Any]:
    """The cascade: page value, else page type, else globals."""
    t = PAGE_TYPES.get(page.get("type"), {})
    seo = page.get("seo") or {}
    title = seo.get("seoTitle") or t.get("titlePattern", "{title}").replace("{title}", page.get("title", ""))
    tmpl = globals_doc.get("titleTemplate") or "{page} · {site}"
    full_title = title if "·" in title else tmpl.replace("{page}", title).replace("{site}", globals_doc.get("siteName", ""))
    route = t.get("route", "/{slug}").replace("{slug}", page.get("slug", ""))
    return {
        "seoTitle": full_title,
        "seoTitleLength": len(full_title),
        "metaDescription": seo.get("metaDescription") or globals_doc.get("defaultMetaDescription", ""),
        "canonical": seo.get("canonical") or f"{globals_doc.get('siteUrl', '')}{route}",
        "robots": seo.get("robots") or globals_doc.get("robotsPolicy", "index,follow"),
        "ogImage": seo.get("ogImage") or globals_doc.get("defaultOgImage"),
        "schemaType": seo.get("schemaOverride") or t.get("schemaType"),
        "route": route,
        "sitemap": t.get("sitemap"),
        "inLlmsTxt": t.get("inLlmsTxt", True),
        "resolvedFrom": {
            "seoTitle": "page" if seo.get("seoTitle") else "type",
            "metaDescription": "page" if seo.get("metaDescription") else "globals",
            "canonical": "page" if seo.get("canonical") else "auto",
            "robots": "page" if seo.get("robots") else "globals",
        },
    }


def run_gates(page: Dict[str, Any], resolved: Dict[str, Any]) -> Dict[str, Any]:
    """Publish gates. Every failure blocks approval and says why.

    These mirror the repo's script gates so the CMS cannot publish content
    the deploy pipeline would have rejected.
    """
    checks: List[Dict[str, Any]] = []

    def add(name: str, ok: bool, detail: str = ""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    t = PAGE_TYPES.get(page.get("type"))
    add("known page type", bool(t), page.get("type", ""))
    add("slug is url safe", bool(re.fullmatch(r"[a-z0-9-]+", page.get("slug", ""))),
        page.get("slug", ""))

    title_len = resolved["seoTitleLength"]
    add("SEO title under 60 chars", title_len <= 60, f"{title_len} chars")

    desc = resolved.get("metaDescription") or ""
    add("meta description 140-160 chars", 140 <= len(desc) <= 160, f"{len(desc)} chars")

    add("canonical is absolute", resolved.get("canonical", "").startswith("http"),
        resolved.get("canonical", ""))

    body_text = " ".join((b.get("text") or "") for b in page.get("blocks", []))
    add("no em dashes in copy", "—" not in (body_text + page.get("title", "")),
        "house style rule")

    required = (t or {}).get("requiredBlocks", [])
    kinds = {b.get("kind") for b in page.get("blocks", [])}
    missing = [r for r in required if r not in kinds]
    add("required blocks present", not missing, f"missing: {', '.join(missing)}" if missing else "")

    prov = page.get("provenance") or {}
    if prov.get("author") == "agent":
        srcs = prov.get("sources") or []
        add("agent draft carries sources", len(srcs) > 0, f"{len(srcs)} sources")
        add("every source has a URL", all(s.get("url") for s in srcs), "")
    else:
        add("authored by a human", True, prov.get("author", "human"))

    links = page.get("internalLinks") or []
    add("internal links have anchor text", all(l.get("anchorText") for l in links),
        f"{len(links)} links")

    passed = all(c["ok"] for c in checks)
    return {"passed": passed, "checks": checks, "ranAt": now_iso(),
            "failed": [c["name"] for c in checks if not c["ok"]]}


# ---------------------------------------------------------------- #
#  Router factory (server.py passes db + the admin dependency)
# ---------------------------------------------------------------- #

def build_router(db, get_current_admin) -> APIRouter:
    r = APIRouter(prefix="/cms", tags=["agentic-cms"])

    async def get_globals() -> Dict[str, Any]:
        doc = await db.cms_globals.find_one({"_id": "globals"}, {"_id": 0})
        return {**DEFAULT_GLOBALS, **(doc or {})}

    async def get_profile() -> Dict[str, Any]:
        """Owner overrides merged over the in-code default, one level deep,
        so a PUT that sets operations.agentsPaused does not wipe the rest
        of operations."""
        doc = await db.cms_site_profile.find_one({"_id": "profile"}, {"_id": 0}) or {}
        merged = dict(DEFAULT_SITE_PROFILE)
        for k, v in doc.items():
            if isinstance(v, dict) and isinstance(merged.get(k), dict):
                merged[k] = {**merged[k], **v}
            else:
                merged[k] = v
        merged["profileVersion"] = PROFILE_VERSION
        return merged

    async def log_event(actor: Dict[str, Any], action: str, result: str,
                        target: Optional[Dict[str, Any]] = None, detail: str = "",
                        request: Optional[Request] = None) -> None:
        """One row per thing that happened, agent or admin, allowed or
        refused. This is the answer to "who did that": every draft, every
        revision, every approval, every 403, with the actor, the target and
        the reason. Refusals are logged on purpose; an agent that keeps
        hitting a lock is a signal, not noise."""
        row = {
            "id": secrets.token_hex(8),
            "ts": now_iso(),
            "actor": {"kind": actor.get("kind"), "id": actor.get("id"), "name": actor.get("name")},
            "action": action,
            "result": result,            # ok | refused | error
            "target": target or {},
            "detail": detail[:500],
        }
        if request is not None:
            row["ip"] = request.client.host if request.client else None
            row["requestId"] = request.headers.get("x-request-id")
        await db.cms_activity.insert_one(row)

    def actor_of_agent(agent: Dict[str, Any]) -> Dict[str, Any]:
        return {"kind": "agent", "id": agent.get("id"), "name": agent.get("name")}

    def actor_of_admin(user: Dict[str, Any]) -> Dict[str, Any]:
        return {"kind": "admin", "id": user.get("email"), "name": user.get("email")}

    async def require_agent(request: Request) -> Dict[str, Any]:
        """Agent tokens are separate from admin sessions and can only draft."""
        token = request.headers.get("x-agent-token", "")
        if not token:
            raise HTTPException(status_code=401, detail="Missing X-Agent-Token")
        digest = hashlib.sha256(token.encode()).hexdigest()
        rec = await db.cms_agent_tokens.find_one({"tokenHash": digest, "active": True}, {"_id": 0})
        if not rec:
            await log_event({"kind": "agent", "id": None, "name": "unknown"}, "auth", "refused",
                            detail="unknown or revoked token", request=request)
            raise HTTPException(status_code=401, detail="Unknown or revoked agent token")
        # A token that never expires is a credential nobody remembers to
        # rotate. Revoking is still the fast path; this is the backstop.
        expires = rec.get("expiresAt")
        if expires and expires < now_iso():
            await log_event(actor_of_agent(rec), "auth", "refused", detail="token expired", request=request)
            raise HTTPException(status_code=401, detail="Agent token expired; issue a new one")
        await db.cms_agent_tokens.update_one({"id": rec["id"]}, {"$set": {"lastSeenAt": now_iso()}})
        return rec

    async def enforce_draft_cap(agent: Dict[str, Any]) -> None:
        """Cap the open drafts one token can hold.

        The review queue is a human's attention, so it is a finite resource.
        Without a cap, a buggy loop or a stolen token fills it faster than
        anyone can read, and the queue stops being usable at all.
        """
        cap = int(agent.get("openDraftCap") or DEFAULT_AGENT_DRAFT_CAP)
        open_now = await db.cms_pages.count_documents({
            "provenance.agentId": agent.get("id"),
            "status": {"$in": ["draft", "in_review"]},
        })
        if open_now >= cap:
            raise HTTPException(
                429,
                f"agent has {open_now} open drafts, at its cap of {cap}; "
                "a human must approve, reject or archive some before it files more",
            )

    # ---------------- schema / registry ----------------

    @r.get("/types")
    async def list_types(_: dict = Depends(get_current_admin)):
        return [{"id": k, **v} for k, v in PAGE_TYPES.items()]

    @r.get("/types/{type_id}")
    async def get_type(type_id: str, _: dict = Depends(get_current_admin)):
        if type_id not in PAGE_TYPES:
            raise HTTPException(404, "unknown page type")
        return {"id": type_id, **PAGE_TYPES[type_id], "blockKinds": BLOCK_KINDS}

    # ---------------- globals ----------------

    @r.get("/globals")
    async def read_globals(_: dict = Depends(get_current_admin)):
        return await get_globals()

    @r.put("/globals")
    async def write_globals(payload: GlobalsPatch, _: dict = Depends(get_current_admin)):
        incoming = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not incoming:
            raise HTTPException(400, "nothing to update")
        incoming["updatedAt"] = now_iso()
        await db.cms_globals.update_one({"_id": "globals"}, {"$set": incoming}, upsert=True)
        return await get_globals()

    # ---------------- site profile (owner writes, agents read) ----------------

    @r.get("/profile")
    async def read_profile(_: dict = Depends(get_current_admin)):
        return await get_profile()

    @r.put("/profile")
    async def write_profile(payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        # Only known top-level sections, so a typo does not create a new one
        # that nothing reads.
        unknown = [k for k in payload if k not in DEFAULT_SITE_PROFILE]
        if unknown:
            raise HTTPException(400, f"unknown profile sections: {', '.join(unknown)}")
        payload["updatedAt"] = now_iso()
        payload["updatedBy"] = user.get("email")
        await db.cms_site_profile.update_one({"_id": "profile"}, {"$set": payload}, upsert=True)
        return await get_profile()

    @r.post("/profile/pause")
    async def pause_agents(payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        """The kill switch. One call, no deploy, every agent write refused
        until it is lifted. Tokens stay valid so lifting is one call too."""
        paused = bool(payload.get("paused", True))
        await db.cms_site_profile.update_one(
            {"_id": "profile"},
            {"$set": {"operations.agentsPaused": paused, "operations.pausedBy": user.get("email"),
                      "operations.pausedAt": now_iso()}},
            upsert=True)
        await log_event(actor_of_admin(user), "agents.pause" if paused else "agents.resume", "ok")
        return {"ok": True, "agentsPaused": paused}

    # ---------------- pages ----------------

    @r.get("/pages")
    async def list_pages(type: Optional[str] = None, status: Optional[str] = None,
                         q: Optional[str] = None, includeArchived: bool = False,
                         _: dict = Depends(get_current_admin)):
        query: Dict[str, Any] = {}
        if type:
            query["type"] = type
        if status:
            query["status"] = status
        elif not includeArchived:
            # Archived is a soft delete, so it belongs out of the working
            # list unless it is asked for by name. Otherwise every discarded
            # draft stays in the owner's field of view forever.
            query["status"] = {"$ne": "archived"}
        if q:
            # re.escape, because the raw string went into $regex: a search
            # for "a(" was a 500, and a crafted pattern is a CPU bomb.
            safe = re.escape(q)
            query["$or"] = [{"title": {"$regex": safe, "$options": "i"}},
                            {"slug": {"$regex": safe, "$options": "i"}}]
        rows = await db.cms_pages.find(query, {"_id": 0}).sort("updatedAt", -1).to_list(500)
        return rows

    @r.get("/pages/{page_id}")
    async def get_page(page_id: str, _: dict = Depends(get_current_admin)):
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page:
            raise HTTPException(404, "not found")
        g = await get_globals()
        return {**page, "resolvedSeo": resolve_seo(page, g)}

    @r.post("/pages")
    async def create_page(payload: PageUpsert, user: dict = Depends(get_current_admin)):
        if payload.type not in PAGE_TYPES:
            raise HTTPException(400, f"unknown page type {payload.type}")
        validate_fields(payload.type, payload.fields)
        page = payload.model_dump()
        page["id"] = secrets.token_hex(8)
        page["slug"] = slugify(page["slug"] or page["title"])
        page["createdAt"] = page["updatedAt"] = now_iso()
        page["createdBy"] = user.get("email")
        await db.cms_pages.insert_one(dict(page))
        page.pop("_id", None)
        return page

    @r.put("/pages/{page_id}")
    async def update_page(page_id: str, payload: PagePatch, user: dict = Depends(get_current_admin)):
        existing = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not existing:
            raise HTTPException(404, "not found")

        # Only the keys the caller actually sent. Saving one tab must not
        # blank out the tabs that were not on screen.
        incoming = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not incoming:
            raise HTTPException(400, "nothing to update")

        if "type" in incoming and incoming["type"] not in PAGE_TYPES:
            raise HTTPException(400, f"unknown page type {incoming['type']}")
        if "fields" in incoming:
            validate_fields(incoming.get("type", existing["type"]), incoming["fields"])

        if "slug" in incoming:
            incoming["slug"] = slugify(incoming["slug"])

        # A published page owns a URL, and the URL is route + slug. Freezing
        # only the slug was half a rule: switching the type moved the page to
        # a different route and broke every inbound link just as thoroughly.
        if existing.get("status") == "published":
            if incoming.get("slug", existing["slug"]) != existing["slug"]:
                raise HTTPException(400, "slug is frozen after publish; add a redirect instead")
            if incoming.get("type", existing["type"]) != existing["type"]:
                raise HTTPException(400, "page type is frozen after publish; it decides the URL route")

        await db.cms_versions.insert_one({"pageId": page_id, "snapshot": existing,
                                          "at": now_iso(), "by": user.get("email")})
        incoming["updatedAt"] = now_iso()
        incoming["updatedBy"] = user.get("email")
        await db.cms_pages.update_one({"id": page_id}, {"$set": incoming})
        updated = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        return updated

    @r.post("/pages/{page_id}/gates")
    async def gates(page_id: str, _: dict = Depends(get_current_admin)):
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page:
            raise HTTPException(404, "not found")
        g = await get_globals()
        result = run_gates(page, resolve_seo(page, g))
        await db.cms_pages.update_one({"id": page_id},
                                      {"$set": {"provenance.gateResults": result}})
        return result

    # ---------------- review queue ----------------

    @r.get("/review")
    async def review_queue(_: dict = Depends(get_current_admin)):
        rows = await db.cms_pages.find({"status": "in_review"}, {"_id": 0}).sort("updatedAt", -1).to_list(200)
        g = await get_globals()
        out = []
        for p in rows:
            resolved = resolve_seo(p, g)
            out.append({**p, "resolvedSeo": resolved, "gates": run_gates(p, resolved)})
        return out

    @r.post("/pages/{page_id}/approve")
    async def approve(page_id: str, user: dict = Depends(get_current_admin)):
        """The only path to published, and it requires a human session."""
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page:
            raise HTTPException(404, "not found")
        g = await get_globals()
        result = run_gates(page, resolve_seo(page, g))

        # Uniqueness needs the database, so it cannot live in run_gates.
        # Two drafts can legitimately carry the same slug while they are
        # drafts; only one of them may own the URL once published.
        clash = await db.cms_pages.find_one(
            {"type": page["type"], "slug": page["slug"],
             "status": "published", "id": {"$nin": [page_id, page.get("revisionOf")]}},
            {"_id": 0, "id": 1},
        )
        if clash:
            result["checks"].append({
                "name": "slug is unique among published pages",
                "ok": False,
                "detail": f"{page['type']}/{page['slug']} is already live",
            })
            result["failed"].append("slug is unique among published pages")
            result["passed"] = False

        if not result["passed"]:
            await log_event(actor_of_admin(user), "page.approve", "refused",
                            {"pageId": page_id, "type": page["type"], "slug": page["slug"]},
                            detail="gates failed: " + ", ".join(result["failed"]))
            raise HTTPException(422, {"detail": "gates failed", "failed": result["failed"]})
        await log_event(actor_of_admin(user), "page.approve", "ok",
                        {"pageId": page_id, "type": page["type"], "slug": page["slug"],
                         "agentId": (page.get("provenance") or {}).get("agentId")})
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "published",
            "publishedAt": now_iso(),
            "approvedBy": user.get("email"),
            "provenance.gateResults": result,
            "provenance.humanOversight": "reviewed",
        }})
        # A revision replaces its original: the old record is kept for the
        # audit trail but leaves the live set, so the URL has one owner.
        if page.get("revisionOf"):
            await db.cms_pages.update_one({"id": page["revisionOf"]}, {"$set": {
                "status": "archived", "supersededBy": page_id, "archivedAt": now_iso(),
                "archivedBy": user.get("email"),
            }})
        return {"ok": True, "status": "published", "gates": result}

    @r.post("/pages/{page_id}/reject")
    async def reject(page_id: str, payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        if not await db.cms_pages.find_one({"id": page_id}, {"_id": 1}):
            raise HTTPException(404, "not found")
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "draft",
            "reviewNotes": payload.get("notes", ""),
            "reviewedBy": user.get("email"),
            "reviewedAt": now_iso(),
        }})
        await log_event(actor_of_admin(user), "page.reject", "ok", {"pageId": page_id},
                        detail=payload.get("notes", ""))
        return {"ok": True, "status": "draft"}

    @r.post("/pages/{page_id}/archive")
    async def archive(page_id: str, user: dict = Depends(get_current_admin)):
        """Soft delete. Rejecting only sends a draft back to draft, so
        without this the queue fills with work nobody intends to publish.
        The row stays for the audit trail; it just leaves every list."""
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0, "status": 1})
        if not page:
            raise HTTPException(404, "not found")
        if page.get("status") == "published":
            raise HTTPException(
                409,
                "unpublish before archiving; archiving a live page would "
                "orphan its URL without a redirect",
            )
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "archived",
            "archivedBy": user.get("email"),
            "archivedAt": now_iso(),
        }})
        await log_event(actor_of_admin(user), "page.archive", "ok", {"pageId": page_id})
        return {"ok": True, "status": "archived"}

    # ---------------- agent tokens (admin issues them) ----------------

    @r.get("/agent-tokens")
    async def list_tokens(_: dict = Depends(get_current_admin)):
        """Every token with the numbers an operator needs at a glance:
        open drafts, in review, published, refusals, last seen."""
        tokens = await db.cms_agent_tokens.find({}, {"_id": 0, "tokenHash": 0}).to_list(1000)
        ids = [t["id"] for t in tokens]
        by_status = {}
        async for row in db.cms_pages.aggregate([
            {"$match": {"provenance.agentId": {"$in": ids}}},
            {"$group": {"_id": {"a": "$provenance.agentId", "s": "$status"}, "n": {"$sum": 1}}},
        ]):
            by_status.setdefault(row["_id"]["a"], {})[row["_id"]["s"]] = row["n"]
        refused = {}
        async for row in db.cms_activity.aggregate([
            {"$match": {"actor.id": {"$in": ids}, "result": "refused"}},
            {"$group": {"_id": "$actor.id", "n": {"$sum": 1}}},
        ]):
            refused[row["_id"]] = row["n"]
        profile = await get_profile()
        for t in tokens:
            st = by_status.get(t["id"], {})
            t["stats"] = {
                "draft": st.get("draft", 0), "inReview": st.get("in_review", 0),
                "published": st.get("published", 0), "archived": st.get("archived", 0),
                "refused": refused.get(t["id"], 0),
            }
            t["effectivePermissions"] = effective_permissions(profile, t)
        return tokens

    @r.put("/agent-tokens/{token_id}/permissions")
    async def set_token_permissions(token_id: str, payload: Dict[str, Any],
                                    user: dict = Depends(get_current_admin)):
        """Narrow one agent below the site profile. Shape:
        {"<type>": {"create": bool, ..., "fields": [group, ...]}}.
        Unknown types, ops or field groups are refused; a token can never be
        granted something the profile does not grant."""
        tok = await db.cms_agent_tokens.find_one({"id": token_id}, {"_id": 0})
        if not tok:
            raise HTTPException(404, "not found")
        for t, spec in payload.items():
            if t not in tok.get("allowedTypes", []):
                raise HTTPException(400, f"{t} is not in this token's scope")
            for k, v in spec.items():
                if k == "fields":
                    bad = [f for f in v if f not in FIELD_GROUPS]
                    if bad:
                        raise HTTPException(400, f"unknown field groups: {', '.join(bad)}")
                elif k not in OPS:
                    raise HTTPException(400, f"unknown operation {k!r}; allowed: {', '.join(OPS)}")
        await db.cms_agent_tokens.update_one({"id": token_id}, {"$set": {
            "permissions": payload, "permissionsUpdatedAt": now_iso(),
            "permissionsUpdatedBy": user.get("email")}})
        await log_event(actor_of_admin(user), "token.permissions", "ok",
                        {"tokenId": token_id, "name": tok.get("name")}, detail=str(payload)[:300])
        profile = await get_profile()
        tok["permissions"] = payload
        return {"ok": True, "effectivePermissions": effective_permissions(profile, tok)}

    @r.get("/activity")
    async def activity(actorId: Optional[str] = None, action: Optional[str] = None,
                       result: Optional[str] = None, pageId: Optional[str] = None,
                       q: Optional[str] = None, limit: int = 200,
                       _: dict = Depends(get_current_admin)):
        """The audit log, filterable. Newest first."""
        query: Dict[str, Any] = {}
        if actorId:
            query["actor.id"] = actorId
        if action:
            query["action"] = action
        if result:
            query["result"] = result
        if pageId:
            query["target.pageId"] = pageId
        if q:
            safe = re.escape(q)
            query["$or"] = [{"actor.name": {"$regex": safe, "$options": "i"}},
                            {"target.slug": {"$regex": safe, "$options": "i"}},
                            {"target.path": {"$regex": safe, "$options": "i"}},
                            {"detail": {"$regex": safe, "$options": "i"}}]
        rows = await db.cms_activity.find(query, {"_id": 0}).sort("ts", -1).to_list(min(limit, 1000))
        return rows

    @r.get("/activity/summary")
    async def activity_summary(_: dict = Depends(get_current_admin)):
        """What is happening right now: active agents (seen in the last
        hour), actions in the last 24h, refusals in the last 24h, drafts
        awaiting review."""
        from datetime import timedelta as _td
        now = datetime.now(timezone.utc)
        hour_ago = (now - _td(hours=1)).isoformat().replace("+00:00", "Z")
        day_ago = (now - _td(hours=24)).isoformat().replace("+00:00", "Z")
        active = await db.cms_agent_tokens.count_documents({"active": True, "lastSeenAt": {"$gte": hour_ago}})
        total_active = await db.cms_agent_tokens.count_documents({"active": True})
        actions24 = await db.cms_activity.count_documents({"ts": {"$gte": day_ago}})
        refused24 = await db.cms_activity.count_documents({"ts": {"$gte": day_ago}, "result": "refused"})
        awaiting = await db.cms_pages.count_documents({"status": "in_review"})
        top = []
        async for row in db.cms_activity.aggregate([
            # Unknown tokens log as actor.id null; they count as refusals,
            # not as an agent, so they are excluded from "busiest".
            {"$match": {"ts": {"$gte": day_ago}, "actor.kind": "agent", "actor.id": {"$ne": None}}},
            {"$group": {"_id": {"id": "$actor.id", "name": "$actor.name"}, "n": {"$sum": 1},
                        "refused": {"$sum": {"$cond": [{"$eq": ["$result", "refused"]}, 1, 0]}}}},
            {"$sort": {"n": -1}}, {"$limit": 10},
        ]):
            top.append({"id": row["_id"]["id"], "name": row["_id"]["name"], "actions": row["n"], "refused": row["refused"]})
        return {"agentsSeenLastHour": active, "agentsActive": total_active,
                "actions24h": actions24, "refused24h": refused24, "awaitingReview": awaiting,
                "busiestAgents24h": top}

    @r.post("/agent-tokens")
    async def create_token(payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        raw = "omni_" + secrets.token_urlsafe(24)

        # Scope is a security control, so an unrecognised type is an error
        # rather than something to quietly widen. An empty list would grant
        # nothing useful, so that falls back to every type on purpose.
        draftable = [k for k, v in PAGE_TYPES.items() if v.get("agentDraftable", True)]
        requested = payload.get("allowedTypes") or draftable
        unknown = [t for t in requested if t not in PAGE_TYPES]
        if unknown:
            raise HTTPException(400, f"unknown page type(s): {', '.join(unknown)}")
        locked = [t for t in requested if t not in draftable]
        if locked:
            raise HTTPException(
                400, f"not agent-draftable: {', '.join(locked)}. "
                     "These types change site structure and are created by the owner.")

        days = int(payload.get("expiresInDays") or DEFAULT_AGENT_TOKEN_DAYS)
        rec = {
            "id": secrets.token_hex(6),
            "name": payload.get("name", "unnamed agent"),
            "tokenHash": hashlib.sha256(raw.encode()).hexdigest(),
            "allowedTypes": requested,
            "openDraftCap": int(payload.get("openDraftCap") or DEFAULT_AGENT_DRAFT_CAP),
            "expiresAt": (datetime.now(timezone.utc) + timedelta(days=days))
                .isoformat().replace("+00:00", "Z"),
            "active": True,
            "createdAt": now_iso(),
            "createdBy": user.get("email"),
        }
        await db.cms_agent_tokens.insert_one(dict(rec))
        rec.pop("_id", None)
        rec.pop("tokenHash", None)
        await log_event(actor_of_admin(user), "token.issue", "ok",
                        {"tokenId": rec["id"], "name": rec["name"]}, detail=f"scope {requested}")
        # shown once, never stored in the clear
        return {**rec, "token": raw}

    @r.post("/agent-tokens/{token_id}/revoke")
    async def revoke_token(token_id: str, user: dict = Depends(get_current_admin)):
        await db.cms_agent_tokens.update_one({"id": token_id}, {"$set": {
            "active": False, "revokedAt": now_iso(), "revokedBy": user.get("email")}})
        await log_event(actor_of_admin(user), "token.revoke", "ok", {"tokenId": token_id})
        return {"ok": True}

    # ---------------- AGENT SURFACE: draft only, no publish ----------------

    @r.get("/agent/schema")
    async def agent_schema(agent: dict = Depends(require_agent)):
        """What an agent reads before writing. The schema is the contract."""
        allowed = agent.get("allowedTypes", [])
        return {
            "agent": agent.get("name"),
            "allowedTypes": allowed,
            "types": {k: v for k, v in PAGE_TYPES.items()
                      if k in allowed and v.get("agentDraftable", True)},
            "blockKinds": BLOCK_KINDS,
            "rules": [
                "You may create and update drafts only. There is no publish endpoint.",
                "Choose the page type from each type's placement.useWhen and placement.neverFor before anything else, and state the reason. A wrong type puts content under the wrong URL.",
                "Where a type has placement.decidedBy, that field must be set; it decides which section the page lands in.",
                "Send only fields the type declares, and only block kinds the schema lists. Anything else is refused.",
                "Every factual claim needs a source with a URL and a fetched timestamp.",
                "No em dashes in copy.",
                "SEO title must be 60 characters or fewer.",
                "Meta description must be between 140 and 160 characters.",
                "Slugs are lowercase, hyphenated, and frozen after publication.",
            ],
        }

    @r.get("/agent/profile")
    async def agent_profile(agent: dict = Depends(require_agent)):
        """Everything the owner wants an agent to know: truth file, voice,
        topic map, keyword ownership, permissions, locks, update rules."""
        return await get_profile()

    @r.get("/agent/whoami")
    async def agent_whoami(agent: dict = Depends(require_agent)):
        """The authentication-success layer.

        An agent calls this first. It learns who the server thinks it is,
        what it may do, how much room it has, and what to read next. If this
        call succeeds the credential works; everything after is permission,
        not authentication.
        """
        profile = await get_profile()
        open_now = await db.cms_pages.count_documents({
            "provenance.agentId": agent.get("id"), "status": {"$in": ["draft", "in_review"]}})
        allowed = [t for t in agent.get("allowedTypes", [])
                   if PAGE_TYPES.get(t, {}).get("agentDraftable", True)]
        eff = effective_permissions(profile, agent)
        grants = {t: eff.get(t, {"create": False, "update": False, "refresh": False,
                                 "proposeArchive": False, "fields": []}) for t in allowed}
        await log_event(actor_of_agent(agent), "auth", "ok", detail="whoami")
        return {
            "authenticated": True,
            "agent": {"id": agent.get("id"), "name": agent.get("name"),
                      "issuedAt": agent.get("createdAt"), "expiresAt": agent.get("expiresAt")},
            "site": {"siteId": profile["identity"]["siteId"], "siteUrl": profile["identity"]["siteUrl"],
                     "profileVersion": profile["profileVersion"]},
            "scope": {"types": allowed, "grants": grants},
            "fieldGroups": FIELD_GROUPS,
            "lockedPaths": [l["path"] for l in profile.get("lockedPaths", [])],
            "quota": {"openDrafts": open_now,
                      "openDraftCap": int(agent.get("openDraftCap") or DEFAULT_AGENT_DRAFT_CAP)},
            "agentsPaused": bool(profile.get("operations", {}).get("agentsPaused")),
            "canPublish": False,
            "readNext": ["/cms/agent/profile", "/cms/agent/schema"],
            "thenTry": ["POST /cms/agent/drafts/validate  (dry run, stores nothing)"],
        }

    @r.post("/agent/drafts/validate")
    async def agent_validate_draft(payload: AgentDraft, agent: dict = Depends(require_agent)):
        """Dry run. Same checks as creating a draft, nothing stored. This is
        what an agent runs during onboarding to prove the contract end to
        end before it is trusted with a real job."""
        profile = await get_profile()
        ok, why = agent_may(profile, "create", payload.type, token=agent)
        refused_fields = fields_refused(profile, agent, payload.type, payload.model_dump())
        checks = [
            {"name": "type in token scope", "ok": payload.type in agent.get("allowedTypes", [])},
            {"name": "type agent-draftable", "ok": PAGE_TYPES.get(payload.type, {}).get("agentDraftable", True)},
            {"name": "profile permits create", "ok": ok, "detail": why},
            {"name": "every field written is within the grant", "ok": not refused_fields,
             "detail": ("outside grant: " + ", ".join(refused_fields)) if refused_fields else ""},
        ]
        try:
            validate_fields(payload.type, payload.fields)
            checks.append({"name": "fields match template", "ok": True})
        except HTTPException as e:
            checks.append({"name": "fields match template", "ok": False, "detail": str(e.detail)})
        page = {"type": payload.type, "slug": slugify(payload.slug or payload.title),
                "title": payload.title, "seo": payload.seo.model_dump(),
                "blocks": [b.model_dump() for b in payload.blocks],
                "provenance": {"author": "agent", "sources": [s.model_dump() for s in payload.sources]}}
        g = await get_globals()
        gates = run_gates(page, resolve_seo(page, g))
        passed = all(c["ok"] for c in checks) and gates["passed"]
        return {"dryRun": True, "stored": False, "wouldBeAccepted": passed,
                "checks": checks, "gates": gates}

    @r.post("/agent/revisions")
    async def agent_propose_revision(payload: AgentRevision, agent: dict = Depends(require_agent)):
        """Propose a change to an EXISTING page. Creates a draft linked to
        the original; the original is untouched until a human approves the
        revision. This is the only way an agent affects published content,
        and it goes through the same queue as a new draft."""
        original = await db.cms_pages.find_one({"id": payload.pageId, "status": "published"}, {"_id": 0})
        if not original:
            raise HTTPException(404, "no published page with that id")
        if original["type"] not in agent.get("allowedTypes", []):
            why = f"agent not allowed to touch type {original['type']}"
            await log_event(actor_of_agent(agent), "revision.create", "refused",
                            {"pageId": original["id"], "type": original["type"]}, detail=why)
            raise HTTPException(403, why)
        profile = await get_profile()
        route = PAGE_TYPES[original["type"]]["route"].split("{")[0].rstrip("/")
        path = f"{route}/{original['slug']}"
        tgt = {"pageId": original["id"], "type": original["type"], "slug": original["slug"], "path": path}
        ok, why = agent_may(profile, "update", original["type"], path, token=agent)
        if not ok:
            await log_event(actor_of_agent(agent), "revision.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        stray = fields_refused(profile, agent, original["type"], payload.model_dump(), op="update")
        if stray:
            why = f"agent may not write {stray} on {original['type']}; grant covers " \
                  f"{effective_permissions(profile, agent)[original['type']]['fields']}"
            await log_event(actor_of_agent(agent), "revision.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        validate_fields(original["type"], payload.fields or {})
        await enforce_draft_cap(agent)
        rev = {
            "id": secrets.token_hex(8),
            "revisionOf": original["id"],
            "type": original["type"], "slug": original["slug"],
            "title": payload.title or original["title"],
            "status": "draft",
            "seo": {**original.get("seo", {}), **{k: v for k, v in payload.seo.model_dump().items() if v is not None}},
            "blocks": [b.model_dump() for b in payload.blocks] if payload.blocks else original.get("blocks", []),
            "fields": {**original.get("fields", {}), **(payload.fields or {})},
            "internalLinks": original.get("internalLinks", []),
            "provenance": {
                "author": "agent", "agentId": agent.get("id"), "agentName": agent.get("name"),
                "model": payload.model, "humanOversight": "none",
                "sources": [s.model_dump() for s in payload.sources],
                "changeSummary": payload.changeSummary,
            },
            "createdAt": now_iso(), "updatedAt": now_iso(),
        }
        await db.cms_pages.insert_one(dict(rev))
        rev.pop("_id", None)
        await log_event(actor_of_agent(agent), "revision.create", "ok",
                        {**tgt, "revisionId": rev["id"]}, detail=payload.changeSummary)
        g = await get_globals()
        return {**rev, "gates": run_gates(rev, resolve_seo(rev, g))}

    @r.post("/agent/drafts")
    async def agent_create_draft(payload: AgentDraft, agent: dict = Depends(require_agent)):
        # Scope refusals are logged like every other refusal. An agent that
        # keeps probing types it was never granted is the clearest signal
        # that it is misconfigured or not the agent you think it is, and
        # that signal is worthless if it leaves no trace.
        tgt = {"type": payload.type, "slug": slugify(payload.slug or payload.title)}
        if payload.type not in agent.get("allowedTypes", []):
            why = f"agent not allowed to draft type {payload.type}"
            await log_event(actor_of_agent(agent), "draft.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        if not PAGE_TYPES.get(payload.type, {}).get("agentDraftable", True):
            why = f"{payload.type} pages are owner-created; agents cannot draft them"
            await log_event(actor_of_agent(agent), "draft.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        profile = await get_profile()
        ok, why = agent_may(profile, "create", payload.type, token=agent)
        if not ok:
            await log_event(actor_of_agent(agent), "draft.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        stray = fields_refused(profile, agent, payload.type, payload.model_dump())
        if stray:
            why = f"agent may not write {stray} on {payload.type}"
            await log_event(actor_of_agent(agent), "draft.create", "refused", tgt, detail=why)
            raise HTTPException(403, why)
        validate_fields(payload.type, payload.fields)
        await enforce_draft_cap(agent)
        page = {
            "id": secrets.token_hex(8),
            "type": payload.type,
            "slug": slugify(payload.slug or payload.title),
            "title": payload.title,
            "status": "draft",
            "seo": payload.seo.model_dump(),
            "blocks": [b.model_dump() for b in payload.blocks],
            "fields": payload.fields,
            "internalLinks": [],
            "provenance": {
                "author": "agent",
                "agentId": agent.get("id"),
                "agentName": agent.get("name"),
                "model": payload.model,
                "humanOversight": "none",
                "sources": [s.model_dump() for s in payload.sources],
            },
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        await db.cms_pages.insert_one(dict(page))
        page.pop("_id", None)
        await log_event(actor_of_agent(agent), "draft.create", "ok",
                        {**tgt, "pageId": page["id"]}, detail=payload.title)
        g = await get_globals()
        return {**page, "gates": run_gates(page, resolve_seo(page, g))}

    @r.post("/agent/drafts/{page_id}/sources")
    async def agent_add_source(page_id: str, src: SourceRef, agent: dict = Depends(require_agent)):
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page or page.get("provenance", {}).get("agentId") != agent.get("id"):
            raise HTTPException(404, "not your draft")
        if page.get("status") != "draft":
            raise HTTPException(409, "draft is no longer editable")
        await db.cms_pages.update_one({"id": page_id},
                                      {"$push": {"provenance.sources": src.model_dump()},
                                       "$set": {"updatedAt": now_iso()}})
        return {"ok": True}

    @r.post("/agent/drafts/{page_id}/gates")
    async def agent_run_gates(page_id: str, agent: dict = Depends(require_agent)):
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page or page.get("provenance", {}).get("agentId") != agent.get("id"):
            raise HTTPException(404, "not your draft")
        g = await get_globals()
        return run_gates(page, resolve_seo(page, g))

    @r.post("/agent/drafts/{page_id}/submit")
    async def agent_submit(page_id: str, agent: dict = Depends(require_agent)):
        """The furthest an agent can go: ask a human to look."""
        page = await db.cms_pages.find_one({"id": page_id}, {"_id": 0})
        if not page or page.get("provenance", {}).get("agentId") != agent.get("id"):
            raise HTTPException(404, "not your draft")
        g = await get_globals()
        result = run_gates(page, resolve_seo(page, g))
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "in_review", "submittedAt": now_iso(),
            "provenance.gateResults": result,
        }})
        await log_event(actor_of_agent(agent), "draft.submit", "ok",
                        {"pageId": page_id, "type": page["type"], "slug": page["slug"]},
                        detail="gates " + ("pass" if result["passed"] else "fail: " + ", ".join(result["failed"])))
        return {"ok": True, "status": "in_review", "gates": result,
                "note": "A human must approve. Agents cannot publish."}

    return r
