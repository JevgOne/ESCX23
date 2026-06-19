# TASK-002: Opening dates for Zizkov (18.6.) and Smichov (25.7.) — Plan

## Analysis result: ALREADY IMPLEMENTED

All code changes for this task have **already been implemented** in uncommitted changes on the `main` branch. This is a continuation of TASK-013 from a previous session.

## What is already done (verified in current codebase)

### 1. Database schema
- `opening_date TEXT` column exists on `locations` table
- Values need verification: `praha-3` should have `2026-06-18`, `praha-5` should have `2026-07-25`

### 2. Queries (`lib/queries.ts`)
- `Location` interface includes `openingDate: string | null` (line 428)
- `getActiveLocations()` SELECTs and returns `opening_date` (lines 483-496)
- `getLocationBySlug()` returns `openingDate` (line 479)

### 3. Homepage LocationsRow (`components/home/LocationsRow.tsx`)
- Data-driven `isPreparing` logic using `loc.openingDate > today` (line 44)
- Shows `formatOpeningDate()` date alongside "Otevíráme" badge (line 71)
- Uses `pragueDateISO()` for Prague timezone comparison (line 33)
- CSS classes: `.loc-row-preparing` (dashed/opacity), `.loc-row-badge-soon`

### 4. Pobocka detail page (`app/[locale]/pobocka/[slug]/page.tsx`)
- Opening banner with i18n labels (lines 263-268, 339-355)
- Uses `isUpcoming = loc.openingDate != null && loc.openingDate > today` (line 261)
- `formatOpeningDate()` for localized date display
- CSS: `.pobocka-opening-banner`, `.pobocka-opening-icon`, `.pobocka-opening-title`, `.pobocka-opening-date`

### 5. Rozvrh schedule filter (`app/[locale]/rozvrh/page.tsx`)
- Filters out not-yet-open locations from filter pills (line 136):
  ```ts
  const openLocations = dbLocations.filter((l) => !l.openingDate || l.openingDate <= today);
  ```

### 6. SiteFooter (`components/layout/SiteFooter.tsx`)
- Marks upcoming locations with "— brzy/soon/bald/skoro" suffix (lines 130-150)
- Uses `pragueDateISO()` for date comparison

### 7. Admin pages
- **List** (`admin/pobocky/page.tsx`): `opening_date` column in table (lines 51-55)
- **Edit** (`admin/pobocky/[id]/page.tsx`): `opening_date` date input with hint text (lines 172-179)
- **New** (`admin/pobocky/nova/page.tsx`): `opening_date` date input (lines 139-144)

### 8. Admin actions (`lib/admin-actions.ts`)
- `createPobocka()`: handles `opening_date` in INSERT (lines 457, 463)
- `updatePobocka()`: handles `opening_date` in UPDATE (lines 491, 493, 501)

### 9. SEO landing content (`lib/seo/landing-content.ts`)
- `LOCATION_CONTENT['praha-3']`: metaDesc, intro, 3 FAQ items, relatedHashtags (lines 267-295)
- `LOCATION_CONTENT['praha-5']`: metaDesc, intro, 3 FAQ items, relatedHashtags (lines 297-325)
- `LOCATION_CONTENT['vinohrady']`: already existed (lines 327-355)

### 10. CSS (`app/globals.css`)
- `.pobocka-opening-banner` styles (line ~12405)
- `.loc-row-preparing`, `.loc-row-badge-soon` styles (lines ~1618, ~1669)

### 11. Utility (`lib/utils.ts`)
- `formatOpeningDate()` helper — "18.6." for CS, "Jun 18" for EN (lines 51-60)
- `pragueDateISO()` for Prague-timezone date comparison (lines 24-30)

## What the implementor needs to do

### Step 1: Verify DB data
Run a quick check that the opening dates are actually set in the database:
```bash
cd /Users/zen/Projects/ESCX23
npx tsx -e "
  const { db } = require('./lib/db');
  db.execute('SELECT id, name, display_name, opening_date FROM locations').then(r => console.log(r.rows));
"
```

Expected: `praha-3` has `2026-06-18`, `praha-5` has `2026-07-25`.

If dates are missing, run:
```sql
UPDATE locations SET opening_date = '2026-06-18' WHERE name = 'praha-3';
UPDATE locations SET opening_date = '2026-07-25' WHERE name = 'praha-5';
```

### Step 2: Verify build passes
```bash
npm run build
```

### Step 3: Visual verification
Run dev server and verify:
1. Homepage LocationsRow: praha-3 shows "Otevíráme · 18.6.", praha-5 shows "Otevíráme · 25.7." with dashed border
2. `/cs/pobocka/praha-3`: opening banner with "Nový apartmán — otevíráme brzy!" and "Plánované otevření: 18.6."
3. `/cs/pobocka/praha-5`: same but with "25.7."
4. `/cs/rozvrh`: only Vinohrady in location filter (no praha-3/praha-5)
5. Footer: locations show "brzy" suffix for upcoming ones
6. Admin `/cs/admin/pobocky`: opening_date column shows dates
7. Admin edit: opening_date field populated

## Files involved (all already modified, in git diff)

| File | Status |
|------|--------|
| `lib/queries.ts` | Modified — openingDate in Location type + queries |
| `lib/utils.ts` | Modified — formatOpeningDate() helper |
| `lib/admin-actions.ts` | Modified — opening_date in create/update |
| `lib/seo/landing-content.ts` | Modified — LOCATION_CONTENT for praha-3, praha-5, vinohrady |
| `components/home/LocationsRow.tsx` | Modified — data-driven isPreparing |
| `components/layout/SiteFooter.tsx` | Modified — upcoming marker |
| `app/[locale]/pobocka/[slug]/page.tsx` | Modified — opening banner |
| `app/[locale]/rozvrh/page.tsx` | Modified — filter out upcoming locations |
| `app/[locale]/(admin)/admin/pobocky/page.tsx` | Modified — opening_date column |
| `app/[locale]/(admin)/admin/pobocky/[id]/page.tsx` | Modified — opening_date field |
| `app/[locale]/(admin)/admin/pobocky/nova/page.tsx` | Modified — opening_date field |
| `app/globals.css` | Modified — opening banner CSS |

## Risk assessment
- **Low risk**: All changes are self-contained, no breaking changes to existing functionality
- **Prague timezone**: Correctly uses `pragueDateISO()` for all date comparisons
- **Auto-transition**: When opening date passes, locations automatically become "open" — no manual action needed
