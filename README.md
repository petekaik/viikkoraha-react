# Viikkoraha

**Lasten viikkorahaseuranta Google Sheetsillä — React 19 PWA, asennettava mobiililaitteille.**

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
- [Google Cloud Console](https://console.cloud.google.com/) -projekti:
  - Google Sheets API enabled
  - OAuth 2.0 Client ID (Web application -tyyppi)
  - API Key (rajoitettu Sheets API:lle)
- Google Sheets -taulukko (voi luoda sovelluksessa)

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
    │   ├── DashboardSummary.jsx
    │   ├── HistoryList.jsx
    │   └── HistoryItem.jsx
    ├── views/              # Sivunäkymät
    │   ├── HomeView.jsx    # Päänäkymä
    │   ├── DashboardView.jsx
    │   └── SettingsView.jsx
    ├── stores/             # Zustand-tilat
    │   ├── authStore.js    # Autentikointitila (token + user)
    │   ├── choresStore.js  # Askareiden tila
    │   └── settingsStore.js # Asetustila (Client ID, API key yms.)
    ├── hooks/              # Mukautetut hookit
    │   ├── useGoogleAuth.js
    │   └── useGoogleSheets.js
    ├── utils/
    │   ├── sheets-schema.js # Sheets-välilehtimäärittelyt ja oletusdata
    │   └── validation.js
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
