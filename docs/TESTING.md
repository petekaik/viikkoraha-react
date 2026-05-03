# Viikkoraha — Testausdokumentaatio

## Testausstrategia

Viikkoraha käyttää **kolmea testaustasoa**:

| Taso | Teknologia | Laajuus | Komento |
|------|-----------|---------|---------|
| **Yksikkö- ja komponenttitestit** | Vitest + Testing Library | Storet, hookit, komponentit, utilit | `npm test` |
| **E2E — iOS Safari WebDriver** | Python + safaridriver | Koko käyttäjäpolku oikealla iPhonella | `tests/e2e/full_e2e.py` |

---

## 1. Yksikkö- ja komponenttitestit (`npm test`)

### Suoritus

```bash
npm test               # Kertasuoritus
npm run test:watch     # Watch-moodi
```

### Testien rakenne

Testit sijaitsevat `src/__tests__/`-hakemistossa. Kukin testitiedosto kattaa yhden moduulin:

```
src/__tests__/
├── authStore.test.js        # Auth (login/logout, token-persistenssi)
├── settingsStore.test.js    # Settings (CRUD, localStorage, validointi)
├── choresStore.test.js      # Chores (haku, varaus, peruutus)
├── sheets-schema.test.js    # Sheets-rakenne ja validointi
├── validation.test.js       # Syötteiden validointi
├── AppShell.test.jsx        # Navigaatio, header
├── ChoreList.test.jsx       # Askarelistan renderöinti
├── ChoreButton.test.jsx     # Yksittäinen askarepainike
├── ConfirmDialog.test.jsx   # Vahvistusdialogi
├── LoginPrompt.test.jsx     # Kirjautumiskehote
├── HomeView.test.jsx        # Kotinäkymä
└── DashboardView.test.jsx   # Dashboard-näkymä
```

### Testikonfiguraatio

- **Runner:** Vitest 4 (`vite.config.js`)
- **Ympäristö:** `jsdom` (selain-API-emulointi)
- **Setup:** `src/test-setup.js` — mockaa `localStorage`, Google API:t, `window.google.accounts`
- **Mockit:** Google Identity Services (`useGoogleAuth`), Google Sheets API (`gapi.client.sheets`)

### Tunnettuja mock-rajoituksia

- **GIS-tokenin generointi:** OAuth 2.0 implicit flow'ta ei ajeta testeissä — token injektoidaan suoraan `authStore`-tilaan
- **Sheets API -kutsut:** Mockattu palauttamaan ennalta määriteltyä testidataa
- **localStorage:** `jsdom` tarjoaa synkronisen localStorage API:n — sama kuin WebKit/Safari

---

## 2. E2E — iOS Safari WebDriver

Ajetaan **oikealla iPhonella** safaridriverin kautta. Testaa koko käyttäjäpolun:

```
Askarelista → Varausdialogi → Peruutus → Dashboard → Graafi → Hard reload → Tokenin säilyminen
```

### Vaatimukset

- **macOS** (safaridriver vaatii)
- **iOS-laite** yhdistettynä USB:llä, Safari Web Inspector päällä
- **safaridriver** käynnissä
- **Python 3.9+** (vain stdlib, ei riippuvuuksia)

### Asennus ja konfiguraatio

#### 1. Aktivoi Safari Web Inspector iPhonella

```
iPhone: Asetukset → Safari → Lisäasetukset → Web Inspector = PÄÄLLÄ
```

#### 2. Ota safaridriver käyttöön macOS:llä

```bash
# Kertaluonteinen aktivointi
safaridriver --enable

# Tarkista tila
safaridriver --status
```

#### 3. Käynnistä safaridriver

```bash
# Pidä tämä ajossa erillisessä terminaalissa
safaridriver -p 4444
```

Portti 4444 on vapaasti valittavissa.

#### 4. Hae laitteen UDID (valinnainen)

```bash
system_profiler SPUSBDataType | grep -A 20 iPhone | grep "Serial Number"
```

Jos sinulla on vain yksi iPhone yhdistettynä, jätä `E2E_DEVICE_UDID=auto` — safaridriver löytää sen automaattisesti.

#### 5. Luo .env.e2e

```bash
cd tests/e2e
cp .env.e2e.example .env.e2e
```

Täytä `.env.e2e`:

```bash
# Google OAuth 2.0 access token (ks. alla "Tokenin generointi")
E2E_ACCESS_TOKEN=ya29.a0AfH6SMC...

# Google Sheets Spreadsheet ID
E2E_SPREADSHEET_ID=1F2ktM2YggQX2lOzIJmPR2yZiVnLsLmvkvAx38J-iFv0

# iOS-laitteen UDID (tai 'auto')
E2E_DEVICE_UDID=00008130-0016786A368A001C

# Deploy-URL
E2E_DEPLOY_URL=https://gitpages.morgeweb.com/viikkoraha
```

### Tokenin generointi E2E-testeihin

E2E-testit käyttävät oikeaa Google OAuth 2.0 -access tokenia — tämä on **ainoa** testiympäristön salaisuus, ja se vanhenee 1 tunnin kuluttua.

#### Tapa 1: Generoi Google OAuth 2.0 Playgroundilla (suositeltu)

1. Avaa [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. ⚙️ → **Use your own OAuth credentials** → syötä Client ID ja Client Secret
3. Valitse **Google Sheets API v4** (scopet: `https://www.googleapis.com/auth/spreadsheets`)
4. Klikkaa **Authorize APIs** → kirjaudu Google-tilillä
5. Klikkaa **Exchange authorization code for tokens**
6. Kopioi **Access token** → liitä `.env.e2e`:n `E2E_ACCESS_TOKEN`-kenttään

> Token vanhenee 1 tunnissa. Päivitä `.env.e2e` tarvittaessa.

#### Tapa 2: Poimi token selaimen DevToolsista

1. Avaa Viikkoraha selaimessa ja kirjaudu sisään
2. Avaa DevTools → Application → Local Storage → `viikkoraha-auth`
3. Kopioi `accessToken`-kentän arvo
4. Liitä `.env.e2e`:n `E2E_ACCESS_TOKEN`-kenttään

#### Tapa 3: Generoi gcloud CLI:llä

```bash
gcloud auth print-access-token
```

> Vaatii gcloud CLI:n asennettuna ja konfiguroituna samalle Google Cloud -projektille.

### Ajaminen

```bash
# Varmista ensin: safaridriver -p 4444 on ajossa

python3 tests/e2e/full_e2e.py
```

### Mitä testataan

| # | Testi | Mitä varmistetaan |
|---|-------|-------------------|
| 1 | **Askarelista** | Siivous, Tiskaus, Ruoanlaitto näkyvät hinnoilla |
| 2 | **Varausdialogi** | Dialogi avautuu, askare ja hinta näkyvät |
| 3 | **Peruutus** | Peruuta-napista askarelista palautuu |
| 4 | **Dashboard** | Tehtävähistoria, Maksamatta, Tienattu näkyvät |
| 5 | **Graafi** | Graafi-välilehti renderöityy |
| 6 | **Hard reload** | Käyttäjä pysyy kirjautuneena, login-nappia ei näy |
| 7 | **Dashboard reloadin yli** | Maksamatta- ja Tienattu-summat säilyvät |
| 8 | **Token localStorage** | `viikkoraha-auth` on tallessa |

### Vianmääritys

| Ongelma | Todennäköinen syy | Ratkaisu |
|---------|-------------------|----------|
| `❌ Ei sessiota` | safaridriver ei käynnissä | `safaridriver -p 4444` |
| `❌ E2E_ACCESS_TOKEN puuttuu` | .env.e2e puuttuu tai tyhjä | `cp .env.e2e.example .env.e2e` + täytä |
| `⚠️ Token vanhentunut` | Token yli 1 h vanha | Generoi uusi token (ks. yllä) |
| `ERR: A device is required` | iPhone ei yhdistetty tai Web Inspector ei päällä | Tarkista USB + Asetukset → Safari → Web Inspector |
| `ERR: Could not create session` | Väärä UDID tai useita laitteita | Tarkista `system_profiler SPUSBDataType`, aseta oikea UDID |
| Spinner jää ikuisesti | GAPI ei lataudu WebDriverissa | Normaalia — testi ohittaa GAPI:n token-injektiolla |

---

## 3. Manuaalinen testaus

E2E-automaation lisäksi nämä manuaaliset testit suositellaan ajettavaksi ennen julkaisua:

### Toiminnalliset

- [ ] **Kirjautuminen:** Google-tilillä sisään → nimi näkyy headerissa
- [ ] **Askareen varaus:** Siivous → vahvista → näkyy Sheetsin Bookings-välilehdellä
- [ ] **Tuplavarauksen esto:** Sama askare kahdesti → virheilmoitus
- [ ] **Dashboard-summat:** Maksamatta ja Tienattu vastaavat Sheetsin Sums-välilehteä
- [ ] **Maksukuittaus:** Hyväksy maksu → Status vaihtuu "Maksettu"
- [ ] **Sheetin luonti:** Luo uusi → uusi taulukko Google Driveen, kaikki välilehdet olemassa
- [ ] **Sheetin vaihto:** Valitse toinen sheet alasvetovalikosta → data päivittyy

### PWA (iOS)

- [ ] **Asennus:** Lisää kotivalikkoon → avautuu omassa ikkunassa (ei Safari-osoiteriviä)
- [ ] **Splash screen:** Avattaessa näkyy splash screen oikealla resoluutiolla
- [ ] **Kuvake:** Kotivalikossa näkyy Viikkoraha-ikoni

### Responsiivisuus

- [ ] iPhone SE (375×667) → kaikki elementit näkyvät, ei vaakasuuntaista scrollia
- [ ] iPhone 15 Pro Max (430×932) → dashboard-graafi skaalautuu
- [ ] iPad (1024×768+) → kaksipalstainen asettelu toimii

---

## 4. Testien lisääminen

### Uusi yksikkötesti

```bash
# Luo tiedosto src/__tests__/<nimi>.test.js(x)
# Noudata olemassa olevien testien rakennetta:
# - describe('<Komponentti>') → ryhmittely
# - it('tekee X') → testitapaus
# - beforeEach → yhteinen setup
```

### Uusi E2E-testi

Lisää `full_e2e.py`-skriptin loppuun oma testiosionsa:

```python
# ── N. UUSI TESTI ────────────────────────────────────────
print("\n█ UUSI OMINAISUUS")

click("Uusi nappi")
time.sleep(1.5)
b = snapshot("N. Uuden napin tulos")
t("Odotettu teksti" in b, "Uusi ominaisuus toimii")
```

---

## Tunnetut rajoitukset

| Rajoitus | Vaikutus | Kiertotapa |
|----------|----------|------------|
| **GAPI ei toimi WebDriverissa** | Varausta ei voi oikeasti tehdä E2E:ssä | Testaa vain UI-flown, ei Sheets-persistenssiä |
| **Token vanhenee 1 h** | .env.e2e täytyy päivittää | Käytä OAuth Playgroundia nopeaan regenerointiin |
| **Vain yksi iPhone kerrallaan** | Ei rinnakkaisia E2E-ajoja | `E2E_DEVICE_UDID` valitsee laitteen |
| **safaridriver vaatii macOS:n** | Ei toimi Linux/Windows CI:ssä | Aja E2E:t paikallisesti ennen julkaisua |

---

## CI/CD (tulevaisuus)

Tavoitetila: GitHub Actions workflow, joka ajaa `npm test` jokaisessa PR:ssä. E2E-testit pysyvät manuaalisina iOS-laiteriippuvuuden vuoksi.

```yaml
# Tuleva .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
```
