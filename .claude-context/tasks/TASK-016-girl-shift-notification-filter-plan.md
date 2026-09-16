# Task #16: Notifikace dívkám jen v den jejich směny

## Cíl
Upravit notifikační logiku: Telegram notifikace dívce se pošle POUZE pokud dívka má směnu v den rezervace. Operátorce jdou notifikace VŽDY.

## Kontext
Uživatel říká: "nastav to ale jen vždycky v ten den kdy dívka pracuje, že se jí tam něco mění" — dívka by neměla být rušena notifikacemi pokud daný den nepracuje.

## Analýza

### Aktuální stav
`sendBookingCreatedNotifications()` v `lib/telegram-ai/booking-flow.ts:490-550`:
- Posílá notifikaci operátorkám (řádky 518-527) — BEZ podmínky — OK, zůstane tak
- Posílá notifikaci dívce (řádky 529-549) — BEZ kontroly směny — **nutno přidat check**

### Logika kontroly směny (existuje v `getAvailableSlots`, řádek 997-1011)
```sql
SELECT gs.start_time, gs.end_time,
       se.exception_type AS ex_type
FROM girl_schedules gs
LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
  AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
ORDER BY gs.effective_from DESC NULLS LAST
LIMIT 1
```
- Pokud výsledek prázdný → dívka nemá směnu
- Pokud `exception_type = 'unavailable'` → dívka má volno (override)
- Jinak → dívka pracuje

## Implementační plán

### Jediný soubor: `lib/telegram-ai/booking-flow.ts`

Přidat kontrolu směny **před** odesláním notifikace dívce (sekce 2 ve funkci `sendBookingCreatedNotifications`).

**Kde přesně:** Za řádek 528 (`} catch { /* silent */ }`), před řádek 529 (`// 2) Notify the girl`).

```typescript
// 2) Notify the girl — ONLY if she works on the booking date
try {
  // Check if girl has a shift on the booking date
  const bookingDate = date;
  const jsDay = new Date(bookingDate + 'T12:00:00').getDay();
  const dow = jsDay === 0 ? 6 : jsDay - 1;
  
  const shiftCheck = await db.execute({
    sql: `SELECT gs.id, se.exception_type AS ex_type
          FROM girl_schedules gs
          LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST
          LIMIT 1`,
    args: [bookingDate, girlId, dow, bookingDate],
  });
  
  const hasShift = shiftCheck.rows.length > 0 
    && String(shiftCheck.rows[0].ex_type ?? '') !== 'unavailable';
  
  if (!hasShift) {
    // Girl doesn't work this day — skip notification
    return;  // (or just skip the girl notification block, not return)
  }
  
  // ... existing girl notification logic (telegram_links → users fallback)
```

**Pozor:** Nepoužít `return` ale přeskočit jen blok notifikace dívce. Správný pattern:

```typescript
// 2) Notify the girl — ONLY if she works on the booking date
try {
  const bookingDate = date;
  const jsDay = new Date(bookingDate + 'T12:00:00').getDay();
  const dow = jsDay === 0 ? 6 : jsDay - 1;
  
  const shiftCheck = await db.execute({
    sql: `SELECT gs.id, se.exception_type AS ex_type
          FROM girl_schedules gs
          LEFT JOIN schedule_exceptions se ON se.girl_id = gs.girl_id AND se.date = ?
          WHERE gs.girl_id = ? AND gs.day_of_week = ? AND gs.is_active = 1
            AND (gs.effective_from IS NULL OR gs.effective_from <= ?)
          ORDER BY gs.effective_from DESC NULLS LAST
          LIMIT 1`,
    args: [bookingDate, girlId, dow, bookingDate],
  });
  
  const hasShift = shiftCheck.rows.length > 0 
    && String(shiftCheck.rows[0].ex_type ?? '') !== 'unavailable';
  
  if (hasShift) {
    // Girl works today — send notification
    const girlLink = await db.execute({
      sql: `SELECT chat_id FROM telegram_links
            WHERE girl_id = ? AND is_active = 1 LIMIT 1`,
      args: [girlId],
    });

    if (girlLink.rows.length > 0) {
      sendMessage(String(girlLink.rows[0].chat_id), msg).catch(() => {});
    } else {
      const girlUser = await db.execute({
        sql: `SELECT telegram_chat_id FROM users
              WHERE girl_id = ? AND is_active = 1 AND telegram_chat_id IS NOT NULL LIMIT 1`,
        args: [girlId],
      });
      if (girlUser.rows.length > 0) {
        sendMessage(String(girlUser.rows[0].telegram_chat_id), msg).catch(() => {});
      }
    }
  }
} catch { /* silent */ }
```

## Soubory k úpravě

| Soubor | Akce |
|--------|------|
| `lib/telegram-ai/booking-flow.ts` | Obalit sekci 2 (notify girl) kontrolou směny |

## Poznámky pro implementátora

1. **Operátorce VŽDY** — sekce 1 (notify operators) se NEMĚNÍ
2. **day_of_week konvence**: JS getDay() vrací 0=Ne, ale DB používá 0=Po. Proto: `jsDay === 0 ? 6 : jsDay - 1`
3. **schedule_exceptions override**: Pokud existuje exception s `exception_type = 'unavailable'`, dívka nepracuje i když má běžnou směnu
4. **effective_from**: Řazení DESC NULLS LAST zajistí, že nejnovější schedule má přednost
5. **Edge case**: Booking se normálně vytváří jen na dny kdy dívka pracuje (slot selection). Ale tento check je **safety guard** pro případ manuálních bookingů nebo race conditions.
6. **Fire-and-forget**: Celý blok je v try/catch s `.catch(() => {})` — selhání neovlivní booking flow
