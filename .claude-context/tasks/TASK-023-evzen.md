# TASK-023: Evzen Report — Night Shifts Implementation vs. Specification

**Status:** done
**Date:** 2026-07-10

---

## Checklist: User Requirements vs. Implementation

### 1. "Budeme dělat i noční směny" — shifts across midnight
- **PASS.** The +24h convention (`end_time` stored as `31:00` for `07:00`) enables cross-midnight shifts throughout the codebase. `isWithinShift()`, `isBeforeShift()`, `isShiftEnded()` all handle +24h correctly in `lib/utils.ts:59-91`.

### 2. "noční směna bude automaticky jenom 1 a to od 23:00 do 7:00" — night preset 23:00-07:00
- **PASS.** Night preset is defined in all 3 action files:
  - `app/.../dostupnost/actions.ts:13` → `night: { from: '23:00', to: '31:00' }`
  - `lib/admin-actions.ts:1073` → `nocni: ['23:00', '31:00']`
  - `WeeklyScheduleForm.tsx:17` → `{ value: 'night', label: 'Noční', sub: '23:00 – 07:00', from: '23:00', to: '31:00' }`

### 3. "bez změn to nebude rozdělené na 2 směny" — single shift, one from/to field
- **PASS.** Implementation stores a single row per shift with `start_time` and `end_time`. No splitting into two shifts. The +24h convention keeps it as one continuous range.

### 4. "co když holka která pracuje od 16:30 bude na odpolední i noční?" → celovečerní category
- **PASS.** `classifyShift()` in `lib/utils.ts:95-107` returns `'allevening'` when `startH < 22` and `endH >= 24`. This correctly covers 16:30-07:00.

### 5. "nebo za to přidat celovečerní a to bude od 16:30 - 7:00" — celovečerní preset
- **PASS.** Celovečerní preset defined in all 3 action files:
  - `app/.../dostupnost/actions.ts:12` → `allevening: { from: '16:30', to: '31:00' }`
  - `lib/admin-actions.ts:1072` → `celovecerni: ['16:30', '31:00']`
  - `WeeklyScheduleForm.tsx:16` → `{ value: 'allevening', label: 'Celovečerní', sub: '16:30 – 07:00', from: '16:30', to: '31:00' }`

### 6. "Ranní, Odpolední, Celodenní, Celovečerní, Noční" — 5 columns on schedule
- **PASS.** `GROUP_ORDER` in `app/[locale]/rozvrh/page.tsx:241` defines exactly these 5 categories. `ShiftGroupedGrid` component renders them as separate sections with headings.
- **PASS.** Labels in 4 locales (cs, en, de, uk) at line 243-249.

### 7. "ten měsíček můžeš dát i do badge" — moon emoji for night/allevening
- **PASS.** Two locations:
  - **GirlCard** (`components/girl/GirlCard.tsx:157-158`): Shows `🌙` instead of green dot when `shiftCategory === 'night' || 'allevening'` AND `status === 'working'`.
  - **Rozvrh group headings** (`app/[locale]/rozvrh/page.tsx:281`): Moon emoji before group label for night/allevening sections.

### 8. "musí jí vidět když otevře v sobotu 2:00 a dívka s páteční noční je online" — cross-midnight display on BOTH days
- **FAIL — INCOMPLETE.** The `getGirlsForDay()` function (`lib/queries.ts:771-913`) only queries the current day's schedule (`day_of_week = ?`). It does NOT have the planned "previous day cross-midnight JOIN" from Step 4 of the plan.
  - **Impact:** A girl with a Friday 23:00-07:00 shift will appear on the Friday tab but will NOT appear on the Saturday tab at 2:00 AM. The user explicitly asked for this.
  - **story-schedule.ts is OK:** `isCurrentlyOnShift()` (line 218-237) correctly checks the previous day's cross-midnight shift. So stories work correctly. But the `/rozvrh` page does not.
  - **Homepage/divky queries partially OK:** `getHomepageGirls()` and `getGirlsFiltered()` use today's `day_of_week`, so they also miss previous-day cross-midnight girls. However, these have a second pass for tomorrow's schedule already (`gs2`), which partially compensates but doesn't cover the cross-midnight scenario.

### 9. "potřebujeme přidat do cen noční ceny nějak opatrně" — night prices in pricing
- **PASS.** Implementation is subtle and well done:
  - `night_price` column added to `pricing_plans` (`lib/db.ts:44`)
  - Each program card shows day price prominently + small gold `🌙 Noční X Kč` line below (`components/cenik/ProgramsGrid.tsx:68-75`)
  - `NightPricingNote.tsx` component explains night pricing in 4 locales
  - Note integrated below ProgramsGrid on `/cenik` page (`app/[locale]/cenik/page.tsx:138`)
  - Night prices seeded: 30min=2500, 45min=2700, 60min=3000, 90min=4500, 120min=5500

---

## Additional Issues Found

### A. Studio presets missing night/allevening
- **File:** `app/[locale]/studio/dostupnost/actions.ts:8-12`
- **Problem:** Only has 3 presets (morning, afternoon, fullday). Missing `allevening` and `night`. Also missing `toStorageTime()` import for custom times.
- **Impact:** Girls using the self-service Studio cannot set night or celovečerní shifts. Custom cross-midnight times would be stored incorrectly (e.g., `from=23:00, to=07:00` instead of `from=23:00, to=31:00`).
- **Severity:** HIGH — this is a functional gap.

### B. Admin schedules JS map uses display times
- **File:** `app/[locale]/(admin)/admin/schedules/page.tsx:717`
- **Code:** `celovecerni:['16:30','07:00'],nocni:['23:00','07:00']`
- **Analysis:** This JS map pre-fills the custom time inputs in the browser. The form then submits to `addGirlSchedule()` which calls `toStorageTime()` on the received values. So `07:00` with `from=16:30` will be converted to `31:00` correctly on the server. **This is OK** — the client-side display is correct and the server handles conversion.

---

## Summary

| # | Requirement | Status |
|---|---|---|
| 1 | Cross-midnight shifts | PASS |
| 2 | Night preset 23:00-07:00 | PASS |
| 3 | Single shift (not split) | PASS |
| 4 | Celovečerní category | PASS |
| 5 | Celovečerní preset 16:30-07:00 | PASS |
| 6 | 5 columns on rozvrh | PASS |
| 7 | Moon badge | PASS |
| 8 | Cross-midnight on both days (rozvrh) | **FAIL** |
| 9 | Night prices in ceník | PASS |

**Additional:**
| Issue | Severity |
|---|---|
| Studio missing night/celovečerní presets | HIGH |
| Studio missing toStorageTime for custom | HIGH |

**Verdict: 2 issues need fixing before this can ship.**
1. `getGirlsForDay()` needs previous-day cross-midnight JOIN (as designed in plan Step 4 but not implemented)
2. `app/[locale]/studio/dostupnost/actions.ts` needs allevening + night presets and toStorageTime import
