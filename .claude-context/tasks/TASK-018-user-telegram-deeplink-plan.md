# Task #18: Deep-link propojení Telegramu pro admin/operátorky (users)

## Cíl
Nahradit ruční zadávání "Telegram Chat ID" v editaci uživatele automatickým deep-link propojením. Admin/operátorka klikne na odkaz → bot propojí chat_id automaticky.

## Analýza stávajícího kódu

### Aktuální stav — `app/booking/users/[id]/page.tsx`:
- Řádky 108-121: Input pole "Telegram Chat ID" s placeholderem "Napr. 123456789"
- Hint říká "musi nejdriv napsat /start botovi, pak zkopirovat chat ID z URL" — nepraktické
- `handleSubmit` server action na řádku 46 ukládá `telegramChatId` přes `updateUser()`

### Token generace — `lib/telegram.ts:93`:
- `generateLinkToken(girlId)` — HMAC-SHA256 s `girl:${girlId}` message
- Potřeba přidat `generateUserLinkToken(userId)` s `user:${userId}` message

### Deep-link handler — `lib/telegram-bot.ts:49`:
- Existuje `LG_` prefix (klienti) a `GIRL_` prefix (dívky, task #15)
- Potřeba přidat `USER_` prefix pro admin/operátorky

## Implementační plán

### Krok 1: Přidat user token funkce do `lib/telegram.ts`

**Za existující `verifyLinkToken` (řádek 99):**

```typescript
export function generateUserLinkToken(userId: number): string {
  return crypto.createHmac('sha256', LINK_SECRET).update(`user:${userId}`).digest('hex').slice(0, 16);
}

export function verifyUserLinkToken(userId: number, token: string): boolean {
  return generateUserLinkToken(userId) === token;
}
```

### Krok 2: Přidat USER_ deep-link handler do `lib/telegram-bot.ts`

**Za GIRL_ handler (přidaný v task #15), před promo code check:**

```typescript
// Deep-link activation: /start USER_{token}
if (text.startsWith('/start USER_')) {
  const token = text.replace('/start USER_', '');
  try {
    await handleUserDeepLinkActivation(chatId, token, username);
  } catch (err) {
    console.error('[telegram-bot] User deep link error:', err);
  }
  return { type: 'deep_link_user', from: displayName, text, response: 'done' };
}
```

**Nová funkce `handleUserDeepLinkActivation`:**

```typescript
async function handleUserDeepLinkActivation(
  chatId: string, 
  token: string,
  username: string | null
): Promise<void> {
  const { verifyUserLinkToken } = await import('./telegram');
  
  // Find matching user — iterate active admin/operator/manager users
  const users = await db.execute({
    sql: `SELECT id, email, display_name, role, telegram_chat_id 
          FROM users 
          WHERE role IN ('admin', 'manager', 'operator') AND is_active = 1`,
    args: [],
  });
  
  let matchedUser: { id: number; displayName: string; role: string; existingChatId: string | null } | null = null;
  for (const row of users.rows) {
    const userId = Number(row.id);
    if (verifyUserLinkToken(userId, token)) {
      matchedUser = {
        id: userId,
        displayName: row.display_name ? String(row.display_name) : String(row.email),
        role: String(row.role),
        existingChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
      };
      break;
    }
  }
  
  if (!matchedUser) {
    await sendMessage(chatId, 'Odkaz neni platny. Kontaktujte spravce.');
    return;
  }

  // Check if already linked to different chat
  if (matchedUser.existingChatId && matchedUser.existingChatId !== chatId) {
    await sendMessage(chatId, 'Tento ucet je jiz propojen s jinym Telegram chatem.');
    return;
  }

  // Save chat_id
  await db.execute({
    sql: 'UPDATE users SET telegram_chat_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [chatId, matchedUser.id],
  });

  const roleLabel = matchedUser.role === 'admin' ? 'admin' 
    : matchedUser.role === 'manager' ? 'manazerka' 
    : 'operatorka';

  await sendMessage(chatId, [
    `<b>Propojeno!</b>`,
    '',
    `Vitejte, ${matchedUser.displayName} (${roleLabel}).`,
    'Budete dostavat notifikace o novych rezervacich z bota.',
  ].join('\n'));
}
```

### Krok 3: Upravit user edit page

**Soubor:** `app/booking/users/[id]/page.tsx`

**3a) Přidat data fetching** (v getUser funkci nebo v page komponentě):

```typescript
// Za stávající getUser(), přidat generování deep-link URL
const { generateUserLinkToken } = await import('@/lib/telegram');
const userToken = generateUserLinkToken(userId);
const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'studioflow3_bot';
const deepLinkUrl = `https://t.me/${botUsername}?start=USER_${userToken}`;
```

**3b) Nahradit Telegram Chat ID input** (řádky 108-121):

Stávající kód:
```tsx
<label className="ue-label">
  <span>Telegram Chat ID</span>
  <input type="text" name="telegramChatId" defaultValue={user.telegramChatId} placeholder="Napr. 123456789" className="ue-input" />
  <span className="ue-hint">Pro prijem eskalaci z bota. Uzivatel musi nejdriv napsat /start botovi, pak zkopirovat chat ID z URL.</span>
</label>
```

Nový kód:
```tsx
<div className="ue-label">
  <span>Telegram</span>
  {user.telegramChatId ? (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '13px' }}>Propojeno</span>
      </div>
      <span className="ue-hint">Chat ID: {user.telegramChatId}</span>
      {/* Hidden input to preserve existing value */}
      <input type="hidden" name="telegramChatId" value={user.telegramChatId} />
    </div>
  ) : (
    <div>
      <div style={{ fontSize: '13px', color: 'var(--dim)', marginBottom: '8px' }}>Nepropojeno</div>
      <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 14px' }}>
        <div style={{ fontSize: '11px', color: 'var(--dim)', marginBottom: '6px' }}>
          Kliknete na odkaz nebo ho zkopirujte:
        </div>
        <a href={deepLinkUrl} target="_blank" style={{ fontSize: '12px', color: 'var(--coral)', wordBreak: 'break-all' }}>
          {deepLinkUrl}
        </a>
      </div>
      <input type="hidden" name="telegramChatId" value="" />
      <span className="ue-hint">Po kliknuti se automaticky propoji Telegram s timto uctem.</span>
    </div>
  )}
</div>
```

## Soubory k úpravě

| Soubor | Akce |
|--------|------|
| `lib/telegram.ts` | Přidat `generateUserLinkToken()` + `verifyUserLinkToken()` |
| `lib/telegram-bot.ts` | Přidat `USER_` deep-link handler + `handleUserDeepLinkActivation()` |
| `app/booking/users/[id]/page.tsx` | Nahradit ruční Chat ID input za deep-link UI |

## Poznámky pro implementátora

1. **Deterministický token** — `generateUserLinkToken(userId)` vrací vždy stejný token pro stejný userId (HMAC). Nemusí se ukládat do DB.
2. **Oddělený prefix** — `user:${userId}` v HMAC message, odlišený od `girl:${girlId}` — nemůže dojít ke kolizi.
3. **USER_ prefix** v deep-link — třetí prefix vedle LG_ (klienti) a GIRL_ (dívky).
4. **Iterace** — handler projde max desítky users (admin/manager/operator), zanedbatelná zátěž.
5. **Hidden input** — když je propojeno, `telegramChatId` se posílá jako hidden input aby se nezměnil při uložení formuláře. Když nepropojeno, posílá se prázdný string.
6. **Odkaz je klikací** — admin může přímo kliknout a propojit svůj vlastní účet, nebo zkopírovat a poslat operátorce.
7. **Import pattern** — dynamický import `await import('./telegram')` v bot handleru, aby nedocházelo k circular deps.
