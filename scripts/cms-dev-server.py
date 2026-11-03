#!/usr/bin/env python3
"""cms-dev-server.py: a local stand-in for the CMS backend.

Usage:
  python3 scripts/cms-dev-server.py            # serves on http://localhost:8787
  NEXT_PUBLIC_BACKEND_URL=http://localhost:8787 npm run dev

Why this exists: the admin UI talks to the production backend, whose admin
password lives in Railway. To LOOK at the CMS, size it, and develop against
it, you should not need production credentials at all, and production data
should never be at risk from a local experiment.

So this serves the same API shape the admin UI expects, in memory, seeded
with realistic rows. Any email and password are accepted, because nothing
here is real and nothing here can reach production.

It also doubles as the scaffold for the CMS in docs/CMS_PLAN.md: when the
real endpoints for updates, guides and concepts get built, they can be
prototyped here first.
"""
import json
import re
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

NOW = datetime.now(timezone.utc).isoformat()

PILLARS = [
    {"slug": "ai-systems", "title": "AI Systems"},
    {"slug": "search", "title": "Search and SEO"},
    {"slug": "notebooks", "title": "Notebooks"},
]

POSTS = [
    {
        "slug": "why-model-routers-matter",
        "title": "Why Model Routers Matter",
        "pillarSlug": "ai-systems",
        "metaTitle": "Why Model Routers Matter (2026)",
        "metaDescription": "What a routing layer does, why it is suddenly worth billions, and how to reason about lock-in when every model is one API call away.",
        "excerpt": "A routing layer is a meter. Meters get bought.",
        "body": "<p>Draft body. Edit me in the CMS to see the editor round-trip.</p>",
        "tags": ["AI", "infrastructure"],
        "status": "published",
        "date": "2026-08-16",
        "updatedAt": NOW,
    },
    {
        "slug": "what-agents-actually-buy",
        "title": "What AI Agents Actually Buy",
        "pillarSlug": "ai-systems",
        "metaTitle": "What AI Agents Actually Buy",
        "metaDescription": "Agentic commerce is mostly agents buying inference. That single fact reorders who owns the payment rail for machine work.",
        "excerpt": "Follow the tokens, not the checkout button.",
        "body": "<p>Draft body.</p>",
        "tags": ["agents", "payments"],
        "status": "draft",
        "date": "2026-08-17",
        "updatedAt": NOW,
    },
]


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"  {self.command} {self.path}")

    def _send(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # the Next dev server is a different origin
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if not n:
            return {}
        try:
            return json.loads(self.rfile.read(n))
        except Exception:
            return {}

    def do_OPTIONS(self):
        self._send(204, {})

    def do_GET(self):
        p = self.path.split("?")[0]
        if p == "/api/auth/me":
            return self._send(200, {"email": "local-dev@example.com", "role": "admin"})
        if p == "/api/admin/cms/pillars" or p == "/api/content/pillars":
            return self._send(200, PILLARS)
        if p == "/api/admin/cms/posts" or p == "/api/content/posts":
            return self._send(200, POSTS)
        m = re.match(r"^/api/(?:admin/cms|content)/posts/([^/]+)$", p)
        if m:
            for post in POSTS:
                if post["slug"] == m.group(1):
                    return self._send(200, post)
            return self._send(404, {"detail": "not found"})
        if p == "/api/admin/overview":
            return self._send(200, {
                "posts": len(POSTS),
                "published": sum(1 for x in POSTS if x["status"] == "published"),
                "drafts": sum(1 for x in POSTS if x["status"] != "published"),
                "contactSubmissions": 3,
                "newsletterSubscribers": 42,
            })
        if p in ("/api/admin/contact-submissions", "/api/admin/newsletter-subscribers"):
            return self._send(200, [])
        if p == "/api/health":
            return self._send(200, {"status": "ok", "mode": "LOCAL DEV MOCK"})
        return self._send(404, {"detail": f"no mock route for {p}"})

    def do_POST(self):
        p = self.path.split("?")[0]
        if p == "/api/auth/login":
            # Local only. Any credentials work; this token is meaningless
            # anywhere else and the server holds no real data.
            return self._send(200, {"access_token": "local-dev-token", "token_type": "bearer"})
        if p == "/api/auth/logout":
            return self._send(200, {"ok": True})
        if p == "/api/admin/cms/posts":
            post = self._body()
            post.setdefault("status", "draft")
            post["updatedAt"] = datetime.now(timezone.utc).isoformat()
            POSTS.append(post)
            return self._send(201, post)
        return self._send(404, {"detail": f"no mock route for {p}"})

    def do_PUT(self):
        m = re.match(r"^/api/admin/cms/posts/([^/]+)$", self.path.split("?")[0])
        if m:
            incoming = self._body()
            for i, post in enumerate(POSTS):
                if post["slug"] == m.group(1):
                    POSTS[i] = {**post, **incoming,
                                "updatedAt": datetime.now(timezone.utc).isoformat()}
                    return self._send(200, POSTS[i])
            return self._send(404, {"detail": "not found"})
        return self._send(404, {"detail": "no mock route"})

    def do_DELETE(self):
        m = re.match(r"^/api/admin/cms/posts/([^/]+)$", self.path.split("?")[0])
        if m:
            before = len(POSTS)
            POSTS[:] = [x for x in POSTS if x["slug"] != m.group(1)]
            return self._send(200, {"deleted": before - len(POSTS)})
        return self._send(404, {"detail": "no mock route"})


if __name__ == "__main__":
    port = 8787
    print(f"CMS dev mock on http://localhost:{port}")
    print("  any email and password will sign you in")
    print("  data is in memory: restart to reset")
    print("  NOTHING here touches production\n")
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
