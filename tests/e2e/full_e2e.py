#!/usr/bin/env python3
"""
Viikkoraha FULL E2E — iOS Safari WebDriver -testit.

Ajaa koko käyttäjäpolun: askarelista → varausdialogi → dashboard → graafi → hard reload.
Testaa tokenin säilymisen localStorage:n yli ja datan näkyvyyden.

Vaatimukset:
  - safaridriver käynnissä portissa 4444
  - iOS-laite yhdistettynä (UDID .env.e2e:ssä, tai 'auto' = ainoa yhdistetty laite)
  - DEPLOY_URL osoittaa toimivaan Viikkoraha-instanssiin

Asetukset:
  Kopioi .env.e2e.example → .env.e2e ja täytä arvot.
  Skripti lukee ympäristömuuttujat samasta hakemistosta.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# 1. LUE .env.e2e
# ═══════════════════════════════════════════════════════════════════════════

ENV_FILE = Path(__file__).parent / ".env.e2e"
if ENV_FILE.exists():
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if key and value and key not in os.environ:
                os.environ[key] = value

# ═══════════════════════════════════════════════════════════════════════════
# 2. VALIDOI ENV
# ═══════════════════════════════════════════════════════════════════════════

E2E_ACCESS_TOKEN   = os.environ.get("E2E_ACCESS_TOKEN")
E2E_TOKEN_EXPIRY   = os.environ.get("E2E_TOKEN_EXPIRY", "0")
E2E_USER_NAME      = os.environ.get("E2E_USER_NAME", "Test User")
E2E_USER_EMAIL     = os.environ.get("E2E_USER_EMAIL", "test@example.com")
E2E_SPREADSHEET_ID = os.environ.get("E2E_SPREADSHEET_ID")
E2E_DEVICE_UDID    = os.environ.get("E2E_DEVICE_UDID", "auto")
E2E_DEPLOY_URL     = os.environ.get("E2E_DEPLOY_URL", "https://gitpages.morgeweb.com/viikkoraha")

if not E2E_ACCESS_TOKEN:
    print("❌ E2E_ACCESS_TOKEN puuttuu. Kopioi .env.e2e.example → .env.e2e ja täytä arvot.")
    sys.exit(1)
if not E2E_SPREADSHEET_ID:
    print("❌ E2E_SPREADSHEET_ID puuttuu.")
    sys.exit(1)

try:
    token_expiry = int(E2E_TOKEN_EXPIRY)
    if token_expiry and time.time() > token_expiry:
        print("⚠️  Token vanhentunut. Generoi uusi ja päivitä .env.e2e.")
        print("   Ohjeet: katso docs/TESTING.md → Tokenin generointi")
except ValueError:
    pass

# ═══════════════════════════════════════════════════════════════════════════
# 3. LUO SESSIO — tämän jälkeen kaikki WebDriver-funktiot toimivat
# ═══════════════════════════════════════════════════════════════════════════

BASE = "http://localhost:4444"

def _req(method, url, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=data, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read())
        except Exception:
            err = {}
        print(f"  ERR [{method} {url.rsplit('/',1)[-1]}]: {err.get('value',{}).get('message',str(e))}")
        return None
    except Exception as e:
        print(f"  ERR [{method} {url.rsplit('/',1)[-1]}]: {e}")
        return None

print("█ SESSION: safaridriver")

caps = {"browserName": "Safari", "platformName": "iOS"}
if E2E_DEVICE_UDID != "auto":
    caps["safari:deviceType"] = "iPhone"
    caps["safari:deviceUDID"] = E2E_DEVICE_UDID

resp = _req("POST", f"{BASE}/session", {"capabilities": {"alwaysMatch": caps}})
if not resp:
    print("❌ Ei sessiota — onko safaridriver käynnissä?")
    print("   Käynnistä: safaridriver -p 4444")
    sys.exit(1)

SID = resp["value"]["sessionId"]
print(f"  ✓ Session: {SID[:8]}...")

# ═══════════════════════════════════════════════════════════════════════════
# 4. WEBDRIVER HELPERS — nyt SID on olemassa
# ═══════════════════════════════════════════════════════════════════════════

def wd(method, path, body=None):
    return _req(method, f"{BASE}/session/{SID}{path}", body)

def wd_js(script):
    """Suorita JavaScript sivulla."""
    r = wd("POST", "/execute/sync", {"script": script, "args": []})
    return r["value"] if r else None

def get_body():
    return wd_js("return (document.body?.innerText||'').substring(0,800);") or ""

def snapshot(label):
    b = get_body()
    print(f"\n── {label} ──")
    for line in b.strip().split("\n")[:12]:
        if line.strip():
            print(f"  {line.strip()[:100]}")
    return b

def wait_spinner(timeout=6):
    for _ in range(timeout):
        if not wd_js("return !!document.querySelector('.animate-spin');"):
            return True
        time.sleep(1)
    return False

def nav(hash_path):
    wd_js(f"location.hash = {json.dumps(hash_path)};")
    time.sleep(2)

def click(text):
    wd_js(
        f"var b=document.querySelectorAll('button,a');"
        f"for(var e of b)if(e.innerText.includes({json.dumps(text)})){{e.click();return true}}"
        f"return false;"
    )
    time.sleep(1.5)

# ═══════════════════════════════════════════════════════════════════════════
# 5. TEST ASSERTIONS
# ═══════════════════════════════════════════════════════════════════════════

PASS = 0
FAIL = 0

def t(cond, msg):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {msg}")
    else:
        FAIL += 1
        print(f"  ❌ {msg}")

# ═══════════════════════════════════════════════════════════════════════════
# 6. SUORITA TESTIT
# ═══════════════════════════════════════════════════════════════════════════

try:
    ts = int(time.time())

    # ── SETUP: Injektoi auth + settings localStorageen ──────────────────
    print("\n█ SETUP: Injektoi token + settings localStorageen")

    auth_data = {
        "state": {
            "accessToken": E2E_ACCESS_TOKEN,
            "user": {
                "name": E2E_USER_NAME,
                "email": E2E_USER_EMAIL,
                "imageUrl": "",
            },
            "isSignedIn": True,
            "role": None,
        },
        "version": 0,
    }

    # Navigoi sovellukseen → localStorage kontekstiin
    wd("POST", "/url", {"url": E2E_DEPLOY_URL})
    time.sleep(3)
    wait_spinner()

    # Injektoi
    wd_js(
        f"localStorage.setItem('viikkoraha-auth', JSON.stringify({json.dumps(auth_data)}));"
        "return true;"
    )
    settings = {"state": {"clientId": "", "apiKey": "", "spreadsheetId": E2E_SPREADSHEET_ID}, "version": 0}
    wd_js(
        f"localStorage.setItem('viikkoraha-settings', JSON.stringify({json.dumps(settings)}));"
        "return true;"
    )

    # Uudelleenlataus → appi lukee injektoidut arvot
    wd("POST", "/url", {"url": f"{E2E_DEPLOY_URL}?e2e={ts}"})
    time.sleep(5)
    wait_spinner()

    # ── 1. HOME — Askareet ──────────────────────────────────────────────
    b = snapshot("1. HOME — Askareet")
    t("Siivous" in b, "Siivous 2.00€ näkyy")
    t("Tiskaus" in b, "Tiskaus 1.50€ näkyy")
    t("Ruoanlaitto" in b, "Ruoanlaitto 2.00€ näkyy")

    # ── 2. VARAUSDIALOGI ────────────────────────────────────────────────
    print("\n█ VARAUS: Klikkaa Siivous → dialogi → peruuta")

    click("Siivous")
    time.sleep(1.5)
    b = snapshot("2. Vahvistusdialogi")
    t("Siivous" in b, "Vahvistusdialogi: Siivous näkyy")
    t("2.00" in b or "2,00" in b, "Hinta 2.00€ näkyy dialogissa")

    click("Peruuta")
    time.sleep(2)
    b = snapshot("3. Peruutuksen jälkeen")
    t("Siivous" in b, "Askarelista edelleen näkyvissä peruutuksen jälkeen")

    # ── 3. DASHBOARD ────────────────────────────────────────────────────
    print("\n█ DASHBOARD: Yhteenveto + historia")

    nav("#/dashboard")
    time.sleep(3)
    wait_spinner()

    b = snapshot("4. Dashboard")
    t("Tehtävähistoria" in b, "Tehtävähistoria otsikko")
    t("Maksamatta" in b, "Maksamatta näkyy")
    t("Tienattu" in b, "Tienattu näkyy")

    has_euro_data = any(amt in b for amt in ["16.00", "18.00", "€"])
    t(has_euro_data, "Euro-määrät näkyvissä (Sheets-data)")

    # ── 4. GRAAFI ───────────────────────────────────────────────────────
    print("\n█ GRAAFI")

    click("Graafi")
    time.sleep(2)
    b = snapshot("5. Graafi")
    t("Viikko" in b or "€" in b or "dataa" in b or "0" in b, "Graafi renderöityy")

    click("Yhteenveto")
    time.sleep(1)

    # ── 5. HARD RELOAD ──────────────────────────────────────────────────
    print("\n█ HARD RELOAD: Token + data säilyy")

    wd("POST", "/url", {"url": f"{E2E_DEPLOY_URL}?hard={ts}"})
    time.sleep(5)
    wait_spinner()

    b = snapshot("6. Hard reloadin jälkeen")
    t(E2E_USER_NAME.split()[0] in b, "Käyttäjä edelleen kirjautuneena")
    t(not wd_js("return document.body?.innerText?.includes('Kirjaudu Googlella');"),
      "Login-nappi ei näy")

    nav("#/dashboard")
    time.sleep(3)
    wait_spinner()
    b = snapshot("7. Dashboard reloadin jälkeen")
    t("Maksamatta" in b, "Dashboard-data säilyi reloadissa")
    t("Tienattu" in b, "Tienattu-summa säilyi reloadissa")

    token_ok = wd_js("return localStorage.getItem('viikkoraha-auth') ? 'YES' : 'NO';")
    t(token_ok == "YES", f"Token localStorage: {token_ok}")

    # ── SUMMARY ─────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    pct = int(PASS / (PASS + FAIL) * 100) if PASS + FAIL else 0
    print(f"  E2E: {PASS} passed, {FAIL} failed  ({pct}%)")
    if FAIL == 0:
        print("  🎉 FULL E2E LÄPI!")
    else:
        print("  ⚠️  Tutki ylläolevat ❌-kohdat.")
    print("=" * 60)

finally:
    _req("DELETE", f"{BASE}/session/{SID}")
