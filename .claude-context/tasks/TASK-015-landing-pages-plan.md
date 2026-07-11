# TASK-015: Landing pages — apartmany + SEO area pages

## Korekce rozsahu (v2 — od klienta pres lead)

Dva typy stranek, oba v `/pobocka/[slug]`:

### Typ 1: Apartmanove stranky (fyzicky apartman)
- **vinohrady** — Praha 2, hlavni, v provozu
- **praha-3** — Praha 3, Zizkov, otevreni 18.6.2026
- **praha-5** — Praha 5, Smichov/Andel, otevreni 25.7.2026

### Typ 2: SEO area pages (bez apartmanu, "obsluhujeme oblast")
- **stare-mesto** — Stare Mesto (Praha 1/2), odkazuje na vinohrady
- **nove-mesto** — Nove Mesto (Praha 1/2), odkazuje na vinohrady
- **smichov** — Smichov (ctvrt), odkazuje na praha-5

Area pages nemaji: apartment-specificke detaily (vybaveni, recenze, review form, transport/parking/payment karty, "co je v cene" karta).
Area pages maji: SEO intro text, divky v okoli, FAQ, hashtagy, odkaz na nejblizsi apartman(y), JSON-LD (BreadcrumbList, FAQPage — BEZ LocalBusiness).

---

## Audit stavu

### Landing content (lib/seo/landing-content.ts)

| Slug | Typ | Content existuje? |
|------|-----|-------------------|
| `vinohrady` | apartment | ANO — intro, FAQ (3), metaDesc, hashtagy |
| `praha-3` | apartment | ANO — intro, FAQ (3), metaDesc, hashtagy |
| `praha-5` | apartment | ANO — intro, FAQ (3), metaDesc, hashtagy |
| `stare-mesto` | area | NE — nutne vytvorit |
| `nove-mesto` | area | NE — nutne vytvorit |
| `smichov` | area | NE — nutne vytvorit |

### DB (locations tabulka)

| DB name (slug) | display_name | district | is_active | type |
|-----------------|-------------|----------|-----------|------|
| `praha-2` | Praha 2 | Praha 2 | 1 | — (neni sloupec) |
| `praha-3` | Praha 3 — Zizkov | Praha 3 | 1 | — |
| `praha-5` | Praha 5 — Andel | Praha 5 | 1 | — |

Chybi: `stare-mesto`, `nove-mesto`, `smichov` v DB. Chybi sloupec `location_type`.

### Slug mismatch (z predchoziho auditu)

DB ma `praha-2`, ale `LOCATION_CONTENT` pouziva `vinohrady`. Pobocka page (radek 322) hleda `getLocationContent(slug)` → `LOCATION_CONTENT['praha-2']` → null. **Bug: stranka `/pobocka/praha-2` nema landing content.**

---

## Plan implementace

### Krok 1: Pridat `location_type` sloupec do DB

**Soubor:** `lib/db.ts` — pridat runtime migraci

```sql
ALTER TABLE locations ADD COLUMN location_type TEXT DEFAULT 'apartment'
```

Hodnoty: `'apartment'` (default, zpetne kompatibilni) | `'area'`

### Krok 2: Prejmenovat slug `praha-2` → `vinohrady` v DB

**Soubor:** `lib/db.ts` — pridat runtime migraci

```sql
UPDATE locations SET name = 'vinohrady' WHERE name = 'praha-2'
```

Alternativne: novy radek `vinohrady` a redirect z `praha-2`. Ale rename je cistsi — `id` zustava, jen `name` (= slug) se meni.

### Krok 3: Pridat 3 nove area lokality do DB

**Soubor:** `scripts/add-locations.mjs` (rozsirit) nebo nova migrace v `lib/db.ts`

```sql
INSERT INTO locations (name, display_name, district, city, is_active, is_primary, location_type)
VALUES
  ('stare-mesto', 'Staré Město', 'Praha 1', 'Praha', 1, 0, 'area'),
  ('nove-mesto', 'Nové Město', 'Praha 1', 'Praha', 1, 0, 'area'),
  ('smichov', 'Smíchov', 'Praha 5', 'Praha', 1, 0, 'area');
```

### Krok 4: Pridat landing content pro 3 area lokality

**Soubor:** `lib/seo/landing-content.ts` — pridat do `LOCATION_CONTENT`

Nove polozky + rozsirit `LocationContent` interface o `nearestApartments`:

```ts
export interface LocationContent {
  metaDesc: { cs: string; en: string; de: string; uk: string };
  intro: { cs: string; en: string; de: string; uk: string };
  faq: LandingFaqItem[];
  relatedHashtags: string[];
  nearestApartments?: { slug: string; label: string; distance: string }[]; // NOVE
}
```

Data pro kazdy slug:

**`stare-mesto`:**
- intro: SEO text o Starem Meste, turisti, historicke centrum, pesi zona, blizko Vinohrady
- nearestApartments: `[{ slug: 'vinohrady', label: 'Vinohrady (Praha 2)', distance: '5 min' }]`
- FAQ: 3 otazky (kde je apartman, jak se dostat, ceny)
- metaDesc: "Escort Stare Mesto Praha — overene spolecnice v centru..."
- relatedHashtags: relevantni

**`nove-mesto`:**
- intro: SEO text o Novem Meste, Vaclavske namesti, obchodni centrum, blizko Vinohrady
- nearestApartments: `[{ slug: 'vinohrady', label: 'Vinohrady (Praha 2)', distance: '3 min' }]`
- FAQ: 3 otazky
- metaDesc: "Escort Nove Mesto Praha — diskretni spolecnice v centru..."

**`smichov`:**
- intro: SEO text o Smichove/Andelu, metro B, nakupni centrum, nocni zivot
- nearestApartments: `[{ slug: 'praha-5', label: 'Praha 5 — Anděl', distance: 'přímo v oblasti' }]`
- FAQ: 3 otazky
- metaDesc: "Escort Smichov Praha 5 — diskretni apartman u metra Andel..."

**DULEZITE:** Vsechny texty ve 4 jazycich (cs, en, de, uk). Muze napsat copywriter agent.

### Krok 5: Upravit pobocka page — podpora `area` typu

**Soubor:** `app/[locale]/pobocka/[slug]/page.tsx`

Pridat `location_type` do return objektu v `getLocationBySlug()` (queries.ts).

Na strance rozlisit typ a SCHOVAT apartment-specificke sekce pro area:

| Sekce | apartment | area |
|-------|-----------|------|
| Hero (H1, district, quick-meta) | ANO | ANO (upravit H1 — ne "Apartman" ale "Escort oblast") |
| "Hlavni pobocka" badge | ANO (isPrimary) | NE |
| Apartment photo placeholder | ANO | NE |
| Quick meta (hodiny, lokace, diskretnost) | ANO | CASTECNE (jen lokace) |
| Companions circles | ANO | ANO |
| About card (popis, features) | ANO | NAHRADIT: SEO intro text z landing content |
| "Co je v cene" karta | ANO | NE |
| Transport/Payment/Parking info karty | ANO | NE |
| **"Nejblizsi apartman" CTA** | NE | **ANO — NOVE** (odkaz na nearest apartment) |
| Related hashtags | ANO | ANO |
| FAQ | ANO | ANO |
| Apartment reviews + form | ANO | NE |
| Others (dalsi lokace) | ANO | ANO |
| Opening banner | ANO (upcoming) | NE |

**Implementace:**
```tsx
const isArea = loc.locationType === 'area';

// V hero:
{!isArea && loc.isPrimary && <span className="pobocka-badge">...</span>}
// H1: isArea ? "Escort {displayName}" : "Apartman {displayName}"

// Schovat apartment sekce:
{!isArea && (
  <div className="pobocka-grid-2col">
    {/* About card, Included card */}
  </div>
)}
{!isArea && (
  <div className="pobocka-info-grid">
    {/* Transport, Payment, Parking */}
  </div>
)}
{!isArea && (
  <section className="apt-section">
    {/* Reviews + form */}
  </section>
)}

// Nova sekce pro area — nejblizsi apartman:
{isArea && lc?.nearestApartments && (
  <section className="pobocka-section">
    <h2>Nejblizsi apartman</h2>
    {lc.nearestApartments.map(apt => (
      <Link href={`/pobocka/${apt.slug}`}>
        {apt.label} — {apt.distance}
      </Link>
    ))}
  </section>
)}

// Misto about card — zobrazit intro z landing content:
{isArea && lc?.intro && (
  <div className="pobocka-card">
    <p>{lc.intro[locale]}</p>
  </div>
)}
```

### Krok 6: Upravit JSON-LD pro area typ

**Soubor:** `app/[locale]/pobocka/[slug]/page.tsx`

- `apartment` typ: BreadcrumbList + **LocalBusiness** + FAQPage + ItemList (jak ted)
- `area` typ: BreadcrumbList + FAQPage + ItemList (**BEZ LocalBusiness** — neni fyzicky apartman)

```tsx
{!isArea && (
  <script type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
  />
)}
```

### Krok 7: Upravit queries.ts

**Soubor:** `lib/queries.ts`

Pridat `locationType` do return objektu `getLocationBySlug`:
```ts
locationType: r.location_type ? String(r.location_type) : 'apartment',
```

Pridat `locationType` do `getActiveLocations` return:
```ts
locationType: (r as Record<string, unknown>).location_type ? String((r as Record<string, unknown>).location_type) : 'apartment',
```

### Krok 8: Redirect praha-2 → vinohrady (volitelne)

Pokud se prejmenuje slug v DB, stare URL `/pobocka/praha-2` vrati 404. Pridat do `next.config.ts`:

```ts
async redirects() {
  return [
    { source: '/:locale/pobocka/praha-2', destination: '/:locale/pobocka/vinohrady', permanent: true },
  ];
}
```

Nebo v pobocka page pridat redirect logiku.

---

## Soubory k vytvorit/upravit

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `lib/db.ts` | UPRAVIT | Pridej migraci: `location_type` sloupec + rename `praha-2` → `vinohrady` + INSERT 3 area lokality |
| 2 | `lib/queries.ts` | UPRAVIT | Pridej `locationType` do `getLocationBySlug` a `getActiveLocations` return |
| 3 | `lib/seo/landing-content.ts` | UPRAVIT | Pridej `nearestApartments` do `LocationContent` interface + 3 nove area content bloky (stare-mesto, nove-mesto, smichov) |
| 4 | `app/[locale]/pobocka/[slug]/page.tsx` | UPRAVIT | Rozlisit `apartment` vs `area` — skryt/zobrazit sekce, pridat "nejblizsi apartman" CTA, upravit H1 pro area |
| 5 | `next.config.ts` | UPRAVIT | Redirect `/pobocka/praha-2` → `/pobocka/vinohrady` |
| 6 | `scripts/add-locations.mjs` | UPRAVIT (volitelne) | Pridat area lokality (alternativa k runtime migraci) |

**Zadny novy route.** Vsechno v existujicim `/pobocka/[slug]`.

---

## I18n labels (nove)

Pobocka page potrebuje nove labels pro area stranky:

```ts
// T[locale] doplnit o:
areaH1Prefix: string;       // cs: "Escort", en: "Escort", de: "Escort", uk: "Ескорт"
nearestAptH: string;         // cs: "Nejbližší apartmán", en: "Nearest apartment", ...
nearestAptCta: string;       // cs: "Rezervovat v tomto apartmánu", en: "Book at this apartment", ...
areaAboutH: string;          // cs: "O této oblasti", en: "About this area", ...
```

---

## Ocekavany vysledek

Po implementaci:

**Apartment pages (existujici, upravene):**
- `/pobocka/vinohrady` — plna stranka s intro, FAQ, recenze, vybaveni (opraveny slug)
- `/pobocka/praha-3` — plna stranka (uz funguje)
- `/pobocka/praha-5` — plna stranka (uz funguje)

**Area pages (NOVE):**
- `/pobocka/stare-mesto` — SEO text, divky v okoli, FAQ, odkaz na vinohrady
- `/pobocka/nove-mesto` — SEO text, divky v okoli, FAQ, odkaz na vinohrady
- `/pobocka/smichov` — SEO text, divky v okoli, FAQ, odkaz na praha-5

**Vsechny v sitemap** (automaticky z `getActiveLocations()`), se hreflang pro 4 jazyky.
**Vsechny se schema** (BreadcrumbList + FAQPage; apartment navic LocalBusiness).

---

## Poznamky

1. Area stranky nemaji `LocalBusiness` schema — neni to fyzicky misto.
2. Slovo "pobocka" v URL je OK i pro area — uzivatel nevidí tech typ, jen SEO-friendly URL.
3. Smichov jako area vs praha-5 jako apartment: `/pobocka/smichov` je SEO landing pro ctvrt, `/pobocka/praha-5` je stranka konkretniho apartmanu. Ruzne URL, ruzny obsah. Smichov odkazuje na praha-5.
4. Content pro area pages musi napsat copywriter ve 4 jazycich — idealne copywriter agenti (cs, en, de, uk).
