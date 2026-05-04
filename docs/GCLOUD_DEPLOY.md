# Google Cloud Console — OAuth-consent-sivun tuotantohyväksyntä

Viikkoraha käyttää Google Identity Services (GIS) / OAuth 2.0 -implicit flow'ta,
joten jokainen uusi käyttäjä näkee Google-consent-sivun ensimmäisellä kirjautumisella.
Kun sovellus on **testing**-tilassa, vain sallitut testikäyttäjät (max 100) voivat kirjautua.
**Tuotantokäyttö edellyttää sovelluksen siirtämistä "In production" -tilaan.**

## Consent screen -konfiguraatio

**Polku:** Google Cloud Console → APIs & Services → OAuth consent screen

### 1. OAuth consent screen -tyyppi

| Asetus | Arvo |
|---|---|
| User Type | **External** (perheet kirjautuvat omilla Google-tileillään) |

### 2. App information

| Kenttä | Arvo | Huomio |
|---|---|---|
| App name | **Viikkoraha** | Näkyy consent-näkymässä käyttäjälle |
| User support email | `petteri.kaikkonen@gmail.com` | Oma sähköpostisi, johon käyttäjät voivat ottaa yhteyttä |
| App logo | Viikkoraha-ikoni (192×192 px PNG) | Ladattava erikseen, näkyy consent-näkymässä |

**App domain — Authorized domains:**

| Domain | Tarkoitus |
|---|---|
| `gitpages.morgeweb.com` | GitHub Pages -deploy |
| `localhost` | Paikallinen kehitys |

### 3. Scopes (sovelluksen pyytämät käyttöoikeudet)

Viikkoraha pyytää **neljä scopea** — kolme herkkää + yksi ei-arkaluonteinen:

| Scope | Tyyppi | Käyttötarkoitus |
|---|---|---|
| `.../auth/userinfo.email` | Ei-herkkä | Sähköpostiosoite käyttäjätunnistukseen |
| `.../auth/userinfo.profile` | Ei-herkkä | Nimi ja profiilikuva UI:hin |
| `https://www.googleapis.com/auth/spreadsheets` | **Herkkä** | Askareiden luku/kirjoitus perheen taulukkoon |
| `https://www.googleapis.com/auth/drive.readonly` | **Herkkä** | Käyttäjän omien taulukoiden listaus alasvetovalikkoon |

> ⚠️ **Herkät scopet** (sensitive) vaativat Googlelta manuaalisen verifioinnin
> ennen kuin sovellus voidaan siirtää tuotantoon. Ei-herkät scopet eivät vaadi verifiointia.

### 4. Test users (vain testing-tilassa)

Kun sovellus on **testing**-tilassa, lisää tähän kaikkien perheenjäsenten
sähköpostiosoitteet (max 100 käyttäjää). Nämä ovat ainoat, jotka voivat kirjautua.

Kun sovellus siirretään **in production** -tilaan, tätä rajoitusta ei enää ole —
kuka tahansa Google-käyttäjä voi kirjautua.

## Verifiointiprosessi (sovelluksen siirto tuotantoon)

Google vaatii sovellukselta manuaalisen verifioinnin, koska pyydämme
**herkkiä scopeja** (spreadsheets, drive.readonly).

### Vaihe 1: Täytä kaikki consent screen -kentät

Kaikki yllä olevat kentät on täytettävä ennen kuin "Submit for verification"
-nappi aktivoituu. Erityisesti:

- **App logo** on ladattava
- **App domain** on täsmättävä authorized domains -listaukseen
- **Privacy policy URL** on annettava (esim. linkki GitHubin README:hen)
- **Terms of service URL** (valinnainen mutta suositeltava)

### Vaihe 2: Luo YouTube-demovideo

Google vaatii demonstraatiovideon, joka näyttää:

1. Miten sovellus käyttää pyydettyjä scopeja
2. Miten käyttäjä kirjautuu sisään
3. Miten sovellus lukee/kirjoittaa Google Sheetsiin
4. Miten Drive API:a käytetään taulukoiden listaukseen

> **Vinkki:** Video voi olla yksityinen/unlisted YouTube-video. Sen ei tarvitse olla julkinen.

### Vaihe 3: Lähetä verifiointipyyntö

1. Google Cloud Console → OAuth consent screen
2. Klikkaa **"Submit for verification"**
3. Täytä lomake:
   - Kuvaa, mihin kutakin scopea käytetään
   - Lisää linkki demovideoon
   - Vahvista, että sovellus noudattaa Google API Terms of Servicea

### Vaihe 4: Odota Googlen vastausta

Verifiointi kestää tyypillisesti **2–5 arkipäivää**. Google saattaa pyytää:

- Lisätietoja sovelluksen toiminnallisuudesta
- Muutoksia scopejen käyttöön
- Tarkennuksia tietosuojaselosteeseen

Kun verifiointi hyväksytään, saat sähköposti-ilmoituksen ja sovellus
voidaan siirtää "In production" -tilaan.

### Vaihe 5: Siirrä tuotantoon

Google Cloud Console → OAuth consent screen → **"Publish app"**

Tämän jälkeen:
- Test users -rajoitus poistuu
- Kuka tahansa Google-käyttäjä voi kirjautua Viikkorahaan
- Consent-näkymässä näkyy ⚠️ "This app isn't verified" -varoituksen sijaan
  vihreä "Verified" -merkintä

## Vaihtoehto: pysy testing-tilassa

Jos sovellusta käyttää vain oma perhe (≤ 100 käyttäjää), verifiointia **ei tarvita**.
Pidä sovellus **testing**-tilassa ja lisää perheenjäsenten sähköpostit
test users -listaan. Tämä on täysin toimiva ratkaisu, mutta consent-näkymässä
näkyy varoitus "This app isn't verified" — jonka voi ohittaa klikkaamalla
"Advanced" → "Go to Viikkoraha (unsafe)".

## CI/CD GitHub Secrets

Kun CI-pipeline (.github/workflows/ci.yml) buildaa sovellusta, se tarvitsee
`VITE_GOOGLE_CLIENT_ID` ja `VITE_GOOGLE_API_KEY` -ympäristömuuttujat,
jotta `settingsStore.js`:n oletusarvot toimivat.

**Aseta GitHub-repoon:**

1. Repository → Settings → Secrets and variables → Actions → New repository secret
2. Lisää:
   - `VITE_GOOGLE_CLIENT_ID` = `447744705396-r873fiunqg6fskcpvvtnladprsm5nami.apps.googleusercontent.com`
   - `VITE_GOOGLE_API_KEY` = `AIzaSyBkWIiLMvJO0muQPJFLLYV8wn-fuVLPmFI`

CI-workflow injektoi nämä automaattisesti testikomennon ajaksi.
