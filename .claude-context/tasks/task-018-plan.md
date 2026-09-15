# TASK #18: Import kontaktů + deep-link propojení Telegram

**Status:** PLAN READY  
**Autor:** Plánovač  
**Datum:** 2026-09-14

---

## Přehled

Dvě provázané věci:
- **A) Import script** — naparsovat 6349 kontaktů z CSV, klasifikovat, šifrovat telefony, vložit do `booking_clients`
- **B) Deep-link propojení** — nový sloupec `deep_link_token`, handle `/start LG_{token}` v botu, zobrazit deep-link URL v admin klientské kartě

---

## ČÁST A: Import kontaktů

### A1. CSV struktura

Soubor: `/Users/zen/Desktop/contacts.csv`  
Řádků: 6349 (+ 1 header = 6350 celkem)  
Encoding: UTF-8, Google Contacts export

**Relevantní sloupce:**
| # | Sloupec | Použití |
|---|---------|---------|
| 1 | `First Name` | Kód klienta → `nickname` |
| 15 | `Notes` | Flagy (⛔, neprisel atd.) |
| 19 | `Phone 1 - Value` | Telefon → encrypt + HMAC |

**Ignorujeme:** sloupce 2-14, 16-18, 20-21 (Middle Name, Last Name, Labels, Photo atd.)

### A2. Parsování First Name (nickname)

CSV `First Name` obsahuje pestrou směs formátů. Příklady z reálných dat:

```
Klient1509          → nickname: "Klient1509"
Novy1509            → nickname: "Novy1509"
A0101 EMILY NE      → nickname: "A0101 EMILY NE"
⛔                   → nickname: "⛔" (banned)
~ Paul0112N         → nickname: "Paul0112N" (trim ~ prefix)
😀novy1007          → nickname: "novy1007" (strip emoji prefix)
$29014              → nickname: "$29014"
0510LauraNE         → nickname: "0510LauraNE"
815/Ellis/Němec     → nickname: "815/Ellis/Němec"
2 Kluci/St.Boleslav/Emily → nickname: "2 Kluci/St.Boleslav/Emily"
(prázdné)           → nickname: "Import-{row_number}"
```

**Pravidla čištění:**
1. Trim whitespace
2. Strip leading `~` (přibližně 3 záznamy)
3. Strip leading emoji (😀 a podobné) — regex `^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+`
4. Pokud po čištění prázdné → `"Import-{row_number}"`
5. **NEměnit** obsah (⛔ se ponechá v nickname, klasifikace se dělá zvlášť)

### A3. Klasifikace trust_level

**Logika (v tomto pořadí — první match vyhrává):**

| Podmínka | trust_level | is_banned | no_show_count | total_visits | notes |
|----------|-------------|-----------|---------------|--------------|-------|
| First Name nebo Notes obsahuje `⛔` | `new` | `1` | `0` | `0` | Obsah Notes sloupce z CSV |
| First Name (case-insensitive) obsahuje `neprisel`, `neprisla`, `nepřišel`, `nepřišla`, `zrusil`, `zrušil`, `zrusila`, `zrušila`, `NE` na konci slova (regex `\bNE\b`) | `new` | `0` | `1` | `0` | "unreliable (imported)" |
| First Name začíná `Novy` (case-insensitive) | `new` | `0` | `0` | `1` | null |
| First Name začíná `Klient` (case-insensitive) | `regular` | `0` | `0` | `3` | null |
| Jiné | `regular` | `0` | `0` | `3` | null |

**Poznámka k `NE`:** Mnoho záznamů má `NE` jako suffix = "nepřišel" (např. `A0101 EMILY NE`, `0510LauraNE`). Detekce přes regex `\bNE$/` nebo `\sNE$` na trimovaném First Name.

### A4. Telefony — šifrování a deduplikace

**Formáty v CSV:**
```
+420 608 943 042    → normalize: +420608943042
+420723594090       → normalize: +420723594090
+39 327 399 8799    → normalize: +393273998799
+447960541365       → normalize: +447960541365
+972522510126       → normalize: +972522510126
(prázdné)           → skip phone encryption
```

**Postup:**
1. Parsovat `Phone 1 - Value` (sloupec 19)
2. Pokud prázdné → `phone_encrypted = NULL`, `phone_hmac = NULL`
3. Pokud neprázdné:
   - Normalize přes `normalizePhone()` z crypto.ts (strip spaces/dashes, Czech 00420→+420)
   - Spočítat HMAC: `hmacSearch(phone)` → `phone_hmac`
   - **Deduplikace check:** `SELECT id FROM booking_clients WHERE phone_hmac = ?`
   - Pokud HMAC už existuje → **SKIP** (neimportovat duplikát, zalogovat)
   - Pokud unikátní → encrypt: `encrypt(normalizedPhone)` → `phone_encrypted`

**Odhad:** ~540 řádků nemá telefon → ~5810 s telefonem. Duplikáty neočekávám mnoho (Google Contacts export), ale safety check je nutný.

### A5. Generování client_number

Existující formát v systému: `LG-XXXX` (číslo). Script musí:
1. Najít `MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER))` z booking_clients
2. Pokračovat od `max + 1`
3. Pro každý importovaný řádek: `LG-{nextNumber}`, increment

### A6. Generování deep_link_token

Pro každého klienta vygenerovat unikátní token:
```ts
import crypto from 'crypto';
const token = crypto.randomBytes(8).toString('hex'); // 16 chars hex
```

16 znaků hex = 64 bitů entropie — dostatečné pro 6350 kontaktů, kolize prakticky nemožná. Token se uloží do nového sloupce `deep_link_token`.

### A7. Import skript

**Soubor:** `scripts/import-contacts.ts`

**Spuštění:** `npx tsx scripts/import-contacts.ts`

**Pseudokód:**
```
1. Načti CSV (csv-parse nebo manuální split — CSV je jednoduchý)
2. Najdi max client_number
3. Pro každý řádek (skip header):
   a. Parsuj First Name, Notes, Phone 1 - Value
   b. Očisti nickname (trim, strip ~, strip emoji)
   c. Klasifikuj trust_level / is_banned / no_show_count / total_visits
   d. Pokud má telefon:
      - hmac = hmacSearch(phone)
      - Check duplikát v DB
      - Pokud duplikát → log + skip
      - encrypt phone
   e. Generuj client_number (LG-XXXX)
   f. Generuj deep_link_token (16 hex chars)
   g. INSERT do booking_clients
4. Výstup: celkem importováno / přeskočeno / duplikáty / chyby
```

**Důležité:**
- Script musí nastavit env vars `BOOKING_ENCRYPTION_KEY` a `BOOKING_HMAC_SECRET` (ze `.env.local` nebo parametrů)
- Batch INSERT po 100 řádcích (Turso má limit na transaction size)
- Dry-run mode: `--dry-run` flag pro testování bez zápisu
- Logovat do konzole: `[IMPORT] Row 42: Klient1509 → LG-1042 (regular, phone: yes)`

### A8. Ošetření edge cases

| Case | Řešení |
|------|--------|
| Řádek bez First Name a bez Phone | Importovat s nickname `Import-{row}`, bez telefonu |
| Více čárek v First Name (CSV escaping) | Google Contacts export používá quoted fields — parsovat správně |
| Non-Czech phone formats (+39, +44, +972) | `normalizePhone()` je nechá jak jsou, jen stripne mezery |
| Existující booking_clients v DB | Script NEPŘEPISUJE existující záznamy. Duplikace se kontroluje jen přes phone_hmac |
| Notes sloupec s `:::` separátorem | Google Contacts export: `Importováno 18. 3. ::: * myContacts`. Uložit celé do `notes` |

---

## ČÁST B: Deep-link propojení

### B1. DB migrace — nový sloupec

V `lib/db.ts` přidat do `runMigrations()`:

```ts
'ALTER TABLE booking_clients ADD COLUMN deep_link_token TEXT',
```

Plus index:
```ts
await client.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_bc_deeplink ON booking_clients(deep_link_token)');
```

### B2. Bot — handle `/start LG_{token}`

**Soubor:** `lib/telegram-bot.ts`

Aktuální stav: `/start` zprávy jdou přímo do AI handleru (`handleAIMessage`). Potřebujeme **intercept** `/start LG_*` PŘED AI handlerem.

**Změna v `handleUpdate()`:**

```ts
// V sekci "Text message → AI handler", PŘED handleAIMessage:
if (text.startsWith('/start LG_')) {
  const token = text.replace('/start ', '');
  // token = "LG_abcdef1234567890"
  const deepLinkToken = token.replace('LG_', '');
  
  try {
    await handleDeepLinkActivation(chatId, username, deepLinkToken);
  } catch (err) {
    console.error('[telegram-bot] Deep link error:', err);
  }
  
  return { type: 'deep_link', from: displayName, text, response: 'done' };
}
```

### B3. Deep-link activation handler

**Nová funkce** v `lib/telegram-bot.ts` (nebo nový soubor `lib/telegram-ai/deep-link.ts`):

```ts
async function handleDeepLinkActivation(
  chatId: string, 
  username: string | null, 
  token: string
): Promise<void> {
  // 1. Najdi klienta s tímto tokenem
  const result = await db.execute({
    sql: 'SELECT id, nickname, telegram_id FROM booking_clients WHERE deep_link_token = ? LIMIT 1',
    args: [token],
  });
  
  if (result.rows.length === 0) {
    // Neplatný token
    await sendMessage(chatId, 'Odkaz není platný. Napište nám a pomůžeme vám.');
    return;
  }
  
  const client = result.rows[0];
  const clientId = Number(client.id);
  const existingTgId = client.telegram_id ? String(client.telegram_id) : null;
  
  // 2. Check jestli už je propojený s jiným chatem
  if (existingTgId && existingTgId !== chatId) {
    await sendMessage(chatId, 'Tento účet je již propojen s jiným Telegram chatem.');
    return;
  }
  
  // 3. Propojit — uložit telegram_id do booking_clients
  await db.execute({
    sql: 'UPDATE booking_clients SET telegram_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [chatId, clientId],
  });
  
  // 4. Upsert do telegram_users (pro kontext lookup)
  await db.execute({
    sql: `INSERT INTO telegram_users (telegram_user_id, client_id, chat_id, activation_token, is_active, activated_at)
          VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(telegram_user_id) DO UPDATE SET client_id = ?, chat_id = ?, activated_at = CURRENT_TIMESTAMP`,
    args: [chatId, clientId, chatId, token, clientId, chatId],
  });
  
  // 5. Audit log
  // auditClientUpdate(clientId, 'deep_link_activated', { chatId })
  
  // 6. Potvrzení klientovi
  const nickname = client.nickname ? String(client.nickname) : 'klient';
  await sendMessage(chatId, [
    `✅ Váš účet byl úspěšně propojen!`,
    ``,
    `Vítejte, ${nickname}. Nyní můžete přes tento chat:`,
    `• Vytvářet rezervace`,
    `• Sledovat oblíbené dívky`,
    `• Dostávat upozornění na nový rozvrh`,
    ``,
    `Napište <b>cokoliv</b> a naše AI operátorka vám pomůže.`,
  ].join('\n'));
}
```

### B4. Admin klientská karta — zobrazit deep-link

**Soubor:** `app/booking/clients/[id]/page.tsx`

V sekci "Kontakt" (řádky 133-161 aktuálně), přidat nový řádek pod Telegram:

```tsx
{/* Deep-link pro propojení */}
{client.deepLinkToken && !client.telegramId && (
  <div className="cd-info-row">
    <span className="cd-info-label">Deep-link</span>
    <span className="cd-info-value cd-deeplink">
      t.me/studioflow3_bot?start=LG_{client.deepLinkToken}
    </span>
  </div>
)}
```

**Logika zobrazení:**
- Zobrazit deep-link **pouze pokud** klient má `deep_link_token` ale NEMÁ `telegram_id` (= ještě nepropojený)
- Pokud klient UŽ MÁ `telegram_id` → zobrazit jen "TG: propojeno ✅" (už zobrazuje telegram_id)
- Operátorka může tento odkaz zkopírovat a poslat klientovi přes WhatsApp/SMS

**CSS styl pro deep-link:**
```css
.cd-deeplink {
  font-size: 11px;
  font-family: monospace;
  word-break: break-all;
  color: #229ED9;
  cursor: pointer;
  user-select: all;
}
```

### B5. Úprava client-queries.ts

`getClientDetail()` musí vracet nové pole `deepLinkToken`. Přidat do SELECT:
```sql
bc.deep_link_token
```

A do mapování výsledku:
```ts
deepLinkToken: r.deep_link_token ? String(r.deep_link_token) : null,
```

---

## ČÁST C: Pořadí implementace

```
1. DB migrace (deep_link_token sloupec + index)     — lib/db.ts
2. Import skript                                      — scripts/import-contacts.ts
3. Client queries update (deep_link_token)            — lib/client-queries.ts
4. Admin karta UI (deep-link zobrazení)               — app/booking/clients/[id]/page.tsx
5. Bot /start LG_ handler                            — lib/telegram-bot.ts
6. Test: spustit import s --dry-run
7. Test: spustit import na produkci
8. Test: poslat deep-link přes TG, ověřit propojení
```

---

## ČÁST D: Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `lib/db.ts` | Přidat ALTER TABLE + CREATE INDEX pro deep_link_token |
| `scripts/import-contacts.ts` | **NOVÝ** — celý import skript |
| `lib/telegram-bot.ts` | Intercept `/start LG_*` před AI handlerem |
| `lib/client-queries.ts` | Přidat deep_link_token do getClientDetail SELECT |
| `app/booking/clients/[id]/page.tsx` | Zobrazit deep-link URL v kontakt sekci |

---

## ČÁST E: Rizika a poznámky

1. **Turso rate limits** — 6349 INSERTs. Batchovat po 100, nebo použít `db.batch()` pokud libSQL client podporuje.
2. **Šifrování vyžaduje env vars** — skript musí mít přístup k `BOOKING_ENCRYPTION_KEY` a `BOOKING_HMAC_SECRET`. Načítat z `.env.local`.
3. **CSV parsování** — Google Contacts CSV může mít quoted fields s čárkami uvnitř (viz řádek `1704,"""KYLIE"`). Použít robustní parser nebo csv-parse knihovnu.
4. **Duplikáty v CSV** — Pokud dvě řádky mají stejný telefon, importovat jen první a druhý zalogovat jako skip.
5. **`NE` false positives** — Jméno `NEL` nebo `NELSON` by nemělo matchovat. Regex musí být `\bNE\b` nebo na konci stringu `\sNE$|NE$` na celém First Name.
6. **Telegram bot name** — deep-link URL používá `studioflow3_bot` (dle TASK-020 kontextu). Ověřit aktuální bot username před deploy.
7. **Idempotence** — pokud skript běží dvakrát, duplikáty se odchytí přes phone_hmac check. Řádky bez telefonu ale nemají HMAC → mohou se zduplikovat. Řešení: logovat importované řádky a jejich client_number do log souboru.
