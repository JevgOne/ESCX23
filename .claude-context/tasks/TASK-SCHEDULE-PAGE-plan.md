# TASK #4: /booking/schedule stránka — rozvrh směn

## Status: PLÁN HOTOVÝ — čeká na implementaci

## Analýza

### Aktuální stav
- Sidebar (`components/booking/BookingSidebar.tsx` řádek 23) odkazuje na `/booking/schedule` s labelem "Rozvrh směn"
- Adresář `app/booking/schedule/` **NEEXISTUJE** → 404
- Stránku je třeba vytvořit od nuly

### Co máme k dispozici

#### DB tabulka `girl_schedules`
```sql
CREATE TABLE girl_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),  -- Mon=0..Sun=6
  start_time TEXT NOT NULL,    -- "HH:MM"
  end_time TEXT NOT NULL,      -- "HH:MM"
  is_active BOOLEAN DEFAULT 1,
  location_id INTEGER,         -- FK to locations
  effective_from DATE,         -- NULL = platí hned
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (girl_id) REFERENCES girls(id) ON DELETE CASCADE
)
```

#### DB tabulka `schedule_exceptions`
Používá se v `lib/story-schedule.ts` a `lib/booking-queries.ts`:
- `exception_type`: 'unavailable' | 'custom_hours'
- Overriduje girl_schedules pro konkrétní datum

#### Existující query funkce
1. **`getWeekSchedules(weekStart)`** v `lib/booking-queries.ts` řádek 220 — vrací `Map<girlId, WeekGirlSchedule>` s shifts per day_of_week
2. **`getAllSchedulesGrouped()`** v `lib/queries.ts` řádek 2431 — vrací všechny girls s jejich schedules, fotkami, barvami
3. **`getCalendarGirls(date)`** v `lib/booking-queries.ts` řádek 51 — vrací girls pro konkrétní den s shift info

#### Existující design patterns
- **Admin schedule editor** (`app/[locale]/(admin)/admin/schedules/page.tsx`) — 7-column grid per girl, show/off days, barevné karty
- **Booking calendar** (`app/booking/calendar/page.tsx`) — day/week view toggle, date navigation
- **STUDIOFLOW design** — dark theme, coral accent, inline CSS, Server Components

### Auth
- Layout `app/booking/layout.tsx` volá `requireBooking()` → povoleno pro `admin` + `operator`
- Schedule stránka NENÍ adminOnly v sidebaru → viditelná i pro operátorku
- Stránka by měla být READ-ONLY (editace schedules je v admin panelu `/admin/schedules`)

## Plán implementace

### Vytvořit `app/booking/schedule/page.tsx`

**Účel:** Přehledný týdenní rozvrh směn všech dívek pro operátorku a admina. Čistě zobrazovací — žádné editace.

**Funkcionalita:**
1. Týdenní zobrazení (Po-Ne) s navigací mezi týdny
2. Řádky = dívky, sloupce = dny
3. Barevné buňky se směnou (čas + pobočka)
4. Prázdné buňky = volno
5. Aktuální den zvýrazněný
6. Filtr na konkrétní dívku (volitelný)

### Krok 1: Vytvořit novou query funkci (nebo reuse existující)

Reuse **`getAllSchedulesGrouped()`** z `lib/queries.ts` — vrací girls + schedules + photos + colors. Perfektní match.

Alternativně přidat novou optimalizovanou query, ale pro MVP stačí existující.

### Krok 2: Vytvořit page.tsx

```
app/booking/schedule/page.tsx
```

**Vzor:** Inspirovat se admin schedule page designem (7-col grid), ale:
- Bez edit/delete akcí (read-only)
- Kompaktnější layout (více girls na obrazovce)
- Výraznější zvýraznění dnešního dne
- Navigace mezi týdny (prev/next)

**Struktura:**
```tsx
export const dynamic = 'force-dynamic';

export default async function BookingSchedulePage({ searchParams }) {
  // 1. Parse week navigation (?week=2026-W38)
  // 2. Fetch all schedules: getAllSchedulesGrouped()
  // 3. Render 7-column grid per girl
}
```

### Krok 3: Inline CSS

Použít STUDIOFLOW design pattern — inline `<style>` tag s dark theme variablami:
- `var(--bg-elev)`, `var(--line)`, `var(--coral)`, `var(--text)`, `var(--muted)`, `var(--dim)`
- 7-column grid responsive (mobile: vertikální list)
- Girl avatar + name v levém sloupci
- Barevné shift buňky s časem a pobočkou

### Krok 4: Week navigation

- URL param: `?week=YYYY-MM-DD` (Monday of the week)
- Prev/Next tlačítka
- "Dnes" link pro návrat na aktuální týden
- Zobrazit rozsah dat: "15.9. – 21.9.2026"

### Navrhovaný layout

```
┌─────────────────────────────────────────────────────────────┐
│  Rozvrh směn          ◄ Předchozí  15.9.–21.9.2026  Další ►│
├──────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│  Dívka   │  Po  │  Út  │  St  │  Čt  │  Pá  │  So  │  Ne  │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 🟠 Emily │10-16 │      │10-16 │      │      │      │      │
│          │ P2   │  —   │ P2   │  —   │  —   │  —   │  —   │
├──────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 🟣 Nika  │      │      │10-22 │      │      │      │16-22 │
│          │  —   │  —   │ P3   │  —   │  —   │  —   │ P3   │
└──────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### Krok 5: Mobile responsive
- Pod 768px: každá dívka jako karta se seznamem směn (den + čas)
- Stejný pattern jako admin schedules page (sched-mobile-list)

## Soubory k vytvořit/editovat
1. **`app/booking/schedule/page.tsx`** — NOVÝ soubor (hlavní stránka)

## Závislosti
- `lib/queries.ts` → `getAllSchedulesGrouped()` (existuje, reuse)
- Žádné nové npm balíčky
- Žádné nové DB tabulky/migrace

## Poznámky
- Schedule data jsou WEEKLY (den v týdnu), ne datumová — takže "navigace mezi týdny" je vizuální (týden se nemění, data jsou stejná pokud se nezmění `effective_from`)
- Schedule exceptions (`schedule_exceptions` tabulka) by měly být zohledněny pro přesnost — ale to je enhancement, ne MVP
- V budoucnu: propojit s booking calendar (klik na buňku → přesměrování na calendar day view)
