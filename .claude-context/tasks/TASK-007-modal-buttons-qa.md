# QA Report — Task #7: Modal tlačítka (BookingDetailOverlay)

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubory:** `components/booking/BookingDetailOverlay.tsx`, `lib/booking-actions.ts`  
**Commit:** `93a3af5`

---

## 1. Simplify — kvalita kódu

**PASS** — Kód je čistý.

- `handleAction(newStatus, confirmMsg?)` — centrální handler, odstraňuje duplikaci.
- `useTransition` správně použit — `isPending` disabluje všechna tlačítka během async operace.
- `isFinalized` flag zabraňuje opakované akci na uzavřeném bookingu.
- Error state `useState<string | null>` — zobrazí chybovou hlášku z API přímo v modalu.

---

## 2. Debug

**PASS s 1 bugem (drobný)**

### Bug: "Jiny cas" tlačítko nemá onClick handler (pending stav)

Řádek 120–122:
```tsx
<button className="bdo-btn" disabled={isPending}>
  <span className="bdo-icon">&#8644;</span> Jiny cas
</button>
```

Toto tlačítko ve stavu `pending` nemá `onClick` — kliknutí nic nedělá. Ve stavu `confirmed` ekvivalentní tlačítko "Presunout" má správně `onClick={() => handleAction('rescheduled', ...)}`.

Není kritické (UI jen nic neudělá), ale je to nekonzistentní — buď přidat `onClick={() => handleAction('rescheduled', 'Presunout rezervaci?')}` nebo tlačítko skrýt dokud není workflow pro rescheduling implementován.

### Ostatní kontroly:
- `window.confirm()` pro destruktivní akce (declined, rescheduled, no_show, cancelled_client) — správně.
- `router.refresh()` po úspěšné akci obnoví data bez full-page reload — OK.
- Overlay close kliknutím na backdrop (`e.target === e.currentTarget`) — správně.
- `isFinalized` zobrazí "Uzavreno" místo tlačítek pro completed/no_show/cancelled/declined/expired — správně.

---

## 3. Reverzní kontrola — updateBookingStatus server action

**PASS** — Robustní implementace.

| Kontrola | Stav | Poznámka |
|----------|------|----------|
| Auth check | PASS | `requireBooking()` na začátku |
| Status whitelist | PASS | `validStatuses` array, error pro neplatný status |
| Transition matrix | PASS | `allowedTransitions` — nelze přeskočit stavy |
| Audit log | PASS | `booking_audit_log` INSERT s `oldStatus -> newStatus` |
| no_show → increment | PASS | `no_show_count + 1` na klientovi |
| completed → total_spent | PASS | `total_spent + price` na klientovi |
| cancel_reason + cancelled_at | PASS | nastaveno pro cancelled/declined stavy |
| SQL parametrizace | PASS | dynamické `setClauses` s `args` polem |

**Poznámka:** `cancelReason` se vždy ukládá jako `null` (z frontendu se nepředává) pro cancelled/declined. Akceptovatelné — důvod zrušení není povinný v aktuálním UI.

---

## Verdikt

**APPROVED s drobným bugem**

`updateBookingStatus` je robustní — whitelist, transition matrix, audit log, side-effects (no_show_count, total_spent). Overlay funguje správně.

Drobný bug: "Jiny cas" tlačítko (pending stav) nemá onClick — klik nic nedělá. Opravit nebo explicitně označit jako TODO.
