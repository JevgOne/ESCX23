# TASK-021: Schedule Bug — Overrides-only architecture

**Date:** 2026-07-06 (rewritten: user decision — overrides-only, no weekly fallback)

**Bug report:** On Sunday at 22:45 Prague time, `/divky` showed "TMRW" badge for girls who worked Monday LAST WEEK. `/rozvrh` TOMORROW tab showed same stale data.

**User decision:** After closing time (22:31), wipe today's schedule. If no overrides exist for a day, show NOTHING — no fallback to weekly template.

---

## USER'S ARCHITECTURE DECISION

> "Kazdy den v 22:31 (po zaviracce 22:30) se kompletne smaze dnesni rozvrh z DB. Zustane prazdny."
> "Pokud pro den NEEXISTUJI overrides → NEZOBRAZOVAT data."
> "NEPOUZIVAT default weekly schedule jako fallback — jen overrides."

**Translation to code:**
1. Cron at 22:31 Prague: `DELETE FROM schedule_exceptions WHERE date = today`
2. Public pages show girls ONLY if `schedule_exceptions` row exists with `exception_type = 'custom_hours'` for that date
3. `girl_schedules` (weekly template) is ONLY used as an admin helper — a tool for quickly generating daily overrides
4. If no `schedule_exceptions` exist for a date → /rozvrh shows "Rozvrh se pripravuje", /divky shows no TMRW badge

---

## CURRENT STATE ANALYSIS

### How data flows now (BROKEN):

```
girl_schedules (weekly template)     schedule_exceptions (daily overrides)
        │                                      │
        │ LEFT JOIN by day_of_week             │ LEFT JOIN by date
        │                                      │
        └──────────┬───────────────────────────┘
                   │
            Query logic:
            1. If exception = 'unavailable' → girl excluded
            2. If exception = 'custom_hours' → use exception times
            3. If NO exception → FALLBACK to girl_schedules ← THIS IS THE BUG
                   │
            Public pages show data
```

### How data SHOULD flow (user's decision):

```
girl_schedules (weekly template)     schedule_exceptions (daily overrides)
        │                                      │
        │ Admin tool only — used to            │ SOLE source of truth
        │ bulk-generate exceptions             │ for public display
        │                                      │
        └──────────┬───────────────────────────┘
                   │
            Query logic:
            1. If exception = 'unavailable' → girl excluded
            2. If exception = 'custom_hours' → show with exception times
            3. If NO exception → girl NOT SHOWN for that day
                   │
            Public pages show ONLY override-confirmed girls
```

### Current cron timeline:

| Vercel cron | UTC | Prague (summer) | What it does |
|-------------|-----|-----------------|--------------|
| `0 * * * *` | hourly | hourly | expire-stories |
| `31 21 * * *` | 21:31 | 23:31 | cleanup-daily-overrides: `DELETE WHERE date <= today` |
| `0 1 * * *` | 01:00 | 03:00 | recalc-stats |
| `0 3 * * *` | 03:00 | 05:00 | cleanup-old-overrides: `DELETE WHERE date < now-30d` |
| `0 3 * * *` | 03:00 | 05:00 | expire-loyalty-discounts |

The `cleanup-daily-overrides` cron already exists and runs at 22:31 Prague time. It deletes `schedule_exceptions WHERE date <= today`. This is CORRECT for the new architecture — it wipes today's schedule after closing, leaving tomorrow empty until admin creates overrides.

### Affected query functions:

| Function | File:Line | Used by | Current behavior | Needs change |
|----------|-----------|---------|-----------------|--------------|
| `getGirlsForDay(date)` | queries.ts:731 | /rozvrh | JOINs `girl_schedules` (deduped) + `schedule_exceptions` | YES — stop joining `girl_schedules`, use only exceptions |
| `getGirlsForListing(filters)` | queries.ts:1864 | /divky | JOINs `girl_schedules gs` (today) + `gs2` (tomorrow) + exceptions | YES — stop joining `girl_schedules`, use only exceptions |
| `getGirlsWithToday()` | queries.ts:165 | homepage, SimilarGirls | JOINs `girl_schedules gs` (today) + `gs2` (tomorrow) + exceptions | YES — stop joining `girl_schedules`, use only exceptions |
| `getGirlsForHashtag(slug)` | queries.ts:2022 | /hashtag/{slug} | JOINs `girl_schedules` (today) + exceptions | YES — stop joining `girl_schedules`, use only exceptions |
| `getTodayResolved(girlId)` | TodayPanel.tsx:16 | admin panel | Queries both tables for single girl | YES — update to match new logic |

### Admin actions that write `schedule_exceptions`:

| Action | File | What it does | Needs change |
|--------|------|-------------|--------------|
| `setTodayOff(formData)` | admin/.../dostupnost/actions.ts:63 | Inserts `exception_type='unavailable'` for TODAY | OK as-is |
| `applyMonthBulk(formData)` | admin/.../dostupnost/actions.ts:85 | Bulk: clear month exceptions OR next 7 days off | OK as-is |
| `saveWeeklySchedule(formData)` | admin/.../dostupnost/actions.ts:14 | Writes `girl_schedules` (weekly template) | NEEDS NEW: option to also generate `schedule_exceptions` |
| Day override editor | admin/.../dostupnost/den/[date]/page.tsx | **Phase 2 PLACEHOLDER — NOT IMPLEMENTED** | **MUST IMPLEMENT** — this is how admin sets daily schedule |
| `studioSetTodayOff(formData)` | studio/dostupnost/actions.ts:58 | Studio: marks girl off today | OK as-is |
| `studioSaveWeeklySchedule(formData)` | studio/dostupnost/actions.ts:14 | Studio: writes weekly template | Same as admin — needs generate option |

---

## IMPLEMENTATION PLAN

### Step 1: Implement day override editor (CRITICAL PATH)

**Currently a Phase 2 placeholder.** Without this, admin has NO way to set `custom_hours` exceptions for future dates. The only tool is `setTodayOff()` which only works for TODAY.

**File:** `app/[locale]/(admin)/admin/divky/[id]/dostupnost/den/[date]/page.tsx`

Replace Phase 2 placeholder with a working form:

```tsx
// Server action for the form
export async function saveDayOverride(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id'));
  const date = String(formData.get('date'));
  const status = String(formData.get('status')); // 'online' | 'unavailable' | 'clear'

  // Delete existing exception
  await db.execute({
    sql: `DELETE FROM schedule_exceptions WHERE girl_id = ? AND date = ?`,
    args: [girlId, date],
  });

  if (status === 'online') {
    const from = String(formData.get('start_time') || '10:00');
    const to = String(formData.get('end_time') || '22:00');
    const locationId = formData.get('location_id') ? Number(formData.get('location_id')) : null;
    // NOTE: schedule_exceptions schema doesn't have location_id — may need migration
    await db.execute({
      sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type, start_time, end_time)
            VALUES (?, ?, 'custom_hours', ?, ?)`,
      args: [girlId, date, from, to],
    });
  } else if (status === 'unavailable') {
    await db.execute({
      sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type)
            VALUES (?, ?, 'unavailable')`,
      args: [girlId, date],
    });
  }
  // status === 'clear' → just delete, no insert (day falls back to "no data")

  revalidatePath(`...`);
}
```

**Form UI:**
- Radio: Online / Volno / Vymazat
- If Online: time inputs (start_time, end_time), preset buttons (morning/afternoon/fullday), location select
- Pre-fill from `girl_schedules` weekly template (convenience, not display source)
- Submit button

### Step 2: Add "generate overrides from template" admin action

Admin needs a quick way to populate `schedule_exceptions` for tomorrow (or next N days) from the weekly template. This replaces the automatic fallback.

**New action in `admin/.../dostupnost/actions.ts`:**

```ts
export async function generateOverridesFromTemplate(formData: FormData) {
  await requireAdmin();
  const girlId = Number(formData.get('girl_id'));
  const days = Number(formData.get('days') || 1); // generate for next N days
  const today = pragueDateISO();

  for (let i = 1; i <= days; i++) {
    const d = new Date(today + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = pragueDayOfWeek(d);

    // Check if override already exists
    const existing = await db.execute({
      sql: `SELECT id FROM schedule_exceptions WHERE girl_id = ? AND date = ?`,
      args: [girlId, dateStr],
    });
    if (existing.rows.length > 0) continue; // don't overwrite

    // Get weekly template for this DOW
    const sched = await db.execute({
      sql: `SELECT start_time, end_time, location_id FROM girl_schedules
            WHERE girl_id = ? AND day_of_week = ? AND is_active = 1
            ORDER BY effective_from DESC NULLS LAST LIMIT 1`,
      args: [girlId, dow],
    });

    if (sched.rows.length > 0) {
      const row = sched.rows[0];
      await db.execute({
        sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type, start_time, end_time)
              VALUES (?, ?, 'custom_hours', ?, ?)`,
        args: [girlId, dateStr, row.start_time, row.end_time],
      });
    }
    // If no template for this DOW → no override created → girl not shown (correct!)
  }

  revalidatePath(`...`);
}
```

**Also add a BULK version** — "Generate overrides for ALL active girls for tomorrow":

```ts
export async function generateAllOverridesForDate(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get('date'));
  const dow = (() => {
    const d = new Date(date + 'T12:00:00Z');
    const jsDay = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Prague' })).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  })();

  // Get all active girls with a schedule for this DOW
  const girls = await db.execute({
    sql: `SELECT gs.girl_id, gs.start_time, gs.end_time, gs.location_id
          FROM girl_schedules gs
          JOIN girls g ON g.id = gs.girl_id
          WHERE gs.day_of_week = ? AND gs.is_active = 1 AND g.status = 'active'
          ORDER BY gs.effective_from DESC NULLS LAST`,
    args: [dow],
  });

  // Deduplicate by girl_id (take first = latest effective_from)
  const seen = new Set<number>();
  for (const row of girls.rows) {
    const gid = Number(row.girl_id);
    if (seen.has(gid)) continue;
    seen.add(gid);

    // Skip if override already exists
    const existing = await db.execute({
      sql: `SELECT id FROM schedule_exceptions WHERE girl_id = ? AND date = ?`,
      args: [gid, date],
    });
    if (existing.rows.length > 0) continue;

    await db.execute({
      sql: `INSERT INTO schedule_exceptions (girl_id, date, exception_type, start_time, end_time)
            VALUES (?, ?, 'custom_hours', ?, ?)`,
      args: [gid, date, row.start_time, row.end_time],
    });
  }

  revalidatePath(`...`);
}
```

This gives admin a "Publish tomorrow from template" button that generates all overrides at once.

### Step 3: Change query functions — overrides-only logic

#### 3A. `getGirlsForDay(date)` — /rozvrh

**Current:** JOINs `girl_schedules` + `schedule_exceptions`, falls back to `girl_schedules` if no exception.

**New:** JOIN ONLY `schedule_exceptions`. If no exception for a girl on that date → girl not shown.

```sql
SELECT
  g.id, g.slug, g.name, g.age, g.height, g.weight, g.bust, g.location,
  g.created_at, g.is_new, g.badge_type, g.ethnicity, g.languages, g.rating, g.reviews_count,
  se.exception_type, se.start_time AS shift_from, se.end_time AS shift_to,
  l.display_name AS schedule_location, l.district AS schedule_district,
  (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS primary_photo,
  COALESCE(
    (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_secondary = 1 LIMIT 1),
    (SELECT url FROM girl_photos WHERE girl_id = g.id AND (is_primary = 0 OR is_primary IS NULL) ORDER BY display_order ASC, id ASC LIMIT 1)
  ) AS secondary_photo,
  (SELECT COUNT(*) FROM girl_photos WHERE girl_id = g.id) AS photo_count,
  (SELECT COUNT(*) FROM girl_videos WHERE girl_id = g.id) AS video_count
FROM girls g
INNER JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
  AND se.exception_type = 'custom_hours'
LEFT JOIN locations l ON ... -- need location from exception or girl default
WHERE g.status = 'active' AND (g.vip = 0 OR g.vip IS NULL)
ORDER BY g.name
```

Key change: `LEFT JOIN girl_schedules` → removed entirely. `INNER JOIN schedule_exceptions` with `custom_hours` filter means only girls with explicit overrides for that date appear.

**Location issue:** `schedule_exceptions` schema doesn't have `location_id`. Options:
- A. Add `location_id` column to `schedule_exceptions` (DB migration) — RECOMMENDED
- B. Fall back to `g.location` (girl's default location) — simpler but less accurate
- C. JOIN `girl_schedules` only for location lookup — defeats the purpose

**Recommendation: Option A** — add `location_id INTEGER` to `schedule_exceptions`. Then `generateOverridesFromTemplate()` copies it from `girl_schedules`.

#### 3B. `getGirlsForListing(filters)` — /divky

**Current:** JOINs `girl_schedules gs` (today) + `gs2` (tomorrow) + exceptions for both.

**New:** JOIN only `schedule_exceptions se` (today) + `se2` (tomorrow). Remove `girl_schedules` JOINs entirely.

Today's status:
- `se.exception_type = 'custom_hours'` + times → working/later/off
- `se.exception_type = 'unavailable'` → excluded
- No `se` row → no today shift (skip for availability sort, but girl still shown in catalog)

Tomorrow badge:
- `se2.exception_type = 'custom_hours'` + times → TMRW badge
- `se2.exception_type = 'unavailable'` → no badge
- No `se2` row → **NO TMRW badge** (this is the core fix)

```sql
FROM girls g
LEFT JOIN schedule_exceptions se ON se.girl_id = g.id AND se.date = ?
LEFT JOIN schedule_exceptions se2 ON se2.girl_id = g.id AND se2.date = ?
-- NO girl_schedules JOINs
WHERE g.status IN ('active','inactive') AND (g.vip = 0 OR g.vip IS NULL)
```

Status rank logic update:
```sql
CASE
  WHEN g.status = 'inactive' THEN 5
  WHEN se.exception_type = 'unavailable' THEN 4
  WHEN se.exception_type = 'custom_hours'
    AND ? >= SUBSTR(se.start_time, 1, 5)
    AND ? <= SUBSTR(se.end_time, 1, 5)
  THEN 1  -- working now
  WHEN se.exception_type = 'custom_hours'
    AND ? < SUBSTR(se.start_time, 1, 5)
  THEN 2  -- later today
  WHEN se2.exception_type = 'custom_hours'
  THEN 3  -- tomorrow
  ELSE 4  -- no schedule
END AS status_rank
```

#### 3C. `getGirlsWithToday()` — homepage + SimilarGirls

Same change as 3B. Remove `girl_schedules` JOINs, use only `schedule_exceptions`.

#### 3D. `getGirlsForHashtag(slug)` — /hashtag pages

Same change. Remove `girl_schedules` JOIN, use only `schedule_exceptions` for today's status.

### Step 4: /rozvrh empty state — "Rozvrh se pripravuje"

**File:** `app/[locale]/rozvrh/page.tsx`

When `girls.length === 0` for a future day (not today), show a "schedule is being prepared" message instead of the generic "no one scheduled" empty state.

```tsx
const isScheduleEmpty = girls.length === 0 && requestedDay > today;

{isScheduleEmpty ? (
  <SchedulePreparingBanner locale={locale} />
) : girls.length > 0 ? (
  <GirlCardGrid girls={girls} priorityCount={4} />
) : (
  <EmptyState message={NO_ONE[locale] ?? NO_ONE.cs} />
)}
```

**`SchedulePreparingBanner` texts (4 locales):**
- CS: "Rozvrh na tento den se pripravuje. Zkuste to pozdeji nebo nas kontaktujte primo."
- EN: "The schedule for this day is being prepared. Check back later or contact us directly."
- DE: "Der Zeitplan fur diesen Tag wird vorbereitet. Schauen Sie spater noch einmal vorbei."
- UK: "Rozklad na cej den gotujetsja. Povertajtes piznishe abo zvernitsja do nas bezposeredno."

### Step 5: Update cron cleanup

The existing `cleanup-daily-overrides` cron already does what's needed:
- Runs at 22:31 Prague time
- `DELETE FROM schedule_exceptions WHERE date <= today`

This is correct — after closing time, today's schedule is wiped. Tomorrow starts empty.

The `cleanup-old-overrides` (03:00, deletes >30 days old) is now LESS relevant since daily cron already wipes today's data. But it can stay as a safety net.

### Step 6: DB migration — add location_id to schedule_exceptions

```sql
ALTER TABLE schedule_exceptions ADD COLUMN location_id INTEGER REFERENCES locations(id);
```

**File:** `lib/db.ts` — add migration.

This allows `generateOverridesFromTemplate()` to copy the location from the weekly template into the daily override.

---

## IMPLEMENTATION ORDER

| Step | Priority | What | Effort |
|------|----------|------|--------|
| **Step 6** | P0 | DB migration: `location_id` on `schedule_exceptions` | Tiny |
| **Step 1** | P0 | Day override editor (replace Phase 2 placeholder) | Medium |
| **Step 2** | P0 | "Generate overrides from template" actions (per-girl + bulk) | Medium |
| **Step 3** | P0 | Rewrite 4 query functions to overrides-only | Large |
| **Step 4** | P1 | /rozvrh "schedule is being prepared" empty state | Small |
| **Step 5** | P1 | Verify cron behavior (already correct) | Tiny |

**Total effort: ~Medium-Large.** The query rewrites (Step 3) are the biggest piece — 4 functions need rewriting, but the new queries are simpler (fewer JOINs).

---

## MIGRATION / ROLLOUT PLAN

**IMPORTANT:** This is a breaking change to the schedule display logic. Admin must populate overrides for the current day BEFORE deploying, or the schedule pages will show empty.

**Pre-deployment checklist:**
1. Run `generateAllOverridesForDate(today)` for today's date — creates `custom_hours` exceptions from weekly template for all girls
2. Run same for tomorrow (and optionally next 6 days)
3. Deploy code changes
4. Verify /divky and /rozvrh show correct data
5. Admin tests day override editor — creates/edits/deletes overrides for future dates

**Rollback:** If something goes wrong, the weekly template data in `girl_schedules` is untouched. Re-deploying old code restores the fallback behavior.

---

## ADMIN WORKFLOW (after deployment)

**Daily workflow:**
1. Before 22:30: Admin has today's schedule active (from overrides)
2. 22:31: Cron wipes today's schedule (business closed)
3. Anytime (e.g., 23:30): Admin clicks "Publikuj zitrek ze sablony" → generates overrides for tomorrow
4. Admin adjusts individual girls: mark unavailable, change times, change location
5. Repeat

**Weekly/advance planning:**
- Admin clicks "Generuj pristi tyden ze sablony" → generates 7 days of overrides
- Then adjusts individual days as needed
- Each day's overrides are independent — changing one doesn't affect others

---

## TESTING

### Core flow:
1. Day with NO `schedule_exceptions` → /rozvrh shows "Rozvrh se pripravuje", /divky shows no TMRW badges
2. Admin generates overrides from template for tomorrow → /rozvrh shows girls, /divky shows TMRW badges
3. Admin marks one girl unavailable for tomorrow → girl disappears from /rozvrh tomorrow tab, TMRW badge gone
4. Cron at 22:31 runs → today's overrides deleted → /rozvrh today tab empties

### Day override editor:
5. Open `/admin/divky/{id}/dostupnost/den/2026-07-08` → form shown (not Phase 2 placeholder)
6. Set "Online" with custom hours → saved to `schedule_exceptions` with `custom_hours`
7. Set "Volno" → saved as `unavailable`
8. Set "Vymazat" → exception deleted

### Bulk generation:
9. Click "Publikuj zitrek ze sablony" → overrides created for all active girls from weekly template
10. Girls without weekly template for that DOW → no override created → not shown
11. Existing overrides not overwritten

### Edge cases:
12. Sunday evening → tomorrow (Monday) has no overrides → no TMRW badges on /divky (CORE FIX)
13. Admin generates Monday overrides → TMRW badges appear immediately
14. /rozvrh day beyond generated overrides → "schedule preparing" message
15. Winter TZ: tomorrowDate computation uses Prague-safe method in all functions
