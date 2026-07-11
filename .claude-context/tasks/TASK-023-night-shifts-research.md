# TASK-023: Night Shifts Research — Schedule Data Analysis

**Status:** complete
**Date:** 2026-07-10

---

## 1. Data Source

Local SQLite database at `data/app.db` (last schedule entry: 2026-05-04).
Production Turso credentials are encrypted in Vercel (production env only); `vercel env pull` retrieves them as empty strings. Local DB was used as mirror.

---

## 2. Shift Patterns in DB

Three distinct shift types exist:

| Shift Type | Times | Schedule Entries | Unique Girls |
|---|---|---|---|
| **DAY (Ranní)** | 10:00 – 16:00 | 10 | 7 |
| **EVENING (Odpolední)** | 16:30 – 22:30 | 11 | 8 |
| **FULL DAY (Celodenní)** | 10:00 – 22:00 | 2 | 2 |

**No night shifts exist.** All shifts end by 22:30 at the latest.

---

## 3. Per-Girl Schedule Breakdown

| Girl | Shifts | Day-by-day |
|---|---|---|
| **Anetta** | 3 | Mon(D), Tue(E), Fri(D) |
| **Dana** | 0 | No schedule (active but unscheduled) |
| **Elizabeth** | 0 | No schedule (active but unscheduled) |
| **Eliška** | 2 | Fri(F), Sat(E) |
| **Emily** | 2 | Tue(D), Thu(D) |
| **Katy** | 3 | Mon(E), Wed(D), Thu(D) |
| **Luna** | 3 | Mon(D), Wed(E), Thu(E) |
| **Lyra** | 0 | No schedule (active but unscheduled) |
| **Natalie** | 3 | Tue(E), Sat(E), Sun(D) |
| **Nika** | 2 | Wed(F), Sun(E) |
| **Rebeca** | 3 | Thu(E), Sat(D), Sun(E) |
| **Sara** | 2 | Fri(E), Sat(D) |

Legend: D=Day(10-16), E=Evening(16:30-22:30), F=Full(10-22)

### Girls without schedules (3 of 12 active):
- Dana, Elizabeth, Lyra

---

## 4. Weekly Schedule Matrix

| Day | Girls on shift |
|---|---|
| **Mon** | Luna (D), Anetta (D), Katy (E) |
| **Tue** | Emily (D), Anetta (E), Natalie (E) |
| **Wed** | Katy (D), Luna (E), Nika (F) |
| **Thu** | Katy (D), Emily (D), Luna (E), Rebeca (E) |
| **Fri** | Anetta (D), Rebeca (D), Sara (E), Eliška (F) |
| **Sat** | Sara (D), Rebeca (D), Eliška (E), Natalie (E) |
| **Sun** | Natalie (D), Nika (E), Rebeca (E) |

---

## 5. Location Data

All shifts assigned to **Nové Město, Praha 2** (location_id=1).

| ID | Name | Display Name | Opening Date |
|---|---|---|---|
| 1 | praha-2 | Nové Město, Praha 2 | (active) |
| 2 | praha-3 | Žižkov, Praha 3 | 2026-06-18 |
| 3 | praha-5 | Anděl, Praha 5 | 2026-07-25 |

---

## 6. Schedule Exceptions

**Zero** schedule exceptions in DB. The `schedule_exceptions` table is empty.
No `effective_from` dates set on any schedules.

---

## 7. Admin Preset Shifts

The admin schedule page (`/admin/schedules`) has three built-in presets:

```
Ranní (Day):       10:00 – 16:00
Odpolední (Eve):   16:30 – 22:30
Celodenní (Full):  10:00 – 22:00
```

Plus custom time inputs for arbitrary hours.

---

## 8. How `getGirlsForDay()` Works

**File:** `lib/queries.ts:746`

1. Calculates `dayOfWeek` (Mon=0..Sun=6) for the requested date
2. SQL query joins `girls` + `girl_schedules` (with `ROW_NUMBER()` for `effective_from` precedence) + `schedule_exceptions` + `locations`
3. Post-processing in JS:
   - If `exception_type = 'unavailable'` → girl excluded
   - If `exception_type = 'custom_hours'` → override times
   - If no `from`/`to` → girl excluded (no schedule = not shown)
   - **Today:** compares current Prague time vs shift → `working` / `later` / excluded (past)
   - **Tomorrow:** shows "Zítra" badge, status = `off`
   - **2+ days out:** shows times, status = `off`
4. Sorts: working first, then later, then off; alphabetical within each

---

## 9. How GirlCard Displays Shifts

**File:** `components/girl/GirlCard.tsx`

- `working` status → green dot + "Dnes 10:00 — 16:00"
- `later` status → yellow dot + "Později 16:30"
- `off` with tomorrow data → "Zítra 10:00–16:00"
- `off` without tomorrow → "10:00 — 16:00" (muted)

---

## 10. Key Findings for Night Shift Implementation

1. **No night shifts exist** — all current operations end by 22:30
2. **The code assumes shift_from < shift_to within the same day** — a night shift like 22:00–06:00 would break the current comparison logic in `getGirlsForDay()` (line 831: `now >= from && now <= to`)
3. **Story schedule logic** (`lib/story-schedule.ts`) also assumes same-day shifts — `calculateAccumulatedShiftMinutes()` would miscalculate for cross-midnight shifts
4. **Admin presets** only define day/evening/full — no night preset
5. **The 30-minute gap** between shifts (16:00 end → 16:30 start) is intentional — cleanup/transition time
6. **Three girls have no schedule** but are active — they never appear on `/rozvrh`
