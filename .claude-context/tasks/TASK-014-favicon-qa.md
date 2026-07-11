# TASK-014: QA — Favicon

**Datum:** 2026-06-23
**Kontrolor:** kontrolor

---

## 1. Simplify kontrola

### Přístup

Next.js App Router file-based favicon konvence — žádný ruční `<link>` v layout.tsx. Správný přístup. ✅

Soubory v `app/` Next.js automaticky detekuje a přidá do `<head>`:
- `app/favicon.ico` → `<link rel="icon" ... sizes="48x48">`
- `app/icon.png` → `<link rel="icon" ... sizes="192x192">`
- `app/icon.svg` → `<link rel="icon" ... sizes="any">`
- `app/apple-icon.png` → `<link rel="apple-touch-icon" ... sizes="180x180">`

Žádný custom kód v layout.tsx potřeba — čistá implementace. ✅

### scripts/generate-favicons.mjs

Utility script pro regeneraci ikon z `app/icon.svg`. Není součástí produkčního buildu, jen dev nástroj. ✅

---

## 2. Debug kontrola

### Soubory na disku

| Soubor | Existence | Rozměr | Formát |
|--------|-----------|--------|--------|
| `app/icon.svg` | ✅ | — | SVG (komplexní logo silueta, 64×64 viewBox) |
| `app/icon.png` | ✅ | 192×192 | PNG RGBA |
| `app/apple-icon.png` | ✅ | 180×180 | PNG RGBA |
| `app/favicon.ico` | ✅ | 48×48 | PNG data v .ico kontejneru |
| `app/apple-icon.svg` | ✅ smazáno | — | Stará SVG verze odstraněna |

**Vizuální kontrola:**
- `icon.png` (192×192): tmavé pozadí, ružová/korálová silueta ženské postavy, rounded corners — odpovídá brandu ✅
- `apple-icon.png` (180×180): identický obsah ✅

### Velikosti splňují požadavky

| Požadavek | Hodnota | Status |
|-----------|---------|--------|
| Google min. 48×48 | favicon.ico = 48×48 | ✅ |
| Google ideálně 192×192 | icon.png = 192×192 | ✅ |
| Apple touch icon 180×180 | apple-icon.png = 180×180 | ✅ |
| SVG pro moderní browsery | icon.svg přítomen | ✅ |

### HTML výstup (live server /cs)

```html
<link rel="icon" href="/favicon.ico?favicon.0lniqbgwratds.ico" sizes="48x48" type="image/x-icon"/>
<link rel="icon" href="/icon.png?icon.043tpmqkklims.png" sizes="192x192" type="image/png"/>
<link rel="icon" href="/icon.svg?icon.0ohp3253qrpko.svg" sizes="any" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/apple-icon.png?apple-icon.06cim-udatv-l.png" sizes="180x180" type="image/png"/>
```

Všechny 4 tagy přítomny. Cache-busting query string generuje Next.js automaticky. ✅

### HTTP dostupnost

- `GET /favicon.ico` → 200 ✅
- `GET /icon.png` → 200 image/png ✅
- `GET /apple-icon.png` → 200 image/png ✅

### TypeScript

```
npx tsc --noEmit → pouze 3 pre-existing chyby v e2e/tests/
```
Produkční kód bez chyb. ✅

---

## 3. Reverzní kontrola vs zadání

Původní zadání: "Google zobrazuje růžové 'L' na šedém pozadí — ověřit a opravit favicon"

| # | Požadavek | Status | Poznámka |
|---|-----------|--------|----------|
| 1 | Existuje správný favicon soubor | ✅ | `app/icon.png` 192×192 + `favicon.ico` 48×48 |
| 2 | Správně linkovaný v layoutu | ✅ | Next.js file convention — 4 `<link>` tagy v HTML |
| 3 | Min. 48×48 pro Google | ✅ | favicon.ico = 48×48, icon.png = 192×192 |
| 4 | Apple touch icon | ✅ | apple-icon.png 180×180 |
| 5 | Obsah odpovídá brandu (ne "L" na šedém pozadí) | ✅ | Silueta ženy, tmavé pozadí, korálová barva |

### Poznámka k Google indexaci

Google zobrazuje cached favicon z doby před implementací. Nový 192×192 PNG bude Google re-indexovat při příštím crawlu stránky (typicky dny–týdny). **Není to kódový bug** — implementace je správná.

---

## Závěr

### Blokery
Žádné.

### Non-blocker nálezy
Žádné.

### Verdikt
**PASS** — implementace splňuje všechny požadavky. Čtyři icon soubory přítomny ve správných rozměrech, Next.js je automaticky linkuje do `<head>`, HTTP vrací 200. Vizuálně odpovídá brandu (silueta, ne písmeno "L"). Google přejde na nový favicon po příštím crawlu.
