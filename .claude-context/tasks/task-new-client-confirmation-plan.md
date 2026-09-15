# Plan: Booking Confirmation System + Last-Minute Offers

**Status:** PLAN READY  
**Autor:** Planovac  
**Datum:** 2026-09-15

---

## 1. Analyza aktualniho stavu

### Co uz funguje (po task #23)

- `registerNewClient` tool — vytvori `booking_clients` zaznam s `telegram_id`, `trust_level: 'new'`, `total_visits: 0`
- `handleConfirm()` v booking-flow.ts — urcuje `bookingStatus` podle trust_level/visits:
  - `new` klient (visits=0) → `status = 'pending'`
  - Staly klient (visits>0, regular+) → `status = 'confirmed'`
- `sendClientConfirmationRequest()` v telegram.ts — **existuje ale neni napojena**. Posila inline keyboard `confirm_booking:{bookingId}:yes/no`.
- `confirm_booking:` callback v handler.ts (line 130) → `return null` — **ignorovano**.
- Vercel cron — 7 existujicich cron jobu v `vercel.json`, kazdy jako API route s `CRON_SECRET` auth.

### Klicove mezery

1. **Zadny casovany potvrzovaci system** — booking se vytvori a nikdo se nepta pred terminem
2. **Zadny tracking zajmu** — kdyz klient chtel bookovat ale nebylo misto, nikde se to nezaznamenava
3. **`confirm_booking:` callback neni handler** — stary kod, nikdy nedoimplementovany
4. **`pending` status** neni jasne odliseny od `pending_confirmation`** — ted pending = ceka na operatorku (pro nove klienty), ale chceme pending_confirmation = ceka na potvrzeni klientem

### Registrace s telefonnim cislem

Aktualni `registerNewClient` sbira jen `nickname`. Zadani rika ze bot se ma ptat i na **telefonni cislo** — pro prirazeni ke kontaktu z importu.

---

## 2. Navrzene zmeny

### 2.1 Novy booking status: `pending_confirmation`

**Problem:** Aktualne `bookings_v2.status` ma CHECK constraint s fixnim seznamem hodnot. `pending_confirmation` tam neni.

**Reseni:** SQLite neumi ALTER CHECK. Pouzijeme existujici `pending` status s novym sloupcem `requires_confirmation`:

```sql
ALTER TABLE bookings_v2 ADD COLUMN requires_confirmation INTEGER DEFAULT 0;
ALTER TABLE bookings_v2 ADD COLUMN confirmation_sent_at DATETIME;
ALTER TABLE bookings_v2 ADD COLUMN confirmation_deadline DATETIME;
```

**Logika:**
- Novy klient → `status = 'pending'`, `requires_confirmation = 1`, `confirmation_deadline = start_time - 1h`
- Staly klient → `status = 'confirmed'`, `requires_confirmation = 0`
- Po potvrzeni klientem → `status = 'confirmed'`, `requires_confirmation = 0`
- Nepotvrzeny po deadline → `status = 'expired'`, slot se uvolni

### 2.2 Nova tabulka: `booking_interest_log`

Trackuje klienty kteri projevili zajem o konkretni den/divku ale nereservovali (nebylo misto, nebo si to rozmysleli).

```sql
CREATE TABLE IF NOT EXISTS booking_interest_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  client_id INTEGER,
  girl_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  interest_type TEXT NOT NULL DEFAULT 'availability_check'
    CHECK (interest_type IN ('availability_check', 'booking_failed_full', 'booking_cancelled')),
  notified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (girl_id) REFERENCES girls(id)
);
CREATE INDEX IF NOT EXISTS idx_bil_girl_date ON booking_interest_log(girl_id, date, notified);
CREATE INDEX IF NOT EXISTS idx_bil_chat ON booking_interest_log(chat_id);
```

**Kdy se loguje zajem:**
1. `checkAvailability` tool vrati volne sloty → log `availability_check` (klient se aktivne zeptal)
2. `startBookingFlow` selze protoze neni misto → log `booking_failed_full`
3. Klient zrusi booking → log `booking_cancelled` (na jeho slot)

### 2.3 Rozsireni `registerNewClient` o telefon

**Tool definice** — pridat `phone` parametr:

```ts
{
  name: 'registerNewClient',
  description:
    'Registruje noveho klienta. Zeptej se na jmeno a telefonni cislo. ' +
    'Telefon je dulezity pro prirazeni k existujicimu kontaktu.',
  input_schema: {
    type: 'object',
    properties: {
      nickname: {
        type: 'string',
        description: 'Jmeno/prezdivka klienta',
      },
      phone: {
        type: 'string',
        description: 'Telefonni cislo klienta (format +420XXXXXXXXX). Zeptej se na nej.',
      },
    },
    required: ['nickname'],
  },
}
```

**Handler** — pri registraci:
1. Pokud klient da telefon → `hmacSearch(phone)` → zkontrolovat `booking_clients.phone_hmac`
2. **Match nalezen** → NEPRIDAT noveho klienta. Misto toho propojit existujici zaznam s telegram_id:
   ```ts
   UPDATE booking_clients SET telegram_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
   ```
   A vratit existujici clientId (klient uz je v systemu z importu).
3. **Match nenalezen** → vytvori noveho klienta jako dosud + ulozi phone_encrypted a phone_hmac.

**Tohle je klicove** — umozni propojeni importovanych kontaktu (z CSV) s Telegram uctem BEZ deep-linku, jen na zaklade telefonniho cisla.

### 2.4 System prompt — nova pravidla

```
## Registrace noveho klienta
- Zeptej se na JMENO a TELEFON ("Jak ti mam rikat? A jake mas cislo?")
- Telefon neni povinny ale DULEZITY — pomaha prirazeni k existujicimu uctu
- Zavolej registerNewClient s obema udaji
- Po registraci pokracuj s bookingem
- Upozorni klienta: "Pred terminem te pozadame o potvrzeni prichodu"
```

---

## 3. Potvrzovaci system (2h pred terminem)

### 3.1 Cron job: `send-booking-confirmations`

**Soubor:** `app/api/cron/send-booking-confirmations/route.ts`

**Schedule:** Kazdy 15 minut — `*/15 * * * *`

**Logika:**
```
1. Najdi bookings kde:
   - requires_confirmation = 1
   - confirmation_sent_at IS NULL (jeste neodeslano)
   - status = 'pending'
   - start_time MINUS 2 hodiny <= NOW (v Prague timezone)
   - date = dnes

2. Pro kazdy takovy booking:
   a. Najdi client telegram_id (booking_clients.telegram_id)
   b. Posli potvrzovaci zpravu s inline keyboard:
      confirm_booking:{bookingId}:yes / confirm_booking:{bookingId}:no
   c. UPDATE bookings_v2 SET confirmation_sent_at = NOW WHERE id = ?
```

**Zprava:**
```
📅 Potvrzeni rezervace

👩 {girlName}
📅 Dnes v {startTime}
⏰ {durationMinutes} min

Potvrzujes svuj prichod?

[✅ Potvrzuji]  [❌ Rusim]
```

**Deadline:** `confirmation_deadline = start_time - 1h`. Pokud klient nepotvrdil do 1h pred terminem, booking expiruje.

### 3.2 Cron job: `expire-unconfirmed-bookings`

**Soubor:** `app/api/cron/expire-unconfirmed-bookings/route.ts`

**Schedule:** Kazdy 10 minut — `*/10 * * * *`

**Logika:**
```
1. Najdi bookings kde:
   - requires_confirmation = 1
   - confirmation_sent_at IS NOT NULL (potvrzovaci zprava odeslana)
   - status = 'pending'
   - confirmation_deadline <= NOW (Prague timezone)
   - (klient nepotvrdil v danem okne)

2. Pro kazdy:
   a. UPDATE status = 'expired', cancel_reason = 'unconfirmed'
   b. DELETE FROM slot_locks WHERE locked_by = 'booking:{id}'
   c. Posli klientovi: "Vas termin nebyl potvrzen a byl uvolnen. Muzete si zarezervovat znovu."
   d. → TRIGGER last-minute nabidka (viz 3.3)
```

### 3.3 Last-minute nabidka — uvolneny slot

Kdyz se slot uvolni (expirovanou nezpotvrzenou rezervaci), nabidnout ho klientum kteri projevili zajem.

**V ramci `expire-unconfirmed-bookings` cron jobu:**

```ts
// Po expiraci bookingu — najdi zajemce
const interested = await db.execute({
  sql: `SELECT DISTINCT bil.chat_id, bil.client_id
        FROM booking_interest_log bil
        WHERE bil.girl_id = ? AND bil.date = ? AND bil.notified = 0
          AND bil.chat_id != ?
        ORDER BY bil.created_at DESC
        LIMIT 5`,
  args: [girlId, date, expiredClientChatId],
});

for (const row of interested.rows) {
  const chatId = String(row.chat_id);
  await sendMessage(chatId, [
    `🔔 <b>Uvolnil se termin!</b>`,
    '',
    `👩 ${girlName}`,
    `📅 ${formatDate(date)} v ${startTime}`,
    '',
    `Chces si zarezervovat? Napsat staci.`,
  ].join('\n'));
  
  // Mark as notified
  await db.execute({
    sql: 'UPDATE booking_interest_log SET notified = 1 WHERE chat_id = ? AND girl_id = ? AND date = ?',
    args: [chatId, girlId, date],
  });
}
```

**Dulezite:** Posilat max 5 klientum. Neposilat klientovi ktery sam nepotvrdil (vyloucit `expiredClientChatId`).

---

## 4. Handler pro `confirm_booking:` callback

### 4.1 Novy handler v telegram-bot.ts

Aktualne `confirm_booking:` callbacky jdou do `handleAICallback()` → `callbackDataToText()` vrati `null` → ignorovano.

**Zmena:** V `handleUpdate()` pridat intercept PRED AI handlerem (stejne jako `bk_*`):

```ts
// Confirmation callbacks — handle directly
if (data.startsWith('confirm_booking:')) {
  try {
    await handleConfirmationCallback(chatId, data);
  } catch (err) {
    console.error('[telegram-bot] Confirmation callback error:', err);
  }
  return { type: 'confirmation', from: displayName, text: data, response: 'done' };
}
```

### 4.2 Funkce `handleConfirmationCallback`

**Soubor:** `lib/telegram-ai/booking-flow.ts` (nebo novy soubor `lib/telegram-ai/confirmation.ts`)

```ts
export async function handleConfirmationCallback(
  chatId: string,
  callbackData: string,
): Promise<void> {
  // Format: confirm_booking:{bookingId}:{yes|no}
  const parts = callbackData.split(':');
  if (parts.length !== 3) return;
  
  const bookingId = parseInt(parts[1], 10);
  const answer = parts[2]; // 'yes' or 'no'
  
  // Verify booking exists and belongs to this chat
  const booking = await db.execute({
    sql: `SELECT b.id, b.status, b.requires_confirmation, b.girl_id, b.date,
                 b.start_time, b.end_time, b.duration_minutes,
                 bc.telegram_id, g.name AS girl_name
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          JOIN girls g ON g.id = b.girl_id
          WHERE b.id = ? AND bc.telegram_id = ?
          LIMIT 1`,
    args: [bookingId, chatId],
  });
  
  if (booking.rows.length === 0) {
    await sendMessage(chatId, 'Rezervace nenalezena.');
    return;
  }
  
  const row = booking.rows[0];
  
  if (String(row.status) !== 'pending' || !Number(row.requires_confirmation)) {
    await sendMessage(chatId, 'Tato rezervace uz nepotrebuje potvrzeni.');
    return;
  }
  
  if (answer === 'yes') {
    // Confirm booking
    await db.execute({
      sql: `UPDATE bookings_v2
            SET status = 'confirmed', requires_confirmation = 0,
                confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [bookingId],
    });
    
    await sendMessage(chatId, [
      `✅ <b>Potvrzeno!</b>`,
      '',
      `👩 ${row.girl_name}`,
      `⏰ ${String(row.start_time).substring(0, 5)} — ${String(row.end_time).substring(0, 5)}`,
      '',
      `Adresu ti posleme 1 hodinu pred terminem.`,
    ].join('\n'));
    
    // Audit
    logAudit({
      bookingId,
      action: 'booking.client_confirmed',
      actorType: 'bot',
      entityType: 'booking',
      entityId: bookingId,
      details: { chatId, method: 'inline_button' },
    }).catch(() => {});
    
  } else if (answer === 'no') {
    // Client cancels
    await db.execute({
      sql: `UPDATE bookings_v2
            SET status = 'cancelled_client', requires_confirmation = 0,
                cancelled_at = CURRENT_TIMESTAMP, cancel_reason = 'Client declined confirmation',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [bookingId],
    });
    
    // Release slot lock
    await db.execute({
      sql: 'DELETE FROM slot_locks WHERE locked_by = ?',
      args: [`booking:${bookingId}`],
    }).catch(() => {});
    
    await sendMessage(chatId, 'Rezervace zrusena. Napiste kdykoliv pro novou.');
    
    // Trigger last-minute offers for interested clients
    await notifyInterestedClients(
      Number(row.girl_id),
      String(row.date),
      String(row.start_time).substring(0, 5),
      String(row.girl_name),
      chatId, // exclude this client
    );
  }
}
```

---

## 5. Logging zajmu klientu

### 5.1 V `checkAvailability` tool handler

**Soubor:** `lib/telegram-ai/tool-handlers.ts`, funkce `checkAvailability`

Po zjisteni dostupnosti — logovat zajem:

```ts
// Na konci funkce, po return JSON.stringify(...)
// Logovat zajem — klient se ptal na dostupnost teto divky na dany den
if (ctx.chatId) {
  db.execute({
    sql: `INSERT INTO booking_interest_log (chat_id, client_id, girl_id, date, interest_type)
          VALUES (?, ?, ?, ?, 'availability_check')`,
    args: [ctx.chatId, ctx.clientId, girlId, date],
  }).catch(() => {});
}
```

**Problem:** `checkAvailability` nema pristup k `ctx`. Aktualne signatura je `async function checkAvailability(input)` — chybi `ctx`.

**Reseni:** Pridat `ctx` parametr do `checkAvailability` (stejne jako uz ma `getAvailableGirls`).

### 5.2 V `startBookingFlow` pri selhani (slot full)

**Soubor:** `lib/telegram-ai/booking-flow.ts`, funkce `startBookingFlow`

Kdyz `getAvailableSlots()` vrati prazdny seznam:

```ts
if (slots.length === 0) {
  // Log interest — client wanted to book but no slots available
  if (ctx.chatId) {
    db.execute({
      sql: `INSERT INTO booking_interest_log (chat_id, client_id, girl_id, date, interest_type)
            VALUES (?, ?, ?, ?, 'booking_failed_full')`,
      args: [ctx.chatId, ctx.clientId, girlId, date],
    }).catch(() => {});
  }
  throw new Error(`${girlName} nema v ${date} zadne volne casy.`);
}
```

### 5.3 Pri zruseni bookingu klientem

**Soubor:** `lib/telegram-ai/tool-handlers.ts`, funkce `cancelBooking`

Po uspesnem zruseni:

```ts
// Log the cancellation as interest for other clients on same slot
const cancelledBooking = await db.execute({
  sql: 'SELECT girl_id, date, start_time FROM bookings_v2 WHERE id = ? LIMIT 1',
  args: [bookingId],
});
// ... trigger last-minute nabidka
```

---

## 6. Casova osa pro booking noveho klienta

```
T-24h:  Klient napise botu → registrace (jmeno+telefon) → booking vytvoren
        status: pending, requires_confirmation: 1
        confirmation_deadline: start_time - 1h

T-2h:   Cron: send-booking-confirmations
        → posle zpravu: "Potvrzujes prichod? [Ano/Ne]"
        → confirmation_sent_at = NOW

T-2h → T-1h: Klient klikne [Ano]
        → status: confirmed
        NEBO klient klikne [Ne]
        → status: cancelled_client, slot se uvolni
        → last-minute nabidka zajemcum

T-1h:   Cron: expire-unconfirmed-bookings (pokud nepotvrdil)
        → status: expired
        → slot se uvolni
        → last-minute nabidka zajemcum

T-0:    Termin
```

**Staly klient (regular/vip):**
```
T-24h:  Booking vytvoren → status: confirmed, requires_confirmation: 0
T-0:    Termin (bez potvrzovani)
```

---

## 7. Soubory k editaci / vytvorit

| Soubor | Zmena |
|--------|-------|
| `lib/db.ts` | Migrace: `requires_confirmation`, `confirmation_sent_at`, `confirmation_deadline` na bookings_v2; CREATE TABLE `booking_interest_log` |
| `lib/telegram-ai/tools.ts` | Pridat `phone` parametr do `registerNewClient` tool |
| `lib/telegram-ai/tool-handlers.ts` | Rozsirit `handleRegisterNewClient` o phone HMAC lookup + encrypt; pridat ctx do `checkAvailability`; logovat zajem |
| `lib/telegram-ai/booking-flow.ts` | Nastavit `requires_confirmation = 1` + `confirmation_deadline` pro nove klienty; export `handleConfirmationCallback`; export `notifyInterestedClients` |
| `lib/telegram-ai/system-prompt.ts` | Instrukce: ptat se na telefon; upozornit na potvrzovani |
| `lib/telegram-bot.ts` | Intercept `confirm_booking:` callback |
| `app/api/cron/send-booking-confirmations/route.ts` | **NOVY** — cron posilajici potvrzovaci zpravy 2h pred |
| `app/api/cron/expire-unconfirmed-bookings/route.ts` | **NOVY** — cron expirujici nepotvrzene 1h pred + last-minute nabidky |
| `vercel.json` | Pridat 2 nove crony: `*/15 * * * *` a `*/10 * * * *` |

---

## 8. DB migrace (lib/db.ts)

### Nove sloupce na bookings_v2

```ts
// V runMigrations():
'ALTER TABLE bookings_v2 ADD COLUMN requires_confirmation INTEGER DEFAULT 0',
'ALTER TABLE bookings_v2 ADD COLUMN confirmation_sent_at DATETIME',
'ALTER TABLE bookings_v2 ADD COLUMN confirmation_deadline DATETIME',
```

### Nova tabulka booking_interest_log

```ts
try {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS booking_interest_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      client_id INTEGER,
      girl_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      interest_type TEXT NOT NULL DEFAULT 'availability_check'
        CHECK (interest_type IN ('availability_check', 'booking_failed_full', 'booking_cancelled')),
      notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (girl_id) REFERENCES girls(id)
    )
  `);
} catch { /* OK */ }

try {
  await client.execute('CREATE INDEX IF NOT EXISTS idx_bil_girl_date ON booking_interest_log(girl_id, date, notified)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_bil_chat ON booking_interest_log(chat_id)');
} catch { /* OK */ }
```

---

## 9. Cron joby — detail

### 9.1 `send-booking-confirmations` (kazdy 15 min)

```ts
// app/api/cron/send-booking-confirmations/route.ts

export async function GET(request: Request) {
  // Auth check (CRON_SECRET)
  
  // Prague "now"
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const today = formatDateISO(now);
  const twoHoursLater = formatTimeHHMM(now.getHours() + 2, now.getMinutes());
  
  // Find bookings needing confirmation:
  // - pending + requires_confirmation + NOT yet sent + today + start_time within 2h
  const bookings = await db.execute({
    sql: `SELECT b.id, b.date, b.start_time, b.end_time, b.duration_minutes,
                 b.girl_id, g.name AS girl_name,
                 bc.telegram_id AS client_chat_id
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          JOIN girls g ON g.id = b.girl_id
          WHERE b.status = 'pending'
            AND b.requires_confirmation = 1
            AND b.confirmation_sent_at IS NULL
            AND b.date = ?
            AND b.start_time <= ?
            AND bc.telegram_id IS NOT NULL`,
    args: [today, twoHoursLater],
  });
  
  let sent = 0;
  for (const row of bookings.rows) {
    const chatId = String(row.client_chat_id);
    const bookingId = Number(row.id);
    
    const ok = await sendMessage(chatId, [
      `📅 <b>Potvrzeni rezervace</b>`,
      '',
      `👩 ${row.girl_name}`,
      `⏰ Dnes v ${String(row.start_time).substring(0, 5)}`,
      `🕐 ${row.duration_minutes} min`,
      '',
      'Potvrzujes svuj prichod?',
    ].join('\n'), {
      replyMarkup: {
        inline_keyboard: [[
          { text: '✅ Potvrzuji', callback_data: `confirm_booking:${bookingId}:yes` },
          { text: '❌ Rusim', callback_data: `confirm_booking:${bookingId}:no` },
        ]],
      },
    });
    
    if (ok) {
      await db.execute({
        sql: 'UPDATE bookings_v2 SET confirmation_sent_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [bookingId],
      });
      sent++;
    }
  }
  
  return NextResponse.json({ success: true, checked: bookings.rows.length, sent });
}
```

### 9.2 `expire-unconfirmed-bookings` (kazdy 10 min)

```ts
// app/api/cron/expire-unconfirmed-bookings/route.ts

export async function GET(request: Request) {
  // Auth check (CRON_SECRET)
  
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const today = formatDateISO(now);
  const oneHourLater = formatTimeHHMM(now.getHours() + 1, now.getMinutes());
  
  // Find unconfirmed bookings past deadline:
  // - pending + requires_confirmation + confirmation_sent_at IS NOT NULL + today
  // - start_time - 1h <= NOW (ie. start_time <= oneHourLater)
  const bookings = await db.execute({
    sql: `SELECT b.id, b.girl_id, b.date, b.start_time, b.end_time,
                 b.client_id, g.name AS girl_name,
                 bc.telegram_id AS client_chat_id
          FROM bookings_v2 b
          JOIN booking_clients bc ON bc.id = b.client_id
          JOIN girls g ON g.id = b.girl_id
          WHERE b.status = 'pending'
            AND b.requires_confirmation = 1
            AND b.confirmation_sent_at IS NOT NULL
            AND b.date = ?
            AND b.start_time <= ?`,
    args: [today, oneHourLater],
  });
  
  let expired = 0;
  let notified = 0;
  
  for (const row of bookings.rows) {
    const bookingId = Number(row.id);
    const chatId = String(row.client_chat_id);
    const girlId = Number(row.girl_id);
    const date = String(row.date);
    const startTime = String(row.start_time).substring(0, 5);
    const girlName = String(row.girl_name);
    
    // Expire booking
    await db.execute({
      sql: `UPDATE bookings_v2
            SET status = 'expired', requires_confirmation = 0,
                cancel_reason = 'Client did not confirm',
                cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [bookingId],
    });
    
    // Release slot lock
    await db.execute({
      sql: 'DELETE FROM slot_locks WHERE locked_by = ?',
      args: [`booking:${bookingId}`],
    }).catch(() => {});
    
    // Notify client
    await sendMessage(chatId, [
      `⚠️ Tvoje rezervace u ${girlName} (${startTime}) nebyla potvrzena a byla zrusena.`,
      '',
      'Napiš kdykoliv pro novou rezervaci.',
    ].join('\n')).catch(() => {});
    
    expired++;
    
    // Last-minute: notify interested clients
    const interested = await db.execute({
      sql: `SELECT DISTINCT chat_id FROM booking_interest_log
            WHERE girl_id = ? AND date = ? AND notified = 0 AND chat_id != ?
            ORDER BY created_at DESC LIMIT 5`,
      args: [girlId, date, chatId],
    });
    
    for (const iRow of interested.rows) {
      const iChatId = String(iRow.chat_id);
      const sent = await sendMessage(iChatId, [
        `🔔 <b>Uvolnil se termin!</b>`,
        '',
        `👩 ${girlName}`,
        `📅 Dnes v ${startTime}`,
        '',
        `Chces si zarezervovat? Napsat staci.`,
      ].join('\n'));
      
      if (sent) {
        await db.execute({
          sql: 'UPDATE booking_interest_log SET notified = 1 WHERE chat_id = ? AND girl_id = ? AND date = ?',
          args: [iChatId, girlId, date],
        }).catch(() => {});
        notified++;
      }
    }
  }
  
  return NextResponse.json({ success: true, expired, notified });
}
```

### 9.3 vercel.json — nove crony

```json
{
  "path": "/api/cron/send-booking-confirmations",
  "schedule": "*/15 * * * *"
},
{
  "path": "/api/cron/expire-unconfirmed-bookings",
  "schedule": "*/10 * * * *"
}
```

**Poznamka k Vercel Hobby:** Hobby plan ma limit na 2 cron joby. Pro plan ma vic. Aktualne 7 cronu → uz musi byt Pro plan. +2 = 9, to je OK na Pro.

---

## 10. Poradi implementace

```
1. DB migrace (lib/db.ts) — 3 sloupce + 1 tabulka
2. tools.ts — pridat phone do registerNewClient
3. tool-handlers.ts — phone HMAC lookup, encrypt; zajem logging v checkAvailability
4. booking-flow.ts — requires_confirmation + confirmation_deadline; handleConfirmationCallback; notifyInterestedClients
5. telegram-bot.ts — intercept confirm_booking:
6. system-prompt.ts — instrukce pro telefon + potvrzovani
7. Cron: send-booking-confirmations
8. Cron: expire-unconfirmed-bookings
9. vercel.json — 2 nove crony
10. Test: novy klient → booking → potvrzovaci zprava → potvrzeni/expirace
```

---

## 11. Edge cases a rizika

| Case | Reseni |
|------|--------|
| Klient nema Telegram (importovany z CSV, booking pres operatorku) | `requires_confirmation = 0` — operatorka potvrdi sama |
| Booking na zitra (ne dnes) | Cron kontroluje `b.date = today`. Booking na zitra se potvrzovaci zprava posle az ZITRA 2h pred. |
| Booking za 1 hodinu (mene nez 2h) | Cron posle zpravu IHNED (start_time <= twoHoursLater). Deadline je start_time - 1h, takze klient ma minimalne cas do dalsiho behu expire cronu (10 min). |
| Booking za 30 min (mene nez 1h) | Confirmation se posle, ale expire cron hned spusti expiraci. **Reseni:** Bookings do 1h od ted nemaji `requires_confirmation` — automaticky confirmed. |
| Klient potvrdil ale neprisel | To je no-show, resite pres existujici booking status flow. |
| Vicedenni bookings | Neexistuje v systemu — vsechny bookings jsou single-day. |
| Klient nemuzne kliknout na tlacitko (stary Telegram klient) | `confirm_booking:` callback nefunguje → booking expiruje. Klient muze napsat "potvrzuji" jako text → AI handler muze potvrdit. Nutne pridat tool `confirmMyBooking`. |

**Dulezity edge case — bookings do 1h:**
Kdyz novy klient bookuje na termin ktery je za mene nez 1 hodinu, nema smysl posilat potvrzovaci zpravu a cekat. Reseni: v `handleConfirm()` kontrolovat:

```ts
const bookingTimeMin = parseTimeToMinutes(draft.startTime);
const nowMin = getPragueNow().getHours() * 60 + getPragueNow().getMinutes();
const minutesUntilBooking = bookingTimeMin - nowMin;

// If booking is within 1 hour, skip confirmation for today's bookings
const needsConfirmation = (trustLevel === 'new' && visits === 0)
  && !(draft.date === getPragueToday() && minutesUntilBooking < 60);
```

Pokud booking je za mene nez 1h → `requires_confirmation = 0`, `status = 'pending'` (stale ceka na operatorku, ale ne na klientovo potvrzeni).
