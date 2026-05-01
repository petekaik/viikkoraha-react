# Viikkoraha

**Mobiiliystävällinen PWA (Progressive Web App) lasten kotitöiden ja viikkorahan seurantaan.** Sovellus käyttää Google Sheetsiä tietovarastona ja Google-kirjautumista käyttäjien tunnistamiseen.

## Ominaisuudet

- **Kotitöiden hallinta** — selaile, valitse ja merkkaa tehtäviä tehdyksi
- **Viikkorahan seuranta** — automaattinen ansioiden laskenta tehtyjen töiden perusteella
- **Google Sheets -integraatio** — tiedot tallennetaan suoraan perheen omaan taulukkoon
- **Google-kirjautuminen** — jokaisella perheenjäsenellä oma tunnistautuminen
- **PWA-tuki** — asennettavissa puhelimen kotivalikkoon (iOS/Android), splash screen ja faviconit
- **Historia ja dashboard** — yhteenvetonäkymä tehdyistä töistä ja ansioista
- **Suomenkielinen käyttöliittymä**

## Tekninen arkkitehtuuri

| Kerros | Teknologia |
|--------|-----------|
| Frontend | Vanilla JS, jQuery, jQuery Mobile |
| Autentikointi | Google Identity Services / OAuth 2.0 |
| Tietovarasto | Google Sheets API v4 |
| Tyyli | Mukautettu CSS + jQuery UI -teema |

**Ei backend-palvelinta.** Kaikki API-kutsut tehdään suoraan selaimesta Google Cloudiin. Sovellus on staattinen HTML/JS/CSS — hostattavissa millä tahansa staattisella palvelimella (GitHub Pages, Netlify, oma palvelin).

## Vaatimukset

### Google Cloud -konfiguraatio

1. [Google Cloud Console](https://console.cloud.google.com/) → projekti
2. Enable APIs: **Google Sheets API**, **Google Identity Services**
3. Luo **OAuth 2.0 Client ID** (Web application -tyyppinen)
4. Lisää sallitut JavaScript-originit ja redirect-URIt (esim. `https://oma-domain.fi`)
5. Kopioi `Client ID` ja `API Key` sovelluksen asetuksiin

### Google Sheets -taulukko

Sovellus käyttää Google Sheets -taulukkoa, jossa vähintään kolme välilehteä:

| Välilehti | Sisältö |
|-----------|---------|
| **Chores** | Kotityöt: nimi, arvo (€), kategoria, kuvake |
| **Bookings** | Tehdyt työt: käyttäjä, työ, arvo, päivämäärä, tila |
| **Sums** | Yhteenveto: käyttäjäkohtaiset kokonaisansiot |

## Asennus ja käyttöönotto

### 1. Konfiguroi tunnukset

Täytä `js/configuration.js`-tiedostoon:

```javascript
const config = {
  CLIENT_ID: "YOUR_CLIENT_ID.apps.googleusercontent.com",
  API_KEY: "YOUR_API_KEY",
  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID",
  // ...
};
```

> ⚠️ **Älä koskaan commitoi oikeita tunnuksia Git-repoon.**
> Käytä `.env`-tiedostoa ja build-stepiä, tai injectoi arvot CI-palvelimelta.

### 2. Luo Google Sheets -taulukko

- Kopioi taulukon URL:stä `spreadsheetId` (pitkä merkkijono `/d/.../edit`-osiosta)
- Jaa taulukko käyttäjille (Viewer-oikeudet riittävät — sovellus käyttää API-avainta)

### 3. Hostaus

```bash
# GitHub Pages (esimerkki)
git push origin master
# → Settings > Pages > Branch: master, folder: /
```

Tai mikä tahansa staattinen webbipalvelin.

## Rakenne

```
viikkoraha/
├── index.html              # Pääsivu + UI
├── css/
│   └── viikkoraha.css      # Tyylitiedosto
├── js/
│   ├── configuration.js    # API-avaimet (placeholderit gitiin)
│   └── viikkoraha.js       # Sovelluslogiikka
├── img/
│   ├── favicon/            # Faviconit ja PWA-manifesti
│   ├── splash/             # iOS-splash screen -kuvat
│   ├── svg/                # Kotitöiden kuvakkeet
│   └── png/                # Lisäkuvat
└── .gitignore
```

## Käyttö

1. Avaa sovellus selaimessa
2. **Kirjaudu** Google-tunnuksilla (⚙️-kuvake → "Kirjaudu")
3. Selaile käytettävissä olevia kotitöitä
4. Valitse tehtävä ja vahvista — summa päivittyy automaattisesti
5. **Dashboard** (ℹ️-kuvake) näyttää kokonaisansiot ja historian

## Kehitys

Projekti on staattinen HTML/JS/CSS — muutokset voi testata avaamalla `index.html` suoraan selaimessa. API-kutsut vaativat oikean Google Cloud -konfiguraation toimiakseen.

### Tunnettuja rajoituksia

- Ei offline-tukea (vaatii aktiivisen nettiyhteyden Google Sheets API:a varten)
- Ei GraphQL/REST-rajapintaa — suorat Sheets API -kutsut selaimesta
- jQuery Mobile on vanhentunut framework — modernisointi Reactiin suunnitteilla

## Lisenssi

Yksityinen projekti. Ota yhteyttä tekijään ennen käyttöä.

---

**Tekijä:** [Petteri Kaikkonen](https://github.com/petekaik)
