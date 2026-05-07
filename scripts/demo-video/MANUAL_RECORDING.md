# Demo-videon nauhoitusohje — Viikkoraha Google-verifiointia varten

Tarvitset: macOS + QuickTime Player (tulee macOS:n mukana)

## 1. Valmistelut (ennen nauhoitusta)

1. Avaa Safari ja mene osoitteeseen: **https://gitpages.morgeweb.com/viikkoraha/**
2. Varmista että olet **kirjautunut ulos** sovelluksesta (näet "Kirjaudu Google-tilillä" -napin)
3. Sulje kaikki ylimääräiset välilehdet ja sovellukset
4. Laita puhelin äänettömälle — ei ilmoituksia nauhoituksen aikana

## 2. Nauhoitus (noin 2,5 min)

Avaa QuickTime Player → **File → New Screen Recording** (tai paina **⌘ Cmd + Shift + 5**)
- Valitse "Record Selected Portion" 
- Rajaa **vain Safari-ikkuna** (ei koko työpöytää)
- Klikkaa **Record**

### Kohtaus 1 — Sovelluksen esittely (0:00–0:12)
- Nauhoitus käynnissä
- Näytä sovelluksen etusivu (kirjautumisnäkymä)
- **Pidä hiiri paikallaan** — älä rullaa, älä klikkaa
- Odota 12 sekuntia

### Kohtaus 2 — OAuth-kirjautuminen (0:12–0:35)
- Klikkaa "Kirjaudu Google-tilillä"
- Google OAuth -ikkuna aukeaa → **näytä SELKEÄSTI kaikki 4 scopea**:
  - profile
  - email
  - spreadsheets
  - drive.readonly
- **Älä klikkaa vielä** — anna katsojan lukea scopet (~10 s)
- Klikkaa "Jatka" / "Allow"

### Kohtaus 3 — Profiili + asetukset (0:35–0:55)
- Odota että sovellus latautuu → näkyy header jossa käyttäjänimi
- Klikkaa **⚙️-hammasratas**-ikonia (vasen yläkulma)
- Asetukset avautuu → näytä profiilikortti (nimi, email, rooli)
- Odota ~5 s

### Kohtaus 4 — Laskentataulukon valinta (0:55–1:15)
- Rullaa asetuksissa alaspäin
- Näytä **SpreadsheetPicker**-pudotusvalikko — listaa käyttäjän sheetit
- Klikkaa pudotusvalikko auki → näytä lista ~5 s
- Valitse taulukko
- Sulje asetukset

### Kohtaus 5 — Askarelista (1:15–1:35)
- Palaa kotinäkymään — askareet listautuvat
- Rullaa listaa kevyesti ylös/alas
- Anna katsojan nähdä kaikki askareet

### Kohtaus 6 — Suorituksen kirjaus (1:35–1:55)
- Klikkaa jotain askaretta (esim. "Tiskaus")
- ConfirmDialog avautuu → näytä dialogi ~3 s
- Klikkaa "Vahvista" / "Kyllä"
- Odota "Tallennettu" / onnistumisilmoitusta

### Kohtaus 7 — Dashboard (1:55–2:20)
- Klikkaa oikean yläkulman 🏠/📊-kuvaketta → siirry Dashboardiin
- Näytä DashboardSummary (odottavat + maksetut)
- Näytä HistoryList — rullaa muutama rivi
- Klikkaa "Kaavio"-välilehteä → näytä viikkograafi

### Kohtaus 8 — Tietosuoja (2:20–2:35)
- Avaa asetukset uudelleen
- Rullaa alas **Info**-osioon
- Näytä linkit: Tietosuojaseloste · Käyttöehdot

### Lopetus
- Klikkaa **Stop** QuickTime-nauhoituksessa (⌘ Cmd + Ctrl + Esc tai menu-palkin stop-painike)
- Tallenna video: `~/Downloads/viikkoraha-demo-raw.mov`

## 3. Toimitus

Tiedosto `~/Downloads/viikkoraha-demo-raw.mov` — ajan sen jälkeen assemble-skriptin, joka lisää selostusäänen ja tekee lopullisen videon.
