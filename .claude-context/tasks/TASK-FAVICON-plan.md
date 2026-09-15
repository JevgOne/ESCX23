# TASK #5: STUDIOFLOW favicon — jiný než hlavní web

## Status: PLÁN HOTOVÝ — čeká na implementaci

## Analýza

### Aktuální stav
- Hlavní web (`app/[locale]/layout.tsx` řádky 52-58) definuje icons v metadata:
  - `/favicon.ico` (48x48)
  - `/icon.svg` (SVG — růžový LovelyGirls logo na černém pozadí)
  - `/icon.png` (192x192)
  - `/apple-icon.png` (180x180)
- STUDIOFLOW booking layout (`app/booking/layout.tsx` řádky 9-12) má jen:
  ```ts
  export const metadata: Metadata = {
    title: { default: 'STUDIOFLOW', template: '%s · STUDIOFLOW' },
    robots: { index: false, follow: false, nocache: true },
  };
  ```
  **Žádné `icons`** → v Next.js App Router dědí default z `app/favicon.ico` (LovelyGirls logo)

### Problém
Admin/operátorka mají otevřených více tabů — hlavní web + STUDIOFLOW. Oba mají stejný favicon → nelze je vizuálně rozlišit.

### Jak Next.js App Router řeší favicony
1. **Route-specific icon files:** `app/booking/icon.svg` (nebo `.png`, `.ico`) — Next.js automaticky servíruje jako favicon pro `/booking/*` routes
2. **Metadata API:** `export const metadata = { icons: { icon: [...] } }` v layout.tsx
3. **Generovaný icon:** `app/booking/icon.tsx` — dynamicky generovaný favicon pomocí `ImageResponse`

## Plán implementace

### Přístup A: Statický SVG favicon (DOPORUČENO — nejjednodušší)

#### Krok 1: Vytvořit `app/booking/icon.svg`
Jednoduchý SVG favicon pro STUDIOFLOW — rozlišitelný od LovelyGirls:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="12" fill="#110d15"/>
  <text x="32" y="42" text-anchor="middle" font-family="system-ui, sans-serif" 
        font-weight="800" font-size="28" fill="#f27d8d">SF</text>
</svg>
```

Nebo alternativně gradient "SF" logo v coral/magenta barvách.

#### Krok 2: Přidat `icons` do booking layout metadata
V `app/booking/layout.tsx`:
```ts
export const metadata: Metadata = {
  title: { default: 'STUDIOFLOW', template: '%s · STUDIOFLOW' },
  robots: { index: false, follow: false, nocache: true },
  icons: {
    icon: '/booking/icon.svg',
  },
};
```

**ALE:** Next.js App Router automaticky detekuje `icon.svg` v route segmentu a servíruje ho — nemusí se přidávat do metadata explicitně. Stačí jen vytvořit soubor.

### Přístup B: Dynamicky generovaný favicon (alternativa)

Vytvořit `app/booking/icon.tsx`:
```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: 64, height: 64, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#110d15', borderRadius: 12,
      color: '#f27d8d', fontSize: 28, fontWeight: 800,
    }}>
      SF
    </div>,
    { ...size }
  );
}
```

Výhoda: pixel-perfect, works everywhere. Nevýhoda: mírně pomalejší (server-rendered).

### Doporučení
**Přístup A** (statický SVG) — nejjednodušší, žádný server overhead. Pokud SVG text rendering nedělá problémy v prohlížečích, stačí to.

## Soubory k vytvořit/editovat
1. **`app/booking/icon.svg`** — NOVÝ soubor (favicon SVG)
2. Volitelně `app/booking/icon.png` jako fallback pro starší prohlížeče

## Design specifikace
- Pozadí: `#110d15` (STUDIOFLOW bg-sidebar)
- Text/logo: `#f27d8d` (coral) — "SF" nebo stylizovaný symbol
- Border-radius: 12px (konzistentní s LovelyGirls icon)
- Jasně rozlišitelný od růžového LG loga v tab baru
