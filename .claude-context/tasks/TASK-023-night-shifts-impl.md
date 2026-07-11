# TASK-023: Night Shifts Implementation Report

**Status:** done
**Date:** 2026-07-10

---

## What was implemented

All 9 steps from the plan were implemented:

### Step 1: Helper functions (`lib/utils.ts`)
- Added 6 new exports: `displayTime`, `toStorageTime`, `isWithinShift`, `isBeforeShift`, `isShiftEnded`, `classifyShift`
- Added `ShiftCategory` type

### Step 2: Status comparisons (`lib/queries.ts`)
- Fixed 6 JS status comparison locations to use `isWithinShift()` / `isBeforeShift()` / `isShiftEnded()`
- Updated SQL `working_now` / `status_rank` in `getHomepageStats()` and `getGirlsFiltered()` to handle +24h times
- Added `shiftCategory: ShiftCategory | null` to `GirlCard` interface
- All display times now go through `displayTime()` conversion
- Updated `getGirlScheduleForToday()` to use new helpers

### Step 3: Story schedule (`lib/story-schedule.ts`)
- `isCurrentlyOnShift()` — now uses `isWithinShift()` + checks previous day's cross-midnight shift
- `calculateAccumulatedShiftMinutes()` — added previous-day cross-midnight morning portion accumulation

### Step 4: Admin presets — dostupnost (`app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts`)
- Added `allevening` (16:30–31:00) and `night` (23:00–31:00) presets
- Custom times now use `toStorageTime()` for cross-midnight detection

### Step 5: Admin presets — admin-actions (`lib/admin-actions.ts`)
- Added `celovecerni` and `nocni` presets to `PRESET_TIMES`
- Custom per-day times now use `toStorageTime()` for cross-midnight detection

### Step 6: Preset UIs
- `WeeklyScheduleForm.tsx` — 2 new presets added, `detectPreset()` updated for +24h values, custom time inputs display via `displayTime()`
- `admin/schedules/page.tsx` — 2 new preset radio buttons added, JS preset map updated

### Step 7: Rozvrh page 5-group layout (`app/[locale]/rozvrh/page.tsx`)
- Girls grouped by `ShiftCategory` with section headings
- Group headings include moon emoji for night/allevening, count badge
- Single group renders flat (no heading) for clean UX
- 4-locale labels (cs, en, de, uk)

### Step 8: Moon badge on GirlCard (`components/girl/GirlCard.tsx`)
- Night/allevening working shifts show 🌙 instead of green dot

### Step 9: Night pricing on `/cenik`
- **9a:** DB migration added to `lib/db.ts` (`night_price INTEGER DEFAULT NULL` on `pricing_plans`)
- **9b:** `getActivePricingPlans()` now selects `night_price`
- **9c:** `ProgramsGrid.tsx` shows night price line (gold) when `night_price` differs from day price
- **9d:** New `NightPricingNote.tsx` component with 4-locale text
- **9e:** Note integrated below ProgramsGrid on `/cenik` page
- Night prices seeded in local DB (30=2500, 45=2700, 60=3000, 90=4500, 120=5500)

---

## CSS Added (`app/globals.css`)
- `.program-card-night` styles (gold accent)
- `.night-pricing-note` styles
- `.rozvrh-shift-group`, `.rozvrh-group-heading`, `.rozvrh-group-count`, `.rozvrh-moon`
- `.girl-online-moon`

---

## Files Changed

| File | Change |
|---|---|
| `lib/utils.ts` | +6 exports, ShiftCategory type |
| `lib/queries.ts` | +shiftCategory field, 6x JS status fix, SQL +24h fix, displayTime conversion, night_price query |
| `lib/story-schedule.ts` | isCurrentlyOnShift cross-midnight, shift accumulation fix |
| `lib/db.ts` | night_price migration |
| `lib/admin-actions.ts` | 2 presets, toStorageTime import |
| `app/.../dostupnost/actions.ts` | 2 presets, toStorageTime |
| `components/admin/schedule/WeeklyScheduleForm.tsx` | 2 presets, detectPreset, displayTime |
| `app/.../admin/schedules/page.tsx` | 2 preset buttons, JS map |
| `app/[locale]/rozvrh/page.tsx` | 5-group ShiftGroupedGrid |
| `components/girl/GirlCard.tsx` | Moon badge |
| `components/cenik/ProgramsGrid.tsx` | Night price line |
| `components/cenik/NightPricingNote.tsx` | NEW — night pricing note |
| `app/[locale]/cenik/page.tsx` | NightPricingNote integration |
| `app/globals.css` | Night/group/moon CSS |

---

## Verification

- `npx tsc --noEmit` — passes (only pre-existing e2e test type errors remain)
- `npm run build` — TypeScript compilation and Turbopack compilation pass. Build fails at page data collection due to missing production DB URL (pre-existing, not related to changes)
- Night prices seeded in local DB and verified
