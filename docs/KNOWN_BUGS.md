# Viikkoraha — Tunnetut bugit

Tilat: 🔴 Avoin · 🟡 Workaround olemassa · 🟢 Korjattu (seuraavassa releasessa)

---

## 🔴 Avoimet

### SW disabloitu → ei PWA-päivityksiä eikä offline-ilmoitusta
**Raportoitu:** 2026-05-02  
**Vakavuus:** Keskitaso  
**Workaround:** Käyttäjän on suljettava PWA kokonaan ja avattava uudelleen saadakseen uusimman version. iOS Safari ei päivitä cachea `hard reloadilla`.  
**Korjaus:** SW-päivitysstrategia (BACKLOG: 🔴 SW takaisin käyttöön)

### GAPI ei toimi WebDriverissa → E2E ei testaa Sheets-persistenssiä
**Raportoitu:** 2026-05-02  
**Vakavuus:** Matala (vain testiympäristö)  
**Workaround:** E2E testaa UI-flown token-injektiolla, Sheets-persistenssi testataan manuaalisesti.  
**Korjaus:** Ei korjattavissa — WebDriverin eristetty konteksti ei salli Googlen OAuth-popuppia.

---

## 🟡 Workaround olemassa

### Sheets API: 429 Rate Limit mahdollinen render-loopeissa
**Raportoitu:** 2026-04-10  
**Vakavuus:** Matala  
**Oire:** Jos useEffect triggeröi useita fetch-pyyntöjä samassa render-syklissä, Sheets API palauttaa 429. Sovellus ei vielä käsittele tätä gracefully (näyttää geneerisen virheen).  
**Workaround:** Vältä nopeaa edestakaista navigointia Home ↔ Dashboard. 60 req/min on normaalikäytössä riittävä.  
**Korjaus:** Throttle/debounce + exponential backoff 429:lle (BACKLOG: 🟡 Google Sheets quota -suojaus)

### iOS Safari: localStorage sync-ongelma PWA:ssa
**Raportoitu:** 2026-04-25  
**Vakavuus:** Matala  
**Oire:** Harvinainen — PWA:n avauksessa auth-tokenia ei löydy localStorage:sta vaikka se on tallennettu edellisellä kerralla. Korjaantuu uudelleenkirjautumisella.  
**Workaround:** Kirjaudu uudelleen. Token on tallessa, mutta iOS:n PWA-prosessi ei aina saa localStoragea ajoissa lukuvalmiiksi.  
**Korjaus:** Ei selvää juurisyytä — mahdollisesti iOS 18:n PWA-prosessien eristys.

---

## 🟢 Korjattu (seuraavassa releasessa)

### Spinner jää ikuisesti (hydraatio-bugi) — KORJATTU
**Raportoitu:** 2026-04-27  
**Ratkaisu:** `_hydrated`-mekanismi poistettu kokonaan. Zustandin persist-middlewaren storage-adapteri hoitaa JSON-serialisoinnin itse (aiemmin se jätti stringifyaamatta, jolloin localStorageen meni `"[object Object]"`).

### localStorage: "[object Object]" tokenin tilalla — KORJATTU
**Raportoitu:** 2026-04-27  
**Ratkaisu:** `authStore.js`:n storage-adapteri stringifyaa itse. Sama korjaus `settingsStore.js`:ssä.

### Settings sheet -tallennus epäonnistuu — KORJATTU
**Raportoitu:** 2026-04-26  
**Ratkaisu:** WEEKNUM-kaavan lokaalikorjaus (pilkku → puolipiste) ja SUMIF-korjaukset.

---

## Ilmoita bugista

Löysitkö bugin? Lisää tänne:

```markdown
### Buggarin otsikko
**Raportoitu:** PVM
**Vakavuus:** Kriittinen / Korkea / Keskitaso / Matala
**Oire:** Mitä tapahtuu, milloin, millä laitteella
**Toistettavuus:** Step-by-step
**Workaround:** Jos sellainen on
```

---

**Viimeksi päivitetty:** 2026-05-02
