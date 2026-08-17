"""Drive every CMS screen the way the owner would, in both themes.

The API suites (cms-security-tests.py, cms-gate-tests.py) prove the rules.
This proves the owner can actually reach them: that a confirmation survives
the reload that follows it, that a refusal explains itself, that the skip
link is the first tab stop, and that colour is never the only carrier of a
verdict.

Usage:  python3 scripts/cms-ui-journey.py
Needs the backend on 8090 and the CMS UI on 3402 (launch configs "backend"
and "cms-review"). Screenshots land in the scratch directory.

Three of these checks were wrong before they were right, and each mistake
is worth remembering:
  - a name-based locator followed the button label when it flipped to
    "Hide detail", and silently asserted against the next card
  - the CMS nav is a <ul><li> too, so li.first was a nav item
  - inner_text returns text as rendered, and these headings are uppercased
    by CSS, so a case-sensitive match failed on markup that was correct
A test that fails for its own reasons costs more than no test at all.
"""
import json, os, urllib.request
from playwright.sync_api import sync_playwright

API, UI = "http://localhost:8090/api", "http://localhost:3402"
OUT = "/private/tmp/claude-501/-Users-venkatapagadala-Desktop-mono-mind-seo/2713f848-cdfc-4823-838a-09457208a695/scratchpad/cms"
os.makedirs(OUT, exist_ok=True)
fails = []

def check(label, ok, detail=""):
    print(f"  {'ok  ' if ok else 'FAIL'} {label}{f'  ({detail})' if detail else ''}")
    if not ok: fails.append(label)

req = urllib.request.Request(API + "/auth/login",
    data=json.dumps({"email": "admin@monomind.com", "password": "LocalReview2026!"}).encode(),
    headers={"Content-Type": "application/json"})
token = json.loads(urllib.request.urlopen(req).read())["access_token"]

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for scheme in ("dark", "light"):
        print(f"\n=== {scheme} theme ===")
        ctx = b.new_context(color_scheme=scheme, viewport={"width": 1440, "height": 1100})
        ctx.add_init_script(f"localStorage.setItem('mm_admin_token', {json.dumps(token)})")
        p = ctx.new_page()
        errs = []
        p.on("response", lambda r: errs.append(f"HTTP {r.status} {r.url}") if r.status >= 400 else None)
        p.on("console", lambda m: errs.append(f"CONSOLE {m.text}") if m.type == "error" else None)

        # ---- Dashboard ----
        p.goto(UI + "/admin", wait_until="networkidle"); p.wait_for_timeout(900)
        check("dashboard h1", p.locator("h1").first.inner_text() == "Dashboard")
        check("dashboard links to the review queue", p.locator('a[href="/admin/cms/review"]').count() > 0)

        # ---- Pages: default view hides archived ----
        p.goto(UI + "/admin/cms/pages", wait_until="networkidle"); p.wait_for_timeout(900)
        default_rows = p.locator("tbody tr").count()
        body = p.locator("tbody").inner_text()
        check("archived rows are hidden by default", "ARCHIVED" not in body.upper(), f"{default_rows} rows")

        p.select_option("#filter-status", "archived"); p.wait_for_timeout(1000)
        arch_rows = p.locator("tbody tr").count()
        check("archived is reachable on demand", arch_rows > 0, f"{arch_rows} rows")
        p.select_option("#filter-status", ""); p.wait_for_timeout(900)

        # ---- Pages: search ----
        p.fill("#filter-q", "openai"); p.wait_for_timeout(1100)
        hits = p.locator("tbody tr").count()
        check("search narrows the list", 0 < hits <= default_rows, f"{hits} of {default_rows}")
        p.fill("#filter-q", "a("); p.wait_for_timeout(1100)
        check("a regex metacharacter does not break the screen",
              "Could not load" not in p.locator('[role="status"]').inner_text())
        p.fill("#filter-q", ""); p.wait_for_timeout(900)

        # ---- Pages: create a draft ----
        title = f"UI journey draft {scheme}"
        p.fill("#new-title", title)
        p.get_by_role("button", name="Create draft").click(); p.wait_for_timeout(1400)
        check("the draft confirmation survives the reload",
              "Draft created" in p.locator('[role="status"]').inner_text(),
              p.locator('[role="status"]').inner_text())
        check("the new draft appears in the list", title in p.locator("tbody").inner_text())
        p.screenshot(path=f"{OUT}/j-pages-{scheme}.png", full_page=True)

        # ---- Review queue ----
        p.goto(UI + "/admin/cms/review", wait_until="networkidle"); p.wait_for_timeout(900)
        n = p.locator("li > div.p-5").count()
        check("review queue lists drafts", n > 0, f"{n} items")
        card = p.locator("#cms-main li").first
        toggle = card.locator('button[aria-expanded]').first
        check("detail is collapsed by default", toggle.get_attribute("aria-expanded") == "false")
        toggle.click(); p.wait_for_timeout(700)
        # Re-read from the same card: the label flips to "Hide detail", so a
        # name-based locator would silently jump to the next card's button.
        check("detail expands",
              card.locator('button[aria-expanded]').first.get_attribute("aria-expanded") == "true")
        detail = card.inner_text().lower()
        for want in ["content", "sources", "resolved seo", "gates"]:
            check(f"detail shows {want}", want in detail)
        check("gate verdicts are words, not only colour",
              "pass" in detail and ("fail" in detail or "gates pass" in detail))
        check("the resolved SEO says where each value came from", "from page" in detail or "from globals" in detail)
        check("the reviewer sees the source URLs", "http" in detail)
        p.screenshot(path=f"{OUT}/j-review-{scheme}.png", full_page=True)

        # approving a failing draft must be refused, and say why. The 422 it
        # produces is the point of the test, so it does not count as an error.
        expected_422 = len(errs)
        p.get_by_role("button", name="Approve and publish").first.click(); p.wait_for_timeout(1600)
        msg = p.locator('[role="status"]').inner_text()
        check("a failing approve is refused with a reason", "Blocked by gates" in msg, msg[:90])
        deliberate = errs[expected_422:]
        check("the refusal is the only thing that errored",
              all("/approve" in e or "422" in e for e in deliberate), str(deliberate)[:120])
        del errs[expected_422:]

        # ---- Global SEO ----
        p.goto(UI + "/admin/cms/globals", wait_until="networkidle"); p.wait_for_timeout(900)
        desc = p.locator("#defaultMetaDescription")
        check("the description hint counts characters",
              "characters" in p.locator("#defaultMetaDescription-hint").inner_text())
        p.get_by_role("button", name="Save global settings").click(); p.wait_for_timeout(1400)
        check("saving globals is announced",
              "Saved" in p.locator('[role="status"]').inner_text(),
              p.locator('[role="status"]').inner_text())
        p.screenshot(path=f"{OUT}/j-globals-{scheme}.png", full_page=True)

        # ---- Agents ----
        p.goto(UI + "/admin/cms/agents", wait_until="networkidle"); p.wait_for_timeout(900)
        p.fill("#agent-name", f"UI journey agent {scheme}")
        p.get_by_role("button", name="Issue token").click(); p.wait_for_timeout(1400)
        shown = p.locator("code").first.inner_text()
        check("the raw token is shown once", shown.startswith("omni_"), shown[:14] + "...")
        check("issuing is announced", "Token issued" in p.locator('[role="status"]').inner_text())
        rev = p.get_by_role("button", name="Revoke").last
        rev.click(); p.wait_for_timeout(1400)
        check("revoking is announced", "revoked" in p.locator('[role="status"]').inner_text().lower(),
              p.locator('[role="status"]').inner_text())
        p.screenshot(path=f"{OUT}/j-agents-{scheme}.png", full_page=True)

        # ---- accessibility spot checks on every screen ----
        for path in ["/admin/cms/review", "/admin/cms/pages", "/admin/cms/globals", "/admin/cms/agents"]:
            p.goto(UI + path, wait_until="networkidle"); p.wait_for_timeout(700)
            check(f"{path}: exactly one h1", p.locator("h1").count() == 1)
            check(f"{path}: one aria-current",
                  p.locator('nav[aria-label="CMS sections"] a[aria-current="page"]').count() == 1)
            check(f"{path}: has a live region", p.locator('[role="status"][aria-live="polite"]').count() == 1)
            p.keyboard.press("Tab")
            first = p.evaluate("document.activeElement.textContent")
            check(f"{path}: first tab stop is the skip link", "Skip to content" in (first or ""), repr(first))

        check(f"{scheme}: no console errors or failed requests", len(errs) == 0,
              "; ".join(dict.fromkeys(errs))[:200])
        ctx.close()
    b.close()

# Retire what this run created. A test that leaves litter in the owner's
# list is a test that makes the product look worse every time it runs.
def _admin(method, path, body=None):
    req = urllib.request.Request(API + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    try:
        return json.loads(urllib.request.urlopen(req).read() or b"null")
    except Exception:
        return None

for row in (_admin("GET", "/cms/pages") or []):
    if row.get("title", "").startswith("UI journey draft"):
        _admin("POST", f"/cms/pages/{row['id']}/archive")
for tok in (_admin("GET", "/cms/agent-tokens") or []):
    if tok.get("name", "").startswith("UI journey agent") and tok.get("active"):
        _admin("POST", f"/cms/agent-tokens/{tok['id']}/revoke")

print()
if fails:
    print(f"{len(fails)} FAILED: " + ", ".join(fails))
    raise SystemExit(1)
print("Every screen behaved as specified in both themes.")
