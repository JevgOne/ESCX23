# TASK-013: Video funkčnost (Vimeo embedy) — Audit & Report

## Aktuální stav

### Funguje

**1. DB model**
- Tabulka `girl_videos` (sloupce: `id`, `girl_id`, `filename`, `url`, `display_order`, `created_at`)
- `filename` se nastavuje jako `vimeo-{id}` (slouží jako identifikátor)
- Video count se počítá jako subquery `(SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id)`

**2. Admin — správa videí**
- **Soubor:** `app/[locale]/(admin)/admin/divky/[id]/videa/page.tsx`
- Formulář pro přidání Vimeo URL → Server Action `addGirlVideo` (`lib/admin-actions.ts:1292`)
- Smazání videa → Server Action `removeGirlVideo` (`lib/admin-actions.ts:1320`)
- Preview: iframe embed `https://player.vimeo.com/video/{vimeo_id}`
- Vimeo ID extrakce: regex pattern pro `vimeo.com/123`, `vimeo.com/video/123`, `player.vimeo.com/video/123`
- Čísté ID (jen čísla) je také akceptováno
- Display order: auto-increment

**3. Profil — zobrazení videí**
- **Soubor:** `components/profil/ProfilHero.tsx` (řádky 474-500)
- Videa se zobrazují pod fotogalerií v sekci "Video"
- Media tab ukazuje počet videí
- Každé video je Vimeo iframe embed
- Data flow: `profil/[slug]/page.tsx` → `getGirlVideos()` → `ProfilHero` (jako `videos` prop)

**4. Query vrstva**
- **Soubor:** `lib/queries.ts:2135-2156`
- `getGirlVideos(girlId)` — vrací `GirlVideo[]` s `id`, `girl_id`, `url`, `vimeo_id`, `created_at`
- `vimeo_id` se extrahuje z URL při čtení (ne při uložení)
- `videoCount` je dostupný na `GirlCard` interface (z subquery)

**5. GirlCard (listing)**
- **Soubor:** `components/girl/GirlCard.tsx`
- Zobrazuje video count badge na kartě dívky v listingu `/divky`

### Co chybí / potenciální problémy

**1. Studio — chybí správa videí**
- Studio panel (`/studio/*`) NEMÁ stránku pro správu videí
- Girl se nemůže sama přidat/smazat video — musí to udělat admin
- Studio stránky: zakladni, telo, fotky, sluzby, program, jazyky, dostupnost, kalendar, recenze, statistiky, stories, hlas, zprava, zivotni-styl, hashtagy, profil-status, rezervace — **žádná "videa"**
- **Doporučení:** Přidat `/studio/videa/page.tsx` s `loginGirl` auth a Server Actions pro add/remove

**2. Vimeo-only omezení**
- Systém podporuje POUZE Vimeo
- Žádná podpora pro YouTube, TikTok, nebo direct upload
- To je pravděpodobně záměr (Vimeo má lepší privacy controls)
- Nicméně regex by nezvládl Vimeo s query params: `vimeo.com/123456789?share=copy`

**3. Bez validace existence videa**
- `addGirlVideo` nekontroluje zda Vimeo ID skutečně existuje (nepinguje oEmbed API)
- Dá se přidat neexistující ID a iframe prostě nezobrazí nic
- **Low priority** — admin má vizuální preview

**4. Stories — video formát**
- Stories systém podporuje `media_type: 'video'` (viz `lib/queries.ts:1206`)
- Ale stories video upload pravděpodobně jde přes jiný flow (Vercel Blob pro media_url)
- Stories video != Vimeo embed — je to přímý upload

## Shrnutí

| Aspect | Status |
|--------|--------|
| DB model (`girl_videos`) | Funguje |
| Admin add/remove Vimeo | Funguje |
| Profil detail zobrazení | Funguje |
| GirlCard video count | Funguje |
| Vimeo ID extrakce | Funguje (základní URL formáty) |
| Studio self-service | Chybí |
| YouTube/jiné platformy | Nepodporováno (záměr?) |
| oEmbed validace | Chybí (low priority) |

## Soubory relevantní pro video

| Soubor | Účel |
|--------|------|
| `lib/queries.ts:2135-2156` | `getGirlVideos()` query + `GirlVideo` interface |
| `lib/admin-actions.ts:1281-1328` | `addGirlVideo`, `removeGirlVideo` Server Actions |
| `app/[locale]/(admin)/admin/divky/[id]/videa/page.tsx` | Admin video management page |
| `components/profil/ProfilHero.tsx:474-500` | Video display on profile |
| `app/[locale]/profil/[slug]/page.tsx:156-164` | Data fetching for videos |
| `components/girl/GirlCard.tsx` | Video count badge |
