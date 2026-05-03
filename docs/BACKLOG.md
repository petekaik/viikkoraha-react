# Viikkoraha — Backlog

Prioriteettitasot: 🔴 Korkea · 🟡 Keski · 🟢 Matala · ✨ Idea

---

## 🔴 Korkea prioriteetti

### ✅ SW takaisin käyttöön (cache-busting) — VALMIS
**Toteutettu:** 2026-05-02  
SW v6: index.html network-first (ei cachea), ETag-pollaus 5 min, UPDATE_AVAILABLE-viesti.

---

### ✅ Käyttäjäkohtainen varaus (UserEmail bookingsiin) — VALMIS
**Toteutettu:** 2026-05-02  
Bookings-sheetin sarake J sisältää nyt `UserEmail`. `appendBooking()` kirjoittaa kirjautuneen käyttäjän sähköpostin automaattisesti. ConfirmDialog näyttää kirjautuneen käyttäjän nimen ja sähköpostin.

---

## 🟡 Keski prioriteetti

### CI/CD-pipeline (GitHub Actions)
**Branch:** ei vielä  
**Arvio:** 3 h  
- `npm test` jokaisessa PR:ssä
- Build + deploy `main`-branchista GitHub Pagesiin
- `docs/TESTING.md`:ssä on valmis YAML-pohja

### Maksukuittauksen UI-parannukset
**Branch:** ei vielä  
**Arvio:** 2 h  
Dashboardin HistoryListissä "Hyväksy maksu" -nappi toimii, mutta:
- Ei massa-hyväksyntää (checkbox + "Hyväksy valitut")
- Ei suodatusta viikoittain
- Ei mobiilioptimointia (pitkä lista vaatii scrollia)

### Google Sheets quota -suojaus
**Branch:** ei vielä  
**Arvio:** 1.5 h  
Google Sheets API: 60 req/min per projekti. Nyt riski render-loopissa (useEffect triggeröi fetchin). Tarvitaan:
- Throttle/debounce hook
- Request coalescing (sama fetch ei mene kahteen kertaan)
- Virheenkäsittely 429:lle (exponential backoff)

---

## 🟢 Matala prioriteetti

### Monikielisyys (i18n)
**Branch:** ei vielä  
**Arvio:** 3 h  
- `react-i18next` tai oma key-value -ratkaisu
- Kielet: fi (default), en, sv
- UI-tekstit + sheets-skeemat lokalisoitavaksi

### Offline-tuki
**Branch:** ei vielä  
**Arvio:** 5 h  
Vaatii backend-proxyn Sheets API:lle (esim. Cloudflare Worker). Ilman proxyä offline = ei dataa, koska GAPI vaatii elävän tokenin.

### Analytics (GDPR-safe)
**Branch:** ei vielä  
**Arvio:** 1 h  
Plausible tai vastaava privacy-first-analytiikka. Haluaako Pomo tietää montako perhettä käyttää sovellusta?

---

## ✨ Ideat / myöhemmin harkittavat

- **Palkkiojärjestelmä:** Bonukset hyvästä suorituksesta, sakot myöhästymisestä
- **Perhekohtaiset teemat:** Jokainen perhe voi valita värinsä
- **Viikkoraportti PDF:nä:** "Viikkoraportti" → generoi PDF nykyisestä viikosta (tulostusta varten)
- **Push-notifikaatiot:** "Uusi askare varattu", "Maksu hyväksytty" — vaatisi backend-palvelimen
- **Äänikomennot:** "Hei Siri, kirjaa tiskaus" — Siri Shortcuts -integraatio iOS:llä
- **Jaetut askareet:** Sama askare voidaan varata useamman henkilön toimesta (esim. yhdessä tehtävä)

---

## Valmiit / commitoimattomat (seuraava release)

| Ominaisuus | Branch | Status |
|------------|--------|--------|
| Askareiden hallinta (CRUD) | `feat/chore-manager` | ✅ Valmis, commitoimatta |
| Viikkograafi (Recharts) | `feat/weekly-chart` | ✅ Valmis, commitoimatta |
| Käyttäjähallinta (API + UI) | `feat/user-management` | 🔨 Tehty |
| E2E-testausinfra (iOS) | `feat/e2e-tests` | ✅ Valmis, commitoimatta |
| SettingsPanel-parannukset | feat/settings | ✅ Valmis, commitoimatta |

---

## Definition of Done

Kukin backlog-item on **valmis** kun:
1. ✅ Koodi on kirjoitettu ja katselmoitu
2. ✅ Yksikkö-/komponenttitestit menevät läpi (`npm test`)
3. ✅ E2E-testit menevät läpi (jos UI-muutos)
4. ✅ Dokumentaatio päivitetty (CHANGELOG, BACKLOG)
5. ✅ Branch on mergetty `main`:iin
6. ✅ Deploy GitHub Pagesiin onnistunut

---

**Viimeksi päivitetty:** 2026-05-02
