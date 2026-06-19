# TASK-013: Opening dates — Implementation Complete

## What was done

### 1. DB Migration
- Added `opening_date TEXT` column to `locations` table
- Set `2026-06-18` for praha-3 (Zizkov)
- Set `2026-07-25` for praha-5 (Smichov)

### 2. Queries (lib/queries.ts)
- Added `openingDate: string | null` to `Location` interface
- Added `opening_date` to `getActiveLocations()` SELECT + return
- Added `openingDate` to `getLocationBySlug()` return

### 3. LocationsRow (components/home/LocationsRow.tsx)
- Replaced hardcoded `preparingSlugs` Set with date-based logic: `loc.openingDate != null && loc.openingDate > today`
- Uses `pragueDateISO()` for Prague timezone
- Shows opening date alongside "Otevíráme" badge (e.g. "Otevíráme · 18.6.")
- Updated labels: "Připravujeme" → "Otevíráme" (CS), "Coming soon" → "Opening" (EN), etc.
- Added `formatOpeningDate()` helper with locale-aware formatting

### 4. Rozvrh filter (app/[locale]/rozvrh/page.tsx)
- Filters out not-yet-open locations from the location pills
- `openLocations = dbLocations.filter(l => !l.openingDate || l.openingDate <= today)`

### 5. Pobocka detail (app/[locale]/pobocka/[slug]/page.tsx)
- Added opening banner for future locations with party emoji, title and formatted date
- 4-language labels (CS/EN/DE/UK)
- Uses `pragueDateISO()` for timezone-correct comparison

### 6. Admin panel
- **List** (admin/pobocky/page.tsx): Added `opening_date` column to table
- **Edit** (admin/pobocky/[id]/page.tsx): Added date input field with helper text
- **New** (admin/pobocky/nova/page.tsx): Added date input field
- **Actions** (lib/admin-actions.ts): Added `opening_date` to `createPobocka()` and `updatePobocka()`

### 7. CSS (app/globals.css)
- Added `.pobocka-opening-banner`, `.pobocka-opening-icon`, `.pobocka-opening-title`, `.pobocka-opening-date` styles

### 8. SEO (lib/seo/landing-content.ts)
- Added `LOCATION_CONTENT['praha-3']` with metaDesc, intro, 3 FAQ items, relatedHashtags
- Added `LOCATION_CONTENT['praha-5']` with metaDesc, intro, 3 FAQ items, relatedHashtags

### 9. Footer (components/layout/SiteFooter.tsx)
- Upcoming locations show " — brzy" (CS) / "soon" (EN) / "bald" (DE) / "скоро" (UK) suffix

## Verification
- TypeScript: `npx tsc --noEmit` — clean, no errors
- Build: `npx next build` — success
- Auto-transition: When today >= opening_date, location automatically becomes "open" (no manual action)

## Files modified
- `data/app.db` (migration)
- `lib/queries.ts`
- `components/home/LocationsRow.tsx`
- `app/[locale]/rozvrh/page.tsx`
- `app/[locale]/pobocka/[slug]/page.tsx`
- `app/[locale]/(admin)/admin/pobocky/page.tsx`
- `app/[locale]/(admin)/admin/pobocky/[id]/page.tsx`
- `app/[locale]/(admin)/admin/pobocky/nova/page.tsx`
- `lib/admin-actions.ts`
- `app/globals.css`
- `lib/seo/landing-content.ts`
- `components/layout/SiteFooter.tsx`
