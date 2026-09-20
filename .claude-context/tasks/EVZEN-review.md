# EVŽEN REVIEW — Kontrola shody se zadáním

**Datum:** 2026-09-20
**Status:** NALEZENY PROBLÉMY

---

## ZADÁNÍ 1: Manažerka při otevření vidí HNED rezervace

> "Potřebuju aby manazerka při otevření aplikace videla hned rezervace pohodle, aby mohla kdyžtak na telefonu ihned říct kdo v kolik ma cas"

### Kontrola přihlašovací logiky (lib/auth-actions.ts:85-93):
- `girl` → `/studio/dashboard`
- `operator` → `/booking/calendar`
- `admin` + `manager` → `/booking/dashboard`

### Verdikt: OK (s výhradou)

**CO FUNGUJE:**
- Manažerka po přihlášení skočí na `/booking/dashboard`
- Dashboard obsahuje sekci "Dnes" (`db-today`) — zobrazuje VŠECHNY dnešní rezervace
- Každá rezervace ukazuje: **ČAS** (startHHMM), **SLEČNA** (girl_name), **KLIENT** (client_nickname), **LOKACE** (location_name)
- Na mobilu je přehled responzivní — čas je zvětšen na 17px, jméno slečny na 14px
- Aktuálně probíhající rezervace je vizuálně zvýrazněna (modrý rámeček)
- Proběhlé rezervace jsou ztlumené (opacity 0.5)
- Bottom nav má "Dnes" tlačítko jako první položku → snadný návrat

**VÝHRADA:**
- Mobilní bottom nav ukazuje "Dnes" odkaz na `/booking/dashboard` — OK, to je správně
- Kliknutím na rezervaci se přejde na detail v kalendáři — OK

**ZÁVĚR ZADÁNÍ 1: SPLNĚNO** — Manažerka vidí hned dnešní rezervace s kdo, v kolik, s kým.

---

## ZADÁNÍ 2: Lokace (Praha) ZVÝRAZNĚNÁ ve VŠECH views

> "Potřebuju aby v celem systemu byla ZVYRAZENENA PRAHA NA KTERY SLECNA JE"

### Kontrola po jednotlivých views:

#### 1. Dashboard — db-today-loc (řádek 258, 656-665)
- **Styl:** `font-size: 10px; color: var(--dim); background: rgba(255,255,255,0.06)`
- **PROBLÉM:** Barva `var(--dim)` = `#6a5e72` = ŠEDÁ. Na tmavém pozadí prakticky neviditelné. To NENÍ zvýraznění.

#### 2. Dashboard — db-list-loc (pending, working, recent — řádky 313, 343, 399, 552-558)
- **Styl:** `font-size: 11px; color: var(--dim); background: rgba(255,255,255,0.05)`
- **PROBLÉM:** Stejný problém — šedá barva, malý text, minimální kontrast. NENÍ zvýrazněné.

#### 3. CalendarDayView — cal-girl-loc (header sloupce, řádek 134, 274-279)
- **Styl:** `font-size: 10px; font-weight: 600; background: rgba(96,165,250,0.12); color: var(--blue)`
- **OK-ISH:** Modrý badge s pozadím, ale jen 10px — relativně malý. Aspoň je barevně odlišený.

#### 4. CalendarDayView — booking blocks (řádek 202)
- **Styl:** Lokace je v `cal-bk-meta` = `color: var(--muted); font-size: 10px`
- **PROBLÉM:** Lokace na booking blocku je jen šedý 10px text, žádný badge, žádné zvýraznění.

#### 5. CalendarMobileList — cal-ml-loc (řádek 65, 263-268)
- **Styl:** `font-size: 10px; font-weight: 600; background: rgba(96,165,250,0.12); color: var(--blue)`
- **OK-ISH:** Modrý badge jako v DayView. Ale jen v headeru slečny, NE u jednotlivých bookingů.

#### 6. CalendarWeekView — cal-wg-girl-loc (řádek 112, 231-233)
- **Styl:** `font-size: 9px; font-weight: 600; color: var(--blue)` — BEZ pozadí
- **PROBLÉM:** Nejmenší ze všech = 9px, žádné pozadí, žádný badge. Téměř neviditelné.

#### 7. QuickBookingPanel — qb-girl-loc (řádek 399, 72-74)
- **Styl:** `font-size: 10px; font-weight: 600; color: var(--blue); margin-left: 4px`
- **OK-ISH:** Modrý text, ale bez pozadí/badge. Mohlo by být výraznější.

#### 8. BookingDetailOverlay (řádek 127)
- **Styl:** Lokace je inline text `· ${b.locationName}` bez jakékoliv třídy
- **PROBLÉM:** Žádné zvýraznění, jen text v řadě s cenou.

### Verdikt ZADÁNÍ 2: NESPLNĚNO

**Uživatel chtěl lokaci ZVÝRAZNĚNOU. Aktuální stav:**

| View | Velikost | Barva | Badge/pozadí | Verdikt |
|------|----------|-------|-------------|---------|
| Dashboard (today) | 10px | ŠEDÁ (dim) | téměř průhledné | NESPLNĚNO |
| Dashboard (lists) | 11px | ŠEDÁ (dim) | téměř průhledné | NESPLNĚNO |
| DayView header | 10px | Modrá | modrý badge | ČÁSTEČNĚ |
| DayView bookings | 10px | Šedá (muted) | žádný | NESPLNĚNO |
| MobileList header | 10px | Modrá | modrý badge | ČÁSTEČNĚ |
| MobileList bookings | — | — | CHYBÍ | NESPLNĚNO |
| WeekView | 9px | Modrá | žádný | NESPLNĚNO |
| QuickBooking | 10px | Modrá | žádný | ČÁSTEČNĚ |
| BookingDetail | inherit | inherit | žádný | NESPLNĚNO |

**Co je potřeba opravit:**
1. **VŠUDE** by lokace měla mít výrazný badge (barevné pozadí + bold text), ne jen drobný šedý text
2. Minimální velikost by měla být 11-12px (ne 9-10px)
3. Barva by měla být výrazná (modrá/coral) s viditelným pozadím, NE dim/muted
4. Na booking blocích v DayView lokace chybí jako badge (je jen v cal-bk-meta)
5. V MobileList lokace CHYBÍ u jednotlivých bookingů
6. V BookingDetailOverlay lokace potřebuje vlastní zvýrazněný badge, ne inline text
7. Dashboard lokace používá var(--dim) místo výrazné barvy

---

## SOUHRN

| Zadání | Status | Detail |
|--------|--------|--------|
| 1. Manažerka vidí hned rezervace | SPLNĚNO | Dashboard s dnešním přehledem jako výchozí stránka |
| 2. Lokace ZVÝRAZNĚNA všude | NESPLNĚNO | Lokace je ve většině views malý šedý text, ne zvýraznění |

**DOPORUČENÍ:** Vrátit zadání 2 implementátorovi k přepracování — lokace musí být vizuálně výrazná (barevný badge, min. 11px, viditelné pozadí) ve VŠECH views konzistentně.
