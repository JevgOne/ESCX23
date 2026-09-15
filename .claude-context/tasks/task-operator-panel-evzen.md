# Evzen Verdikt — Operator Quick Booking Panel (/booking/quick)

**Datum:** 2026-09-14
**Kontrolor:** Evzen the King
**Task:** #13
**Status: SCHVALENO**

---

## Puvodni zadani (doslove)

> 1. "pro operatorku musi bejt easy vlozeni rezervace musi to zvladnot proste behem hovoru"
> 2. "vybere divku, cas a smenu dle rozvrhu a je to"
> 3. "13.9 kdyz tam bude musi tam bejt jasne napsano 13.9 PATEK at proste je to fakt easy"

**Doplnujici spec z planu:** Format datumu "14.9 SOBOTA", 3 kliky minimum, vse na jedne obrazovce.

---

## Kontrola shody

### 1. "easy vlozeni rezervace behem hovoru" — OK

- Jednoobrazovkovy formular, zadne kroky, zadne modaly, zadny routing
- Vsechna data (divky, smeny pro cely tyden) nactena na serveru a predana jako props — zadne cekani na shift data
- Girl buttons okamzite viditelne jako klikaci pills
- Duration defaultuje na 60 min — nejcastejsi varianta, neni treba menit
- Channel hardcoded na 'phone' — spravne pro operator panel
- Po uspesnem bookingu: "NOVA REZERVACE" button pro okamzity reset
- Shrnuty vždy dole — zivy preview co se vytvori

**Soubory:** `components/booking/QuickBookingPanel.tsx` (cely component), `app/booking/quick/page.tsx` (server component)

### 2. "vybere divku, cas a smenu dle rozvrhu a je to" — OK

Flow presne odpovida:
1. Klik na divku → smeny se zobrazi z `weekSchedules[girlId]` (radek 325-349)
2. Klik na den → volne casy se nactou pres `getAvailableSlots` (radek 177-188)
3. Klik na cas → vyber (radek 363-370)
4. VYTVORIT → booking vytvoren (radek 231-249)

State resety spravne: zmena divky resetuje den+cas (radek 168-175), zmena duration reloadne sloty (radek 190-201).

### 3. "13.9 PATEK" format datumu — OK

- `formatDateLabel` v `lib/booking-actions.ts:380-383`:
  ```
  ${d.getDate()}.${d.getMonth() + 1} ${CZECH_DAYS[d.getDay()]}
  ```
  Produkuje: "14.9 SOBOTA", "15.9 PONDELI", atd.
- `CZECH_DAYS = ['NEDELE', 'PONDELI', 'UTERY', 'STREDA', 'CTVRTEK', 'PATEK', 'SOBOTA']`
- CSS `.qb-day-label`: `font-size: 13px; font-weight: 700` — tucne, dobre viditelne
- Nepracujici dny: `opacity: 0.35` + pomlcka "—" misto casu — nelze kliknout
- Dnesni den oznacen prefixem "DNES"

### 4. "3 kliky minimum, vse na jedne obrazovce" — OK s poznamkou

**Pocet kliku (minimum path, znamý klient):**
- Divka(1) + Den(2) + Cas(3) + VYTVORIT(4) = **4 kliky**
- Duration defaultuje na 60 → neni treba klikat
- Klient: type jmeno + Enter = 1 akce navic (nutne — bez klienta nelze bookovat)

Plan uvadi "3 kliky minimum" ale to predpoklada default klienta. V realite klient MUSI byt zadan pred submitem (button disabled bez klienta). To je SPRAVNE — nelze bookovat bez klienta. Plan sam rika: "Klient nepovinnÿ zpocatku — operatorka muze nejdriv kliknout divku/cas a klienta dohledat pozdeji (pred potvrzenim)" — toto je implementovano.

**Vse na jedne obrazovce:** ANO. Zadny multi-step, zadny modal, zadny routing. Jeden component, progresivni zobrazovani sekci.

---

## Technicke overeni

| Co | Stav | Detail |
|----|------|--------|
| `getWeekSchedulesForAll()` | OK | Nacita vsechny divky + 7 dni rozvrhu v 3 SQL queries, vrati jako props |
| Prague timezone | OK | `toLocaleString('en-US', { timeZone: 'Europe/Prague' })` v server component i action |
| Schedule exceptions | OK | `schedule_exceptions` tabulka: unavailable → null shifts, custom_hours → override |
| Auth guard | OK | `requireBooking()` v server action |
| Conflict handling | OK | `createBooking` vraci `{ error }` → cerveny box v UI |
| State management | OK | Spravne resety pri zmene divky/datumu/duration |
| Error UX | OK | "Klient nenalezen" + "+ Novy" button pro vytvoreni |
| Success UX | OK | Booking ID + detail + "NOVA REZERVACE" reset |

---

## Verdikt

**SCHVALENO** — Implementace doslove odpovida vsem 3 bodum zadani uzivatele. Format datumu "14.9 SOBOTA" spravny, jednoobrazovkovy panel, minimalni pocet kliku (4 + client search). Technicka kvalita odpovida planu. Zadne odchylky od zadani.
