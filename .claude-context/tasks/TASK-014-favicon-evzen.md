# TASK-014: Evzen review — Favicon

## Verdikt: SCHVALENO

## Puvodni zadani uzivatele

Google Search pro `site:lovelygirls.cz` ukazuje rozpixelovane ruzove "L" na sedem pozadi. Uzivatel chce spravny favicon.

Pricina: Google rasterizoval SVG favicon na 16-32px → komplexni silueta se stala necitelnou.
Reseni: Vygenerovat rasterizovane PNG/ICO varianty z SVG.

---

## 1. Kontrola souboru

| Soubor | Existuje | Rozmery | Format | Vizual |
|--------|----------|---------|--------|--------|
| `app/icon.svg` | ANO | 64x64 viewBox | SVG | Zenska silueta, gradient ruzova na tmavem pozadi |
| `app/icon.png` | ANO (12.5 KB) | 192x192 | PNG RGBA | Totozne — silueta citelna i v malych rozmerech |
| `app/apple-icon.png` | ANO (11.5 KB) | 180x180 | PNG RGBA | Totozne |
| `app/favicon.ico` | ANO (2 KB) | 48x48 | PNG v ICO kontejneru | Totozne |
| `app/apple-icon.svg` | SMAZANO | — | — | Nahrazeno PNG verzi |

### Rozmery vs pozadavky

| Pozadavek | Splneno? |
|-----------|----------|
| Google min. 48x48 | ANO — favicon.ico = 48x48 |
| Google idealne 192x192 | ANO — icon.png = 192x192 |
| Apple touch icon 180x180 | ANO — apple-icon.png = 180x180 |
| SVG pro moderni browsery | ANO — icon.svg ponechan |

---

## 2. Kontrola generacniho scriptu

**Soubor:** `scripts/generate-favicons.mjs`
- Pouziva `sharp` (Node.js image processing)
- Cte `app/icon.svg` a generuje 3 soubory
- Script neni soucast produkce — dev nastroj pro regeneraci

**Spravny pristup.** Pokud se SVG zmeni, admin spusti script a pregeneruje PNG varianty.

---

## 3. Kontrola HTML vystupu (z QA)

QA potvrdil ze Next.js automaticky generuje v `<head>`:
```html
<link rel="icon" href="/favicon.ico" sizes="48x48" type="image/x-icon"/>
<link rel="icon" href="/icon.png" sizes="192x192" type="image/png"/>
<link rel="icon" href="/icon.svg" sizes="any" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" type="image/png"/>
```

Vsechny 4 tagy pritomny. Zadny custom kod v layout.tsx — Next.js file-based konvence. Spravne.

---

## 4. Vizualni kontrola

Overil jsem `icon.png` — zobrazi se zenska silueta na tmavem pozadi s koralovou/ruzovou barvou. Jednoznacne odpovida brandu LovelyGirls. **Neni to "L" na sedem pozadi.**

Google prebere novy favicon pri pristim crawlu (dny az tydny) — implementacne je vse v poradku.

---

## Kontrola proti zadani

| # | Pozadavek | Splneno? | Jak |
|---|-----------|----------|-----|
| 1 | Overit aktualni favicon | ANO | icon.svg je zenska silueta, ne "L" |
| 2 | Spravne linkovany v layoutu | ANO | Next.js file convention, 4 link tagy |
| 3 | Min. 48x48 pro Google | ANO | favicon.ico 48x48, icon.png 192x192 |
| 4 | Apple touch icon | ANO | apple-icon.png 180x180 |

## Non-blocker nalezy

Zadne.

---

**Evzen the King — SCHVALENO. Favicon implementace je kompletni. 4 icon soubory ve spravnych rozmerech, vizualne odpovida brandu. Next.js je automaticky linkuje. Google prebere zmenu pri pristim crawlu.**
