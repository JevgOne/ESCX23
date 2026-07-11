# TASK-023: Evzen Re-check — Fixes Verified

**Status:** done
**Date:** 2026-07-11

---

## Fix 1: Previous-day cross-midnight JOIN in `getGirlsForDay()` — PASS

**File:** `lib/queries.ts:770-957`

**What was added:**
- `prevDayOfWeek` and `prevDate` computed at lines 780-785
- New `gs_prev` LEFT JOIN (lines 826-833) queries previous day's schedule filtered to `CAST(SUBSTR(end_time,1,2) AS INTEGER) >= 24` (cross-midnight only)
- `l_prev` location JOIN for the previous day's shift location (line 834)
- JS post-processing (lines 854-872): when no same-day shift exists, checks if prev day's cross-midnight shift morning portion is still active
- Lines 893-911: `usePrevDay` branch correctly sets `cardFrom = '00:00'`, `cardTo = morningEnd`, and classifies shift from original prev-day times
- Status logic: if today and `now <= morningEnd` -> `working`; if past -> returns null (excluded)
- Location correctly pulled from `prev_schedule_location` when using prev day (line 874-876)

**Verification against requirement #8:**
- "musí jí vidět když otevře v sobotu 2:00 a dívka s páteční noční je online" -> Friday night shift (23:00-31:00, day_of_week=4) will be found by `gs_prev` on Saturday (day_of_week=5 queries prevDayOfWeek=4). At 2:00 AM, `now='02:00' <= morningEnd='07:00'` -> status = `working`. Girl appears on Saturday tab. **Correct.**

---

## Fix 2: Studio presets + toStorageTime — PASS

**File:** `app/[locale]/studio/dostupnost/actions.ts`

**What was added:**
- Line 4: `toStorageTime` imported from `@/lib/utils`
- Lines 12-13: `allevening: { from: '16:30', to: '31:00' }` and `night: { from: '23:00', to: '31:00' }` presets added
- Line 46: Custom times now use `toStorageTime(customFrom, customTo)` instead of raw `{ from, to }`

**Verification:**
- Girls in Studio can now select Celovecerni and Nocni presets -> stored correctly as +24h
- Custom cross-midnight times (e.g. 22:00-06:00) will be converted to 22:00-30:00 via `toStorageTime()`. **Correct.**

---

## Final Verdict

Both issues from the original Evzen report are now fixed. All 9 user requirements PASS.

| # | Requirement | Status |
|---|---|---|
| 1 | Cross-midnight shifts | PASS |
| 2 | Night preset 23:00-07:00 | PASS |
| 3 | Single shift (not split) | PASS |
| 4 | Celovecerni category | PASS |
| 5 | Celovecerni preset 16:30-07:00 | PASS |
| 6 | 5 columns on rozvrh | PASS |
| 7 | Moon badge | PASS |
| 8 | Cross-midnight on both days (rozvrh) | **PASS** (fixed) |
| 9 | Night prices in cenik | PASS |

| Additional Issue | Status |
|---|---|
| Studio missing presets + toStorageTime | **PASS** (fixed) |

**No remaining blockers. Ready to ship.**
