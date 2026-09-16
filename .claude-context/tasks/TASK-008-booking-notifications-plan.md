# Task #8: Notifikace operátorce/dívkám při nové rezervaci

## Cíl
Když klient vytvoří booking přes Telegram bot (handleConfirm v booking-flow.ts), poslat Telegram notifikaci:
1. **Operátorce** (role='operator' v users tabulce)
2. **Dívce** (přes telegram_links nebo users tabulku s girl_id)

## Analýza stávajícího kódu

### Co už existuje (ale NEPOUŽÍVÁ SE):
- `lib/telegram.ts:105` — `notifyGirlNewBooking()` — existující funkce, ale **nikdy se nevolá**
- `lib/booking-notifications.ts:3` — `createBookingNotification()` — in-app notifikace, **nikdy se nevolá**

### DB tabulky k dispozici:

| Tabulka | Relevantní sloupce | Účel |
|---------|-------------------|------|
| `users` | `role, girl_id, telegram_chat_id, display_name` | Operátorky (role='operator'), dívky (role='girl', girl_id=X) |
| `telegram_links` | `girl_id, chat_id, is_active` | Propojení dívky s Telegram chatem |
| `booking_clients` | `nickname, telegram_id` | Klient info |
| `girls` | `id, name` | Jméno dívky |

### Klíčový soubor k úpravě:
- **`lib/telegram-ai/booking-flow.ts`** — funkce `handleConfirm()` (řádek 273-453)

### Místo pro vložení notifikací:
Po úspěšném vytvoření bookingu (po řádku 453 — po odeslání potvrzení klientovi), přidat notifikace operátorce a dívce.

## Implementační plán

### Krok 1: Vytvořit helper funkci `sendBookingCreatedNotifications()`

Umístění: `lib/telegram-ai/booking-flow.ts` (na konci souboru, před helpers sekci)

```typescript
async function sendBookingCreatedNotifications(params: {
  bookingId: number;
  clientNickname: string;
  girlId: number;
  girlName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  status: string;
}): Promise<void> {
  const { bookingId, clientNickname, girlId, girlName, date, startTime, endTime, durationMinutes, price, status } = params;
  
  const statusText = status === 'confirmed' ? 'Potvrzena' : 'Ceka na potvrzeni';
  
  const msg = [
    `📅 <b>Nova rezervace #${bookingId}</b>`,
    '',
    `👤 Klient: ${clientNickname}`,
    `👩 ${girlName}`,
    `📆 ${formatDate(date)}`,
    `⏰ ${startTime}–${endTime} (${durationMinutes} min)`,
    `💰 ${price} CZK`,
    `📋 Status: ${statusText}`,
  ].join('\n');

  // 1) Notifikace operátorkám (users kde role='operator' a telegram_chat_id IS NOT NULL)
  try {
    const operators = await db.execute({
      sql: `SELECT telegram_chat_id FROM users 
            WHERE role = 'operator' AND is_active = 1 AND telegram_chat_id IS NOT NULL`,
      args: [],
    });
    for (const op of operators.rows) {
      sendMessage(String(op.telegram_chat_id), msg).catch(() => {});
    }
  } catch { /* silent */ }

  // 2) Notifikace dívce
  // Cesta A: telegram_links (přímé propojení dívky s Telegram)
  // Cesta B: users tabulka (girl_id + telegram_chat_id)
  try {
    // Nejprve zkusit telegram_links
    const girlLink = await db.execute({
      sql: `SELECT chat_id FROM telegram_links 
            WHERE girl_id = ? AND is_active = 1 LIMIT 1`,
      args: [girlId],
    });
    
    if (girlLink.rows.length > 0) {
      sendMessage(String(girlLink.rows[0].chat_id), msg).catch(() => {});
    } else {
      // Fallback: users tabulka
      const girlUser = await db.execute({
        sql: `SELECT telegram_chat_id FROM users 
              WHERE girl_id = ? AND is_active = 1 AND telegram_chat_id IS NOT NULL LIMIT 1`,
        args: [girlId],
      });
      if (girlUser.rows.length > 0) {
        sendMessage(String(girlUser.rows[0].telegram_chat_id), msg).catch(() => {});
      }
    }
  } catch { /* silent */ }
}
```

### Krok 2: Zavolat funkci z `handleConfirm()`

Přidat volání **po** odeslání potvrzení klientovi (za řádek 453), jako fire-and-forget:

```typescript
// Po posledním sendMessage klientovi (řádek 453):

// Get client nickname for notification
const clientInfo = await db.execute({
  sql: 'SELECT nickname FROM booking_clients WHERE id = ? LIMIT 1',
  args: [draft.clientId],
});
const clientNickname = clientInfo.rows[0] ? String(clientInfo.rows[0].nickname) : 'Neznámý';

// Send notifications to operator & girl (fire-and-forget)
sendBookingCreatedNotifications({
  bookingId,
  clientNickname,
  girlId: draft.girlId,
  girlName: draft.girlName,
  date: draft.date,
  startTime: draft.startTime,
  endTime: draft.endTime!,
  durationMinutes: draft.durationMinutes!,
  price: finalPrice,
  status: bookingStatus,
}).catch(() => {});
```

### Krok 3: Přidat in-app booking notifikaci

Přidat import a volání `createBookingNotification` pro in-app dashboard:

```typescript
import { createBookingNotification } from '../booking-notifications';

// Za sendBookingCreatedNotifications volání:
createBookingNotification({
  type: 'new_booking',
  title: `Nova rezervace #${bookingId}`,
  message: `${clientNickname} → ${draft.girlName}, ${formatDate(draft.date)} ${draft.startTime}–${draft.endTime} (${finalPrice} CZK)`,
  bookingId,
  link: `/booking/calendar?date=${draft.date}`,
}).catch(() => {});
```

## Soubory k úpravě

| Soubor | Akce |
|--------|------|
| `lib/telegram-ai/booking-flow.ts` | Přidat import `createBookingNotification`, přidat `sendBookingCreatedNotifications()` helper, přidat volání v `handleConfirm()` |

## Poznámky pro implementátora

1. **Fire-and-forget**: Všechny notifikace volat s `.catch(() => {})` — nesmí blokovat klientův flow
2. **Žádný nový import `sendMessage`**: už je importován na řádku 18
3. **Nová funkce `notifyGirlNewBooking` v telegram.ts se NEPOUŽIJE** — je příliš omezená (nemá klienta, lokaci). Lepší je mít logiku přímo v booking-flow.ts
4. **Fallback strategie pro dívku**: telegram_links → users(girl_id) — oba zdroje chat_id
5. **Operátorky**: hledat `role='operator'` v users tabulce — může jich být víc, poslat všem
6. **`telegram_chat_id`**: sloupec v users musí být vyplněn ručně adminem v dashboardu nebo přes seed. Pokud je NULL, notifikace se nepošle (tiché selhání).
7. **Formát zprávy**: HTML parse mode (výchozí v sendMessage), česky, emoji pro přehlednost
