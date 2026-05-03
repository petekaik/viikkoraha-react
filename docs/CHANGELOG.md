# Viikkoraha — Changelog

Muoto perustuu [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):n versiointiin.

---

## [Unreleased] — 2026-05-02

### Added
- **Käyttäjähallinta** — `UsersManagerView` + `useUsers`-hook (#10)
  - Lisää/poista perheenjäseniä (email, nimi, rooli)
  - Parent/child-roolitus — admin-navigaatio vain parent-käyttäjille
  - Rooli haetaan automaattisesti Users-sheetistä kirjautuessa
  - `Users`-välilehti sheetissä, automaattinen luonti
- **Askareiden hallinta** — `ChoreManagerView` (#9)
  - Lisää, muokkaa, poista askareita
  - ID, kuvaus, arvo (€), näyttönimi
  - Vain parent-roolille
- **Viikkograafi** — `WeeklyChart`-komponentti (#8)
  - Recharts-pylväsdiagrammi: tehdyt askareet per viikko
  - Dashboardin Graafi-välilehti
- **E2E-testausinfra** — `tests/e2e/full_e2e.py` (#7)
  - iOS Safari WebDriver, 16 testiä
  - Token-injektio localStorageen — ohittaa GAPI:n testiajossa
  - `.env.e2e`-pohjainen secretien hallinta (gitignored)
  - Kattava `docs/TESTING.md`
- **Display name -käsittely** — `displayName.js`, `parseNumber.js`
  - Suomi-lokaalin pilkkudesimaalit (0,5 = 0.5)
  - Google-profiilin nimiformaatit (tyhjä name → email fallback)

### Changed
- **Sheets-schema:** `USERS_RANGE`, `USERS_HEADERS` lisätty
- **authStore:** `role`-kenttä persistoidaan localStorageen
- **AppShell:** Admin-navigaatio (⚙️ → käyttäjät/askareet)

### Fixed
- **Spinner-ongelma:** `_hydrated`-mekanismi poistettu, storage-adapteri serialisoi JSONin itse
- **Service Worker:** Korjattu ja palautettu käyttöön (#11)
  - index.html haetaan aina network-first — ei enää iOS-cache-ongelmaa
  - JS/CSS-assetit stale-while-revalidate
  - ETag-pollaus 5 min välein, UPDATE_AVAILABLE-viesti
- **localStorage:** `"[object Object]"` -bugi korjattu — storage-adapteri stringifyaa itse
- **Bookings-rakenne:** Lisätty UserEmail (sarake J) — mahdollistaa käyttäjäkohtaisen seurannan

---

## [1.0.0] — 2026-04-10 (MVP-julkaisu)

### Added
- Google-kirjautuminen (OAuth 2.0 implicit flow, GIS)
- Askareiden selaus ja varaus (yksi napautus)
- Vahvistusdialogi peruutusmahdollisuudella
- Automaattinen Google Sheets -synkronointi
  - `Chores`-välilehti: askareet ID:n, kuvauksen, arvon ja näyttönimen kera
  - `Bookings`-välilehti: aikaleima, viikkonumero, käyttäjänimi, status
  - `Sums`-välilehti: SUMIF-kaavat avoimille ja maksetuille summille
- Dashboard: avoimet summat, tehtyjen töiden historia, maksukuittaus
- Uuden sheetin luonti: generoi valmiin Viikkoraha-taulukon
- Sheetin valinta alasvetovalikosta (Drive API -haku)
- PWA-tuki: kotivalikkoasennus, splash screenit, faviconit
- Tumma teema (Tailwind CSS 4)
- Responsiivisuus: iPhone → iPad
- Yksikkö- ja komponenttitestit (Vitest + Testing Library)
- Onboarding-flow uusille käyttäjille

### Tekninen pohja
- React 19, Vite 8, Zustand 5, Tailwind CSS 4, React Router 7
- Full client-side — ei backend-palvelinta
- Google Identity Services (GIS) tokeninhallintaan
- Google Sheets API v4 + Google Drive API v3

---

## Versionnin periaatteet

- **MAJOR.MINOR.PATCH** (SemVer)
- **MAJOR:** Breaking change (Sheets-rakenne, API-muutos)
- **MINOR:** Uusi ominaisuus, taaksepäin yhteensopiva
- **PATCH:** Bugikorjaus, tyylimuutos, dokumentaatio

---

**Viimeksi päivitetty:** 2026-05-02
