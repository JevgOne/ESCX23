# TASK-016: Video pod tab + lepší design — Implementační plán (v2)

## Zadání (upřesnění)
> Video NESMÍ být zobrazené pod fotkami. Musí být schované pod VIDEO tabem — klik na tab přepne obsah (PHOTO grid vs VIDEO embed). Server-side, bez JS.

## Aktuální stav

### Media tabs (nefunkční placeholder)
**`components/profil/ProfilHero.tsx:472-477`:**
```tsx
<div className="media-tabs">
  <span className="media-tab active">Foto <span className="media-tab-count">13</span></span>
  {videos.length > 0 && (
    <span className="media-tab">Video <span className="media-tab-count">1</span></span>
  )}
</div>
```
- Taby jsou `<span>` — neklikatelné, žádný přepínání
- Foto tab je vždy `active`
- Video tab jen ukazuje počet, nic nepřepíná

### Video sekce (vždy viditelná pod fotkami)
**`components/profil/ProfilHero.tsx:486-505`:**
```tsx
{videos.length > 0 && (
  <div className="profile-videos">
    <div className="profile-videos-label">Video (1)</div>
    <div className="profile-videos-grid">
      {videos.map((v) => (
        <div key={v.id} className="profile-video-embed">
          <iframe src={`https://player.vimeo.com/video/${v.vimeo_id}...`} />
        </div>
      ))}
    </div>
  </div>
)}
```
- Video je VŽDY viditelné pod fotkami
- Duplikuje label z media-tab

### Profile page (žádné searchParams)
**`app/[locale]/profil/[slug]/page.tsx:145`:**
```tsx
export default async function ProfilPage({ params }: Props) {
```
- Stránka nepřijímá `searchParams`
- ProfilHero nemá prop pro aktivní tab

---

## Implementační plán

### Přístup: URL param `?media=video`

Server-side tab switching přes URL parametry — konzistentní s CLAUDE.md pravidlem "funguje bez JS" a existujícím vzorem ve filtru dívek (`/divky?status=available`).

- Default: `?media=photo` (nebo bez parametru = foto)
- Klik na VIDEO tab: `?media=video`
- Server Component čte `searchParams.media` a zobrazí příslušný obsah

### Krok 1: Profile page — přidat `searchParams` + předat do ProfilHero

**Soubor:** `app/[locale]/profil/[slug]/page.tsx`

```tsx
// Změna 1: rozšířit Props interface
interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ media?: string }>;  // NOVÉ
}

// Změna 2: v page komponentě přečíst searchParams
export default async function ProfilPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const activeMedia = sp.media === 'video' ? 'video' : 'photo';

  // Změna 3: předat do ProfilHero
  <ProfilHero
    ...
    activeMedia={activeMedia}  // NOVÉ
    slug={slug}                // NOVÉ (pro stavbu URL tabů)
  />
```

### Krok 2: ProfilHero — funkční taby + podmíněné zobrazení

**Soubor:** `components/profil/ProfilHero.tsx`

**2a) Přidat props:**
```tsx
interface ProfilHeroProps {
  // ... existující props ...
  activeMedia?: 'photo' | 'video';  // NOVÉ
  slug?: string;                     // NOVÉ
}
```

**2b) Přepsat media-tabs na `<a>` linky (řádky 472-477):**

Aktuálně:
```tsx
<div className="media-tabs">
  <span className="media-tab active">Foto ...</span>
  <span className="media-tab">Video ...</span>
</div>
```

Po změně:
```tsx
<div className="media-tabs">
  <a
    href={`/${locale}/profil/${slug}`}
    className={`media-tab${activeMedia === 'photo' ? ' active' : ''}`}
  >
    {fotoLabel} <span className="media-tab-count">{photos.length}</span>
  </a>
  {videos.length > 0 && (
    <a
      href={`/${locale}/profil/${slug}?media=video`}
      className={`media-tab${activeMedia === 'video' ? ' active' : ''}`}
    >
      {videoLabel} <span className="media-tab-count">{videos.length}</span>
    </a>
  )}
</div>
```

**Poznámka k lokalizovaným URL:** `profil` je `profil` ve všech jazycích kromě EN (`profile`). Použít:
```tsx
const profileSegment = locale === 'en' ? 'profile' : 'profil';
// href={`/${locale}/${profileSegment}/${slug}`}
// href={`/${locale}/${profileSegment}/${slug}?media=video`}
```

**2c) Podmíněné zobrazení fotek vs videí (řádky 479-505):**

Aktuálně: fotky + videa vždy viditelné.

Po změně:
```tsx
{activeMedia === 'photo' && allPhotos.length > 0 && (
  <PhotoLightbox ... />
)}

{activeMedia === 'video' && videos.length > 0 && (
  <div className="profile-videos">
    <div className="profile-videos-grid">
      {videos.map((v) => (
        <div key={v.id} className="profile-video-card">
          <div className="profile-video-embed">
            <iframe
              src={`https://player.vimeo.com/video/${v.vimeo_id}?badge=0&autopause=0&player_id=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`${name} video`}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**2d) Smazat** starý `profile-videos-label` (řádky 488-490) — label "Video (1)" je zbytečný, tab to řeší.

### Krok 3: CSS úpravy

**Soubor:** `app/globals.css`

**3a) Media tabs — `<a>` místo `<span>`:**
```css
/* Přidat (řádek ~9868): */
.media-tab {
  /* ... existující styly ... */
  text-decoration: none;  /* pro <a> element */
  cursor: pointer;
}
.media-tab:hover {
  color: var(--color-coral);
}
```

**3b) Video karta (nový):**
```css
.profile-video-card {
  background: var(--color-surface-raised, rgba(255,255,255,0.04));
  border: 1px solid var(--color-line);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.profile-video-card:hover {
  border-color: rgba(242, 125, 141, 0.3);
}
```

**3c) Video embed v kartě:**
```css
.profile-video-card .profile-video-embed {
  border-radius: 0;  /* wrapper dělá zaoblení */
}
```

**3d) Responsive grid pro více videí:**
```css
@media (min-width: 768px) {
  .profile-videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

**3e) Smazat** `.profile-videos-label` CSS (řádky 9932-9938) — už nepotřebujeme.

### Krok 4: (Volitelné) Click-to-play s thumbnail

Místo okamžitého načtení Vimeo iframe zobrazit thumbnail s play buttonem. Iframe se načte po kliknutí.

**Implementace s `<details>`:**
```tsx
<details className="profile-video-card">
  <summary className="profile-video-poster">
    <img
      src={`https://vumbnail.com/${v.vimeo_id}.jpg`}
      alt={`${name} video`}
      loading="lazy"
    />
    <div className="profile-video-play">▶</div>
  </summary>
  <div className="profile-video-embed">
    <iframe src={`...?autoplay=1`} ... />
  </div>
</details>
```

**Toto je BONUS, ne povinné.** Minimální scope je taby + karta kolem iframe.

---

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `app/[locale]/profil/[slug]/page.tsx` | Přidat `searchParams` do Props, přečíst `media` param, předat `activeMedia` + `slug` do ProfilHero |
| `components/profil/ProfilHero.tsx` | Přidat `activeMedia`/`slug` props, taby na `<a>` linky, podmíněné zobrazení foto/video, smazat `profile-videos-label`, přidat `profile-video-card` wrapper |
| `app/globals.css` | Přidat hover na media-tab, `.profile-video-card` styly, smazat `.profile-videos-label`, responsive grid |

## Scope

- 3 soubory k úpravě
- ~15 řádků TypeScript v page.tsx
- ~25 řádků TypeScript v ProfilHero.tsx (přepis existujících řádků)
- ~25 řádků CSS (nové + úpravy)
- Čistě server-side (no `'use client'`)
- Tab switching přes URL params (`<a>` linky) — funguje bez JS
- Žádné nové npm balíčky

## Chování po změně

| URL | Zobrazení |
|-----|-----------|
| `/profil/anetta` | Foto tab active, grid thumbnailů (default) |
| `/profil/anetta?media=photo` | Foto tab active, grid thumbnailů |
| `/profil/anetta?media=video` | Video tab active, Vimeo embed(y) v kartě |
| `/profil/anetta?media=cokoliv` | Fallback na foto (neznámá hodnota = photo) |

## Vizuální náhled

**Foto tab (default):**
```
  [FOTO 13]  [VIDEO 1]          ← taby, FOTO active (coral underline)
  ┌────┐┌────┐┌────┐┌────┐
  │ 📷 ││ 📷 ││ 📷 ││ 📷 │     ← thumbnail grid (4 sloupce)
  └────┘└────┘└────┘└────┘
  ┌────┐┌────┐┌────┐┌────┐
  │ 📷 ││ 📷 ││ 📷 ││ 📷 │
  └────┘└────┘└────┘└────┘
```

**Video tab:**
```
  [FOTO 13]  [VIDEO 1]          ← taby, VIDEO active (coral underline)
  ┌──────────────────────────┐
  │ ┌──────────────────────┐ │
  │ │                      │ │   ← Vimeo iframe v kartě
  │ │   Vimeo player       │ │
  │ │                      │ │
  │ └──────────────────────┘ │
  └──────────────────────────┘
```

## Bezpečnostní poznámky

- `searchParams.media` je sanitizován: pouze `'video'` je akceptováno, vše ostatní = `'photo'`
- Žádný XSS risk — hodnota se nepoužívá v HTML output, jen pro podmínku
- URL param neovlivňuje SEO — canonical URL je bez `?media=` parametru (zajistí existující `getProfileCanonical()`)
