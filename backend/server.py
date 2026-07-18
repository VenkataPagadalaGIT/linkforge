"""
Mono Mind — FastAPI backend

Features:
- Contact + newsletter forms (public)
- Resend email notification on contact submission (graceful no-op if RESEND_API_KEY missing)
- JWT admin auth (Bearer + httpOnly cookie) + seeded admin user
- Protected admin endpoints for submissions + subscribers
- Content API: contributors, AI updates, insights (pillars + posts) served from MongoDB
- One-shot seed from /app/backend/seed_data/content.json when collections are empty
"""

from dotenv import load_dotenv
load_dotenv()  # must be first so env vars are available to the rest of the imports

import os
import json
import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional, Any

import bcrypt
import jwt as pyjwt
import resend
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


ROOT_DIR = Path(__file__).parent
SEED_DATA_PATH = ROOT_DIR / "seed_data" / "content.json"

# ----- Env & Mongo -----
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

JWT_SECRET = os.environ.get("JWT_SECRET", "change-me")
JWT_ALGO = "HS256"
ACCESS_TTL_MIN = 60 * 24  # 1 day — admin convenience
REFRESH_TTL_DAYS = 30

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@monomind.com").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "MonoMind2026!")

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
CONTACT_TO = os.environ.get("CONTACT_NOTIFICATION_EMAIL", "vdepagadala@gmail.com")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

logger = logging.getLogger("mono-mind")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# ----- App -----
app = FastAPI(title="Mono Mind API", version="1.1.0")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================ Models ================

class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    subject: Optional[str] = Field(default=None, max_length=300)
    message: str = Field(min_length=5, max_length=5000)
    source: Optional[str] = Field(default="contact_form", max_length=100)

    @field_validator("name", "message")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class ContactRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    subject: Optional[str] = None
    message: str
    source: Optional[str] = "contact_form"
    created_at: str


class NewsletterCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = Field(default="kit_signup", max_length=100)
    tag: Optional[str] = Field(default=None, max_length=100)


class NewsletterRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    source: Optional[str] = "kit_signup"
    tag: Optional[str] = None
    created_at: str


class OkResponse(BaseModel):
    ok: bool = True
    message: str
    id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    role: str = "admin"


class AdminUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    role: str = "admin"


class ConferenceNoteUpsert(BaseModel):
    # Increased from 20K → 60K to accommodate longer field-note formats
    # (3K+ word multi-image session notes from SEO Week 2026 onwards).
    note: Optional[str] = Field(default="", max_length=60000)
    takeaways: Optional[List[str]] = Field(default=None)
    status: Optional[str] = Field(default=None, max_length=40)  # attended | skipped | revisit | ""
    is_public: Optional[bool] = Field(default=None)

    @field_validator("note")
    @classmethod
    def _strip_note(cls, v: Optional[str]) -> str:
        return (v or "").strip()


class ConferenceNoteRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conference_slug: str
    session_id: str
    note: str = ""
    takeaways: List[str] = []
    status: str = ""
    is_public: bool = False
    updated_at: str


# ---- CMS: Post model with full SEO fields ----

class PostSeo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    metaTitle: Optional[str] = Field(default=None, max_length=160)
    metaDescription: Optional[str] = Field(default=None, max_length=320)
    h1: Optional[str] = Field(default=None, max_length=200)
    canonical: Optional[str] = Field(default=None, max_length=400)
    ogTitle: Optional[str] = Field(default=None, max_length=160)
    ogDescription: Optional[str] = Field(default=None, max_length=320)
    ogImage: Optional[str] = Field(default=None, max_length=800)
    twitterCard: Optional[str] = Field(default="summary_large_image", max_length=40)
    robotsIndex: bool = True
    robotsFollow: bool = True
    jsonLdType: Optional[str] = Field(default="Article", max_length=40)


class PostUpsert(BaseModel):
    """Admin payload to create or update a Post."""
    slug: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=300)
    pillarSlug: str = Field(min_length=1, max_length=200)
    excerpt: Optional[str] = Field(default="", max_length=1000)
    content: Optional[str] = Field(default="", max_length=200000)
    tags: Optional[List[str]] = Field(default_factory=list)
    date: Optional[str] = Field(default=None, max_length=40)  # ISO date
    coverImage: Optional[str] = Field(default=None, max_length=800)
    status: Optional[str] = Field(default="draft", max_length=20)  # draft | published | scheduled
    publishAt: Optional[str] = Field(default=None, max_length=40)
    seo: Optional[PostSeo] = None

    @field_validator("slug")
    @classmethod
    def _slug_format(cls, v: str) -> str:
        v = v.strip().lower()
        if not all(ch.isalnum() or ch in "-_" for ch in v):
            raise ValueError("slug must be lowercase alphanumeric with - or _")
        return v


class PostRecord(BaseModel):
    model_config = ConfigDict(extra="allow")
    slug: str
    title: str
    pillarSlug: str
    excerpt: str = ""
    content: str = ""
    tags: List[str] = []
    date: Optional[str] = None
    coverImage: Optional[str] = None
    status: str = "draft"
    publishAt: Optional[str] = None
    seo: Optional[dict] = None
    metaTitle: Optional[str] = None  # legacy mirror
    metaDescription: Optional[str] = None  # legacy mirror
    updatedAt: Optional[str] = None
    createdAt: Optional[str] = None


# ================ Helpers ================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "email": email,
        "role": "admin",
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.admin_users.find_one({"email": payload.get("email")}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ================ Public routes ================

@api.get("/")
async def root():
    return {"service": "mono-mind-api", "status": "ok", "version": app.version, "time": now_iso()}


@api.get("/health")
async def health():
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception as e:
        logger.error("Mongo ping failed: %s", e)
        mongo_ok = False
    return {"ok": True, "mongo": mongo_ok, "resend_configured": bool(RESEND_API_KEY), "time": now_iso()}


@api.get("/stats")
async def stats():
    return {
        "contact_submissions": await db.contact_submissions.count_documents({}),
        "newsletter_subscribers": await db.newsletter_subscribers.count_documents({}),
        "contributors": await db.contributors.count_documents({}),
        "updates": await db.ai_updates.count_documents({}),
        "pillars": await db.pillars.count_documents({}),
        "posts": await db.posts.count_documents({}),
    }


async def _send_contact_email(payload: ContactCreate, record_id: str) -> None:
    if not RESEND_API_KEY:
        logger.info("Resend disabled (no API key); skipping notification email")
        return
    subj = f"[Mono Mind] New contact: {payload.subject or payload.name}"
    html = f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#0a0a0a;color:#eaeaea">
      <h2 style="margin:0 0 16px;color:#fff">New contact submission</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#cfcfcf">
        <tr><td style="padding:6px 0;width:110px;color:#888">Name</td><td>{payload.name}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Email</td><td><a style="color:#9ad2ff" href="mailto:{payload.email}">{payload.email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#888">Subject</td><td>{payload.subject or '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">Source</td><td>{payload.source or '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#888">ID</td><td style="font-family:monospace;color:#888">{record_id}</td></tr>
      </table>
      <hr style="border:0;border-top:1px solid #222;margin:16px 0" />
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.6">{payload.message}</div>
    </div>
    """
    try:
        params = {"from": SENDER_EMAIL, "to": [CONTACT_TO], "subject": subj, "html": html, "reply_to": payload.email}
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Contact notification email sent to %s", CONTACT_TO)
    except Exception as e:
        logger.warning("Resend email failed: %s", e)


@api.post("/contact", response_model=OkResponse)
async def submit_contact(payload: ContactCreate, request: Request):
    doc = {
        "id": new_id(),
        "name": payload.name,
        "email": payload.email.lower(),
        "subject": payload.subject,
        "message": payload.message,
        "source": payload.source or "contact_form",
        "created_at": now_iso(),
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }
    await db.contact_submissions.insert_one(doc)
    asyncio.create_task(_send_contact_email(payload, doc["id"]))
    return OkResponse(ok=True, message="Thanks — we'll get back to you soon.", id=doc["id"])


@api.post("/newsletter", response_model=OkResponse)
async def subscribe_newsletter(payload: NewsletterCreate, request: Request):
    email = payload.email.lower()
    existing = await db.newsletter_subscribers.find_one({"email": email}, {"_id": 0, "id": 1})
    if existing:
        return OkResponse(ok=True, message="You're already subscribed.", id=existing.get("id"))
    doc = {
        "id": new_id(),
        "email": email,
        "source": payload.source or "kit_signup",
        "tag": payload.tag,
        "created_at": now_iso(),
        "ip": request.client.host if request.client else None,
    }
    try:
        await db.newsletter_subscribers.insert_one(doc)
    except Exception:
        existing = await db.newsletter_subscribers.find_one({"email": email}, {"_id": 0, "id": 1})
        return OkResponse(ok=True, message="You're already subscribed.", id=(existing or {}).get("id"))
    return OkResponse(ok=True, message="Subscribed — welcome to Mono Mind.", id=doc["id"])


# ================ Auth ================

@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower()
    user = await db.admin_users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TTL_MIN * 60,
        path="/",
    )
    return TokenResponse(access_token=token, email=email, role="admin")


@api.post("/auth/logout")
async def logout(response: Response, _: dict = Depends(get_current_admin)):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me", response_model=AdminUser)
async def me(user: dict = Depends(get_current_admin)):
    return AdminUser(email=user["email"], role=user.get("role", "admin"))


# ================ Admin — list submissions ================

@api.get("/admin/contact-submissions", response_model=List[ContactRecord])
async def admin_list_contacts(limit: int = 200, _: dict = Depends(get_current_admin)):
    limit = max(1, min(limit, 1000))
    cursor = (
        db.contact_submissions.find({}, {"_id": 0, "ip": 0, "user_agent": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [ContactRecord(**doc) async for doc in cursor]


@api.get("/admin/newsletter-subscribers", response_model=List[NewsletterRecord])
async def admin_list_subscribers(limit: int = 500, _: dict = Depends(get_current_admin)):
    limit = max(1, min(limit, 2000))
    cursor = (
        db.newsletter_subscribers.find({}, {"_id": 0, "ip": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [NewsletterRecord(**doc) async for doc in cursor]


@api.get("/admin/overview")
async def admin_overview(_: dict = Depends(get_current_admin)):
    return await stats()


# Keep previous public-list endpoints but make them require auth too
@api.get("/contact/submissions", response_model=List[ContactRecord])
async def list_contacts_protected(limit: int = 100, _: dict = Depends(get_current_admin)):
    return await admin_list_contacts(limit, _)


@api.get("/newsletter/subscribers", response_model=List[NewsletterRecord])
async def list_subs_protected(limit: int = 100, _: dict = Depends(get_current_admin)):
    return await admin_list_subscribers(limit, _)


# ================ Conference Notes (admin-protected) ================

@api.get("/notebook/notes/{conference_slug}", response_model=List[ConferenceNoteRecord])
async def list_conference_notes(conference_slug: str, _: dict = Depends(get_current_admin)):
    cursor = db.conference_notes.find(
        {"conference_slug": conference_slug},
        {"_id": 0},
    ).limit(500)
    return [ConferenceNoteRecord(**doc) async for doc in cursor]


@api.put("/notebook/notes/{conference_slug}/{session_id}", response_model=ConferenceNoteRecord)
async def upsert_conference_note(
    conference_slug: str,
    session_id: str,
    payload: ConferenceNoteUpsert,
    _: dict = Depends(get_current_admin),
):
    existing = await db.conference_notes.find_one(
        {"conference_slug": conference_slug, "session_id": session_id},
        {"_id": 0},
    )
    doc = {
        "conference_slug": conference_slug,
        "session_id": session_id,
        "note": payload.note or "",
        "takeaways": payload.takeaways if payload.takeaways is not None else (existing or {}).get("takeaways", []),
        "status": (payload.status if payload.status is not None else (existing or {}).get("status", "")).strip(),
        "is_public": payload.is_public if payload.is_public is not None else bool((existing or {}).get("is_public", False)),
        "updated_at": now_iso(),
    }
    await db.conference_notes.update_one(
        {"conference_slug": conference_slug, "session_id": session_id},
        {"$set": doc},
        upsert=True,
    )
    return ConferenceNoteRecord(**doc)


@api.delete("/notebook/notes/{conference_slug}/{session_id}")
async def delete_conference_note(
    conference_slug: str,
    session_id: str,
    _: dict = Depends(get_current_admin),
):
    await db.conference_notes.delete_one(
        {"conference_slug": conference_slug, "session_id": session_id},
    )
    return {"ok": True}


# Public — returns only is_public=true notes for a conference (no auth required)
@api.get("/notebook/notes/public/{conference_slug}", response_model=List[ConferenceNoteRecord])
async def list_public_conference_notes(conference_slug: str):
    cursor = db.conference_notes.find(
        {"conference_slug": conference_slug, "is_public": True},
        {"_id": 0},
    ).limit(500)
    return [ConferenceNoteRecord(**doc) async for doc in cursor]


# ================ Content API (public) ================

def _strip_id(d: dict) -> dict:
    d.pop("_id", None)
    return d


@api.get("/content/contributors")
async def list_contributors(limit: int = 200, segment: Optional[str] = None, q: Optional[str] = None):
    query: dict = {}
    if segment:
        query["segment"] = segment
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"bio": {"$regex": q, "$options": "i"}},
            {"affiliation": {"$regex": q, "$options": "i"}},
        ]
    cursor = db.contributors.find(query, {"_id": 0}).sort("rank", 1).limit(max(1, min(limit, 500)))
    return [doc async for doc in cursor]


@api.get("/content/contributors/{contrib_id}")
async def get_contributor(contrib_id: str):
    doc = await db.contributors.find_one({"id": contrib_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Contributor not found")
    return doc


@api.get("/content/updates")
async def list_updates(limit: int = 50, category: Optional[str] = None):
    query: dict = {}
    if category:
        query["category"] = category
    cursor = db.ai_updates.find(query, {"_id": 0}).sort("date", -1).limit(max(1, min(limit, 200)))
    return [doc async for doc in cursor]


@api.get("/content/updates/{slug}")
async def get_update(slug: str):
    doc = await db.ai_updates.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Update not found")
    return doc


@api.get("/content/pillars")
async def list_pillars():
    cursor = db.pillars.find({}, {"_id": 0}).sort("title", 1).limit(200)
    return [doc async for doc in cursor]


@api.get("/content/pillars/{slug}")
async def get_pillar(slug: str):
    doc = await db.pillars.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Pillar not found")
    posts_cursor = db.posts.find({"pillarSlug": slug}, {"_id": 0, "content": 0}).sort("date", -1).limit(500)
    doc["posts"] = [p async for p in posts_cursor]
    return doc


@api.get("/content/posts")
async def list_posts(pillar: Optional[str] = None, limit: int = 200):
    query: dict = {"$or": [{"status": "published"}, {"status": {"$exists": False}}]}
    if pillar:
        query["pillarSlug"] = pillar
    cursor = db.posts.find(query, {"_id": 0}).sort("date", -1).limit(max(1, min(limit, 500)))
    return [doc async for doc in cursor]


@api.get("/content/posts/{slug}")
async def get_post(slug: str):
    doc = await db.posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    # Hide drafts/scheduled from public reads
    status = doc.get("status", "published")
    if status not in ("published", None) and status != "":
        raise HTTPException(status_code=404, detail="Post not found")
    return doc


# ============== CMS: Admin Post CRUD (auth required) ==============

@api.get("/admin/cms/posts", response_model=List[PostRecord])
async def admin_list_posts(_: dict = Depends(get_current_admin), pillar: Optional[str] = None, status: Optional[str] = None):
    query: dict = {}
    if pillar:
        query["pillarSlug"] = pillar
    if status:
        query["status"] = status
    cursor = db.posts.find(query, {"_id": 0}).sort([("updatedAt", -1), ("date", -1)]).limit(2000)
    return [PostRecord(**doc) async for doc in cursor]


@api.get("/admin/cms/posts/{slug}", response_model=PostRecord)
async def admin_get_post(slug: str, _: dict = Depends(get_current_admin)):
    doc = await db.posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostRecord(**doc)


@api.post("/admin/cms/posts", response_model=PostRecord)
async def admin_create_post(payload: PostUpsert, _: dict = Depends(get_current_admin)):
    existing = await db.posts.find_one({"slug": payload.slug}, {"_id": 0, "slug": 1})
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{payload.slug}' already exists")
    now = now_iso()
    doc = payload.model_dump(exclude_none=False)
    seo = doc.get("seo") or {}
    doc.update({
        "createdAt": now,
        "updatedAt": now,
        "date": doc.get("date") or now[:10],
        # legacy mirrors so existing public consumers keep working
        "metaTitle": (seo.get("metaTitle") if seo else None) or doc.get("title"),
        "metaDescription": (seo.get("metaDescription") if seo else None) or doc.get("excerpt") or "",
    })
    await db.posts.insert_one(dict(doc))
    return PostRecord(**doc)


@api.put("/admin/cms/posts/{slug}", response_model=PostRecord)
async def admin_update_post(slug: str, payload: PostUpsert, _: dict = Depends(get_current_admin)):
    existing = await db.posts.find_one({"slug": slug}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    if payload.slug != slug:
        clash = await db.posts.find_one({"slug": payload.slug}, {"_id": 0, "slug": 1})
        if clash:
            raise HTTPException(status_code=409, detail=f"Slug '{payload.slug}' already exists")
    doc = payload.model_dump(exclude_none=False)
    seo = doc.get("seo") or {}
    doc.update({
        "createdAt": existing.get("createdAt", now_iso()),
        "updatedAt": now_iso(),
        "date": doc.get("date") or existing.get("date") or now_iso()[:10],
        "metaTitle": (seo.get("metaTitle") if seo else None) or doc.get("title"),
        "metaDescription": (seo.get("metaDescription") if seo else None) or doc.get("excerpt") or "",
    })
    await db.posts.replace_one({"slug": slug}, dict(doc))
    return PostRecord(**doc)


@api.delete("/admin/cms/posts/{slug}")
async def admin_delete_post(slug: str, _: dict = Depends(get_current_admin)):
    res = await db.posts.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


@api.get("/admin/cms/pillars")
async def admin_list_pillars_for_picker(_: dict = Depends(get_current_admin)):
    """Lightweight pillar list for the post-editor pillar selector."""
    cursor = db.pillars.find({}, {"_id": 0, "slug": 1, "title": 1}).sort("title", 1).limit(500)
    return [d async for d in cursor]


@api.get("/content/sitemap")
async def content_sitemap():
    """Returns all slugs so the Next.js sitemap can include every detail page."""
    contribs = [d async for d in db.contributors.find({}, {"_id": 0, "id": 1}).limit(2000)]
    updates = [d async for d in db.ai_updates.find({}, {"_id": 0, "slug": 1, "date": 1}).limit(2000)]
    pillars = [d async for d in db.pillars.find({}, {"_id": 0, "slug": 1}).limit(500)]
    posts = [d async for d in db.posts.find({}, {"_id": 0, "slug": 1, "pillarSlug": 1, "date": 1}).limit(5000)]
    return {"contributors": contribs, "updates": updates, "pillars": pillars, "posts": posts}


# ================ Startup: seed content + admin + indexes ================

async def _seed_collection(
    coll_name: str,
    docs: list,
    unique_keys: tuple = ("id",),
    reconcile: bool = False,
) -> tuple:
    """Additive, idempotent seed. Runs on every boot; never deletes.

    - Inserts any seed doc whose unique key is absent.
    - When ``reconcile`` is set, an existing doc is also refreshed from the
      seed, but only if the seed's ``updated_at`` is newer than or equal to
      the stored one — so a later admin edit (which bumps ``updated_at``) is
      never clobbered by a stale seed. Docs without ``updated_at`` on either
      side are treated as insert-only.
    """
    coll = db[coll_name]
    if not docs:
        return (0, 0)
    inserted = updated = 0
    for d in docs:
        cleaned = {k: v for k, v in d.items() if k != "_id"}
        flt = {k: cleaned.get(k) for k in unique_keys}
        existing = await coll.find_one(flt)
        if existing is None:
            await coll.insert_one(cleaned)
            inserted += 1
        elif reconcile:
            seed_ts = str(cleaned.get("updated_at") or "")
            cur_ts = str(existing.get("updated_at") or "")
            if seed_ts and seed_ts >= cur_ts:
                same = all(existing.get(k) == v for k, v in cleaned.items())
                if not same:
                    await coll.update_one(flt, {"$set": cleaned})
                    updated += 1
    return (inserted, updated)


async def seed_content():
    if not SEED_DATA_PATH.exists():
        logger.warning("Seed data file not found: %s", SEED_DATA_PATH)
        return
    try:
        with open(SEED_DATA_PATH, "r") as f:
            data = json.load(f)
    except Exception as e:
        logger.error("Failed to read seed data: %s", e)
        return
    c = await _seed_collection("contributors", data.get("contributors", []))
    u = await _seed_collection("ai_updates", data.get("updates", []))
    p = await _seed_collection("pillars", data.get("pillars", []))
    po = await _seed_collection("posts", data.get("posts", []), unique_keys=("slug",))
    cn = await _seed_collection(
        "conference_notes",
        data.get("conference_notes", []),
        unique_keys=("session_id",),
        reconcile=True,
    )
    logger.info(
        "Seed complete — contributors:%s updates:%s pillars:%s posts:%s conference_notes:%s",
        c, u, p, po, cn,
    )


async def seed_admin():
    existing = await db.admin_users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.admin_users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info("Admin user seeded: %s", ADMIN_EMAIL)
    else:
        # Sync password from .env if it differs (dev convenience)
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.admin_users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
            )
            logger.info("Admin password updated from env")


@app.on_event("startup")
async def on_startup():
    try:
        # indexes
        await db.contact_submissions.create_index([("created_at", -1)])
        await db.newsletter_subscribers.create_index("email", unique=True)
        await db.newsletter_subscribers.create_index([("created_at", -1)])
        await db.admin_users.create_index("email", unique=True)
        await db.contributors.create_index("id", unique=True)
        await db.contributors.create_index("rank")
        await db.contributors.create_index("segment")
        await db.ai_updates.create_index("slug", unique=True)
        await db.ai_updates.create_index([("date", -1)])
        await db.pillars.create_index("slug", unique=True)
        await db.posts.create_index("slug", unique=True)
        await db.posts.create_index("pillarSlug")
        await db.conference_notes.create_index(
            [("conference_slug", 1), ("session_id", 1)], unique=True
        )
        logger.info("Indexes ensured.")
    except Exception as e:
        logger.warning("Index creation warn: %s", e)

    await seed_admin()
    await seed_content()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# Root-level health endpoint for the deployment platform (Kubernetes / Cloudflare).
# The platform polls /health (without /api prefix) on the backend pod.
@app.get("/health")
async def root_health():
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"ok": True, "mongo": mongo_ok, "time": now_iso()}


# Register router
app.include_router(api)
