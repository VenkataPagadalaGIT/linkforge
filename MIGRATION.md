# Mono Mind — Migrating off Emergent → Railway

Goal: own the full stack (no Emergent platform lock-in). Move the live site —
Next.js frontend + FastAPI backend + MongoDB — to Railway, with your own
database and your own deploy pipeline.

This runbook is written so it can be executed top-to-bottom. Anything that
requires a human (account creation, secrets, DNS) is called out under
**Owner action**. Everything else is pre-built in this repo.

---

## 0. Current architecture (what we're moving)

| Component | Today (Emergent) | After (Railway) |
|---|---|---|
| Frontend | Next.js 14, K8s pod, `start-prod.js` | Railway service, root `frontend/` |
| Backend | FastAPI (`server:app`), uvicorn | Railway service, root `backend/` |
| Database | Emergent shared Atlas (`customer-apps`, IP-allowlisted) | Railway MongoDB service (yours) |
| Deploy | Emergent auto-commits → image build | Railway git-push deploys |
| DNS/TLS | Cloudflare → Emergent | Cloudflare → Railway |

The lock-in is the **database**: Emergent's Atlas only accepts its own infra,
so data must be exported through an Emergent-allowlisted path (already done for
content — see §3).

---

## 1. What's already prepared in this repo (no action needed)

- `frontend/railway.json` — Nixpacks build; start `next start -p $PORT` (bypasses
  the Emergent `start-prod.js` K8s wrapper).
- `backend/railway.json` — Nixpacks build; start `uvicorn server:app --port $PORT`.
- `backend/.python-version` — pins Python 3.11.
- `frontend/.env.example`, `backend/.env.example` — full env contracts.
- `scripts/migrate/import_backup_to_mongo.py` — loads the content backup into the
  new Mongo (dry-run verified: 159 docs).

> The Emergent `next.config.mjs` memory limits are intentionally **kept** — they
> prevent OOM during SSG of 336 pages and are harmless on Railway.

---

## 2. Provision Railway (Owner action)

In a Railway **project**, create three services from this GitHub repo + a DB:

1. **MongoDB** → New → Database → **MongoDB**. Note its connection URL
   (Connect tab). Prefer the private URL (`...railway.internal:27017`) for the
   backend; the public proxy URL is for the one-off import.
2. **backend** service → Deploy from repo, **Root Directory = `backend`**.
3. **frontend** service → Deploy from repo, **Root Directory = `frontend`**.

Set service variables (from the `.env.example` files):

**backend**
| Var | Value |
|---|---|
| `MONGO_URL` | Railway Mongo **private** URL |
| `DB_NAME` | `monomind` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your choice (strong) |
| `RESEND_API_KEY` | your Resend key (optional) |
| `SENDER_EMAIL`, `CONTACT_NOTIFICATION_EMAIL` | your addresses |
| `CORS_ORIGINS` | `https://venkatapagadala.com,https://www.venkatapagadala.com` |

**frontend**
| Var | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://venkatapagadala.com` |
| `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` | the backend service public URL |
| `NPM_CONFIG_LEGACY_PEER_DEPS` | `true` (required — eslint peer conflict) |

Deploy both. Confirm backend `GET /api/health` returns `{"ok":true,"mongo":true}`.

---

## 3. Load the data

Content (159 docs: contributors, posts w/ bodies, pillars, ai_updates, all 25
conference_notes) is committed in this repo as a point-in-time snapshot at
`scripts/migrate/seed_backup/` (also mirrored locally at
`~/Desktop/monomind_backup_<timestamp>/`).

Run the importer against the new Mongo. Use the **public** Mongo proxy URL for
this external run (or `railway run` from the backend service):

```bash
export BACKUP_DIR=scripts/migrate/seed_backup   # committed snapshot
export MONGO_URL="<railway mongo PUBLIC url>"
export DB_NAME="monomind"
python3 scripts/migrate/import_backup_to_mongo.py --dry-run   # preview
python3 scripts/migrate/import_backup_to_mongo.py --wipe      # load
```

The backend reseeds `admin_users` from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first
boot, so no admin import needed.

**Leads** (`contact_submissions`, `newsletter_subscribers`) are admin-gated and
grow over time — export them from Emergent **right before DNS cutover** (§5) so
they're freshest, via the admin API with a Bearer token or the Mongo Viewer.

---

## 4. Verify on Railway URLs (before touching DNS)

On the frontend's `*.up.railway.app` URL, confirm:

- [ ] Home, About, Insights (pillars + a post), AI Contributors, AI Updates,
      Solutions render
- [ ] Notebook → Conference (SEO Week 2026 + sessions + speakers) renders
- [ ] `/guides/graph-types-for-ai-agents` renders (figures in dark **and** light)
- [ ] Dark/light toggle works site-wide
- [ ] Contact form submits (backend reachable, CORS ok)
- [ ] `/admin` login works with your new creds
- [ ] `/sitemap.xml`, `/robots.txt`, `/llms.txt` serve

---

## 5. Cut over DNS (Owner action)

1. Add the domain to the Railway **frontend** service (Settings → Networking →
   Custom Domain → `venkatapagadala.com` + `www`). Railway shows the CNAME/target.
2. In **Cloudflare**, lower the record TTL first (e.g. 5 min), wait, then point
   the apex/`www` records at Railway's target. Keep proxying as desired.
3. Re-run the §4 checklist on the real domain.
4. **Leads:** export `contact_submissions` + `newsletter_subscribers` from
   Emergent now and import into Railway Mongo (extend the importer or insert
   directly) so nothing collected in the gap is lost.

---

## 6. Decommission Emergent

Only after the domain is green on Railway for ~24–48h:

- [ ] Promote this code to a clean `main` (the live branch is currently the
      oddly-named `conflict_280426_1122`); make Railway deploy from `main`.
- [ ] Stop/disconnect the Emergent project and its auto-commit pipeline.
- [ ] Cancel Emergent.

---

## 7. Rollback

DNS is the switch. If anything regresses post-cutover, repoint Cloudflare back
to Emergent (low TTL makes this fast). Railway and Emergent run in parallel
until step 6, so rollback is non-destructive.

---

## Owner-only actions (the short list)

1. Create the Railway project + 3 services (§2) and set the env vars.
2. Provide the Mongo **public** URL once, so the content import can run (§3).
3. Provide a Resend API key (optional) and choose admin creds.
4. Do the Cloudflare DNS cutover (§5).

Everything else (configs, importer, content backup, build verification) is done.
