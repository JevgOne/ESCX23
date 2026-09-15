# TASK-019: Evzen Verdict — Hybridni booking flow (v3 — autoritativni diagram)

**Datum:** 2026-09-14
**Kontrolor:** Evzen-the-King
**Specifikace:** .claude-context/tasks/TASK-019-definitive-spec.md
**Autoritativni design:** mockups/booking/07-flow-diagram.html

---

## DOSLOVNE ZADANI UZIVATELE

1. "nasad ty rezervace, pokud si klient vybere divku uz tam zarad ty rezervace na odkliky at se neplacaji kredity na claude AI"
2. "jo at proste prvnich max 6 zprav jsou jako clovek, a kdyz bot napise jakou slecnu chce napise katy tak uz jede structured data"

---

## KONTROLA PROTI AUTORITATIVNIMU FLOW DIAGRAMU

### 1. Draft timeout = 30 min — NESOULAD

**Diagram:** 30 min (3 mista: Scenar 1 radek 818 "30:00 zbyvajici", radek 909 "timeout 30 min", legenda "30 min timeout")
**Implementace:** `booking-flow.ts:99` — `Date.now() + 12 * 60 * 1000` = **12 minut**

**VERDIKT: NESOULAD.** Diagram rika 30 min, kod ma 12 min. Musi se opravit na 30 min.

### 2. Auto-confirm pro 3+ navstevy — ODPOVIDA

**Diagram:** "bot: staly klient (3+) → CONFIRMED (auto, preskoci PENDING)"
**Implementace:**
- `booking-flow.ts:70-72`: `if (ctx.totalVisits < 3) throw Error` — kontrola 3+ navstev
- `booking-flow.ts:296`: INSERT bookings_v2 s `status: 'confirmed'` — rovnou CONFIRMED

### 3. No-show eskalace — NEIMPLEMENTOVANO (v booking flow)

**Diagram (Flow D):**
- 1x no-show → zluty badge v klientske karte
- 2x no-show → povinne potvrzeni 2h predem, bez odpovedi = auto-cancel
- 3x no-show → type "untrusted", TG bot zakazan

**Implementace:**
- DB schema ma `no_show_count` v booking_clients (db.ts:344)
- DB schema ma `no_show_level` v bookings_v2 (db.ts:388)
- Ale: booking-flow.ts NEKONTROLUJE no_show_count pri vytvareni bookingu
- Telegram AI context NE-blokuje klienty s 3+ no-shows
- Zadny cron pro 2h potvrzeni pred terminem

**VERDIKT: CASTECNE.** DB schema je pripravena, ale logika eskalace neni implementovana v booking flow. Toto je budouci prace — diagram popisuje CELKOVY system, ne jen MVP booking flow.

### 4. First-write-wins — CASTECNE IMPLEMENTOVANO

**Diagram:** "PRAVIDLO: First-Write-Wins" + "Optimistic locking — kazdy slot ma version counter"
**Implementace:**
- `booking-flow.ts:252-264`: Kontrola konfliktu pred INSERT (SELECT existujici bookings)
- `booking-flow.ts:279-289`: slot_locks INSERT (pokud kolize → catch → zprava)
- ALE: Zadny `version` counter na slotech. Pouziva slot_locks tabulku misto optimistic locking.

**VERDIKT: CASTECNE.** Race condition je osetrena pres slot_locks (funkci), ale ne pres optimistic locking s version counter (jak diagram naznacuje). Slot_locks reseni je funkci ekvivalentni pro soucasny scope.

### 5. Notifikace divce po bookingu — NEIMPLEMENTOVANO

**Diagram:** "Bot notifikuje divku: 'Nova rezervace: 16:00, 60 min, VIP klient'"
**Implementace:** booking-flow.ts:handleConfirm NEPOSILA notifikaci divce. Posle jen potvrzeni klientovi.

**VERDIKT: CHYBI.** Po vytvoreni bookingu divka nedostane zprávu.

### 6. Auto reminder 1h pred — NEIMPLEMENTOVANO (v booking flow)

**Diagram:** "Cron (1h pred): Auto reminder + presna adresa"
**Implementace:** Zadny cron pro reminder v booking-flow.ts ani jinde v telegram-ai/.

**VERDIKT: CHYBI.** Toto je cron job, ne soucast booking flow. Budouci prace.

### 7. Slot zablokovan pri DRAFT — ODPOVIDA

**Diagram:** "Slot je reserved behem vyberu. Jiny klient vidi slot jako obsazeny."
**Implementace:**
- `booking-flow.ts:558-564`: getAvailableSlots cte aktivni drafty z booking_drafts
- Aktivni draft blokuje slot pro jine klienty

---

## SHRNUTI NALEZU

| Pozadavek | Diagram | Implementace | Stav |
|-----------|---------|-------------|------|
| Draft timeout | 30 min | 12 min | NESOULAD |
| Auto-confirm 3+ | ANO | ANO | OK |
| No-show eskalace | 3 levely | DB schema only | BUDOUCI |
| First-write-wins | Optimistic lock | slot_locks | FUNKCI OK |
| Notifikace divce | ANO | NE | CHYBI |
| Auto reminder 1h | ANO | NE | BUDOUCI (cron) |
| Slot blok pri DRAFT | ANO | ANO | OK |
| Booking az do konce | ANO | ANO | OK |
| Bez Claude API kred | ANO | ANO | OK |
| Stavovy prechod | ANO | ANO | OK |

---

## FINALNI VERDICT

### SCHVALENO S VYHRADAMI

**Booking flow (MVP scope) funguje od zacatku do konce:**
- Prirozena AI konverzace → stavovy prechod → tlacitka
- Cas → delka → potvrzeni → INSERT bookings_v2 → potvrzovaci zprava
- 100% bez Claude API kreditov v booking flow
- Auto-confirm pro 3+ navstevy

**MUSI SE OPRAVIT (blokujici):**
1. **Draft timeout: 12 min → 30 min** (booking-flow.ts:99) — jasny nesoulad s diagramem

**CHYBI ALE NE-BLOKUJICI PRO MVP:**
2. Notifikace divce po bookingu (zadna implementace)
3. No-show eskalace (DB schema existuje, logika ne)
4. Auto reminder 1h pred terminem (cron job)
5. Optimistic locking s version counter (slot_locks staci pro MVP)
6. Dead code createBooking v tool-handlers.ts + system-prompt.ts zminky
