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
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

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


class Block(BaseModel):
    kind: str
    text: Optional[str] = None
    items: Optional[List[str]] = None
    title: Optional[str] = None
    url: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class Seo(BaseModel):
    """Page level only. Empty fields fall back to type, then globals."""
    seoTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    canonical: Optional[str] = None
    robots: Optional[str] = None
    ogImage: Optional[str] = None
    primaryKeyword: Optional[str] = None
    schemaOverride: Optional[str] = None


class InternalLink(BaseModel):
    toSlug: str
    anchorText: str
    relation: str = "related"


class SourceRef(BaseModel):
    url: str
    quote: Optional[str] = None
    fetchedAt: Optional[str] = None
    httpStatus: Optional[int] = None


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
    status: Status = "draft"
    seo: Seo = Field(default_factory=Seo)
    blocks: List[Block] = Field(default_factory=list)
    fields: Dict[str, Any] = Field(default_factory=dict)
    internalLinks: List[InternalLink] = Field(default_factory=list)
    provenance: Provenance = Field(default_factory=Provenance)


class PagePatch(BaseModel):
    """Every field optional, and only the fields actually sent are written.

    PageUpsert is a full document, so using it for PUT meant a caller who
    saved just the SEO tab reset blocks to [] and provenance to empty,
    destroying an agent's sources. A partial patch cannot do that.
    """
    type: Optional[str] = None
    slug: Optional[str] = None
    title: Optional[str] = None
    status: Optional[Status] = None
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


# ---------------------------------------------------------------- #
#  Helpers
# ---------------------------------------------------------------- #

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


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

    async def require_agent(request: Request) -> Dict[str, Any]:
        """Agent tokens are separate from admin sessions and can only draft."""
        token = request.headers.get("x-agent-token", "")
        if not token:
            raise HTTPException(status_code=401, detail="Missing X-Agent-Token")
        digest = hashlib.sha256(token.encode()).hexdigest()
        rec = await db.cms_agent_tokens.find_one({"tokenHash": digest, "active": True}, {"_id": 0})
        if not rec:
            raise HTTPException(status_code=401, detail="Unknown or revoked agent token")
        return rec

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
    async def write_globals(payload: Dict[str, Any], _: dict = Depends(get_current_admin)):
        payload["updatedAt"] = now_iso()
        await db.cms_globals.update_one({"_id": "globals"}, {"$set": payload}, upsert=True)
        return await get_globals()

    # ---------------- pages ----------------

    @r.get("/pages")
    async def list_pages(type: Optional[str] = None, status: Optional[str] = None,
                         q: Optional[str] = None, _: dict = Depends(get_current_admin)):
        query: Dict[str, Any] = {}
        if type:
            query["type"] = type
        if status:
            query["status"] = status
        if q:
            query["$or"] = [{"title": {"$regex": q, "$options": "i"}},
                            {"slug": {"$regex": q, "$options": "i"}}]
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

        if "slug" in incoming:
            incoming["slug"] = slugify(incoming["slug"])
            # slugs are frozen once published: changing one silently breaks links
            if existing.get("status") == "published" and incoming["slug"] != existing["slug"]:
                raise HTTPException(400, "slug is frozen after publish; add a redirect instead")

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
             "status": "published", "id": {"$ne": page_id}},
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
            raise HTTPException(422, {"detail": "gates failed", "failed": result["failed"]})
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "published",
            "publishedAt": now_iso(),
            "approvedBy": user.get("email"),
            "provenance.gateResults": result,
            "provenance.humanOversight": "reviewed",
        }})
        return {"ok": True, "status": "published", "gates": result}

    @r.post("/pages/{page_id}/reject")
    async def reject(page_id: str, payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        await db.cms_pages.update_one({"id": page_id}, {"$set": {
            "status": "draft",
            "reviewNotes": payload.get("notes", ""),
            "reviewedBy": user.get("email"),
            "reviewedAt": now_iso(),
        }})
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
        return {"ok": True, "status": "archived"}

    # ---------------- agent tokens (admin issues them) ----------------

    @r.get("/agent-tokens")
    async def list_tokens(_: dict = Depends(get_current_admin)):
        return await db.cms_agent_tokens.find({}, {"_id": 0, "tokenHash": 0}).to_list(100)

    @r.post("/agent-tokens")
    async def create_token(payload: Dict[str, Any], user: dict = Depends(get_current_admin)):
        raw = "omni_" + secrets.token_urlsafe(24)
        rec = {
            "id": secrets.token_hex(6),
            "name": payload.get("name", "unnamed agent"),
            "tokenHash": hashlib.sha256(raw.encode()).hexdigest(),
            "allowedTypes": payload.get("allowedTypes", list(PAGE_TYPES.keys())),
            "active": True,
            "createdAt": now_iso(),
            "createdBy": user.get("email"),
        }
        await db.cms_agent_tokens.insert_one(dict(rec))
        rec.pop("_id", None)
        rec.pop("tokenHash", None)
        # shown once, never stored in the clear
        return {**rec, "token": raw}

    @r.post("/agent-tokens/{token_id}/revoke")
    async def revoke_token(token_id: str, _: dict = Depends(get_current_admin)):
        await db.cms_agent_tokens.update_one({"id": token_id}, {"$set": {"active": False}})
        return {"ok": True}

    # ---------------- AGENT SURFACE: draft only, no publish ----------------

    @r.get("/agent/schema")
    async def agent_schema(agent: dict = Depends(require_agent)):
        """What an agent reads before writing. The schema is the contract."""
        allowed = agent.get("allowedTypes", [])
        return {
            "agent": agent.get("name"),
            "allowedTypes": allowed,
            "types": {k: v for k, v in PAGE_TYPES.items() if k in allowed},
            "blockKinds": BLOCK_KINDS,
            "rules": [
                "You may create and update drafts only. There is no publish endpoint.",
                "Every factual claim needs a source with a URL and a fetched timestamp.",
                "No em dashes in copy.",
                "SEO title must be 60 characters or fewer.",
                "Meta description must be between 140 and 160 characters.",
                "Slugs are lowercase, hyphenated, and frozen after publication.",
            ],
        }

    @r.post("/agent/drafts")
    async def agent_create_draft(payload: AgentDraft, agent: dict = Depends(require_agent)):
        if payload.type not in agent.get("allowedTypes", []):
            raise HTTPException(403, f"agent not allowed to draft type {payload.type}")
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
        return {"ok": True, "status": "in_review", "gates": result,
                "note": "A human must approve. Agents cannot publish."}

    return r
