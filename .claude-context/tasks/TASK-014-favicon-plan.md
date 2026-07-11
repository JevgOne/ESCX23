# TASK-014: Favicon audit a oprava — Plán

## Stav auditu

### Co existuje
- `app/icon.svg` — 64x64 SVG, ženská silueta (LovelyGirls logo) s radialGradient (#F27D8D → #9A1D51) na tmavém pozadí (#0a0509), zakulacené rohy (rx=12).
- `app/apple-icon.svg` — identický soubor jako `icon.svg`.

### Co chybí
1. **`favicon.ico` neexistuje** — Next.js App Router se snaží servírovat `app/icon.svg` jako favicon, ale starší browsery a Google Favicon API preferují `.ico` formát.
2. **`public/` je prázdný** — žádný favicon.ico, žádný PNG fallback.
3. **Manifest (site.webmanifest) neexistuje** — Android/PWA icon definice chybí.
4. **PNG varianty chybí** — Google vyžaduje **minimálně 48x48px** rasterizovaný favicon. SVG favicon je podporován v moderních browserech, ale Google Search ho někdy špatně renderuje (malá rozlišení, gradient se ztratí).
5. **Layout nemá explicitní icon meta tagy** — spoléhá na Next.js file-based metadata (automatické servírování z `app/icon.svg`). To je OK pro moderní browsery, ale edge-case problémy mohou nastat.

### Proč Google ukazuje "růžové L na šedém pozadí"
Google Favicon API rasterizuje SVG na malou velikost (16-32px). Komplexní SVG silueta se na takové velikosti stává nečitelnou — zbyde jen rozpixelovaný tvar na tmavém pozadí, který Google interpretuje jako "L". **Řešení: poskytnout rasterizované PNG v rozumné velikosti.**

## Plán implementace (3 kroky)

### Krok 1: Vytvořit rasterizované varianty faviconu

Potřebné soubory v `app/`:
- `app/favicon.ico` — multi-size ICO (16x16, 32x32, 48x48) — pro starší browsery
- `app/icon.png` — 192x192 PNG — pro Android/Chrome tabs (nahradí icon.svg jako primary)
- `app/apple-icon.png` — 180x180 PNG — pro iOS home screen (nahradí apple-icon.svg)

**Jak vytvořit:**
Implementátor musí rasterizovat `icon.svg` do PNG. Doporučené přístupy:
1. **sharp** (Node.js) — `npx sharp-cli --input app/icon.svg --output ...` nebo jednoduchý Node script
2. **Alternativa:** ručně pomocí GIMP/Inkscape pokud NPM verze selhává
3. **Nebo:** programaticky vygenerovat PNG z SVG v build-time Node scriptu

Minimální script (`scripts/generate-favicons.mjs`):
```js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('app/icon.svg');

// 192x192 PNG for Chrome/Android
await sharp(svg).resize(192, 192).png().toFile('app/icon.png');

// 180x180 PNG for Apple
await sharp(svg).resize(180, 180).png().toFile('app/apple-icon.png');

// favicon.ico — 48x48 PNG (Next.js accepts .ico as PNG-in-ICO wrapper)
await sharp(svg).resize(48, 48).png().toFile('app/favicon.ico');
```

### Krok 2: Vyčistit SVG fallbacky

Po vygenerování PNG souborů:
- **Smazat `app/apple-icon.svg`** (nahrazeno `apple-icon.png`)
- **Ponechat `app/icon.svg`** — moderní browsery ho preferují a SVG je sharp v retina (Next.js automaticky prioritizuje SVG nad PNG pokud oba existují)

Nebo alternativně: smazat `app/icon.svg` a ponechat jen `app/icon.png` — jednoznačnější, méně potenciálních konfliktů.

**Doporučení:** Ponechat SVG (`app/icon.svg`) pro moderní browsery + přidat PNG (`app/icon.png`) jako fallback pro Google/starší. Next.js servíruje oba jako `<link rel="icon">` — browser si vybere.

### Krok 3: Ověření

1. Zkontrolovat `<head>` výstup na dev serveru — měly by tam být:
   - `<link rel="icon" href="/favicon.ico" sizes="48x48" />`
   - `<link rel="icon" href="/icon.svg" type="image/svg+xml" />`
   - `<link rel="apple-touch-icon" href="/apple-icon.png" />`
2. Otevřít `/favicon.ico` v browseru — měl by zobrazit ikonku
3. Google Rich Results Test / favicon checker

## Soubory k vytvoření/úpravě

| # | Soubor | Akce |
|---|--------|------|
| 1 | `scripts/generate-favicons.mjs` | VYTVOŘIT — Node script pro generování PNG z SVG |
| 2 | `app/favicon.ico` | VYTVOŘIT — 48x48 rasterizovaný |
| 3 | `app/icon.png` | VYTVOŘIT — 192x192 PNG |
| 4 | `app/apple-icon.png` | VYTVOŘIT — 180x180 PNG (nahrazuje apple-icon.svg) |
| 5 | `app/apple-icon.svg` | SMAZAT — nahrazeno PNG |
| 6 | `package.json` | DEV DEP — `sharp` (pokud ještě není) |

## Poznámky

- Next.js App Router automaticky generuje správné `<link>` tagy z souborů v `app/` — není třeba nic měnit v `layout.tsx`.
- Žádný `manifest.json` / `site.webmanifest` zatím nevytváříme — to spadá do Sprint 6 (PWA polish).
- `sharp` je již pravděpodobně transitivní závislost Next.js, ale pro přímé použití ho potřebujeme jako dev dependency.

## Závislosti

Žádné blokující závislosti. `sharp` NPM package.

## Očekávaný výsledek

1. Google Search zobrazí správný favicon (ženská silueta na tmavém pozadí, ne rozpixelované "L")
2. Všechny browsery (Chrome, Safari, Firefox, Edge) zobrazí správný favicon
3. iOS home screen ikona bude fungovat
4. `favicon.ico` funguje pro starší systémy a bookmarkování
