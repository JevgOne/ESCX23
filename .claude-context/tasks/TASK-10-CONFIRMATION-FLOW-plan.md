# TASK-10: Operatorka NEMA potvrzovat rezervace — potvrzuje jen klient

## Status: PLAN READY
## Datum: 2026-09-15

---

## ANALYZA AKTUALNIHO STAVU

### Jak confirmation flow funguje TEĎ:

#### 1. Bot booking-flow.ts (radky 288-296)
Kdyz klient potvrdi booking pres TG bot:
```typescript
const bookingStatus = (visits === 0 || trustLevel === 'new') ? 'pending' : 'confirmed';
```
- **Novy klient (0 visits, trust=new)** → booking se vytvori jako `pending`
- **Staly/VIP klient** → booking se vytvori jako `confirmed`

#### 2. Bot zprava klientovi (radky 344-356)
Pro pending booking bot posila:
```
"Ceka na potvrzeni operatorkou — ozveme se ti brzy"
```
**PROBLEM: Tato zprava lže — uživatel řekl, že operátorka NEPOTVRZUJE.**

#### 3. BookingDetailOverlay.tsx (radky 119-129)
Kdyz operator/manager otevre pending booking v modalu, vidi:
- Tlacitko "Potvrdit" (zmena status na confirmed)
- Tlacitko "Jiny cas" (rescheduled)
- Tlacitko "Odmitnout" (declined)

**PROBLEM: Operátorka nemá mít tlačítko "Potvrdit" — potvrzení dělá klient.**

#### 4. booking-actions.ts (radky 392-393)
Status transitions povolují:
```typescript
pending: ['confirmed', 'declined'],
```
Toto je ok — ale `confirmed` přechod by měl být triggered klientem, ne operátorkou.

#### 5. Cron: booking-confirmations/route.ts
- Posila klientovi reminder 2h pred bookingem (pres Telegram inline keyboard)
- Callback `bk_remind_ok:{bookingId}` / `bk_remind_cancel:{bookingId}`
- **PROBLEM: `bk_remind_ok` callback NENI HANDLOVAN v telegram-bot.ts!** Bot handluje jen `bk_*` callbacky, ale `bk_remind_ok` neni v handleBookingCallback().
- Kdyz klient nepotvrdí do 1h pred → cron zrusi booking (status → expired)

#### 6. Stary kod confirm_booking:
- `lib/telegram.ts:172-173` — definuje `sendClientConfirmationRequest()` s `confirm_booking:{bookingId}:yes/no` callbacky
- **Tato funkce se nikde NEVOLA** — je mrtvy kod
- `handler.ts:130` — `confirm_booking:` callbacky vraci `return null` — ignorovany

#### 7. Admin booking (booking-actions.ts:311)
- Rucni rezervace pres admin panel → vzdy status `confirmed`
- **Toto je SPRAVNE — admin/operator vytvari booking uz jako potvrzeny**

### Co realne NEFUNGUJE:

1. **Bot vytvari `pending` booking pro noveho klienta** — ale nikdo ten pending NEpotvrzuje (ani operator ani klient) protoze:
   - Operator by nemel (task zadani)
   - Klient nemuze — `bk_remind_ok` callback neni handlovan

2. **Cron posila reminder** ale tlacitko `bk_remind_ok` je dead (neni handler)

3. **Jediny zpusob jak pending→confirmed** je pres BookingDetailOverlay tlacitko — co je presne to co uzivatel NECHCE

---

## NAVRZENE ZMENY

### Princip: Klient potvrzuje SAM, operátorka NE

Flow pro noveho klienta:
1. Klient vytvori booking pres TG bot → status `pending`
2. Bot posle klientovi zprávu s inline keyboard: "Potvrd příchod do X hodin"  
3. Klient klikne "Potvrzuji" → status zmena na `confirmed`
4. Pokud neklikne do 1h pred booking → cron expiruje

Flow pro staleho klienta:
1. Booking se vytvori jako `confirmed` (beze zmeny — uz funguje)

### SOUBORY K EDITACI:

#### 1. `lib/telegram-ai/booking-flow.ts` — ZMENIT ZPRAVU
**Radky 344-356**: Zmenit text pro pending booking:

PRED:
```
Ceka na potvrzeni operatorkou — ozveme se ti brzy
```

PO:
```
Protoze jsi u nas poprve, prosim potvrď svůj příchod kliknutím na tlačítko níže.
Pokud nepotvrdíš do 1h před termínem, rezervace bude automaticky zrušena.
```

A PRIDAT inline keyboard primo pri vytvoreni bookingu (ne cekat na cron):
```typescript
await sendMessage(chatId, msg, {
  replyMarkup: {
    inline_keyboard: [
      [
        { text: '✅ Potvrzuji příchod', callback_data: `bk_remind_ok:${bookingId}` },
        { text: '❌ Ruším', callback_data: `bk_remind_cancel:${bookingId}` },
      ],
    ],
  },
});
```

#### 2. `lib/telegram-ai/booking-flow.ts` — PRIDAT HANDLERY pro bk_remind_ok/cancel

Do `handleBookingCallback()` pridat:

```typescript
// bk_remind_ok:{bookingId} — client confirms attendance
if (callbackData.startsWith('bk_remind_ok:')) {
  const bookingId = parseInt(callbackData.slice(13), 10);
  await handleClientConfirm(chatId, bookingId);
  return true;
}

// bk_remind_cancel:{bookingId} — client cancels
if (callbackData.startsWith('bk_remind_cancel:')) {
  const bookingId = parseInt(callbackData.slice(17), 10);
  await handleClientCancel(chatId, bookingId);
  return true;
}
```

Nova funkce `handleClientConfirm`:
```typescript
async function handleClientConfirm(chatId: string, bookingId: number): Promise<void> {
  // Verify booking exists, is pending, belongs to this client
  const result = await db.execute({
    sql: `SELECT b.id, b.status, b.date, b.start_time, b.end_time,
                 g.name AS girl_name, bc.telegram_id
          FROM bookings_v2 b
          JOIN girls g ON g.id = b.girl_id
          JOIN booking_clients bc ON bc.id = b.client_id
          WHERE b.id = ? AND bc.telegram_id = ?`,
    args: [bookingId, chatId],
  });
  
  if (result.rows.length === 0) {
    await sendMessage(chatId, 'Rezervace nenalezena.');
    return;
  }
  
  const booking = result.rows[0];
  if (String(booking.status) !== 'pending') {
    // Already confirmed or cancelled
    const label = String(booking.status) === 'confirmed' ? 'uz je potvrzena' : 'uz neni aktivni';
    await sendMessage(chatId, `Tato rezervace ${label}.`);
    return;
  }
  
  // Confirm
  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP,
                                  updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'pending'`,
    args: [bookingId],
  });
  
  await sendMessage(chatId, [
    '✅ <b>Rezervace potvrzena!</b>',
    '',
    `👩 ${String(booking.girl_name)}`,
    `📅 ${formatDate(String(booking.date))}`,
    `⏰ ${String(booking.start_time).substring(0,5)} — ${String(booking.end_time).substring(0,5)}`,
    '',
    `Těšíme se na tebe! Adresu dostaneš 1h před termínem.`,
  ].join('\n'));
  
  logAudit({ bookingId, action: 'booking.client_confirm', actorType: 'bot', ... });
}
```

Nova funkce `handleClientCancel`:
```typescript
async function handleClientCancel(chatId: string, bookingId: number): Promise<void> {
  // Similar verify + cancel logic
  await db.execute({
    sql: `UPDATE bookings_v2 SET status = 'cancelled_client',
          cancel_reason = 'Klient zrusil pred potvrzenim',
          cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'pending'`,
    args: [bookingId],
  });
  
  // Release slot lock
  await db.execute({
    sql: 'DELETE FROM slot_locks WHERE locked_by = ?',
    args: [`booking:${bookingId}`],
  }).catch(() => {});
  
  await sendMessage(chatId, 'Rezervace zrusena. Napis kdykoliv pro novou rezervaci 😊');
}
```

#### 3. `components/booking/BookingDetailOverlay.tsx` — ZMENIT PENDING AKCE

**Radky 119-129**: Pro pending booking operátorka NESMÍ mít "Potvrdit". 
Místo toho vidí informativní panel + akce které MŮŽE dělat.

PRED:
```tsx
{b.status === 'pending' ? (
  <>
    <button ... onClick={() => handleAction('confirmed')}>Potvrdit</button>
    <button ... onClick={() => handleAction('rescheduled')}>Jiny cas</button>
    <button ... onClick={() => handleAction('declined')}>Odmitnout</button>
  </>
)
```

PO:
```tsx
{b.status === 'pending' ? (
  <>
    <div className="bdo-pending-info">
      Ceka na potvrzeni klientem
    </div>
    <button ... onClick={() => handleAction('declined', 'Odmitnout rezervaci?')}>
      Odmitnout
    </button>
  </>
)
```

Operátorka u pending booking MŮŽE:
- **Odmítnout** (declined) — pokud je nějaky důvod proc ne
- **Vidět info** že čeká na klienta

Operátorka u pending booking NESMÍ:
- **Potvrdit** — to dělá klient
- **Přesunout** — booking ještě není potvrzený, nemá smysl

#### 4. `lib/booking-actions.ts` — UPRAVIT TRANSITIONS (volitelne)

Radky 392-393: Aktualne `pending: ['confirmed', 'declined']`

Moznosti:
- **A) Nechat** — transition `pending→confirmed` porad funguje, ale jen z bota (klient), ne z UI
- **B) Přidat 'cancelled_client'** — aby cron/bot mohl zrusit: `pending: ['confirmed', 'declined', 'cancelled_client']`

DOPORUCENI: Varianta B — přidat `cancelled_client` k pending transitions, protože klient může zrušit přes tlačítko.

Ale pozor: `updateBookingStatus` je server action volana z overlay — musime zajistit ze `confirmed` transition z UI nefunguje. To uz resime odstraněním tlačítka v bode 3.

#### 5. `app/api/cron/booking-confirmations/route.ts` — BEZ ZMEN

Cron je ok:
- Posila reminder (step 1) — uz ok, ale redundantni pokud klient dostal tlacitko pri vytvoreni
- Expiruje nepotvrzene (step 2) — ok, funguje spravne
- Notifikuje zajem (step 3) — ok

Jedina uprava: Cron reminder by mohl byt DRUHY reminder (pripomenuti), ne prvni zadost o potvrzeni. Zprava v cronu uz odpovidá tomuto ucelu.

#### 6. Cisteni mrtvého kódu (volitelne, nizka priorita)

- `lib/telegram.ts:154-178` — `sendClientConfirmationRequest()` — nikde se nevola, pouziva stary `confirm_booking:` callback format → SMAZAT
- `handler.ts:130` — `confirm_booking:` legacy handling → SMAZAT (uz nepotrebne)

---

## CHECKLIST PRO IMPLEMENTATORA

### Kriticke (musi byt):
- [ ] `booking-flow.ts`: Zmenit zpravu pro pending booking — ne "ceka na operatorku" ale "potvrď příchod"
- [ ] `booking-flow.ts`: Pridat inline keyboard s confirm/cancel tlacitky pri vytvoreni pending bookingu
- [ ] `booking-flow.ts`: Pridat `bk_remind_ok` a `bk_remind_cancel` handlery do `handleBookingCallback()`
- [ ] `booking-flow.ts`: Implementovat `handleClientConfirm()` a `handleClientCancel()` funkce
- [ ] `BookingDetailOverlay.tsx`: Odstranit "Potvrdit" tlacitko pro pending bookings
- [ ] `BookingDetailOverlay.tsx`: Pridat informacni panel "Čeká na potvrzení klientem"
- [ ] `booking-actions.ts`: Pridat 'cancelled_client' do pending transitions

### Volitelne (cisteni):
- [ ] `lib/telegram.ts`: Smazat nevyuzivanou `sendClientConfirmationRequest()`
- [ ] `handler.ts`: Smazat `confirm_booking:` legacy handling

### NESAHAT:
- `app/api/cron/booking-confirmations/route.ts` — funguje spravne jako druhy reminder
- `booking-actions.ts createBooking()` — admin booking → confirmed, to je ok

---

## SOUBORY A RADKY

| Soubor | Radky | Zmena |
|--------|-------|-------|
| `lib/telegram-ai/booking-flow.ts` | 288-370, 435-484 | Zpravy + handlery |
| `components/booking/BookingDetailOverlay.tsx` | 119-129 | UI tlacitka |
| `lib/booking-actions.ts` | 392-393 | Status transitions |
| `lib/telegram.ts` | 154-178 | Smazat mrtvy kod (volitelne) |
| `lib/telegram-ai/handler.ts` | 130 | Smazat legacy (volitelne) |

## RIZIKA

1. **Existujici pending bookings v DB** — po deployi se u nich nezobrazi "Potvrdit" v UI. Ale cron je stale muze expirovat. OK — zadna ztrata dat.
2. **Klient bez Telegramu** — pro phone/walkin bookings se pending nevytvari (jen bot), admin vytvari confirmed. OK.
3. **Race condition** — klient klikne confirm a zaroven cron expiruje. Handler musi checkovat `status = 'pending'` v UPDATE WHERE clause. Uz je v navrhu.
