# EVŽEN REVIEW v2 — Re-review po opravě lokace

**Datum:** 2026-09-20
**Status:** SPLNĚNO

---

## Zadání: "Potřebuju aby v celem systemu byla ZVYRAZENENA PRAHA NA KTERY SLECNA JE"

### Kontrola 6 problémů z prvního review:

#### 1. Dashboard db-today-loc (řádek 657-667)
- **PŘED:** `color: var(--dim)` = šedá, `background: rgba(255,255,255,0.06)` = téměř průhledné
- **TEĎ:** `color: var(--blue)` = #60a5fa, `font-weight: 600`, `background: rgba(96,165,250,0.12)` = viditelný modrý badge
- **VERDIKT: OPRAVENO**

#### 2. Dashboard db-list-loc (řádek 552-559)
- **PŘED:** `color: var(--dim)`, `background: rgba(255,255,255,0.05)`
- **TEĎ:** `color: var(--blue)`, `font-weight: 600`, `background: rgba(96,165,250,0.12)`
- **VERDIKT: OPRAVENO**

#### 3. CalendarDayView — booking blocks (řádek 202, 280-285)
- **PŘED:** Lokace byla jen v `cal-bk-meta` (šedý 10px text)
- **TEĎ:** Nová třída `cal-bk-loc` s `font-size: 11px; font-weight: 600; background: rgba(96,165,250,0.12); color: var(--blue)` — vlastní badge
- **JSX:** `{b.locationName && !isBreak && <span className="cal-bk-loc">{b.locationName}</span>}` (řádek 202)
- **VERDIKT: OPRAVENO**

#### 4. CalendarDayView — header (řádek 274-279)
- **PŘED:** `font-size: 10px`
- **TEĎ:** `font-size: 11px; margin-top: 2px` — mírně zvětšeno, konzistentní badge styl
- **VERDIKT: OPRAVENO**

#### 5. CalendarMobileList — booking rows (řádek 93, 270-275)
- **PŘED:** Lokace u bookingů CHYBĚLA (byla jen v headeru slečny)
- **TEĎ:** Nový `<span className="cal-ml-bk-loc">{b.locationName}</span>` u každého bookingu (řádek 93)
- **CSS:** `cal-ml-bk-loc` = `font-size: 11px; font-weight: 600; background: rgba(96,165,250,0.12); color: var(--blue); margin-left: auto`
- **VERDIKT: OPRAVENO**

#### 6. CalendarWeekView — girl name cell (řádek 231-235)
- **PŘED:** `font-size: 9px; color: var(--blue)` — bez pozadí
- **TEĎ:** `font-size: 11px; display: inline-block; background: rgba(96,165,250,0.12); padding: 1px 6px; border-radius: 4px; margin-top: 2px`
- **VERDIKT: OPRAVENO**

#### 7. QuickBookingPanel — girl button (řádek 72-76)
- **PŘED:** `font-size: 10px; color: var(--blue)` — bez pozadí
- **TEĎ:** `font-size: 11px; background: rgba(96,165,250,0.12); padding: 1px 6px; border-radius: 4px`
- **VERDIKT: OPRAVENO**

#### 8. BookingDetailOverlay (řádek 127, 256-260)
- **PŘED:** Inline text `· ${b.locationName}` bez zvýraznění
- **TEĎ:** `<span className="bdo-loc-badge">{b.locationName}</span>` — vlastní badge s `font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: rgba(96,165,250,0.12); color: var(--blue)`
- **VERDIKT: OPRAVENO**

---

## Konzistence stylů

Všechny lokační badge nyní sdílejí konzistentní vizuální styl:
- **Barva:** `var(--blue)` = #60a5fa
- **Pozadí:** `rgba(96,165,250,0.12)` = poloprůhledná modrá
- **Velikost:** 11-12px (zvýšeno z 9-10px)
- **Font-weight:** 600 (bold)
- **Padding:** 1-2px 6-8px s border-radius 4px

Lokace je nyní vizuálně odlišena od okolního textu modrým badge — splňuje požadavek "ZVÝRAZNĚNÁ".

---

## Kompletní přehled pokrytí

| View | Lokace kde | Styl | Status |
|------|-----------|------|--------|
| Dashboard — today list | u každé rezervace | modrý badge 11px | OK |
| Dashboard — pending list | u každé pending rez. | modrý badge 11px | OK |
| Dashboard — working girls | u každé pracující | modrý badge 11px | OK |
| Dashboard — recent bookings | u každé rez. | modrý badge 11px | OK |
| CalendarDayView — header | u jména slečny | modrý badge 11px | OK |
| CalendarDayView — booking block | na booking bloku | modrý badge 11px | OK |
| CalendarMobileList — header | u jména slečny | modrý badge 11px | OK |
| CalendarMobileList — booking row | u každého bookingu | modrý badge 11px | OK |
| CalendarWeekView — girl cell | u jména slečny | modrý badge 11px | OK |
| QuickBookingPanel — girl button | u tlačítka slečny | modrý badge 11px | OK |
| BookingDetailOverlay — detail | v programu | modrý badge 12px | OK |

---

## ZÁVĚR

**ZADÁNÍ 2: SPLNĚNO** — Lokace je nyní zvýrazněná konzistentním modrým badge ve všech views systému. Žádné view nechybí, styl je jednotný a výrazný.

Oba zadání jsou nyní splněna:
1. Manažerka vidí hned rezervace — SPLNĚNO (od v1)
2. Lokace zvýrazněná všude — SPLNĚNO (po opravě)
