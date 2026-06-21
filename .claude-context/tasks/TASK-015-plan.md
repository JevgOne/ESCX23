# TASK-015: Hodnocení apartmánů (Rate the Apartment) — Implementační plán

## Zadání
> "K pobočkám přidat rate the apartment nebo něco v tom smyslu kde můžou lidi hodnotit apartmán"

## Aktuální stav

### Pobočky (locations)
- Tabulka `locations` (id, name, display_name, district, city, address, is_active, is_primary, opening_date, ...)
- Stránka `/pobocka/[slug]` — propracovaná detail stránka s hero, about, features, transport, parking, CTA
- Existující lokace: Vinohrady, Žižkov (otvírá 18.6.), Smíchov (plánovaný 25.7.)
- JSON-LD: `LocalBusiness` schema

### Recenze dívek (existující vzor)
- Tabulka `reviews` (id, girl_id, author_name, author_email, rating, title, content, status, vibe, tags, helpful_count, ...)
- Formulář na `/recenze/nova/[slug]` — Server Action, honeypot-free, rating 1-5, mood emoji, vibe tags
- Admin moderace: `/admin/recenze` — schválení/zamítnutí
- Status workflow: `pending` → `approved` / `rejected`
- Notification při nové recenzi (`createAdminNotification`)

---

## Implementační plán

### Krok 1: DB — Nová tabulka `apartment_reviews`

```sql
CREATE TABLE IF NOT EXISTS apartment_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  -- Optional sub-ratings
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  discretion INTEGER CHECK (discretion >= 1 AND discretion <= 5),
  comfort INTEGER CHECK (comfort >= 1 AND comfort <= 5),
  -- Moderation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER,
  approved_at DATETIME,
  -- Meta
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

**Proč separátní tabulka místo rozšíření `reviews`:**
- `reviews` má `girl_id NOT NULL` — nelze bez refaktoru
- Apartment reviews mají jiné sub-ratings (čistota, diskrétnost, komfort vs. celkový zážitek s dívkou)
- Jednodušší queries, čistší separace

**Migrace:** Přidat do `lib/db.ts` `runMigrations()`.

### Krok 2: Queries — `lib/queries.ts`

```ts
// Nové funkce:

export interface ApartmentReview {
  id: number;
  locationId: number;
  authorName: string;
  rating: number;
  content: string;
  cleanliness: number | null;
  discretion: number | null;
  comfort: number | null;
  createdAt: string;
}

export async function getApartmentReviews(locationId: number): Promise<ApartmentReview[]> { ... }

export async function getApartmentRatingStats(locationId: number): Promise<{
  avgRating: number;
  totalReviews: number;
  avgCleanliness: number | null;
  avgDiscretion: number | null;
  avgComfort: number | null;
}> { ... }

export async function getPendingApartmentReviews(): Promise<...[]> { ... }
```

### Krok 3: Server Actions — `lib/apartment-review-actions.ts` (nový soubor)

```ts
'use server';

export async function submitApartmentReview(formData: FormData) {
  // Validace: rating 1-5, content min 10 chars, author_name required
  // Insert do apartment_reviews se status='pending'
  // createAdminNotification('Nová recenze apartmánu ...')
  // redirect zpět na pobočku s ?sent=ok
}

export async function approveApartmentReview(formData: FormData) {
  // Admin only — requireAdmin()
  // UPDATE apartment_reviews SET status='approved', approved_at=..., approved_by=...
}

export async function rejectApartmentReview(formData: FormData) {
  // Admin only — requireAdmin()
  // UPDATE apartment_reviews SET status='rejected'
}

export async function deleteApartmentReview(formData: FormData) {
  // Admin only — requireFullAdmin()
  // DELETE FROM apartment_reviews WHERE id=?
}
```

### Krok 4: UI na stránce pobočky — `app/[locale]/pobocka/[slug]/page.tsx`

Přidat dvě nové sekce pod stávající obsah (před "Další apartmány"):

**A) Sekce s přehledem hodnocení:**
```
+------------------------------------------+
|  ★ 4.7 z 5  ·  12 hodnocení             |
|                                          |
|  Čistota    ████████░░ 4.5               |
|  Diskrétnost ████████░░ 4.8              |
|  Komfort    ████████░░ 4.6               |
+------------------------------------------+
```

**B) Seznam recenzí (schválených):**
```
+------------------------------------------+
|  ★★★★★  Martin  ·  15.6.2026            |
|  Skvělý apartmán, čistý a diskrétní...  |
+------------------------------------------+
|  ★★★★☆  Jan  ·  10.6.2026               |
|  Hezky zařízený, trochu hlučnější...     |
+------------------------------------------+
```

**C) Formulář pro přidání hodnocení:**
```
+------------------------------------------+
|  Ohodnoťte apartmán                      |
|                                          |
|  Vaše jméno: [_______________]           |
|  Celkové hodnocení: ★ ★ ★ ★ ★           |
|  Čistota: ★ ★ ★ ★ ★                     |
|  Diskrétnost: ★ ★ ★ ★ ★                 |
|  Komfort: ★ ★ ★ ★ ★                     |
|  Váš komentář: [_______________]         |
|                                          |
|  [Odeslat hodnocení]                     |
+------------------------------------------+
```

**Implementace hvězdiček bez JS:**
- CSS-only star rating: `<input type="radio" name="rating" value="5">` v reverse order s CSS `:checked ~ label` pattern
- Fallback pro no-JS: `<select name="rating"><option value="5">5 hvězd</option>...</select>` v `<noscript>`
- Nebo jednoduše `<select>` pro všechny sub-ratings (čistější, funguje vždy)

**Lokalizace:** Všechny labels ve 4 jazycích (cs/en/de/uk) — inline dictionary pattern jako ve stávající pobočka stránce.

### Krok 5: Admin panel — `/admin/recenze-apartmanu`

Nová stránka `app/[locale]/(admin)/admin/recenze-apartmanu/page.tsx`:
- Tabulka pending apartment reviews
- Tlačítka: Schválit / Zamítnout / Smazat
- Server Actions z `lib/apartment-review-actions.ts`
- Navigace: přidat odkaz do AdminSidebar

### Krok 6: SEO — AggregateRating

Na stránce pobočky přidat do existujícího `LocalBusiness` JSON-LD:

```json
{
  "@type": "LocalBusiness",
  "name": "LovelyGirls Vinohrady",
  ...
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "12",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

**Soubor:** `lib/seo/jsonld.ts` — rozšířit `localBusinessJsonLd()` o volitelný `aggregateRating` parameter.

### Krok 7: Anti-spam

- Honeypot pole (skrytý input `<input name="website" style="display:none">` — pokud vyplněný → spam)
- Rate limiting: kontrola IP v `apartment_reviews` — max 1 review na location per IP za 24h
- Minimální délka textu: 10 znaků
- Admin moderace (default status = `pending`)

---

## Soubory k vytvoření

| Soubor | Účel |
|--------|------|
| `lib/apartment-review-actions.ts` | Server Actions (submit, approve, reject, delete) |
| `app/[locale]/(admin)/admin/recenze-apartmanu/page.tsx` | Admin moderation page |

## Soubory k úpravě

| Soubor | Změna |
|--------|-------|
| `lib/db.ts` | CREATE TABLE `apartment_reviews` v runMigrations |
| `lib/queries.ts` | `getApartmentReviews()`, `getApartmentRatingStats()`, `getPendingApartmentReviews()` |
| `app/[locale]/pobocka/[slug]/page.tsx` | Přidat rating overview + reviews list + review form |
| `app/globals.css` | CSS pro rating sekci, formulář, hvězdičky (~60 řádků) |
| `lib/seo/jsonld.ts` | Rozšířit `localBusinessJsonLd()` o `aggregateRating` |
| `components/admin/AdminSidebar.tsx` | Přidat odkaz na "Recenze apartmánů" |

## Scope

- 2 nové soubory + 6 upravených
- ~200 řádků TypeScript, ~60 řádků CSS
- Čistě server-side (no `'use client'`)
- Formuláře přes Server Actions (`<form action={...}>`)
- Hvězdičky přes `<select>` nebo CSS-only radio pattern
- Funguje bez JS

## Závislosti

- Žádné nové npm balíčky
- Závisí na existující `locations` tabulce a `createAdminNotification()` funkci
