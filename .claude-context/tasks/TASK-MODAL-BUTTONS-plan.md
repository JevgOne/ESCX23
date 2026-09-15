# TASK #7: Booking modal tlacitka nefunguji

## Status: PLAN HOTOVY — ceka na implementaci

## Analyza

### Bug popis
Uzivatel rika: "nejde kliknout na dokonceno, ani na krizek". Na modalu Rezervace #2 nefunguji action buttony.

### Root cause
V `components/booking/BookingDetailOverlay.tsx` radky 83-111 — **vsechny action buttony nemaji onClick handlery**. Jsou to ciste `<button>` elementy bez jakekoli funkcionality:

```tsx
// Radek 98-109 — ZADNE onClick!
<button className="bdo-btn bdo-primary">
  <span className="bdo-icon">&#10003;</span> Dokonceno
</button>
<button className="bdo-btn">
  <span className="bdo-icon">&#8644;</span> Presunout
</button>
<button className="bdo-btn bdo-danger">
  <span className="bdo-icon">&#10007;</span> No-show
</button>
<button className="bdo-btn bdo-danger">
  <span className="bdo-icon">&#128465;</span> Zrusit
</button>
```

Navic v `lib/booking-actions.ts` **neexistuji server actions pro zmenu statusu bookingu**:
- Existuje: `createBooking`, `searchClient`, `createClient`, `getAvailableGirls`, `getAvailableSlots`
- **CHYBI:** `updateBookingStatus`, `completeBooking`, `cancelBooking`, `markNoShow`, `rescheduleBooking`

### Dulezite: Close button FUNGUJE
Krizek v headeru (`bdo-close` na radku 59) MA onClick handler: `onClick={close}` kde `close()` = `router.push(backUrl)`. Uzivatel pravdepodobne myslel "krizek" = tlacitko "Zrusit" (ne X v headeru).

### Pending booking buttony taky nefunguji
Radky 84-95 pro pending status:
- "Potvrdit" — zadny onClick
- "Jiny cas" — zadny onClick
- "Odmitnout" — zadny onClick

### Soucasny booking status flow v DB
```sql
status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'confirmed', 'completed', 'in_progress',
    'no_show', 'cancelled_client', 'cancelled_girl', 'declined', 'rescheduled', 'expired'))
```

Povolene prechody:
- `pending` -> `confirmed` (Potvrdit)
- `pending` -> `declined` (Odmitnout)
- `confirmed` -> `completed` (Dokonceno)
- `confirmed` -> `in_progress` (Probiha — automaticky)
- `confirmed` -> `no_show` (No-show)
- `confirmed` -> `cancelled_client` (Zruseno klientem)
- `confirmed` -> `cancelled_girl` (Zruseno holkou)
- `confirmed` -> `rescheduled` (Presunuto)

## Plan implementace

### Krok 1: Pridat server actions do `lib/booking-actions.ts`

```ts
// ---------------------------------------------------------------------------
// Update booking status
// ---------------------------------------------------------------------------

export async function updateBookingStatus(
  bookingId: number,
  newStatus: string,
  cancelReason?: string,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireBooking();

  // Validate status
  const validStatuses = [
    'confirmed', 'completed', 'in_progress',
    'no_show', 'cancelled_client', 'cancelled_girl',
    'declined', 'rescheduled',
  ];
  if (!validStatuses.includes(newStatus)) {
    return { error: 'Neplatny status' };
  }

  // Get current booking
  const current = await db.execute({
    sql: 'SELECT id, status, client_id, girl_id, price, points_earned FROM bookings_v2 WHERE id = ?',
    args: [bookingId],
  });
  if (current.rows.length === 0) {
    return { error: 'Rezervace nenalezena' };
  }

  const booking = current.rows[0];
  const oldStatus = String(booking.status);

  // Validate transition
  const allowedTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'declined'],
    confirmed: ['completed', 'in_progress', 'no_show', 'cancelled_client', 'cancelled_girl', 'rescheduled'],
    in_progress: ['completed', 'no_show'],
  };

  const allowed = allowedTransitions[oldStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    return { error: `Nelze zmenit stav z "${oldStatus}" na "${newStatus}"` };
  }

  // Build UPDATE
  const setClauses = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
  const args: (string | number | null)[] = [newStatus];

  if (['cancelled_client', 'cancelled_girl', 'declined'].includes(newStatus)) {
    setClauses.push('cancel_reason = ?', 'cancelled_at = CURRENT_TIMESTAMP');
    args.push(cancelReason ?? null);
  }

  if (newStatus === 'completed') {
    setClauses.push('completed_at = CURRENT_TIMESTAMP');
  }

  args.push(bookingId);

  await db.execute({
    sql: `UPDATE bookings_v2 SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  // Update client stats on no_show
  if (newStatus === 'no_show') {
    await db.execute({
      sql: 'UPDATE booking_clients SET no_show_count = no_show_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [Number(booking.client_id)],
    });
  }

  // Update client total_spent on completed
  if (newStatus === 'completed' && booking.price) {
    await db.execute({
      sql: 'UPDATE booking_clients SET total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [Number(booking.price), Number(booking.client_id)],
    });
  }

  // Audit log
  await db.execute({
    sql: `INSERT INTO booking_audit_log (booking_id, user_id, action, detail, created_at)
          VALUES (?, ?, 'status_change', ?, CURRENT_TIMESTAMP)`,
    args: [bookingId, user.id, `${oldStatus} -> ${newStatus}${cancelReason ? ': ' + cancelReason : ''}`],
  });

  return { ok: true };
}
```

### Krok 2: Pridat onClick handlery do BookingDetailOverlay.tsx

Uprava `components/booking/BookingDetailOverlay.tsx`:

```tsx
'use client';

import type { CalendarBooking } from '@/lib/booking-queries';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { updateBookingStatus } from '@/lib/booking-actions';

// ... existing code ...

export default function BookingDetailOverlay({ booking, backUrl }: Props) {
  const router = useRouter();
  const b = booking;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function close() {
    router.push(backUrl);
  }

  function handleAction(newStatus: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(b.id, newStatus);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.refresh();
        // Optionally close overlay after action
        // close();
      }
    });
  }

  // ... existing rendering code ...

  // CONFIRMED/IN_PROGRESS buttons:
  <button className="bdo-btn bdo-primary" onClick={() => handleAction('completed')} disabled={isPending}>
    <span className="bdo-icon">&#10003;</span> Dokonceno
  </button>
  <button className="bdo-btn" onClick={() => handleAction('rescheduled', 'Presunout rezervaci?')} disabled={isPending}>
    <span className="bdo-icon">&#8644;</span> Presunout
  </button>
  <button className="bdo-btn bdo-danger" onClick={() => handleAction('no_show', 'Oznacit jako no-show?')} disabled={isPending}>
    <span className="bdo-icon">&#10007;</span> No-show
  </button>
  <button className="bdo-btn bdo-danger" onClick={() => handleAction('cancelled_client', 'Zrusit rezervaci?')} disabled={isPending}>
    <span className="bdo-icon">&#128465;</span> Zrusit
  </button>

  // PENDING buttons:
  <button className="bdo-btn bdo-primary" onClick={() => handleAction('confirmed')} disabled={isPending}>
    <span className="bdo-icon">&#10003;</span> Potvrdit
  </button>
  <button className="bdo-btn" disabled={isPending}>
    <span className="bdo-icon">&#8644;</span> Jiny cas
  </button>
  <button className="bdo-btn bdo-danger" onClick={() => handleAction('declined', 'Odmitnout rezervaci?')} disabled={isPending}>
    <span className="bdo-icon">&#10007;</span> Odmitnout
  </button>

  // Error display (pridat pod bdo-actions):
  {error && (
    <div className="bdo-error">{error}</div>
  )}
}
```

### Krok 3: Pridat error + loading CSS

Do OVERLAY_STYLES v BookingDetailOverlay.tsx:
```css
.bdo-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bdo-error {
  padding: 8px 24px 12px;
  font-size: 12px;
  color: var(--red);
  background: rgba(239,68,68,0.08);
}
```

### Krok 4: Po uspesne akci — refresh + visual feedback

Po `updateBookingStatus` uspech:
1. `router.refresh()` — server re-fetchne data, overlay se aktualizuje s novym statusem
2. Overlay zustane otevreny aby uzivatel videl novy stav
3. Tlacitka se zmeni podle noveho statusu (napr. po "Dokonceno" uz nejsou videt akce)

### Krok 5 (volitelne): Pridat stav "uz dokonceno" do overlay

Kdyz booking.status je `completed`, `no_show`, `cancelled_*`, `declined`:
- Nezobrazovat action buttony
- Zobrazit jen status badge (zeleny/cerveny)
- Pridat "Zmeneno: [timestamp]" info

V soucasnem kodu je else vetev (radky 96-111) pro vsechny non-pending stavy, vcetne `completed`. To znamena ze po oznaceni "Dokonceno" se tlacitka stale zobrazuji. Treba pridat:

```tsx
const isFinalized = ['completed', 'no_show', 'cancelled_client', 'cancelled_girl', 'declined', 'expired'].includes(b.status);

{isFinalized ? (
  <div className="bdo-finalized">
    <span className="bdo-finalized-label">Uzavreno</span>
  </div>
) : b.status === 'pending' ? (
  // pending buttons
) : (
  // confirmed/in_progress buttons
)}
```

## Soubory k editovat

1. **`lib/booking-actions.ts`** — pridat `updateBookingStatus()` server action (~70 radku)
2. **`components/booking/BookingDetailOverlay.tsx`** — pridat onClick handlery + useTransition + error state + disabled stav + finalized check (~40 radku zmen)

## DB zmeny
ZADNE — `bookings_v2` tabulka uz ma vsechny potrebne sloupce:
- `status` s CHECK constraint pro vsechny hodnoty
- `cancel_reason TEXT`
- `cancelled_at DATETIME`
- `completed_at` — **OVERIT** zda sloupec existuje, pokud ne, pridat v migraci

### Overit sloupce v bookings_v2:
```sql
-- Tyto sloupce musi existovat:
cancel_reason TEXT
cancelled_at DATETIME
completed_at DATETIME  -- MOZNA CHYBI — overit v lib/db.ts
```

## Bezpecnostni poznamky
- `updateBookingStatus` pouziva `requireBooking()` — admin + operator (+ manager po Task #6)
- Audit log se zapise ke kazde zmene
- Validace prechodu stavu — nelze napr. oznacit pending jako completed (musi projit pres confirmed)
- `window.confirm()` pro destruktivni akce (no-show, zrusit, odmitnout)

## Priorita
VYSOKA — zakladni funkcionalita booking systemu je nefunkcni. Bez tohoto nelze ridit rezervace.
