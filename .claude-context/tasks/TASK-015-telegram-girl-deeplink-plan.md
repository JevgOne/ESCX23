# Task #15: Telegram propojení dívek — deep-link v admin kartě

## Cíl
Admin vygeneruje unikátní deep-link pro dívku, pošle jí ho přes WA/SMS. Dívka klikne, bot ji propojí s jejím profilem. Pak jí chodí notifikace o rezervacích.

## Analýza stávajícího kódu

### Co existuje:
| Co | Kde | Stav |
|----|-----|------|
| `telegram_links` tabulka | `lib/db.ts:131` | Existuje (girl_id UNIQUE, chat_id, username, is_active) |
| `generateLinkToken(girlId)` | `lib/telegram.ts:93` | HMAC-SHA256 token, 16 znaků. **Ale deterministic** — stejný girlId = stejný token vždy |
| `verifyLinkToken(girlId, token)` | `lib/telegram.ts:97` | Ověření tokenu |
| Deep-link handler pro KLIENTY | `lib/telegram-bot.ts:49` | `/start LG_{token}` → propojí booking_client |
| Admin girl detail page | `app/[locale]/(admin)/admin/divky/[id]/page.tsx` | Server component, zobrazuje profil dívky |
| Booking girls list | `app/booking/girls/page.tsx` | Seznam dívek v booking admin |
| Bot username | `.env.local` | `studioflow3_bot` |
| Notifikace při bookingu | `lib/telegram-ai/booking-flow.ts:529` | Už hledá `telegram_links` pro chat_id dívky |

### Co NEEXISTUJE:
- Deep-link handler pro DÍVKY (prefix `GIRL_`)
- Telegram sekce v admin kartě dívky
- Server action pro generování/zrušení linku

## Implementační plán

### Krok 1: Rozšířit deep-link handler v `telegram-bot.ts`

Přidat nový prefix `GIRL_` vedle existujícího `LG_` (pro klienty).

**Soubor:** `lib/telegram-bot.ts`
**Kde:** Za řádek 57 (za stávající `LG_` deep-link block)

```typescript
// Deep-link activation: /start GIRL_{token}
if (text.startsWith('/start GIRL_')) {
  const token = text.replace('/start GIRL_', '');
  try {
    await handleGirlDeepLinkActivation(chatId, token, username);
  } catch (err) {
    console.error('[telegram-bot] Girl deep link error:', err);
  }
  return { type: 'deep_link_girl', from: displayName, text, response: 'done' };
}
```

**Nová funkce `handleGirlDeepLinkActivation`** (ve spodní části souboru):

```typescript
async function handleGirlDeepLinkActivation(
  chatId: string, 
  token: string, 
  username: string | null
): Promise<void> {
  // Ověřit token — projít všechny aktivní dívky a najít match
  const girls = await db.execute({
    sql: "SELECT id, name FROM girls WHERE status = 'active'",
    args: [],
  });
  
  let matchedGirl: { id: number; name: string } | null = null;
  for (const row of girls.rows) {
    const girlId = Number(row.id);
    if (verifyLinkToken(girlId, token)) {
      matchedGirl = { id: girlId, name: String(row.name) };
      break;
    }
  }
  
  if (!matchedGirl) {
    await sendMessage(chatId, 'Odkaz neni platny. Kontaktujte spravce.');
    return;
  }

  // Zkontrolovat jestli už není propojená
  const existing = await db.execute({
    sql: 'SELECT chat_id FROM telegram_links WHERE girl_id = ? AND is_active = 1 LIMIT 1',
    args: [matchedGirl.id],
  });
  
  if (existing.rows.length > 0 && String(existing.rows[0].chat_id) !== chatId) {
    await sendMessage(chatId, 'Tento ucet je jiz propojen s jinym Telegram chatem.');
    return;
  }

  // Upsert do telegram_links
  await db.execute({
    sql: `INSERT INTO telegram_links (girl_id, chat_id, username, is_active, linked_at)
          VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(girl_id) DO UPDATE SET 
            chat_id = ?, username = ?, is_active = 1, linked_at = CURRENT_TIMESTAMP`,
    args: [matchedGirl.id, chatId, username, chatId, username],
  });

  await sendMessage(chatId, [
    `<b>Propojeno!</b>`,
    '',
    `Vitej, ${matchedGirl.name}. Tvuj Telegram je propojen s tvym profilem.`,
    'Od ted budes dostavat notifikace o novych rezervacich.',
  ].join('\n'));
}
```

**Import:** Přidat `import { verifyLinkToken } from './telegram';` na začátek telegram-bot.ts.

### Krok 2: Server action pro generování deep-linku

**Soubor:** `lib/admin-actions.ts` — přidat na konec

```typescript
export async function generateGirlTelegramLink(girlId: number): Promise<string> {
  await requireAdmin();
  
  const { generateLinkToken } = await import('./telegram');
  const token = generateLinkToken(girlId);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'studioflow3_bot';
  
  return `https://t.me/${botUsername}?start=GIRL_${token}`;
}

export async function unlinkGirlTelegram(girlId: number): Promise<void> {
  await requireAdmin();
  
  await db.execute({
    sql: 'UPDATE telegram_links SET is_active = 0 WHERE girl_id = ?',
    args: [girlId],
  });
  
  revalidatePath('/cs/admin/divky/' + girlId);
}
```

### Krok 3: Telegram sekce v admin kartě dívky

**Soubor:** `app/[locale]/(admin)/admin/divky/[id]/page.tsx`

**3a) Přidat data fetching** (za stávající photoResult query, cca řádek 35):

```typescript
// Telegram link status
const telegramResult = await db.execute({
  sql: 'SELECT chat_id, username, linked_at FROM telegram_links WHERE girl_id = ? AND is_active = 1 LIMIT 1',
  args: [Number(id)],
});
const telegramLinked = telegramResult.rows.length > 0;
const telegramUsername = telegramLinked && telegramResult.rows[0].username 
  ? String(telegramResult.rows[0].username) : null;
const telegramLinkedAt = telegramLinked && telegramResult.rows[0].linked_at 
  ? String(telegramResult.rows[0].linked_at) : null;

// Generate deep-link URL (deterministic — same token every time for same girl)
const { generateLinkToken } = await import('@/lib/telegram');
const token = generateLinkToken(Number(id));
const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? 'studioflow3_bot';
const deepLinkUrl = `https://t.me/${botUsername}?start=GIRL_${token}`;
```

**3b) Přidat Telegram sekci do JSX** (za "Akce" div, před uzavírající `</div>` gridového containeru):

```tsx
{/* Telegram propojení */}
<div style={{ 
  background: 'var(--color-bg-card)', 
  border: '1px solid var(--color-line)', 
  borderRadius: '12px', 
  padding: '20px', 
  marginTop: '20px' 
}}>
  <div style={{ 
    fontSize: '12px', 
    color: 'var(--color-coral)', 
    fontWeight: 600, 
    textTransform: 'uppercase', 
    letterSpacing: '0.08em', 
    marginBottom: '16px' 
  }}>
    Telegram
  </div>
  
  {telegramLinked ? (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ color: '#22c55e', fontWeight: 600 }}>Propojeno</span>
        {telegramUsername && (
          <span style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
            @{telegramUsername}
          </span>
        )}
      </div>
      {telegramLinkedAt && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
          Propojeno: {new Date(telegramLinkedAt).toLocaleString('cs-CZ')}
        </div>
      )}
      <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
        Divka dostava notifikace o novych rezervacich pres Telegram.
      </div>
    </div>
  ) : (
    <div>
      <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
        Nepropojeno — divka nedostava Telegram notifikace.
      </div>
      <div style={{ 
        background: 'var(--color-bg-elev)', 
        border: '1px solid var(--color-line)', 
        borderRadius: '8px', 
        padding: '12px', 
        marginBottom: '12px' 
      }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
          Poslete tento odkaz divce (WA/SMS):
        </div>
        <code style={{ 
          fontSize: '12px', 
          wordBreak: 'break-all', 
          background: 'var(--color-bg)', 
          padding: '6px 10px', 
          borderRadius: '4px', 
          display: 'block' 
        }}>
          {deepLinkUrl}
        </code>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>
        Po kliknuti se divce v Telegramu propoji ucet a zacne dostavat notifikace.
      </div>
    </div>
  )}
</div>
```

## Soubory k úpravě

| Soubor | Akce |
|--------|------|
| `lib/telegram-bot.ts` | Přidat GIRL_ deep-link handler + `handleGirlDeepLinkActivation()` + import `verifyLinkToken` |
| `app/[locale]/(admin)/admin/divky/[id]/page.tsx` | Přidat Telegram sekci (data fetch + UI) |
| `lib/admin-actions.ts` | Přidat `unlinkGirlTelegram()` server action (volitelné, pro budoucí "odpojit" tlačítko) |

## Poznámky pro implementátora

1. **Token je deterministic** — `generateLinkToken(girlId)` vždy vrátí stejný token pro stejné girlId. Tzn. odkaz se nemění, lze ho znovu zobrazit kdykoliv. Není potřeba ukládat token do DB.
2. **GIRL_ prefix** — odlišení od klientského LG_ prefixu. Bot handler musí rozpoznat oba.
3. **`telegram_links` tabulka** — má UNIQUE constraint na `girl_id`, takže upsert s ON CONFLICT je správný přístup.
4. **`verifyLinkToken` iterace** — pro bezpečnost se token neposílá s girlId, takže handler musí projít všechny active dívky a najít match. Při 20-30 dívkách je to zanedbatelná zátěž.
5. **Username capture** — z Telegram update.message.from.username se uloží do telegram_links pro identifikaci.
6. **Server component** — admin karta dívky je RSC, takže data fetch jde přímo do komponenty bez server action. Deep-link URL se generuje na serveru.
7. **Žádný client component potřeba** — odkaz se jen zobrazí jako text/code, admin ho zkopíruje a pošle ručně.

## Bezpečnostní poznámky

- Token je HMAC-SHA256 podepsaný `TELEGRAM_LINK_SECRET` — nelze uhodnout bez znalosti secret
- Dívka se může propojit jen jednou (ON CONFLICT → update). Opětovné kliknutí přepíše chat_id.
- Pokud je již propojená s jiným chatem, handler odmítne nové propojení (ochrana proti zneužití).
