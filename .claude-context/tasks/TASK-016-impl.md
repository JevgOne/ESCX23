# TASK-016: Implementace — Video pod tab + lepší design

## Datum: 2026-06-21

## Změněné soubory

### 1. `app/[locale]/profil/[slug]/page.tsx`
- Rozšířen `Props` interface o `searchParams: Promise<{ media?: string }>`
- V `ProfilPage` se čte `searchParams.media` a sanitizuje na `'photo' | 'video'` (default: `'photo'`)
- Předány nové props `activeMedia` a `slug` do `<ProfilHero>`

### 2. `components/profil/ProfilHero.tsx`
- Přidány props `activeMedia?: 'photo' | 'video'` a `slug?: string` do `ProfilHeroProps`
- Media tabs přepsány z `<span>` na `<a>` linky:
  - Foto tab: `href=/{locale}/profil/{slug}` (clean URL, bez param)
  - Video tab: `href=/{locale}/profil/{slug}?media=video`
  - Locale-aware: EN používá `/profile/`, ostatní `/profil/`
  - Active tab má CSS třídu `.active` (coral barva + underline)
- Podmíněné zobrazení:
  - `activeMedia === 'photo'` → `<PhotoLightbox>` (thumbnail grid)
  - `activeMedia === 'video'` → Vimeo embedy v kartách
- Smazán duplicitní `profile-videos-label` ("Video (1)")
- Video embed zabalen do `.profile-video-card` (border, border-radius, hover efekt)

### 3. `app/globals.css`
- `.media-tab`: změněn `cursor: default` → `cursor: pointer`, přidáno `text-decoration: none`, `transition: color 0.2s`
- Přidán `.media-tab:hover` s coral barvou
- Smazán `.profile-videos-label` (nepotřebný — tab to řeší)
- Přidán `.profile-video-card` (border, border-radius 14px, surface-raised background, hover border-color)
- `.profile-video-embed` odstraněn border-radius (wrapper card to dělá)
- Přidán responsive grid: `@media (min-width: 768px)` → 2 sloupce pro více videí

## Chování po změně

| URL | Zobrazení |
|-----|-----------|
| `/profil/anetta` | Foto tab active, thumbnail grid |
| `/profil/anetta?media=photo` | Foto tab active, thumbnail grid |
| `/profil/anetta?media=video` | Video tab active, Vimeo embed(y) v kartě |
| `/profil/anetta?media=cokoliv` | Fallback na foto (neznámá hodnota = photo) |

## Ověření
- TypeScript kompilace: OK (tsc --noEmit bez chyb, pouze pre-existing e2e test warnings)
- Server-side rendering: tab switching přes URL params (`<a>` linky), funguje bez JS
- Žádné nové npm balíčky
