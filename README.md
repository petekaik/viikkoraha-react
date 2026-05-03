# Viikkoraha

**Lasten viikkorahaseuranta Google Sheetsillä — React 19 PWA, asennettava mobiililaitteille.**

> **Esiasennettu sovellus käytettävissä:** [https://gitpages.morgeweb.com/viikkoraha](https://gitpages.morgeweb.com/viikkoraha)

## Ominaisuudet

- **Google-kirjautuminen** — OAuth 2.0, jokainen perheenjäsen omalla tunnuksella
- **Askareiden hallinta** — selaa, valitse ja kirjaa kotityöt yhdellä napautuksella
- **Dashboard** — avoimet summat, tehtyjen töiden historia, maksukuittaus
- **Automaattinen Google Sheets -synkronointi** — tiedot suoraan perheen omaan taulukkoon
- **Uuden sheetin luonti** — "Luo uusi" -nappi generoi valmiin Viikkoraha-taulukon
- **PWA** — asennettavissa iOS/Android-kotivalikkoon, splash screen, faviconit
- **Tumma teema** — Tailwind CSS 4, responsiivinen (puhelin → tabletti)
- **Täysin staattinen** — ei backend-palvelinta, hostattavissa GitHub Pages/Netlify/VPS

## Tekninen arkkitehtuuri

| Kerros | Teknologia |
|--------|-----------|
| UI-framework | React 19 |
| Build | Vite 8 |
| Tilanhallinta | Zustand 5 |
| Tyylit | Tailwind CSS 4 |
| Reititys | React Router 7 |
| Autentikointi | Google Identity Services (GIS) / OAuth 2.0 implicit flow |
| Tietovarasto | Google Sheets API v4 |
| Testaus | Vitest + Testing Library |
| PWA | Service Worker, Web Manifest, iOS splash screenit |

Sovellus on **full client-side** — kaikki API-kutsut menevät suoraan selaimesta Google Cloudiin. Ei Node-backendiä, ei tietokantaa.

## Asennus

### Vaatimukset

- Node.js 18+
- Google Cloud Console -projekti (katso ohjeet alla)
- Google Sheets -taulukko (voi luoda sovelluksessa)

### Google Cloud Console -asetukset

Sovellus tarvitsee Google Cloud -projektin, jossa on aktivoitu **kaksi API:a**, OAuth 2.0 -asiakastunnus ja API-avain.

#### 1. Luo Google Cloud -projekti

1. Mene osoitteeseen [console.cloud.google.com](https://console.cloud.google.com/)
2. Luo uusi projekti (tai valitse olemassa oleva)
3. Anna projektille nimi, esim. "Viikkoraha"

#### 2. Aktivoi tarvittavat API:t

Molemmat API:t on aktivoitava **erikseen** — Sheets API:n aktivointi ei automaattisesti aktivoi Drive API:a.

| API | Linkki aktivointiin | Käyttötarkoitus |
|-----|-------------------|-----------------|
| **Google Sheets API** | [Aktivoi Sheets API](https://console.cloud.google.com/apis/library/sheets.googleapis.com) | Askareiden luku/kirjoitus, yhteenvedot |
| **Google Drive API** | [Aktivoi Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com) | Käyttäjän omien taulukoiden listaus alasvetovalikkoon |

> ⚠️ **Ilman Drive API:n aktivointia** taulukkovalikko ei toimi — näkyviin tulee virhe "Drive API has not been used in project".

#### 3. Luo OAuth 2.0 -asiakastunnus

1. Siirry: **APIs & Services → Credentials**
2. Klikkaa **Create Credentials → OAuth client ID**
3. Valitse **Web application**
4. Täytä:
   - **Name:** Viikkoraha
   - **Authorised JavaScript origins:** `https://petekaik.github.io` (oma GitHub Pages -domain)
   - Klikkaa **Create**
5. Kopioi **Client ID** talteen (muotoa `XXXXXXXXXXXX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)

#### 4. Luo API-avain

1. **APIs & Services → Credentials**
2. Klikkaa **Create Credentials → API key**
3. Kopioi avain talteen (muotoa `AIzaSy...`)

> 🔒 **Suositus:** Rajoita API-avain **Credentials → API Key → Edit** -kohdassa:
> - **Application restrictions:** `HTTP referrers` → lisää `*.github.io/*`
> - **API restrictions:** `Google Sheets API` ja `Google Drive API`

#### 5. Syötä tunnukset sovellukseen

1. Avaa Viikkoraha
2. ⚙️ → Asetukset
3. Syötä **Client ID** ja **API-avain**
4. Tallenna → Kirjaudu Google-tililläsi
5. Valitse taulukko tai luo uusi

> 💡 **Vinkki:** Voit esitäyttää Client ID:n ja API-avaimen luomalla `.env`-tiedoston:
> ```bash
> cp .env.example .env
> ```
> ja täyttämällä `VITE_GOOGLE_CLIENT_ID` ja `VITE_GOOGLE_API_KEY`. Tällöin sovellus on heti käyttövalmis ilman asetusten syöttämistä. Spreadsheet ID täytetään sovelluksessa.

### Kehitysympäristö

```bash
npm install
cp .env.example .env   # valinnainen — VITE_GOOGLE_CLIENT_ID:n voi syöttää sovelluksessa
npm run dev             # http://localhost:5173
```

### Testit

```bash
npm test               # Vitest (kertasuoritus)
npm run test:watch     # Watch-moodi
```

**E2E-testit oikealla iPhonella:** Katso [docs/TESTING.md](docs/TESTING.md)

### Tuotantobuild

```bash
npm run build          # → dist/
npm run preview        # Esikatselu paikallisesti
```

## Käyttöönotto

1. Avaa sovellus selaimessa
2. ⚙️-kuvake → **Asetukset**
3. Syötä Google Client ID (`.apps.googleusercontent.com`)
4. Syötä API-avain (`AIzaSy...`)
5. Syötä Spreadsheet ID — tai klikkaa **"Luo uusi"** generoidaksesi valmiin taulukon
6. Tallenna
7. Kirjaudu Google-tililläsi
8. Aloita askareiden kirjaus

## Google Sheets -rakenne

Sovellus käyttää kolmea välilehteä automaattisesti:

| Välilehti | Sarakkeet | Sisältö |
|-----------|-----------|---------|
| **Chores** | A–D | ID, Kuvaus, Arvo (€), Näyttönimi |
| **Bookings** | A–H | Aikaleima, ChoreID, Kuvaus, Arvo, Viikkonro, Käyttäjä, Status |
| **Sums** | A–B | Kaavat avoimille ja maksetuille summille |

## Projektirakenne

```
viikkoraha/
├── index.html              # Vite entry point
├── vite.config.js          # Vite + Vitest -konfiguraatio
├── package.json            # Riippuvuudet ja skriptit
├── .env.example            # Pohja ympäristömuuttujille
├── .gitignore
├── docs/                   # Dokumentaatio
│   ├── BACKLOG.md          # Kehitysjonossa olevat tehtävät
│   ├── CHANGELOG.md        # Julkaisut ja muutosloki
│   ├── KNOWN_BUGS.md       # Tunnetut bugit ja workaroundit
│   └── TESTING.md          # Testausohjeet (yksikkö- ja E2E)
├── tests/                  # E2E-testit
│   └── e2e/
│       ├── full_e2e.py     # iOS Safari WebDriver -skripti
│       ├── .env.e2e        # Paikalliset secretit (gitignored)
│       └── .env.e2e.example
├── public/                 # Staattiset assetit
│   ├── sw.js               # Service Worker (PWA)
│   ├── site.webmanifest    # PWA-manifesti
│   ├── splash/             # iOS-splash screenit (eri resoluutiot)
│   └── favicon.*           # Faviconit ja PWA-ikonit
└── src/
    ├── main.jsx            # React entry + reititys
    ├── index.css           # Tailwind + globaalit tyylit
    ├── test-setup.js       # Vitest + Testing Library -konfiguraatio
    ├── components/         # UI-komponentit
    │   ├── AppShell.jsx    # Header, navigaatio, asetuspaneeli
    │   ├── ChoreList.jsx   # Askarelista
    │   ├── ChoreButton.jsx # Yksittäinen askarepainike
    │   ├── ConfirmDialog.jsx
    │   ├── NotificationBar.jsx
    │   ├── LoginPrompt.jsx
    │   ├── SettingsPanel.jsx
    │   ├── SpreadsheetPicker.jsx
    │   ├── DashboardSummary.jsx
    │   ├── HistoryList.jsx
    │   ├── HistoryItem.jsx
    │   └── WeeklyChart.jsx  # Viikkograafi
    ├── views/              # Sivunäkymät
    │   ├── HomeView.jsx    # Päänäkymä
    │   ├── DashboardView.jsx
    │   ├── ChoreManagerView.jsx  # Askareiden hallinta (parent)
    │   ├── UsersManagerView.jsx  # Perheenjäsenten hallinta (parent)
    │   └── SettingsView.jsx
    ├── stores/             # Zustand-tilat
    │   ├── authStore.js    # Autentikointitila (token + user + rooli)
    │   ├── choresStore.js  # Askareiden tila
    │   └── settingsStore.js # Asetustila (Client ID, API key yms.)
    ├── hooks/              # Mukautetut hookit
    │   ├── useGoogleAuth.js
    │   ├── useGoogleSheets.js
    │   └── useUsers.js     # Käyttäjähallinta (Users-sheet)
    ├── utils/
    │   ├── sheets-schema.js # Sheets-välilehtimäärittelyt ja oletusdata
    │   ├── validation.js
    │   ├── displayName.js  # Google-profiilin nimen käsittely
    │   ├── parseNumber.js  # Suomi-lokaalin numerojäsennys
    │   ├── settingsSync.js # Settings-sheetin synkronointi
    │   └── AppContext.js
    └── __tests__/          # Yksikkö- ja komponenttitestit
```

## Tunnettuja rajoituksia

- Ei offline-tukea — vaatii nettiyhteyden Google Sheets API:a varten
- Ei monen käyttäjän reaaliaikaista synkronointia (Sheets API:n luonne)
- Vaatii Google-tilin kirjautumiseen

## Lisenssi

MIT — vapaasti jaettavissa ja muokattavissa.

---

**Tekijä:** [Petteri Kaikkonen](https://github.com/petekaik)
