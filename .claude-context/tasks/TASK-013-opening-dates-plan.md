# TASK-013: Opening dates for Zizkov (18.6.2026) and Smichov (25.7.2026)

## Current state analysis

### Database (data/app.db)
- Table `locations` already has 3 rows:
  - id=1: `praha-2` (Nove Mesto, Praha 2) — active, main apartment
  - id=2: `praha-3` (Zizkov, Praha 3) — active (but shown as "preparing")
  - id=3: `praha-5` (Andel, Praha 5) — active (but shown as "preparing")
- **No `opening_date` column exists** — the "preparing" state is currently **hardcoded** in `components/home/LocationsRow.tsx:31`:
  ```ts
  const preparingSlugs = new Set(['praha-3', 'praha-5']);
  ```

### Frontend locations display
1. **Homepage LocationsRow** (`components/home/LocationsRow.tsx`) — shows all active locations, marks `praha-3`/`praha-5` as "Pripravujeme" with dashed border + reduced opacity
2. **Pobocka detail page** (`app/[locale]/pobocka/[slug]/page.tsx`) — full landing page per location
3. **Rozvrh LocationFilter** (`components/rozvrh/LocationFilter.tsx`) — filter pills on schedule page
4. **SiteFooter** (`components/layout/SiteFooter.tsx`) — lists all active locations
5. **Admin pobocky** (`app/[locale]/(admin)/admin/pobocky/`) — CRUD for locations

### What's missing
- No `opening_date` column in DB schema
- No countdown or "opening soon" badge with date
- The "preparing" state is hardcoded, not data-driven
- No logic to auto-transition from "preparing" to "open" when date arrives
- Rozvrh/schedule filter shows all active locations including ones not yet open
- No SEO content for Zizkov/Smichov in `lib/seo/landing-content.ts` (only `vinohrady` has content)

---

## Implementation plan

### Step 1: Add `opening_date` column to locations table

**File:** New SQL migration (run via sqlite3 or admin action)

```sql
ALTER TABLE locations ADD COLUMN opening_date TEXT;
-- Set opening dates for the two new locations
UPDATE locations SET opening_date = '2026-06-18' WHERE name = 'praha-3';
UPDATE locations SET opening_date = '2026-07-25' WHERE name = 'praha-5';
```

**File:** `lib/queries.ts`
- Update `getLocationBySlug()` (line 449-479) — add `openingDate` to return object:
  ```ts
  openingDate: r.opening_date ? String(r.opening_date) : null,
  ```
- Update `getActiveLocations()` (line 481-493) — add `opening_date` to SELECT and return:
  ```ts
  SELECT id, name, display_name, district, city, is_primary, opening_date FROM locations WHERE is_active = 1 ...
  ```
  Add to return type:
  ```ts
  openingDate: r.opening_date ? String(r.opening_date) : null,
  ```
- Update `Location` type (wherever defined) to include `openingDate: string | null`

### Step 2: Make "preparing" state data-driven

**File:** `components/home/LocationsRow.tsx`

Replace hardcoded `preparingSlugs` with date-based logic:

```ts
// Remove: const preparingSlugs = new Set(['praha-3', 'praha-5']);

// Inside the map, compute isPreparing from openingDate:
const today = new Date().toISOString().slice(0, 10); // server-side, Prague TZ handled by server
const isPreparing = loc.openingDate != null && loc.openingDate > today;
```

Add opening date display alongside "Pripravujeme" badge:

```ts
{isPreparing && loc.openingDate && (
  <span className="loc-row-badge-soon">
    {preparingLabel} · {formatOpeningDate(loc.openingDate, locale)}
  </span>
)}
```

Add a helper for date formatting (inline or small function):
```ts
function formatOpeningDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = d.getMonth() + 1;
  // Simple format: "18.6." for CS, "Jun 18" for EN, "18.6." for DE, "18.6." for UK
  if (locale === 'en') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${day}`;
  }
  return `${day}.${month}.`;
}
```

Update labels to include "od" (from) prefix:
```ts
const PREPARING_LABEL: Record<string, string> = {
  cs: 'Otevíráme',
  en: 'Opening',
  de: 'Eröffnung',
  uk: 'Відкриття',
};
```

### Step 3: Filter out not-yet-open locations from schedule/rozvrh

**File:** `components/rozvrh/LocationFilter.tsx` or the page that provides data to it

The rozvrh page should NOT show locations that haven't opened yet as filter options. The page that calls `getActiveLocations()` for the rozvrh filter should filter out future-dated locations:

```ts
const locations = allLocations.filter(loc => {
  if (!loc.openingDate) return true; // no date = already open
  return loc.openingDate <= today;
});
```

### Step 4: Update pobocka detail page for upcoming locations

**File:** `app/[locale]/pobocka/[slug]/page.tsx`

For locations with a future `openingDate`, show a prominent banner/countdown:

```tsx
{loc.openingDate && loc.openingDate > today && (
  <div className="pobocka-opening-banner">
    <span className="pobocka-opening-icon">🎉</span>
    <div>
      <div className="pobocka-opening-title">{openingTitle}</div>
      <div className="pobocka-opening-date">{formatOpeningDate(loc.openingDate, locale)}</div>
    </div>
  </div>
)}
```

Add i18n labels:
```ts
const openingBanner: Record<string, { title: string; datePrefix: string }> = {
  cs: { title: 'Nový apartmán — otevíráme brzy!', datePrefix: 'Plánované otevření' },
  en: { title: 'New apartment — opening soon!', datePrefix: 'Planned opening' },
  de: { title: 'Neues Apartment — Eröffnung bald!', datePrefix: 'Geplante Eröffnung' },
  uk: { title: 'Новий апартамент — незабаром відкриття!', datePrefix: 'Планове відкриття' },
};
```

### Step 5: Update admin panel for opening_date

**File:** `app/[locale]/(admin)/admin/pobocky/[id]/page.tsx`

Add an `opening_date` input field in the form (inside the "Identita" or "Status" fieldset):

```tsx
<div className="admin-form-field">
  <label htmlFor="opening_date">Datum otevření</label>
  <input id="opening_date" name="opening_date" type="date"
    defaultValue={String(loc.opening_date ?? '')} />
  <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
    Pokud je v budoucnu, pobočka se zobrazí jako "Připravujeme"
  </span>
</div>
```

**File:** `app/[locale]/(admin)/admin/pobocky/nova/page.tsx`

Same — add `opening_date` field to the "new location" form.

**File:** `app/[locale]/(admin)/admin/pobocky/page.tsx`

Add opening_date column to the admin list table:

```ts
{
  key: 'opening_date',
  label: 'Otevření',
  render: (row) => <span>{row.opening_date ?? '—'}</span>,
},
```

**File:** `lib/admin-actions.ts`

Update `createPobocka()` and `updatePobocka()`:
- Add `opening_date` to the columns list
- Add `getStr('opening_date')` or empty-to-null to values

### Step 6: CSS for opening banner

**File:** `app/globals.css`

Add styles for the opening banner on pobocka detail:

```css
.pobocka-opening-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(242,125,141,0.12), rgba(200,80,160,0.08));
  border: 1px solid var(--color-coral);
  border-radius: 16px;
  padding: 20px 28px;
  margin-bottom: 32px;
}
.pobocka-opening-icon {
  font-size: 32px;
}
.pobocka-opening-title {
  font-weight: 700;
  font-size: 18px;
  color: var(--color-coral);
}
.pobocka-opening-date {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
}
```

### Step 7: Update SEO landing content for new locations

**File:** `lib/seo/landing-content.ts`

Add entries to `LOCATION_CONTENT` for `'praha-3'` and `'praha-5'` with:
- `metaDesc` in 4 languages
- `intro` in 4 languages
- `faq` items (at least 2-3 per location)
- `relatedHashtags`

### Step 8: Footer — mark upcoming locations

**File:** `components/layout/SiteFooter.tsx`

In the footer locations list, upcoming locations should show a small "soon" indicator rather than appearing as normal open locations. Pass `openingDate` from `getActiveLocations()` and conditionally render.

---

## Files to modify (summary)

| File | Change |
|------|--------|
| `data/app.db` | ALTER TABLE + UPDATE for opening dates |
| `lib/queries.ts` | Add `opening_date` to `getActiveLocations()` and `getLocationBySlug()` returns |
| `components/home/LocationsRow.tsx` | Replace hardcoded `preparingSlugs` with date-based logic, show opening date |
| `components/rozvrh/LocationFilter.tsx` or parent page | Filter out not-yet-open locations |
| `app/[locale]/pobocka/[slug]/page.tsx` | Add opening banner for future locations |
| `app/[locale]/(admin)/admin/pobocky/[id]/page.tsx` | Add `opening_date` form field |
| `app/[locale]/(admin)/admin/pobocky/nova/page.tsx` | Add `opening_date` form field |
| `app/[locale]/(admin)/admin/pobocky/page.tsx` | Show opening_date in admin list |
| `lib/admin-actions.ts` | Handle `opening_date` in create/update |
| `app/globals.css` | CSS for opening banner |
| `lib/seo/landing-content.ts` | SEO content for Zizkov and Smichov |
| `components/layout/SiteFooter.tsx` | Mark upcoming locations in footer |

## Dependencies
- None — all changes are self-contained within the ESCX23 project.

## Risks / considerations
- **Prague timezone:** Date comparison for "is this location open yet?" should use Prague timezone, consistent with project rules (CLAUDE.md rule 5). Use `new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }).format(new Date()))` pattern or similar.
- **After opening:** Once the date passes, the location automatically becomes "open" — no manual action needed. The `is_active` flag remains as-is for admin manual deactivation.
- **Existing companions:** Currently no companions are assigned to Zizkov/Smichov locations. That will need to happen when the locations actually open (separate task).
- **Admin edit:** The admin should be able to change the opening date if plans shift.
