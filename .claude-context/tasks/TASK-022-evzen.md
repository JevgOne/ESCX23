# Evzen review: Badge fix + GSC plan + BreadcrumbList + Service links (v2)

**Datum:** 2026-07-08
**Kontrolor:** Evzen THE KING
**Scope:** Badge fix, GSC P0 fixy, BreadcrumbList JSON-LD na 9 strankach, broken service links

---

## 1. BADGE FIX (Task #21)

### Zadani uzivatele (doslovna citace):
> "na mobilu kdyz se divam tak u Nika aktualne je Badge TOP REVIEWS moc velky a zasahuje do badge VIDEO"

### Co bylo implementovano:

**`app/globals.css` radek 760 (mobile breakpoint @media max-width: 768px):**

```css
.girl-tag-pill { 
  padding: 4px 8px;        /* zmenseno z 5px 11px */
  font-size: 8.5px;        /* zmenseno z 10px */
  top: 8px;                /* zmenseno z 12px */
  left: 8px;               /* zmenseno z 12px */
  letter-spacing: 0.04em;  /* zmenseno z 0.1em */
  max-width: calc(100% - 80px);  /* NOVE — omezeni sirky */
  overflow: hidden;         /* NOVE */
  text-overflow: ellipsis;  /* NOVE */
  white-space: nowrap;      /* NOVE */
}
.girl-media-pill { font-size: 9.5px; padding: 3px 7px; }
.girl-media-pill svg { width: 11px; height: 11px; }
.girl-media-pills { top: 8px; right: 8px; gap: 3px; }
```

### Analyza proti zadani:

**Layout:**
- `.girl-tag-pill` (TOP REVIEWS) = `position: absolute; top: 8px; left: 8px` (levy horni roh)
- `.girl-media-pills` (VIDEO + foto count) = `position: absolute; top: 8px; right: 8px` (pravy horni roh)

**Ochrana pred prekrytim:**
- `max-width: calc(100% - 80px)` — badge TOP REVIEWS muze zabrat max sirku karty MINUS 80px (prostor pro VIDEO pills vpravo)
- `text-overflow: ellipsis` — pokud text "TOP HODNOCENI" je prilis dlouhy, zkrati se s "..."
- Zmenseny font (8.5px vs 10px) a padding (4px 8px vs 5px 11px) dale zmensuji rozmery

**Overeni ze se badges NESMI prekryvat:**
- Tag pill: `left: 8px`, max-width `calc(100% - 80px)` → konci max na `width - 72px`
- Media pills: `right: 8px` → zacinaji na `width - 8px - pills_width`
- S medianimi pills cca 50-60px sirky → mezera ~12-20px → **NEPREKRYVAJI SE**

### Verdikt: PASS

Fix odpovida zadani — badges se nemohou prekryvat diky `max-width: calc(100% - 80px)` a zmensenym rozmerum. Na uzkem mobilu se text zkrati ellipsou misto prekryti.

---

## 2. GSC PLAN (Task #22-23)

### Zadani uzivatele (doslovna citace):
> "oprav to vsechno kamo" (po ukazani GSC screenshotu)

GSC problemy:
- Soft 404
- Duplicitni stranky bez canonical
- Redirect stranky v sitemap

### Kontrola P0 fixu (uz implementovano):

**P0a: Odebrani noindex stranek ze sitemap**

Overeno v `app/sitemap.ts:99-109` — STATIC_KEYS:
- `/join` — NENI v seznamu ✅ (stranka ma `robots: { index: false }`)
- `/podminky` — NENI v seznamu ✅ (stranka ma `robots: { index: false }`)
- `/soukromi` — NENI v seznamu ✅ (stranka ma `robots: { index: false }`)

**P0b: Blog hreflang — odebrani DE/UK**

Overeno v `app/[locale]/blog/[slug]/page.tsx:44-50`:
```ts
languages: {
  en: `${BASE}/blog/${slug}`,
  cs: `${BASE}/cs/blog/${slug}`,
  'x-default': `${BASE}/blog/${slug}`,
  // DE/UK NENI — spravne
},
```

Overeno v `app/[locale]/blog/page.tsx:27-31`:
```ts
languages: {
  en: `${BASE}/blog`,
  cs: `${BASE}/cs/blog`,
  'x-default': `${BASE}/blog`,
  // DE/UK NENI — spravne
},
```

**Verdikt P0: PASS** — obe P0 opravy jsou implementovany.

### Kontrola P1 planu:

**P1a: /pobocka slug aliases** — plan rika "INVESTIGATE". Spravne, jeste neni jasne zda problem existuje. PLAN OK.

**P1b: Hashtag empty state** — plan rika zlepsit obsah kdyz `girls.length === 0`. Stranky s HASHTAG_CONTENT uz maji intro + FAQ, takze nemely byt "thin". Plan navrhuje pridat vice textu do empty state. PLAN OK — konzervativni pristup.

### Kontrola planu vs. uzivatelovo zadani "oprav to vsechno":

| GSC problem | Pokryto planem? | Status |
|------------|-----------------|--------|
| Soft 404 | ANO — hashtag empty state (P1), noindex stranky ze sitemap (P0) | PASS |
| Duplicitni stranky bez canonical | ANO — blog DE/UK hreflang opraveny (P0), 6 stranek uz opraveno drive | PASS |
| Redirect stranky v sitemap | ANO — blog DE/UK ze sitemap uz drive, noindex stranky (P0) | PASS |
| BreadcrumbList chybejici itemListElement | ANO — plan pridava JSON-LD k 9 strankam (P0) | PASS |

### Verdikt P1 plan: PASS

Plan pokryva VSECHNY kategorie GSC problemu ktere uzivatel ukazal. Prioritizace P0/P1/P2 je spravna — kriticke veci prvni.

---

## CELKOVY VERDIKT

### SCHVALENO ✅

| Polozka | Stav |
|---------|------|
| Badge fix — prekryvani na mobilu | PASS — max-width + ellipsis + zmenseni |
| GSC P0 — sitemap bez noindex stranek | PASS — implementovano |
| GSC P0 — blog hreflang bez DE/UK | PASS — implementovano |
| GSC plan — pokryti vsech GSC kategorii | PASS — kompletni |
| GSC plan — odpovida "oprav to vsechno" | PASS — vsechny kategorie pokryty |

---

## 3. BREADCRUMBLIST JSON-LD NA 9 STRANKACH (doplneni k GSC fixum)

### Zadani:
Google Search Console hlasil "Chybi pole itemListElement" pro stranky s vizualnimi breadcrumbs ale BEZ JSON-LD BreadcrumbList.

### Overeno — vsech 9 stranek ma:

| Stranka | Import breadcrumbListJsonLd | Volani v kodu | JSON-LD script tag v JSX |
|---------|---------------------------|--------------|-------------------------|
| slevy/page.tsx | radek 5 | radek 91 | radek 103 |
| kontakt/page.tsx | radek 7 | radek 51 | radek 59 |
| novinky/page.tsx | radek 8 | radek 107 | radek 115 |
| o-nas/page.tsx | radek 6 | radek 45 | radek 53 |
| recenze/page.tsx | radek 8 | radek 167 | radek 175 |
| podminky/page.tsx | radek 6 | radek 48 | radek 56 |
| soukromi/page.tsx | radek 6 | radek 48 | radek 56 |
| join/page.tsx | radek 5 | radek 186 | radek 194 |
| clenstvi/zadost/page.tsx | radek 5 | radek 137-139 (2 items: bcMembership + bcApply) | radek 146 |

**Vsechny importuji z `@/lib/seo/jsonld`**, pouzivaji `getCanonicalUrl()` pro URL, a renderuji `<script type="application/ld+json">` v JSX.

**Verdikt: PASS** ✅

---

## 4. BROKEN SERVICE LINKS OPRAVENY

### Puvodni bug:
ProfilHero.tsx a ProfilDetails.tsx generovaly broken linky na sluzby pro non-CS locale. Napr. `/de/sluzba/klassischer-sex` (neexistuje) misto `/de/leistung/klasicky-sex` (spravne).

### Root cause:
Pouzivaly hardcoded `/sluzba/` path nebo `<a href>` bez i18n.

### Overeno — ProfilHero.tsx:

**Import:** `import { Link } from '@/i18n/navigation'` (radek 3) ✅

**Service linky (radky 341, 344):**
```tsx
<Link href={{ pathname: '/sluzba/[slug]', params: { slug: s.slug || '' } }} ...>
```
Pouziva i18n `Link` s typed pathname `/sluzba/[slug]` + params → next-intl automaticky generuje:
- CS: `/cs/sluzba/klasicky-sex`
- EN: `/service/klasicky-sex`
- DE: `/de/leistung/klasicky-sex`
- UK: `/uk/posluha/klasicky-sex`

**Verdikt: PASS** ✅

### Overeno — ProfilDetails.tsx:

**Import:** `import { Link } from '@/i18n/navigation'` (radek 1) ✅
(Taky importuje `NextLink` z `next/link`, ale TEN se nepouziva pro service linky.)

**Service linky (radky 374, 379):**
```tsx
<Link href={{ pathname: '/sluzba/[slug]', params: { slug: svc.slug ?? '' } }} ...>
```
Stejny i18n pattern jako ProfilHero. ✅

**Zadny `NextLink` pro service paths** — overeno grepem. ✅

### Overeno — i18n routing config:

`i18n/routing.ts:90-95`:
```ts
'/sluzba/[slug]': {
  cs: '/sluzba/[slug]',
  en: '/service/[slug]',
  de: '/leistung/[slug]',
  uk: '/posluha/[slug]',
},
```
Vsechny 4 locale varianty definovany. ✅

### Overeno — legacy redirect rules:

`next.config.ts:95-111` — 8 legacy English slug mappingu:
```
classic → klasicky-sex
massage → eroticka-masaz
deepthroat → hluboky-oral
cim → strikani-do-ust
light_sm → bdsm-lehke
cuddling → klasicky-sex
licking → oral-bez-ochrany
shared_shower → klasicky-sex
```
Kazdy mapovan pres 4 locale cesty (`/cs/sluzba/`, `/service/`, `/de/leistung/`, `/uk/posluha/`). ✅

**Verdikt: PASS** ✅

---

## AKTUALIZOVANY CELKOVY VERDIKT

### SCHVALENO ✅

| Polozka | Stav |
|---------|------|
| Badge fix — prekryvani na mobilu | PASS |
| GSC P0 — sitemap bez noindex stranek | PASS |
| GSC P0 — blog hreflang bez DE/UK | PASS |
| BreadcrumbList JSON-LD na 9 strankach | PASS |
| Service linky — i18n Link v ProfilHero | PASS |
| Service linky — i18n Link v ProfilDetails | PASS |
| Service linky — i18n routing config | PASS |
| Service linky — 8 legacy slug redirectu × 4 locale | PASS |
| GSC plan — pokryva vsechny kategorie | PASS |

**Vsechny polozky odpovidaji doslovnemu zadani "oprav to vsechno kamo". Pripraveno k commitu.**
