# TASK-008 Chrome Test — Homepage + Pobočky datumy

**Datum:** 2026-06-02  
**Tester:** TEST-CHROME  
**Dev server:** http://localhost:3000 (byl spuštěn na začátku testu — nebežel)

---

## Výsledky

### 1. Homepage — eyebrow "— AKTUALIZACE" letter-spacing
**PASS**

CSS v `app/globals.css:282-293`:
```css
.section-eyebrow {
  letter-spacing: 0.3em;  /* platí pro text */
}
.section-eyebrow::before {
  content: '— ';
  letter-spacing: normal;  /* dash NENÍ roztažený */
}
```
Dash je generován přes `::before` s `letter-spacing: normal` — není roztažený. Text eyebrow má `0.3em` jen pro písmena.

---

### 2. Homepage — trust karty, žádný stray element vlevo
**PASS**

HTML struktura každé karty:
```html
<div class="trust-card">
  <div class="trust-icon">✓</div>
  <div class="trust-title">...</div>
  <div class="trust-text">...</div>
</div>
```
Žádné `::before`/`::after` pseudo-elementy na `.trust-card` ani `.trust-icon`. Komponenta `components/home/TrustRow.tsx` je čistá.

---

### 3. Homepage LocationsRow — Žižkov 18.6, Smíchov 25.7
**PASS**

HTML potvrzeno:
```html
<span class="loc-row-badge-soon">Otevíráme <!-- --> · 18.6.</span>  <!-- Žižkov / Praha 3 -->
<span class="loc-row-badge-soon">Otevíráme <!-- --> · 25.7.</span>  <!-- Smíchov / Praha 5 -->
```

---

### 4. /cs/pobocka/praha-3 — opening banner 18.6
**PASS**

HTML potvrzeno:
```html
<div class="pobocka-opening-banner">
  <span class="pobocka-opening-icon">🎉</span>
  <div class="pobocka-opening-title">Nový apartmán — otevíráme brzy!</div>
  <div class="pobocka-opening-date">Plánované otevření: 18.6.</div>
</div>
```

---

### 5. /cs/pobocka/praha-5 — opening banner 25.7
**PASS**

HTML potvrzeno:
```html
<div class="pobocka-opening-banner">
  <span class="pobocka-opening-icon">🎉</span>
  <div class="pobocka-opening-title">Nový apartmán — otevíráme brzy!</div>
  <div class="pobocka-opening-date">Plánované otevření: 25.7.</div>
</div>
```

---

### 6. /cs/rozvrh — Žižkov/Smíchov NEJSOU ve filtru lokací
**PASS**

Logika filtru v `app/[locale]/rozvrh/page.tsx:136`:
```ts
const openLocations = dbLocations.filter((l) => !l.openingDate || l.openingDate <= today);
```
Dnes = `2026-06-02`. Žižkov (`opening_date = 2026-06-18`) a Smíchov (`opening_date = 2026-07-25`) mají budoucí datum → správně vyloučeny z filtru.

Praha 3 a Žižkov se na stránce `/cs/rozvrh` vyskytují pouze ve footeru — ne ve filtru.

---

### 7. Footer — upcoming locations mají suffix "brzy"
**PASS**

HTML potvrzeno:
```html
<li><a href="/cs/pobocka/praha-3">Praha · Praha 3 (Žižkov, Praha 3) — brzy</a></li>
<li><a href="/cs/pobocka/praha-5">Praha · Praha 5 (Anděl, Praha 5) — brzy</a></li>
```

---

## Souhrn

| # | Test | Výsledek |
|---|------|----------|
| 1 | Eyebrow dash letter-spacing | PASS |
| 2 | Trust karty — žádný stray element | PASS |
| 3 | LocationsRow — Žižkov 18.6, Smíchov 25.7 | PASS |
| 4 | Praha 3 opening banner 18.6 | PASS |
| 5 | Praha 5 opening banner 25.7 | PASS |
| 6 | Rozvrh — Žižkov/Smíchov NEJSOU ve filtru | PASS |
| 7 | Footer — suffix "brzy" | PASS |

**CELKEM: 7/7 PASS — vše zelené.**
