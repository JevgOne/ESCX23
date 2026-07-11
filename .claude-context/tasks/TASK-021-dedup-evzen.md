# TASK-021 dedup re-review — Evzen

**Datum:** 2026-07-06
**Kontrolor:** Evzen THE KING
**Scope:** ROW_NUMBER() dedup + TZ fix ve vsech query funkcich ktere joinuji girl_schedules

---

## Puvodni bug (doslovna citace uzivatele)

> "v /divky bylo TMRW u divek ktere byly v pondeli minuly tyden"

**Pricina:** `getGirlsWithToday()` a `getGirlsForListing()` pouzivaly prosty `LEFT JOIN girl_schedules` bez deduplikace. Pokud divka mela stary zaznam (`effective_from = NULL`) a novy zaznam (`effective_from = 2026-07-01`) pro stejny `day_of_week`, JOIN vratil OBA radky — divka se zobrazila s daty ze stareho zaznamu.

**Ocekavany fix:** `ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST)` ve vsech queries, ktere joinuji `girl_schedules`. Plus TZ fix pro `tomorrowDate`.

---

## Kontrola: vsechny girl_schedules joiny v queries.ts

Naskenoval jsem kompletne `lib/queries.ts`. Vsechny `LEFT JOIN` na `girl_schedules` pouzivaji subquery s deduplikaci:

| # | Radek | Funkce | JOIN typ | ROW_NUMBER | effective_from filter | rn = 1 |
|---|-------|--------|----------|------------|----------------------|--------|
| 1 | 85-89 | `getGirlsForService()` | gs (dnes) | PASS | PASS | PASS |
| 2 | 196-202 | `getGirlsWithToday()` | gs (dnes) | PASS | PASS | PASS |
| 3 | 205-211 | `getGirlsWithToday()` | gs2 (zitrek) | PASS | PASS | PASS |
| 4 | 427-431 | `getHomepageStats()` | gs | PASS | PASS | PASS |
| 5 | 781-790 | `getGirlsForDay()` | gs | PASS | PASS | PASS |
| 6 | 1632-1636 | `getGirlScheduleForToday()` | gs | PASS | PASS | PASS |
| 7 | 1954-1960 | `getGirlsForListing()` | gs (dnes) | PASS | PASS | PASS |
| 8 | 1963-1969 | `getGirlsForListing()` | gs2 (zitrek) | PASS | PASS | PASS |
| 9 | 2069-2075 | `getGirlsForHashtag()` | gs (dnes) | PASS | PASS | PASS |

**Vsech 9 joinu ma:**
- `ROW_NUMBER() OVER (PARTITION BY girl_id ORDER BY effective_from DESC NULLS LAST)` 
- `AND (effective_from IS NULL OR effective_from <= ?)`
- `AND gs.rn = 1`

**Zadny prosty `LEFT JOIN girl_schedules` bez subquery nezustal.** Overeno grepem — 0 primarnych joinu.

---

## TZ fix pro tomorrowDate

Funkce s tomorrow logikou:

| Funkce | Radky | TZ spravne? | Dukaz |
|--------|-------|-------------|-------|
| `getGirlsWithToday()` | 172-175 | PASS | `new Date(today + 'T12:00:00Z')` kde `today = pragueDateISO()` |
| `getGirlsForDay()` | 757-761 | PASS | Stejny pattern |
| `getGirlsForListing()` | 1887-1890 | PASS | Stejny pattern |

Vsechny tri staví `tomorrowDate` nad `pragueDateISO()` (Prague TZ), ne nad `new Date()` (server UTC).

**Stary broken pattern (`new Date(); tomorrow.setDate(tomorrow.getDate() + 1)`) neexistuje.** Overeno grepem.

---

## Overeni proti uzivatelem hlaseneho bugu

Bug: *"TMRW u divek ktere byly v pondeli minuly tyden"*

**Scena:** Divka mela schedule_exceptions pro minule pondeli (uz smazany cronem). Ale jeji `girl_schedules` obsahoval stary zaznam s `effective_from = NULL` (platil stale) PLUS novy zaznam s `effective_from = 2026-07-01`. Bez dedup se JOIN pripojil ke staremu zaznamu → TMRW badge se ukazal nespravne.

**Po fixu:** `ROW_NUMBER() ... ORDER BY effective_from DESC NULLS LAST` vybere VZDY nejnovejsi zaznam. Stary zaznam (`effective_from = NULL`) ma nejnizsi prioritu (NULLS LAST). Novy zaznam vyhrava.

**Opraveno: ANO** — bug se nemuze opakovat.

---

## Funkce bez girl_schedules joinu (nepotrebuji dedup)

Overil jsem ze nasledujici funkce NEJOINUJI girl_schedules a tudiz dedup nepotrebuji:
- `getActiveGirlCards()` (radek 2284) — zadny schedule join
- `getAllGirlsForAdmin()` (radek 953) — admin listing, zadny schedule
- `getGirlById()` (radek 989) — detail pro edit, schedule zvlast
- Vsechny blog/review/service/booking queries — nesouvisí

---

## CELKOVY VERDIKT

### SCHVALENO ✅

| Kontrolni bod | Stav |
|---------------|------|
| ROW_NUMBER() dedup ve vsech 9 girl_schedules joinech | PASS |
| effective_from filter ve vsech 9 subqueries | PASS |
| rn = 1 ve vsech 9 JOIN podminkach | PASS |
| TZ fix tomorrowDate ve 3 funkcich s tomorrow logikou | PASS |
| Zadny prosty LEFT JOIN girl_schedules nezustal | PASS |
| Puvodni bug (TMRW z minuleho tydne) opraven | PASS |

**Implementace presne odpovida zadani. Pripraveno k commitu.**
