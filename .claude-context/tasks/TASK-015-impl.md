# TASK-015: Implementace — Hodnoceni apartmanu (Rate the Apartment)

## Datum: 2026-06-21

## Nove soubory

### 1. `lib/apartment-review-actions.ts`
- Server Actions: `submitApartmentReview`, `approveApartmentReview`, `rejectApartmentReview`, `deleteApartmentReview`
- Honeypot anti-spam (skryte `website` pole)
- IP-based rate limiting: max 1 review per location per IP per 24h
- Validace: rating 1-5, content min 10 chars, author_name required
- `createAdminNotification()` pri nove recenzi
- Redirect zpet na pobocku s `?sent=ok` nebo `?error=...`

### 2. `app/[locale]/(admin)/admin/recenze-apartmanu/page.tsx`
- Admin moderacni stranka
- Zobrazuje vsechny apartment reviews (pending first, pak approved/rejected)
- Tlacitka: Schvalit / Zamitnout / Smazat
- Status badge (pending/approved/rejected)
- Ukazuje sub-ratings (cistota/diskretnost/komfort) pokud vyplneny
- `force-dynamic`, `revalidate: 0`

## Upravene soubory

### 3. `lib/db.ts`
- Pridana migrace `CREATE TABLE IF NOT EXISTS apartment_reviews` v `runMigrations()`
- Sloupce: id, location_id, author_name, rating (1-5), content, cleanliness, discretion, comfort, status, approved_by, approved_at, created_at, ip_address

### 4. `lib/queries.ts`
- `getApartmentReviews(locationId)` — vrati schvalene recenze pro pobocku
- `getApartmentRatingStats(locationId)` — prumerne hodnoceni + sub-ratings
- `getPendingApartmentReviews()` — vsechny recenze pro admin (pending first)
- Nove typy: `ApartmentReview`, `PendingApartmentReview`

### 5. `app/[locale]/pobocka/[slug]/page.tsx`
- Import apartment review queries + actions
- Data fetching: `getApartmentReviews()` + `getApartmentRatingStats()` (parallel)
- Rating overview sekce (prumer, sub-rating bars)
- Reviews list (hvezdicky, autor, datum, text)
- Review formular (<select> pro rating, ne CSS-only radio — dle Evzenovy poznamky)
- Honeypot pole (hidden, aria-hidden)
- Success/error messages z URL params (?sent=ok, ?error=validation, ?error=ratelimit)
- Lokalizace: vsechny labely v CS/EN/DE/UK
- JSON-LD: `localBusinessJsonLd()` nyni predava `ratingValue`/`ratingCount` pro aggregateRating
- Formular se nezobrazuje pro upcoming (jeste neotevrene) pobocky

### 6. `app/globals.css`
- ~65 radku CSS pro apartment reviews (overview, bars, cards, form)
- Responsivni: sub-ratings grid 3-col → 1-col na mobilu
- Vizualni konzistence s existujicim designem (coral/magenta theme)

### 7. `components/admin/AdminSidebar.tsx`
- Pridan odkaz "Recenze apartmanu" s ikonou domku
- Badge s poctem pending apartment reviews
- `managerCanSee: true` — viditelne i pro managery

### 8. `lib/seo/jsonld.ts`
- Uz existujici podpora `ratingValue`/`ratingCount` v `localBusinessJsonLd()` — nepotrebovalo zmenu

## Overeni
- TypeScript kompilace: OK (tsc --noEmit bez chyb)
- Vsechny formulate pouzivaji Server Actions — funguje bez JS
- Rating pres `<select>` (ne CSS-only radio) — dle Evzenovy poznamky
