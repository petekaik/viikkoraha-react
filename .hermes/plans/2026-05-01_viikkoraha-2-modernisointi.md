# Viikkoraha 2.0 — Modernisointisuunnitelma

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Huomautus:** Käytä suunnitelmaa referenssinä, ei kirjaimellisena tehtäväjonona — sovita toteutus käytettävään arkkitehtuuriin.

**Goal:** Rakentaa vanhasta jQuery Mobile -pohjaisesta Viikkoraha-sovelluksesta moderni, vapaasti jaeltava PWA, joka käyttää käyttäjän omaa Google Sheetsiä tietovarastona ja osaa luoda tarvittavat välilehdet automaattisesti.

**Architecture:** Client-only SPA (Vue 3 + Vite), Google Identity Services (GIS) OAuth2 implicit flow, Google Sheets API suoraan selaimesta. PWA service workerillä, offline-tuella ja alustakohtaisilla asennusikoneilla.

**Tech Stack:** Vue 3 (Composition API), Vite, Pinia (state), Vue Router, Google Identity Services (GIS token client), Tailwind CSS, Workbox (SW), Vitest + Cypress

**Supported platforms:** iOS Safari 15+, Android Chrome 90+, desktop Chrome/Firefox/Safari

---

## Nykytilan analyysi

### Toiminnallisuus
1. **Google OAuth2 -kirjautuminen** — vanha GAPI `gapi.client.init()` redirect-flow
2. **Askareiden listaus** — "Chores"-välilehdeltä (A2:D): id, kuvaus, arvo, näyttönimi
3. **Askareen kirjaus** — klikkaus → vahvistus → append "Bookings"-välilehdelle (aikaleima, id, kuvaus, arvo, viikkonro-kaava, käyttäjä, "pending")
4. **Dashboard** — yhteenveto "Sums"-välilehdeltä (avoimet €, tienattu yhteensä) + historialista "Bookings"-välilehdeltä
5. **Maksukuittaus** — pending → paid, summary päivittyy
6. **Ilmoitukset** — success/error toastit

### Ongelmat
| Ongelma | Vaikutus |
|---------|----------|
| API-avaimet kovakoodattu `configuration.js`:ssä | Ei jaettavissa, turvallisuusriski |
| jQuery Mobile 1.4.5 (deprekoitu 2016) | Ei toimi uusilla selaimilla luotettavasti |
| Vanha GAPI-kirjasto (`gapi.client`) | Google lopetti gapi.auth2:n tuen 2023 |
| Ei build-työkaluja | Kehitys hidasta, ei optimointia |
| Yksi kovakoodattu spreadsheet-ID | Vain yksi perhe käytössä |
| Splash screenit vain iPhone 6/7/X -malleille | Ei tue iPhone 12+ eikä Android-laitteita |
| Ei service workeriä | Ei offline-tukea, ei asennettavaa PWA:ta |
| Webmanifest puutteellinen | Puuttuu `maskable`-ikoni, `screenshots`, `categories` |
| Ei responsiivista gridiä | Skaalautuu huonosti tableteille |
| jQuery-riippuvuusketju raskas | 3 CDN-kirjastoa (jQuery + UI + Mobile) yhden sivun appiin |

---

## Tavoitteet

### MVP (Phase 1)
- [x] Google-kirjautuminen (GIS Identity Services)
- [x] Google Sheets API -luku/kirjoitus omalla tokenilla
- [x] Askareiden listaus, kirjaus, vahvistusdialogi
- [x] Dashboard: yhteenveto + historia + maksukuittaus
- [x] Responsiivinen UI (mobile-first, tablet-optimized)
- [x] PWA: asennettavuus, splash screen, ikonit (Apple + Android)
- [x] API-avainten input käyttäjältä (ei kovakoodattu)

### Phase 2
- [ ] Sheets-välilehtien automaattinen luonti (Chores, Bookings, Sums)
- [ ] Offline-tuki (service worker + IndexedDB)
- [ ] Taustasynkronointi (Background Sync API)
- [ ] Monen käyttäjän tuki samassa spreadsheetissä
- [ ] Perheen hallinta (kuka näkee/merkitsee mitä)

---

## Arkkitehtuurisuunnitelma

```
src/
├── main.js                 # App entry, PWA registration
├── App.vue                 # Root component
├── router/
│   └── index.js            # Vue Router (/, /dashboard)
├── stores/
│   ├── auth.js             # Pinia: auth state (token, user)
│   ├── chores.js           # Pinia: chores CRUD
│   └── settings.js         # Pinia: API key, spreadsheet ID
├── composables/
│   ├── useGoogleSheets.js  # Sheets API wrapper (read/write/append)
│   ├── useGoogleAuth.js    # GIS token client wrapper
│   └── useNotifications.js # Toast notification system
├── components/
│   ├── AppShell.vue        # Layout: header + nav + content
│   ├── ChoreButton.vue     # Single chore card with icon
│   ├── ChoreList.vue       # Grid of ChoreButtons
│   ├── ConfirmDialog.vue   # Confirmation modal
│   ├── DashboardSummary.vue # Pending/total amounts
│   ├── HistoryList.vue     # Scrollable history with approve
│   ├── LoginPrompt.vue     # GIS login button
│   ├── SettingsPanel.vue   # API key + spreadsheet ID
│   └── NotificationBar.vue # Toast notifications
├── views/
│   ├── HomeView.vue        # Chores list + confirm
│   ├── DashboardView.vue   # Summary + history
│   └── SettingsView.vue    # API key + spreadsheet config
├── utils/
│   ├── sheets-schema.js    # Column mappings, ranges
│   └── validation.js       # API key + spreadsheet ID validation
├── assets/
│   ├── icons/              # SVG chore icons (siivous, tiskaus, etc.)
│   └── pwa/                # PWA icons (192, 512, maskable)
└── public/
    ├── favicon.ico
    ├── apple-touch-icon.png
    ├── splash/             # Apple splash screens (modern devices)
    ├── manifest.json       # Extended web manifest
    └── sw.js               # Service worker (Workbox)
```

### Data Flow
```
User → GIS Login → Token → Pinia auth store
                         ↓
User → Settings Input → API Key + Spreadsheet ID → Pinia settings store
                         ↓
Sheets API calls ← composable(useGoogleSheets) ← token + key + sheetId
                         ↓
Chore list / Summary / History ← Pinia chores store → Vue components
                         ↓
User action (book/approve) → Sheets API append/update → re-fetch state
```

---

## Toteutussuunnitelma

### Phase 1: MVP

#### Task 1: Projektin scaffoldaus
```bash
npm create vite@latest viikkoraha-2 -- --template vue
cd viikkoraha-2
npm install vue-router@4 pinia tailwindcss @tailwindcss/vite
npm install -D vitest @vue/test-utils
```
- Vite + Vue 3 + Tailwind CSS + Pinia + Vue Router
- `.env.example`: `VITE_GOOGLE_CLIENT_ID=` (placeholder)

#### Task 2: Google Auth composable
**Files:** `src/composables/useGoogleAuth.js`, `src/stores/auth.js`

- [GIS Identity Services token client](https://developers.google.com/identity/oauth2/web/guides/use-token-model):
  ```javascript
  // Initialize token client
  const client = google.accounts.oauth2.initTokenClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    callback: (tokenResponse) => storeToken(tokenResponse.access_token),
  });
  // Request token on user action
  client.requestAccessToken({ prompt: 'consent' });
  ```
- Store token in Pinia + `sessionStorage` (ei localStorage — turvallisempi)
- Auto-refresh token expiry check

**Pitfall:** GIS token client vaatii user gesturen — `requestAccessToken()` täytyy kutsua klikkaushandlerista, ei `onMounted()`:sta.

#### Task 3: Google Sheets API composable
**Files:** `src/composables/useGoogleSheets.js`

- Token + API key peräisin Pinia storeista
- Metodit:
  - `getValues(spreadsheetId, range)` → `gapi.client.sheets.spreadsheets.values.get()`
  - `appendRows(spreadsheetId, range, values)` → `spreadsheets.values.append()`
  - `updateCell(spreadsheetId, range, values)` → `spreadsheets.values.update()`
  - `batchGet(spreadsheetId, ranges)` → `spreadsheets.values.batchGet()`

**Pitfall:** GAPI-kirjaston `gapi.client.init()`:lle pitää antaa vain `apiKey` + `discoveryDocs`. Token menee erikseen per-request `Authorization: Bearer <token>` -headerissa. Uusi GAPI ei enää tue `clientId`-parametria initissä.

#### Task 4: Settings store + UI
**Files:** `src/stores/settings.js`, `src/views/SettingsView.vue`, `src/components/SettingsPanel.vue`

- Inputit: Google API Key, Client ID, Spreadsheet ID
- Validoi spreadsheet ID URL-kaavalla (`https://docs.google.com/spreadsheets/d/<ID>/edit`)
- Tallenna `localStorage`:hon
- "Testaa yhteys" -nappi: kokeilee `getValues(spreadsheetId, 'Chores!A2:D2')`

#### Task 5: Chore listaus + kirjaus
**Files:** `src/stores/chores.js`, `src/views/HomeView.vue`, `src/components/ChoreList.vue`, `src/components/ChoreButton.vue`

- Hae "Chores!A2:D" → map `[id, description, value, displayName]`
- Grid-pohjainen nappirivistö (CSS Grid, responsive: 2 col phone, 4 col tablet)
- Jokainen nappi: SVG-ikoni + nimi + arvo
- Klikkaus → ConfirmDialog
- Vahvistus → append "Bookings!A:G" rivi:
  ```javascript
  [new Date().toISOString(), choreId, description, value, weekFormula, userName, 'pending']
  ```
- `weekFormula` = `=WEEKNUM(LEFT(A:A,10), 2)` (sama kuin vanhassa — viikonumero ISO 8601)

#### Task 6: ConfirmDialog
**Files:** `src/components/ConfirmDialog.vue`

- Teleport-modali (Vue `<Teleport to="body">`)
- Näyttää askaren kuvauksen + arvon
- OK / Peruuta -napit
- Animaatio: scale+fade

#### Task 7: Dashboard
**Files:** `src/views/DashboardView.vue`, `src/components/DashboardSummary.vue`, `src/components/HistoryList.vue`

**Yhteenveto:**
- Hae "Sums!A2:B" → `[pendingAmount, totalPaid]`
- Näytä: "Viikkorahaa maksamatta X€" / "Tienattu yhteensä X€"

**Historia:**
- Hae "Bookings!A:G" → map rivit
- Järjestä: uusin ensin (reverse)
- Ryhmittele viikoittain
- Pending-rivit: kellertävä tausta + klikkaus maksaa → update G-sarakkeeseen "paid" + H-sarakkeeseen käyttäjänimi

**Pitfall:** `Bookings!A:G` palauttaa datan ilman tyhjiä rivejä, joten rivinumeron laskeminen Sheets-koordinaatiksi vaati `rowIndex + 2` (header-row offset). Maksukuittauksessa update menee `Bookings!G${row}:H${row}`.

#### Task 8: Notifikaatiot
**Files:** `src/composables/useNotifications.js`, `src/components/NotificationBar.vue`

- `useNotifications()`: `show(message, type, duration)`
- Types: `success`, `error`, `info`
- Auto-dismiss 3s
- Pinia-pohjainen — useampi komponentti voi triggeröidä

#### Task 9: PWA-asetukset
**Files:** `public/manifest.json`, `public/sw.js`, `index.html`, kuvat

**Webmanifest:**
```json
{
  "name": "Viikkoraha",
  "short_name": "Viikkoraha",
  "description": "Lasten viikkorahaseuranta Google Sheetsillä",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#535353",
  "theme_color": "#535353",
  "categories": ["finance", "family", "productivity"],
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "screenshots/home.png", "sizes": "750x1334", "type": "image/png" },
    { "src": "screenshots/dashboard.png", "sizes": "750x1334", "type": "image/png" }
  ]
}
```

**Apple-spesifiset meta-tagit:**
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Viikkoraha">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
```

**Apple splash screenit moderneille laitteille:**
- iPhone 14/15/16 (390×844), iPhone Pro Max (430×932)
- iPad Pro 11" ja 12.9" (landscape + portrait)
- Käytä `<link rel="apple-touch-startup-image">` media queryillä
- Lazy strategy: generoi launch screenit SVG:stä ohjelmallisesti, riittää 3-5 yleisintä resoluutiota

**Service Worker (Workbox):**
- Precache HTML/CSS/JS/fontit
- Cache-strategia: Network First API-kutsuille, Cache First staattisille resursseille
- Offline-fallback-sivu

#### Task 10: Responsiivinen layout
**Files:** `src/components/AppShell.vue`, `tailwind.config.js`

- Mobile-first: 1-sarake 320px+ (peruspuhelimet)
- Tablet: 2-sarakkeinen chores-grid 768px+
- Desktop: max-width 480px keskellä (mobiilimainen kokemus)
- Safe area -käsittely: `env(safe-area-inset-bottom)` iOS notch-laitteille
- Font scaling: `clamp()`-funktio responsiiviselle typografialle
- Touch target: min 44×44px (iOS HIG) / 48×48dp (Android Material)

#### Task 11: Ikonit
- Olemassa olevat SVG-ikonit (siivous, tiskaus, ruoanlaitto, pyykki, roskat, ruokaostokset, posti, vauva) → konvertoi Vue-komponenteiksi
- PWA-ikonit: generoi 192×192 + 512×512 + maskable-versiot

### Phase 2: Sheets-alustus + Offline

#### Task 12: Sheets-välilehtien automaattinen luonti
**Files:** `src/composables/useSheetsSetup.js`

- Tarkista onko spreadsheetissä "Chores", "Bookings", "Sums" -välilehdet
- Jos ei: luo + täytä esimerkkidatalla
- `spreadsheets.batchUpdate()` create sheet
- Esimerkkidata Chores-välilehdelle: 8 perusaskaretta oletusarvoilla

#### Task 13: Offline-tuki
- IndexedDB-kanta (Dexie.js): chore-cache + pending-writes-queue
- SW: offline-fallback, taustasynkronointi
- UI-indikaattori offline-tilasta

---

## Sheets-skeeman määrittely

### Chores-välilehti (A–D)
```
A: id          (esim. "tiskaus", "siivous")
B: description (esim. "Tiskaus ja koneen tyhjennys")
C: value       (esim. 1.50)
D: displayName (esim. "Tiskaus")
```

### Bookings-välilehti (A–H)
```
A: timestamp   (ISO 8601)
B: choreId     (viittaus Chores!A)
C: description (kopio Chores!B)
D: value       (kopio Chores!C)
E: weekNumber  (=WEEKNUM(LEFT(A:A,10), 2))
F: userName    (Google-profiilin nimi)
G: status      ("pending" | "paid")
H: paidBy      (kuka maksoi, tyhjä ennen kuittausta)
```

### Sums-välilehti (A–B)
```
A1: "Pending"  B1: =SUMIF(Bookings!G2:G, "pending", Bookings!D2:D)
A2: "Paid"     B2: =SUMIF(Bookings!G2:G, "paid", Bookings!D2:D)
```

---

## Rajoitteet ja riskit

| Riski | Mitigointi |
|-------|-----------|
| Google Sheets API quota (60 req/min/user) | Batch-get useampi range kerralla, debounce kirjauksissa |
| GIS token vanhenee 1h | Tarkista expiry ennen API-kutsua, request fresh token tarvittaessa |
| VITE_GOOGLE_CLIENT_ID tarvitaan buildia varten | Lazy load: käyttäjä syöttää client ID:n ennen loginia → dynaaminen GIS-init |
| Apple vaatii HTTPS:n PWA-asennukseen | Deploy Netlifyyn/Verceliin (automaattinen HTTPS) |
| Safari ei tue Background Synciä | Fallback: manuaalinen retry offline → online palatessa |
| Google API Key näkyy clientissa | OK — Sheets API vaatii API Keyn + OAuth-tokenin; token suojaa datan. Key on vain quota-trackingia varten |

---

## Deploy

- **Hosting:** Netlify (free tier: 100GB, HTTPS, custom domain)
- **CI/CD:** GitHub Actions, `npm run build` + deploy
- **Domain:** `viikkoraha.fi` (hankitaan myöhemmin)

---

## Muistettavat asiat

1. **GAPI-kirjasto ladataan edelleen CDN:stä** — `https://apis.google.com/js/api.js` — se on ainoa tapa käyttää Sheets API:a selaimesta
2. **GIS-kirjasto ladataan erikseen** — `https://accounts.google.com/gsi/client` — token clienttiä varten
3. **API Key + OAuth Token = kaksi eri autentikointikerrosta**: Key identifioi projektin (quota), Token identifioi käyttäjän (data access)
4. **Olemassa olevat SVG-ikonit voi kierrättää suoraan** — `vite-svg-loader` tai inline `<template>`
5. **Vanhat splash screenit voi heittää pois** — moderni lähestymistapa on ladata 2-3 yleistä kokoa tai käyttää SVG-pohjaista launch screeniä
