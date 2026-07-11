# TASK-023: Night Shifts + 5-Column Schedule — Implementation Plan

**Status:** awaiting approval
**Date:** 2026-07-11
**Based on:** TASK-023-night-shifts-research.md

---

## Problem

All current shifts end by 22:30. Status logic (`now >= from && now <= to`) assumes same-day shifts. The `/rozvrh` page shows a flat grid with no grouping. We need cross-midnight shifts (night/allevening) and 5 visual groups on rozvrh.

---

## Core Design: +24h Convention

When admin enters a cross-midnight shift (e.g. from=23:00, to=07:00), the system detects `to < from` and stores `end_time` with +24h offset:

```
User enters:  23:00 – 07:00
DB stores:    start_time = '23:00', end_time = '31:00'

User enters:  16:30 – 07:00
DB stores:    start_time = '16:30', end_time = '31:00'
```

**Why +24h:** All existing `now >= from && now <= to` comparisons continue to work without modification for non-midnight shifts. For cross-midnight shifts, we only need a small wrapper that converts current time to +24h format when comparing (if `now < from`, add 24h to now).

**Display conversion:** When showing times to users, `31:00` → `07:00`, `30:30` → `06:30` etc. A single helper `displayTime(t)` handles this.

---

## Shift Category Auto-Detection

Categories determined purely from stored times — no manual selection, no new DB column:

```typescript
export type ShiftCategory = 'morning' | 'afternoon' | 'allday' | 'allevening' | 'night';

export function classifyShift(from: string, to: string): ShiftCategory {
  const startH = parseInt(from.split(':')[0]);
  const endH = parseInt(to.split(':')[0]);

  // Cross-midnight: end_time >= 24 (stored as 24+)
  if (endH >= 24) {
    // Starts at 22:00+ → night, otherwise allevening
    return startH >= 22 ? 'night' : 'allevening';
  }
  // Same-day shifts
  if (startH < 12 && endH >= 20) return 'allday';   // 10:00–22:00
  if (startH < 14) return 'morning';                  // 10:00–16:00
  return 'afternoon';                                  // 16:30–22:30
}
```

### 5 Presets

| Preset | Label | Times (display) | Times (DB) |
|---|---|---|---|
| `morning` | Ranní | 10:00 – 16:00 | 10:00 – 16:00 |
| `afternoon` | Odpolední | 16:30 – 22:30 | 16:30 – 22:30 |
| `fullday` | Celodenní | 10:00 – 22:00 | 10:00 – 22:00 |
| `allevening` | Celovečerní | 16:30 – 07:00 | 16:30 – 31:00 |
| `night` | Noční | 23:00 – 07:00 | 23:00 – 31:00 |

---

## Implementation Steps

### Step 1: Helper functions in `lib/utils.ts`

**Dependencies:** none
**New exports:**

```typescript
/** Convert +24h stored time to display format: "31:00" → "07:00" */
export function displayTime(time: string): string {
  const h = parseInt(time.split(':')[0]);
  if (h >= 24) {
    return `${String(h - 24).padStart(2, '0')}:${time.split(':')[1]}`;
  }
  return time.substring(0, 5);
}

/** Convert user input to +24h storage: detects cross-midnight. */
export function toStorageTime(from: string, to: string): { from: string; to: string } {
  if (to < from) {
    // Cross-midnight: add 24 to end hour
    const [h, m] = to.split(':').map(Number);
    return { from, to: `${h + 24}:${String(m).padStart(2, '0')}` };
  }
  return { from, to };
}

/** Check if current time falls within a shift (handles +24h convention). */
export function isWithinShift(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    // Cross-midnight: if now < from, treat now as next-day (add 24h)
    const nowH = parseInt(now.split(':')[0]);
    const adjustedNow = now < from
      ? `${nowH + 24}:${now.split(':')[1]}`
      : now;
    return adjustedNow >= from && adjustedNow <= to;
  }
  return now >= from && now <= to;
}

/** Check if current time is before shift start. */
export function isBeforeShift(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    // Cross-midnight: "before" is any time after last shift ended and before this shift starts
    // i.e. now > displayTime(to) AND now < from
    const displayTo = displayTime(to);
    return now > displayTo && now < from;
  }
  return now < from;
}

/** Check if shift has ended (for filtering out past shifts). */
export function isShiftEnded(now: string, from: string, to: string): boolean {
  const toH = parseInt(to.split(':')[0]);
  if (toH >= 24) {
    // Cross-midnight: ended if now > displayTime(to) AND now < from
    const displayTo = displayTime(to);
    return now > displayTo && now < from;
  }
  return now > to;
}

export type ShiftCategory = 'morning' | 'afternoon' | 'allday' | 'allevening' | 'night';

export function classifyShift(from: string, to: string): ShiftCategory { ... }
```

### Step 2: Fix status comparisons in `lib/queries.ts`

**Dependencies:** Step 1
**Scope:** 6 JS locations + 3 SQL locations

#### 2a: JS status comparisons (6 locations)

Lines 116, 239, 831, 1663, 2017, 2116 — all follow this pattern:
```typescript
// BEFORE:
if (now >= from && now <= to) status = 'working';
else if (now < from) status = 'later';

// AFTER:
if (isWithinShift(now, from, to)) status = 'working';
else if (isBeforeShift(now, from, to)) status = 'later';
```

Line 833 (shift ended check):
```typescript
// BEFORE:
else return null; // shift already ended

// AFTER:
else if (isShiftEnded(now, from, to)) return null;
```

#### 2b: SQL-level comparisons (3 locations)

Lines 422-423, 1945-1946, 1954-1958 — the `working_now` / `status_rank` SQL CASE:

```sql
-- BEFORE:
AND ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)

-- AFTER (handles +24h convention):
AND (
  CASE
    WHEN CAST(SUBSTR(COALESCE(se.end_time, gs.end_time),1,2) AS INTEGER) >= 24
    THEN (
      CASE
        WHEN ? < SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
        THEN PRINTF('%02d', CAST(SUBSTR(?,1,2) AS INTEGER) + 24) || SUBSTR(?,3)
        ELSE ?
      END
    ) >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
    AND (
      CASE
        WHEN ? < SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
        THEN PRINTF('%02d', CAST(SUBSTR(?,1,2) AS INTEGER) + 24) || SUBSTR(?,3)
        ELSE ?
      END
    ) <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
    ELSE ? >= SUBSTR(COALESCE(se.start_time, gs.start_time),1,5)
     AND ? <= SUBSTR(COALESCE(se.end_time, gs.end_time),1,5)
  END
)
```

**Alternative (simpler):** Move the SQL-level `working_now` check to JS post-processing instead, using `isWithinShift()`. This avoids complex SQL and is consistent with the 6 other locations. The SQL result already returns `shift_from` and `shift_to`, so JS can compute it. **Recommended approach.**

#### 2c: Display times in GirlCard data

When building `GirlCard` objects, convert stored +24h times back to display format:
```typescript
let from = r.shift_from ? displayTime(String(r.shift_from)) : null;
let to = r.shift_to ? displayTime(String(r.shift_to)) : null;
```

**But keep raw times for status computation** (before display conversion).

### Step 3: Fix `lib/story-schedule.ts`

**Dependencies:** Step 1

#### 3a: `isCurrentlyOnShift()` (line 202)

```typescript
// BEFORE:
return time >= shift.start && time <= shift.end;

// AFTER:
return isWithinShift(time, shift.start, shift.end);
```

#### 3b: `calculateAccumulatedShiftMinutes()` (line 124)

The `parseTimeToMinutes()` helper already works with +24h format (e.g. "31:00" → 1860 minutes). The existing logic `if (effectiveEnd > effectiveStart)` naturally handles this because 1860 > 1380. **No change needed** here — the +24h convention makes this work automatically.

However, for the morning portion of a cross-midnight shift (the next calendar day), we need to ensure the shift is also checked on the next day. The day iterator (line 145: `while (dayDate <= lastDate)`) needs to check: if yesterday's shift has `endH >= 24`, count the morning portion (0:00 to displayTime(end)) on today.

```typescript
// After getting shift for current day, also check previous day:
const prevDow = dow === 0 ? 6 : dow - 1;
const prevShift = getShiftForDate(prevDateISO, prevDow, schedule, exceptionsList);
if (prevShift && parseInt(prevShift.end.split(':')[0]) >= 24) {
  // Previous day's shift extends into this day
  const morningEnd = parseTimeToMinutes(displayTime(prevShift.end));
  // ... clamp and accumulate morning portion
}
```

### Step 4: Cross-midnight on `/rozvrh` — show on BOTH days

**Dependencies:** Step 2
**File:** `app/[locale]/rozvrh/page.tsx` + `lib/queries.ts` (`getGirlsForDay`)

A shift 23:00–07:00 (stored as 23:00–31:00) on Friday (day_of_week=4) should appear:
- **Friday tab:** girl with shift 23:00–07:00
- **Saturday tab:** girl with morning remainder until 07:00

**In `getGirlsForDay()`:** Add a second LEFT JOIN for previous day's cross-midnight shifts:

```sql
-- Existing: same-day schedule
LEFT JOIN (...) gs ON gs.girl_id = g.id AND gs.rn = 1

-- NEW: previous day's cross-midnight schedule
LEFT JOIN (
  SELECT girl_id, start_time, end_time, location_id,
         ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST) AS rn
  FROM girl_schedules
  WHERE day_of_week = ?          -- previous day (dayOfWeek - 1, wrapping 0→6)
    AND is_active = 1
    AND CAST(SUBSTR(end_time,1,2) AS INTEGER) >= 24  -- cross-midnight only
    AND (effective_from IS NULL OR effective_from <= ?)
) gs_prev ON gs_prev.girl_id = g.id AND gs_prev.rn = 1
```

In JS post-processing: if a girl has no same-day shift but has `gs_prev`, compute status from the morning portion:
- If `now <= displayTime(gs_prev.end_time)` → status = `'working'`
- Otherwise → exclude (morning portion ended)

### Step 5: Update presets in save actions

**Dependencies:** none (independent)

#### 5a: `app/[locale]/(admin)/admin/divky/[id]/dostupnost/actions.ts`

Add 2 presets + cross-midnight conversion:
```typescript
const PRESETS: Record<string, { from: string; to: string }> = {
  morning:    { from: '10:00', to: '16:00' },
  afternoon:  { from: '16:30', to: '22:30' },
  fullday:    { from: '10:00', to: '22:00' },
  allevening: { from: '16:30', to: '31:00' },  // NEW
  night:      { from: '23:00', to: '31:00' },  // NEW
};
```

For custom times, apply `toStorageTime()` before saving:
```typescript
if (preset === 'custom') {
  const converted = toStorageTime(customFrom, customTo);
  times = { from: converted.from, to: converted.to };
}
```

#### 5b: `lib/admin-actions.ts` (line 1067)

Same changes to `PRESET_TIMES`:
```typescript
const PRESET_TIMES: Record<string, [string, string]> = {
  ranni: ['10:00', '16:00'],
  odpoledni: ['16:30', '22:30'],
  celodenni: ['10:00', '22:00'],
  celovecerni: ['16:30', '31:00'],  // NEW
  nocni: ['23:00', '31:00'],        // NEW
};
```

### Step 6: Update preset UIs

**Dependencies:** Step 5

#### 6a: `components/admin/schedule/WeeklyScheduleForm.tsx`

Add 2 presets to the `PRESETS` array:
```typescript
const PRESETS = [
  { value: 'morning',    label: 'Ranní',       sub: '10:00 – 16:00', from: '10:00', to: '16:00' },
  { value: 'afternoon',  label: 'Odpolední',   sub: '16:30 – 22:30', from: '16:30', to: '22:30' },
  { value: 'fullday',    label: 'Celodenní',   sub: '10:00 – 22:00', from: '10:00', to: '22:00' },
  { value: 'allevening', label: 'Celovečerní', sub: '16:30 – 07:00', from: '16:30', to: '31:00' },  // NEW
  { value: 'night',      label: 'Noční',       sub: '23:00 – 07:00', from: '23:00', to: '31:00' },  // NEW
  { value: 'custom',     label: 'Vlastní',     sub: '',               from: '',      to: ''      },
];
```

Update `detectPreset()`:
```typescript
function detectPreset(from: string | null, to: string | null): string {
  if (!from || !to) return 'fullday';
  const f = from.substring(0, 5);
  const t = to.substring(0, 5);
  if (f === '10:00' && t === '16:00') return 'morning';
  if (f === '16:30' && t === '22:30') return 'afternoon';
  if (f === '10:00' && t === '22:00') return 'fullday';
  if (f === '16:30' && t === '31:0')  return 'allevening';  // +24h
  if (f === '23:00' && t === '31:0')  return 'night';       // +24h
  return 'custom';
}
```

Display stored `31:00` as `07:00` in the custom time inputs using `displayTime()`.

#### 6b: `app/[locale]/(admin)/admin/schedules/page.tsx`

Add 2 preset buttons (lines 656-677) and update JS map (line 703):
```javascript
var P={ranni:['10:00','16:00'],odpoledni:['16:30','22:30'],celodenni:['10:00','22:00'],celovecerni:['16:30','07:00'],nocni:['23:00','07:00']};
```

Note: this simpler admin form uses raw display times; the `addGirlSchedule` action will apply `toStorageTime()`.

#### 6c: `app/[locale]/studio/kalendar/page.tsx`

Add same presets to studio's self-service schedule editor (if it has preset buttons — currently it relies on the admin `WeeklyScheduleForm` component, so 6a covers it).

### Step 7: `/rozvrh` page — 5-group layout

**Dependencies:** Steps 1, 2, 4
**File:** `app/[locale]/rozvrh/page.tsx`

After getting `girls` from `getGirlsForDay()`, group by category:

```typescript
import { classifyShift, type ShiftCategory } from '@/lib/utils';

const GROUP_ORDER: ShiftCategory[] = ['morning', 'afternoon', 'allday', 'allevening', 'night'];

const groups = new Map<ShiftCategory, GirlCard[]>();
for (const cat of GROUP_ORDER) groups.set(cat, []);

for (const girl of girls) {
  if (girl.shiftFrom && girl.shiftTo) {
    // Use raw stored times for classification (before displayTime conversion)
    const cat = classifyShift(girl.rawShiftFrom!, girl.rawShiftTo!);
    groups.get(cat)!.push(girl);
  }
}
```

**Note:** Need to pass raw stored times alongside display times. Options:
- Add `rawShiftFrom`/`rawShiftTo` to GirlCard interface
- Or classify before display conversion in `getGirlsForDay()` and add `shiftCategory` field

**Recommended:** Add `shiftCategory: ShiftCategory | null` to `GirlCard` interface. Set it in `getGirlsForDay()` before converting times to display format.

Render each non-empty group:

```tsx
const GROUP_LABELS: Record<ShiftCategory, Record<string, string>> = {
  morning:    { cs: 'Ranní směna',      en: 'Morning shift',     de: 'Frühschicht',        uk: 'Ранкова зміна' },
  afternoon:  { cs: 'Odpolední směna',  en: 'Afternoon shift',   de: 'Nachmittagsschicht', uk: 'Денна зміна' },
  allday:     { cs: 'Celodenní směna',  en: 'All-day shift',     de: 'Ganztagesschicht',   uk: 'Цілоденна зміна' },
  allevening: { cs: 'Celovečerní směna',en: 'All-evening shift', de: 'Ganzabendschicht',   uk: 'Вечірня зміна' },
  night:      { cs: 'Noční směna',      en: 'Night shift',       de: 'Nachtschicht',       uk: 'Нічна зміна' },
};

{GROUP_ORDER.map(cat => {
  const catGirls = groups.get(cat)!;
  if (catGirls.length === 0) return null;
  return (
    <section key={cat} className="rozvrh-shift-group">
      <h2 className="rozvrh-group-heading">
        {(cat === 'night' || cat === 'allevening') && <span className="rozvrh-moon">🌙</span>}
        {GROUP_LABELS[cat][locale] ?? GROUP_LABELS[cat].en}
        <span className="rozvrh-group-count">{catGirls.length}</span>
      </h2>
      <GirlCardGrid girls={catGirls} priorityCount={cat === 'morning' ? 4 : 0} />
    </section>
  );
})}
```

CSS for group headings (add to rozvrh styles or global):
```css
.rozvrh-shift-group { margin-bottom: 32px; }
.rozvrh-group-heading {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 700; color: var(--color-text);
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 1px solid var(--color-line);
}
.rozvrh-group-count {
  font-size: 12px; color: var(--color-text-dim); font-weight: 500;
  padding: 2px 8px; background: var(--color-bg-elev); border-radius: 999px;
}
.rozvrh-moon { font-size: 18px; }
```

### Step 8: Moon badge on GirlCard

**Dependencies:** Step 7 (shiftCategory on GirlCard)
**File:** `components/girl/GirlCard.tsx`

Use the `shiftCategory` field to determine badge:

```tsx
const isNightShift = girl.shiftCategory === 'night' || girl.shiftCategory === 'allevening';

// Replace the green dot for night shifts:
{isNightShift ? (
  <span className="girl-online-moon" aria-label="Night shift">🌙</span>
) : (
  <span className={`girl-online-dot girl-online-dot-${statusClass}`} />
)}
```

The time display on the photo overlay also shows display-formatted times (already handled by Step 2c).

---

## Files Changed (Summary)

| # | File | Change | Depends on |
|---|---|---|---|
| 1 | `lib/utils.ts` | Add 6 new exports: `displayTime`, `toStorageTime`, `isWithinShift`, `isBeforeShift`, `isShiftEnded`, `classifyShift` | — |
| 2 | `lib/queries.ts` | Fix 6x JS status comparisons, move SQL-level checks to JS, add `shiftCategory` to `GirlCard`, add prev-day cross-midnight JOIN in `getGirlsForDay()`, display-convert times | 1 |
| 3 | `lib/story-schedule.ts` | Fix `isCurrentlyOnShift()`, handle prev-day overflow in `calculateAccumulatedShiftMinutes()` | 1 |
| 4 | `app/.../dostupnost/actions.ts` | Add 2 presets + `toStorageTime()` for custom times | 1 |
| 5 | `lib/admin-actions.ts` | Add 2 presets to `PRESET_TIMES` + `toStorageTime()` | 1 |
| 6 | `components/admin/schedule/WeeklyScheduleForm.tsx` | Add 2 presets to UI + update `detectPreset()` + display conversion | 1 |
| 7 | `app/.../admin/schedules/page.tsx` | Add 2 preset buttons + update JS preset map | — |
| 8 | `app/[locale]/rozvrh/page.tsx` | 5-group layout with category headings | 1, 2 |
| 9 | `components/girl/GirlCard.tsx` | Moon badge for night/allevening | 2 (shiftCategory) |

| 10 | `pricing_plans` DB | Add `night_price` column | — (migration) |
| 11 | `lib/queries.ts` | Update `getActivePricingPlans()` to include `night_price` | 10 |
| 12 | `components/cenik/ProgramsGrid.tsx` | Show night price on cards | 11 |
| 13 | `components/cenik/NightPricingNote.tsx` | New: night pricing info note | — |
| 14 | `app/[locale]/cenik/page.tsx` | Add NightPricingNote below ProgramsGrid | 13 |

**1 DB migration** (add `night_price` to `pricing_plans`). Existing `start_time`/`end_time` TEXT columns handle +24h values natively.

---

### Step 9: Night pricing on `/cenik`

**Dependencies:** none (independent of shift logic)

#### Analysis of current state

**DB tables:**
- `pricing_plans`: 5 active plans (30/45/60/90/120 min), each with `price INTEGER` (CZK)
- `pricing_extras`: 8 extras (500–1500 Kč), currently all inactive on frontend (ExtrasGrid shows hardcoded range "500–1 000 Kč")
- `pricing_plan_features`: only used by 1 inactive plan

**Current ceník page:** Simple grid of program cards, each showing duration + price + "Apartmán + společnost". No day/night distinction.

#### Design: night surcharge on program cards

**Approach chosen: `night_price` column + subtle display on each card.**

Why not alternatives:
- ~~Separate night section~~ — duplicates all 5 cards, doubles page length, confusing
- ~~Flat surcharge note~~ — easy to miss, doesn't show actual amounts
- ~~Extra row in extras~~ — extras are per-service, night pricing is per-program

**The simplest clear approach:** Each program card shows the day price prominently (as now) and a small night price line below it. Plus a brief note explaining when night pricing applies.

#### 9a: DB migration

Add `night_price` column to `pricing_plans`:

**File:** `lib/db.ts` (add to `runMigrations`)

```typescript
'ALTER TABLE pricing_plans ADD COLUMN night_price INTEGER DEFAULT NULL',
```

Then seed night prices via admin or SQL:
```sql
UPDATE pricing_plans SET night_price = 2500 WHERE duration = 30;   -- day: 2000
UPDATE pricing_plans SET night_price = 2700 WHERE duration = 45;   -- day: 2200
UPDATE pricing_plans SET night_price = 3000 WHERE duration = 60;   -- day: 2500
UPDATE pricing_plans SET night_price = 4500 WHERE duration = 90;   -- day: 4000
UPDATE pricing_plans SET night_price = 5500 WHERE duration = 120;  -- day: 4500
```

**NULL = no night pricing** (same as day price). This keeps it opt-in.

#### 9b: Query update

**File:** `lib/queries.ts` (`getActivePricingPlans`, line 322)

```typescript
export async function getActivePricingPlans() {
  const result = await db.execute(
    `SELECT id, duration, price, night_price, is_popular, title_cs, title_en, title_de, title_uk
     FROM pricing_plans WHERE is_active = 1
     ORDER BY duration ASC`
  );
  return result.rows;
}
```

#### 9c: ProgramsGrid — show night price on cards

**File:** `components/cenik/ProgramsGrid.tsx`

Add a small line below the day price when `night_price` is set:

```tsx
const NIGHT_LABEL: Record<string, string> = {
  cs: 'Noční', en: 'Night', de: 'Nacht', uk: 'Нічний',
};

// Inside each program card, after program-card-price:
{nightPrice && nightPrice !== price && (
  <div className="program-card-night">
    <span className="program-card-night-icon">🌙</span>
    <span className="program-card-night-label">{NIGHT_LABEL[locale] ?? NIGHT_LABEL.en}</span>
    <span className="program-card-night-price">
      {nightPrice.toLocaleString(priceLoc)} {currency}
    </span>
  </div>
)}
```

CSS (add to cenik styles):
```css
.program-card-night {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
  padding: 4px 12px;
  background: rgba(255, 215, 0, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-text-dim);
}
.program-card-night-icon { font-size: 12px; }
.program-card-night-label { font-weight: 600; }
.program-card-night-price {
  font-family: ui-monospace, monospace;
  color: var(--color-gold, #fbbf24);
  font-weight: 700;
}
```

Visual result per card:
```
┌─────────────────────┐
│      60 minut       │
│    Plný vibe        │
│                     │
│    2 500 Kč         │  ← day price (prominent)
│  🌙 Noční 3 000 Kč │  ← night price (subtle, gold)
│                     │
│  ✓ Apartmán + spol. │
│    [Rezervovat]     │
└─────────────────────┘
```

#### 9d: Night pricing note

**File:** `components/cenik/NightPricingNote.tsx` (new)

A brief note explaining when night pricing applies:

```tsx
const T: Record<string, { heading: string; body: string }> = {
  cs: {
    heading: 'Noční ceny',
    body: 'V nočních hodinách (od 23:00) platí zvýšené ceny. Noční cena je uvedena u každého programu.',
  },
  en: {
    heading: 'Night pricing',
    body: 'Higher rates apply during night hours (from 11 PM). Night prices are shown on each program.',
  },
  de: {
    heading: 'Nachtpreise',
    body: 'In den Nachtstunden (ab 23:00 Uhr) gelten erhöhte Preise. Der Nachtpreis ist bei jedem Programm angegeben.',
  },
  uk: {
    heading: 'Нічні ціни',
    body: 'У нічний час (з 23:00) діють підвищені ціни. Нічна ціна вказана біля кожної програми.',
  },
};

export default function NightPricingNote({ locale = 'cs' }: { locale?: string }) {
  const L = T[locale] ?? T.cs;
  return (
    <div className="night-pricing-note">
      <span className="night-pricing-icon">🌙</span>
      <div>
        <h4>{L.heading}</h4>
        <p>{L.body}</p>
      </div>
    </div>
  );
}
```

CSS:
```css
.night-pricing-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 14px 18px;
  background: rgba(255, 215, 0, 0.06);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 12px;
  font-size: 13px;
  color: var(--color-text-muted);
}
.night-pricing-icon { font-size: 20px; flex-shrink: 0; }
.night-pricing-note h4 {
  font-size: 14px; font-weight: 700; color: var(--color-text);
  margin: 0 0 4px;
}
.night-pricing-note p { margin: 0; line-height: 1.5; }
```

#### 9e: Ceník page integration

**File:** `app/[locale]/cenik/page.tsx`

Add note after ProgramsGrid:

```tsx
import NightPricingNote from '@/components/cenik/NightPricingNote';

// After <ProgramsGrid .../>:
<NightPricingNote locale={locale} />
```

---

## Implementation Order (dependency-based)

```
Step 1: lib/utils.ts helpers               ← foundation, no deps
Step 9a: DB migration (night_price)         ← independent, no deps
    ↓
Step 4: dostupnost/actions.ts presets      ← depends on 1
Step 5: admin-actions.ts presets           ← depends on 1
Step 7: admin/schedules/page.tsx UI        ← independent
Step 9b: queries.ts getActivePricingPlans  ← depends on 9a
    ↓
Step 6: WeeklyScheduleForm.tsx UI          ← depends on 4
Step 2: lib/queries.ts shift fixes         ← biggest change, depends on 1
Step 3: lib/story-schedule.ts fixes        ← depends on 1
Step 9c-e: ProgramsGrid + Note + cenik     ← depends on 9b
    ↓
Step 8: rozvrh/page.tsx 5-groups           ← depends on 2 (shiftCategory)
GirlCard.tsx moon badge                    ← depends on 2 (shiftCategory)
```

**Parallel batches:**
1. Steps 1 + 9a (utils + DB migration) — parallel, no deps
2. Steps 4, 5, 7, 9b (presets + query update) — parallel
3. Steps 6, 2, 3, 9c-e (UI + shift fixes + pricing UI) — parallel
4. Steps 8 + GirlCard moon badge — parallel, after 2

---

## Edge Cases to Test

| Scenario | Expected |
|---|---|
| Night shift 23:00–07:00 (DB: 23:00–31:00) at 23:30 | status = `working` |
| Night shift 23:00–07:00 at 02:00 next day | status = `working` |
| Night shift 23:00–07:00 at 07:01 next day | excluded (shift ended) |
| Night shift 23:00–07:00 at 15:00 same day | status = `later` |
| Allevening 16:30–07:00 at 16:00 | status = `later` |
| Allevening 16:30–07:00 at 20:00 | status = `working` |
| Allevening 16:30–07:00 at 03:00 next day | status = `working` |
| Friday night shift → Saturday rozvrh at 03:00 | girl appears on Saturday tab |
| Friday night shift → Saturday rozvrh at 10:00 | girl NOT on Saturday tab (morning portion ended) |
| Story created at 23:00 during night shift, checked at 02:00 | story visible |
| Custom time input: from=22:00, to=06:30 | stored as 22:00–30:30, displayed as 22:00–06:30 |
| Existing day shifts (10:00–16:00) | zero regression |
| Admin schedule grid shows "31:00" | must display as "07:00" |
| Ceník card with night_price set | shows day price + 🌙 Noční line |
| Ceník card with night_price = NULL | shows only day price, no night line |
| Ceník card with night_price = day price | no night line (same price) |

---

## Risk Assessment

1. **+24h SQL comparisons** — moving SQL-level `working_now` to JS post-processing eliminates complex SQL CASE statements. Low risk.
2. **Story schedule accumulation** — the +24h convention makes `parseTimeToMinutes("31:00")` = 1860, which works with existing arithmetic. The only addition is checking previous day's overflow. Medium risk.
3. **Previous-day JOIN** — extra query per rozvrh load, but small dataset (< 15 girls). Low risk.
4. **Display conversion** — all user-facing code must use `displayTime()`. Need to audit all `.substring(0,5)` calls. Medium risk.
5. **Preset additions** — purely additive. Low risk.
6. **Night pricing** — `night_price` column with NULL default. Existing plans unaffected until admin sets values. `NightPricingNote` is a new component, no existing code touched except adding import to cenik page. Low risk.
