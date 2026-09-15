# STUDIOFLOW: AI Telegram Operator — architektura a plan

## Status: PLAN (ceka na schvaleni)

---

## 1. Koncept

Nahrazeni manualnich TG bot prikazu (/booking, /moje, /zrusit) plnohodnotnym AI operatorem, ktery:
- Rozumi prirozene reci (cesky, anglicky, nemecky, ukrajinsky)
- Ma osobnost a komunikacni styl
- Cte real-time data z DB (divky, rozvrhy, bookings, klienti)
- Vytvari rezervace pomoci tool_use
- Vede plynulou konverzaci s cilem: **dovest klienta k rezervaci**

**Backbone:** Claude API (tool_use) — model `claude-sonnet-4-6` (rychly, levny, dostacujici pro konverzaci).

---

## 2. Architektura

```
Klient (Telegram)
    ↓ zprava
Telegram API → webhook POST
    ↓
app/api/telegram/route.ts          — prijme update, overeni secret
    ↓
lib/telegram-ai/handler.ts         — hlavni orchestrator:
    │
    ├─ 1. Nacti/vytvor client context (telegram_users → booking_clients)
    ├─ 2. Nacti historii konverzace (telegram_messages, poslednich N)
    ├─ 3. Sestav messages[] pro Claude API:
    │      [system prompt, ...historie, nova zprava]
    ├─ 4. Zavolej Claude API (tool_use enabled)
    ├─ 5. Zpracuj odpoved:
    │      ├─ text → odesli klientovi pres TG
    │      └─ tool_use → proved tool, pridej result, loop zpet na 4
    ├─ 6. Uloz zpravy do telegram_messages
    └─ 7. Rate limit / safety checks
    
lib/telegram-ai/tools.ts           — definice tools pro Claude API
lib/telegram-ai/tool-handlers.ts   — implementace tool funkci (DB queries)
lib/telegram-ai/system-prompt.ts   — system prompt + dynamicky kontext
lib/telegram-ai/context.ts         — client context builder
```

### Request flow (detail)

```
1. Webhook prijme TG update
2. Extrahuj chat_id, user message text
3. Rate limit check (max 20 zprav/min per chat_id)
4. Nacti klienta:
   telegram_users → booking_clients (pokud existuje)
   Pokud neexistuje → omezeny rezim (bez bookingu, jen info)
5. Nacti poslednich 20 zprav z telegram_messages
6. Sestav Claude API request:
   {
     model: "claude-sonnet-4-6",
     max_tokens: 1024,
     system: buildSystemPrompt(clientContext),
     messages: [...historie, { role: "user", content: userMessage }],
     tools: TOOLS_DEFINITION
   }
7. Claude odpovi:
   a) Textova odpoved → sendMessage(chatId, text)
   b) tool_use → proved tool → pridej tool_result → zavolej Claude znovu
   c) Opakuj dokud neni finalni textova odpoved (max 5 tool calls per turn)
8. Uloz vsechny zpravy (user + assistant + tool results) do telegram_messages
9. Odpoved 200 OK
```

---

## 3. System Prompt

```typescript
// lib/telegram-ai/system-prompt.ts

export function buildSystemPrompt(ctx: ClientContext): string {
  return `
Jsi AI operatorka studia LovelyGirls Praha. Jmenujes se Nikola.

## Tvuj cil
Privetive a diskretne pomoci klientovi objednat termin. Nezlob se, bud taktni,
ale vzdy smeruj konverzaci k rezervaci.

## Osobnost
- Prijemna, trochu flirtativni (ne vulgarni)
- Strucna — max 2-3 vety na zpravu (Telegram, ne email)
- Pouzivej emoji umirnene (1-2 na zpravu max)
- Cestina je default, ale rozpoznej jazyk klienta a odpovez stejne
- Kdyz klient napise anglicky → odpovez anglicky
- Kdyz klient napise nemecky → odpovez nemecky

## Pravidla
- NIKDY nezminuj ze jsi AI / bot / umela inteligence
- NIKDY nesdilej presnou adresu — pouze mestskou cast (Praha 2 — Vinohrady)
  Presna adresa se posila 1h pred terminem automaticky
- NIKDY nesdilej telefonni cisla nebo emaily divek
- NIKDY nediskutuj o cenach za sex — pouzivej "program 60 min" atd.
- Pokud klient pise vulgarni/agresivni zpravy → "Omlouvam se, takto nemohu pokracovat."
- Ceny uvadej vzdy v CZK
- Cas vzdy v Europe/Prague timezone

## Rozvrh
- Bot nabizi POUZE aktualny tyden (pondeli 0:00 — nedele 23:59)
- Pokud klient chce dalsi tyden → "Novy rozvrh bude v pondeli v 0:00. Mohu te upozornit."
- Nabidni "sledovani oblibenkyne" pokud divka nepracuje tento tyden

## Kontext klienta
${ctx.isRegistered ? `
- Jmeno: ${ctx.nickname}
- Kod: ${ctx.clientNumber}
- Navstevy: ${ctx.totalVisits}
- Trust level: ${ctx.trustLevel}
- Oblibene divky: ${ctx.favoriteGirls.join(', ') || 'zatim zadne'}
` : `
- Neregistrovany klient (jen prohlizeni, bez moznosti bookingu)
- Navedni ho na kontaktovani studia telefonicky pro prvni navstevu
`}

## Jak pracovat s nastroji
- Pouzivej nastroje k ziskani aktualnich dat — NIKDY si nevymyslej rozvrhy nebo ceny
- Pri hledani divky podle preference pouzij searchGirls
- Pri vytvareni bookingu VZDY over dostupnost pres checkAvailability
- Po vytvoreni bookingu VZDY potvrdi klientovi detaily
- Pokud neco nevychazi (obsazeno, nepracuje), nabidni alternativy

## Format odpovedi
- Kratke zpravy (Telegram styl, max 300 znaku)
- Pouzivej <b>tucne</b> pro dulezite info
- Pouzivej seznam s emoji pro prehlednost
- NIKDY nepouzivej markdown — Telegram pouziva HTML
`.trim();
}
```

---

## 4. Tools (Claude API tool_use)

```typescript
// lib/telegram-ai/tools.ts

export const TOOLS: Tool[] = [
  {
    name: "getAvailableGirls",
    description: "Vrátí seznam dívek které pracují v daný den (nebo dnes). Včetně směny (od-do) a lokace.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Datum ve formátu YYYY-MM-DD. Pokud neuvedeno, použije se dnešek."
        }
      },
      required: []
    }
  },
  {
    name: "getGirlProfile",
    description: "Kompletní profil dívky — jméno, věk, výška, váha, vlasy, oči, národnost, jazyky, služby, popis, hodnocení.",
    input_schema: {
      type: "object",
      properties: {
        girlId: { type: "integer", description: "ID dívky" },
        girlName: { type: "string", description: "Jméno dívky (case-insensitive match)" }
      },
      required: []
    }
  },
  {
    name: "searchGirls",
    description: "Hledání dívek podle preferencí klienta. Vrátí seřazený seznam nejlepších shod.",
    input_schema: {
      type: "object",
      properties: {
        hairColor: { type: "string", description: "Barva vlasů: blond, bruneta, zrzka, černovláska" },
        language: { type: "string", description: "Jazyk: cs, en, de, uk, ru" },
        ageMin: { type: "integer" },
        ageMax: { type: "integer" },
        services: {
          type: "array",
          items: { type: "string" },
          description: "Požadované služby (slug z tabulky services)"
        },
        availableDate: {
          type: "string",
          description: "Datum kdy musí být dostupná (YYYY-MM-DD)"
        }
      },
      required: []
    }
  },
  {
    name: "checkAvailability",
    description: "Zkontroluje volné časové sloty dívky pro daný den. Vrátí seznam volných 30min bloků.",
    input_schema: {
      type: "object",
      properties: {
        girlId: { type: "integer", description: "ID dívky" },
        date: { type: "string", description: "Datum YYYY-MM-DD" }
      },
      required: ["girlId", "date"]
    }
  },
  {
    name: "getWeekSchedule",
    description: "Rozvrh dívky na celý aktuální týden (Po-Ne). Pro každý den: pracuje/nepracuje, od-do.",
    input_schema: {
      type: "object",
      properties: {
        girlId: { type: "integer", description: "ID dívky" }
      },
      required: ["girlId"]
    }
  },
  {
    name: "getPricing",
    description: "Ceník programů (30/45/60/90/120 min) včetně denní a noční ceny.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "createBooking",
    description: "Vytvoří potvrzenou rezervaci. POUZE pro registrované klienty s 3+ návštěvami. Auto-confirmed (přeskočí PENDING).",
    input_schema: {
      type: "object",
      properties: {
        girlId: { type: "integer", description: "ID dívky" },
        date: { type: "string", description: "Datum YYYY-MM-DD" },
        startTime: { type: "string", description: "Čas začátku HH:MM" },
        durationMinutes: { type: "integer", description: "Délka v minutách: 30, 45, 60, 90, nebo 120" }
      },
      required: ["girlId", "date", "startTime", "durationMinutes"]
    }
  },
  {
    name: "getClientBookings",
    description: "Aktivní a nadcházející rezervace klienta.",
    input_schema: {
      type: "object",
      properties: {
        includeHistory: {
          type: "boolean",
          description: "Zahrnout i dokončené/zrušené (posledních 10)"
        }
      },
      required: []
    }
  },
  {
    name: "cancelBooking",
    description: "Zruší existující rezervaci klienta. Jen CONFIRMED nebo PENDING bookings.",
    input_schema: {
      type: "object",
      properties: {
        bookingId: { type: "integer", description: "ID rezervace" }
      },
      required: ["bookingId"]
    }
  },
  {
    name: "subscribeToGirl",
    description: "Přihlásí klienta k notifikaci když dívka bude v novém rozvrhu (pondělí 0:05).",
    input_schema: {
      type: "object",
      properties: {
        girlId: { type: "integer", description: "ID dívky k sledování" }
      },
      required: ["girlId"]
    }
  }
];
```

---

## 5. Tool Handlers (DB queries)

```typescript
// lib/telegram-ai/tool-handlers.ts

// Kazdy handler vraci string (JSON) ktery se posle zpet do Claude jako tool_result.
// Handler NESMI vracet citlive udaje (adresy, telefony, emaily).

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>,
  ctx: ClientContext
): Promise<string> {
  switch (name) {
    case 'getAvailableGirls': return getAvailableGirls(input);
    case 'getGirlProfile': return getGirlProfile(input);
    case 'searchGirls': return searchGirls(input);
    case 'checkAvailability': return checkAvailability(input);
    case 'getWeekSchedule': return getWeekSchedule(input);
    case 'getPricing': return getPricing();
    case 'createBooking': return createBooking(input, ctx);
    case 'getClientBookings': return getClientBookings(input, ctx);
    case 'cancelBooking': return cancelBooking(input, ctx);
    case 'subscribeToGirl': return subscribeToGirl(input, ctx);
    default: return JSON.stringify({ error: 'Unknown tool' });
  }
}
```

### Klicove DB queries per tool:

**getAvailableGirls(date?)**
```sql
SELECT g.id, g.name, g.age, g.hair, g.nationality,
       gs.start_time, gs.end_time, l.display_name as location
FROM girls g
JOIN girl_schedules gs ON g.id = gs.girl_id
  AND gs.day_of_week = ? AND gs.is_active = 1
LEFT JOIN locations l ON g.location = l.name
WHERE g.status = 'active'
-- Minus schedule_exceptions (volno/zmena)
-- Filtruj jen aktualny tyden (Po-Ne)
ORDER BY g.name;
```

**getGirlProfile(girlId | girlName)**
```sql
SELECT g.id, g.name, g.age, g.height, g.weight, g.bust, g.hair, g.eyes,
       g.nationality, g.languages, g.bio_cs, g.rating, g.reviews_count,
       g.tattoo_description_cs, g.piercing, g.piercing_description_cs
FROM girls g
WHERE g.id = ? OR LOWER(g.name) = LOWER(?)
  AND g.status = 'active';

-- + services
SELECT s.name_cs, s.category
FROM girl_services gs
JOIN services s ON gs.service_id = s.id
WHERE gs.girl_id = ?;

-- NIKDY nevracet: email, phone, address, slug (interni)
```

**searchGirls(preferences)**
```sql
-- Dynamicky WHERE dle preferencí:
SELECT g.id, g.name, g.age, g.hair, g.nationality, g.languages,
       g.rating, g.reviews_count
FROM girls g
WHERE g.status = 'active'
  AND (? IS NULL OR g.hair LIKE ?)           -- hairColor
  AND (? IS NULL OR g.languages LIKE ?)       -- language
  AND (? IS NULL OR g.age >= ?)               -- ageMin
  AND (? IS NULL OR g.age <= ?)               -- ageMax
ORDER BY g.rating DESC, g.reviews_count DESC;

-- + filtr na dostupnost v dany den (JOIN girl_schedules)
-- + filtr na sluzby (JOIN girl_services)
```

**checkAvailability(girlId, date)**
```sql
-- 1. Smena divky v dany den
SELECT start_time, end_time FROM girl_schedules
WHERE girl_id = ? AND day_of_week = ? AND is_active = 1;

-- 2. Schedule exceptions
SELECT * FROM schedule_exceptions
WHERE girl_id = ? AND date = ?;

-- 3. Existujici bookings (obsazene sloty)
SELECT start_time, end_time FROM bookings_v2
WHERE girl_id = ? AND date = ?
  AND status NOT IN ('cancelled_client', 'cancelled_girl', 'declined', 'expired');

-- 4. Aktivni drafty
SELECT start_time, end_time FROM booking_drafts
WHERE girl_id = ? AND date = ? AND is_converted = 0
  AND expires_at > datetime('now');

-- 5. Slot locks
SELECT start_time, end_time FROM slot_locks
WHERE girl_id = ? AND date = ? AND expires_at > datetime('now');

-- Vysledek: seznam volnych 30min bloku (smena minus obsazene)
```

**createBooking(girlId, date, startTime, durationMinutes, ctx)**
```sql
-- Preconditions:
-- 1. ctx.isRegistered == true
-- 2. ctx.totalVisits >= 3 (staly klient)
-- 3. ctx.isBanned == false
-- 4. Slot je volny (checkAvailability)
-- 5. Datum je v aktualnim tydnu

-- Slot lock (race condition prevence)
INSERT INTO slot_locks (girl_id, date, start_time, end_time, locked_by, expires_at)
VALUES (?, ?, ?, ?, 'ai_booking', datetime('now', '+5 minutes'));

-- Vytvor booking (AUTO-CONFIRMED — staly klient pres bota)
INSERT INTO bookings_v2 (
  client_id, girl_id, date, start_time, end_time, duration_minutes,
  price, status, channel, source, created_at
) VALUES (
  ?, ?, ?, ?, ?, ?,
  ?, 'confirmed', 'telegram', 'ai_operator', datetime('now')
);

-- Update slot lock
UPDATE slot_locks SET locked_by = 'booking:' || last_insert_rowid()
WHERE girl_id = ? AND date = ? AND start_time = ?;

-- Audit log
INSERT INTO booking_audit_log (
  booking_id, action, actor_type, entity_type, entity_id, details
) VALUES (?, 'booking.create', 'bot', 'booking', ?, '{"source":"ai_operator"}');

-- Update client stats
UPDATE booking_clients SET total_visits = total_visits + 0 WHERE id = ?;
-- (total_visits se updatuje az pri COMPLETED, ne pri CREATE)

-- Notifikace divce (async)
-- → notifyGirlNewBooking(telegram_links.chat_id, booking)
```

**cancelBooking(bookingId, ctx)**
```sql
-- Overeni: booking patri klientovi
UPDATE bookings_v2
SET status = 'cancelled_client', cancelled_at = datetime('now'), cancel_reason = 'Klient zrusil pres TG bota'
WHERE id = ? AND client_id = ? AND status IN ('confirmed', 'pending');

-- Uvolni slot
DELETE FROM slot_locks WHERE locked_by = 'booking:' || ?;

-- Audit log
INSERT INTO booking_audit_log (booking_id, action, actor_type, details)
VALUES (?, 'booking.cancel', 'bot', '{"reason":"client_cancelled_via_ai"}');

-- Notifikace divce
```

**subscribeToGirl(girlId, ctx)**
```sql
INSERT OR IGNORE INTO schedule_reminders (client_telegram_id, girl_id)
VALUES (?, ?);
-- Cron v Po 0:05 posle notifikaci
```

---

## 6. DB schema zmeny

### Nova tabulka: `telegram_messages`

```sql
CREATE TABLE IF NOT EXISTS telegram_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result')),
  content TEXT NOT NULL,               -- text zpravy nebo JSON (pro tool_use/tool_result)
  tool_name TEXT,                      -- nazev toolu (jen pro tool_use/tool_result)
  tool_use_id TEXT,                    -- Claude tool_use ID (pro parovani s tool_result)
  tokens_in INTEGER DEFAULT 0,        -- input tokeny (pro cost tracking)
  tokens_out INTEGER DEFAULT 0,       -- output tokeny (pro cost tracking)
  model TEXT,                          -- pouzity model
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tm_chat ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_tm_chat_created ON telegram_messages(chat_id, created_at);
```

### Nova tabulka: `telegram_rate_limits`

```sql
CREATE TABLE IF NOT EXISTS telegram_rate_limits (
  chat_id TEXT NOT NULL,
  window_start DATETIME NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (chat_id, window_start)
);
```

### Migrace v lib/db.ts

Pridat do `runMigrations()`:
```typescript
// telegram_messages — AI konverzacni historie
await client.execute(`
  CREATE TABLE IF NOT EXISTS telegram_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result')),
    content TEXT NOT NULL,
    tool_name TEXT,
    tool_use_id TEXT,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
await client.execute(
  'CREATE INDEX IF NOT EXISTS idx_tm_chat ON telegram_messages(chat_id)'
);
await client.execute(
  'CREATE INDEX IF NOT EXISTS idx_tm_chat_created ON telegram_messages(chat_id, created_at)'
);

// telegram_rate_limits
await client.execute(`
  CREATE TABLE IF NOT EXISTS telegram_rate_limits (
    chat_id TEXT NOT NULL,
    window_start DATETIME NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (chat_id, window_start)
  )
`);
```

---

## 7. Soubory k vytvoreni / prepisu

```
NOVY:
lib/telegram-ai/handler.ts         — hlavni orchestrator (webhook → Claude API → TG response)
lib/telegram-ai/tools.ts           — TOOLS definice pro Claude API
lib/telegram-ai/tool-handlers.ts   — implementace tool funkci (DB queries)
lib/telegram-ai/system-prompt.ts   — buildSystemPrompt(ctx)
lib/telegram-ai/context.ts         — ClientContext builder (z DB)
lib/telegram-ai/rate-limit.ts      — rate limiting + spam detection
lib/telegram-ai/types.ts           — typy (ClientContext, TelegramMessage, atd.)

PREPIS:
lib/telegram-bot.ts                — kompletni nahrazeni: misto pevnych /commands
                                      → deleguje na lib/telegram-ai/handler.ts
                                      Zachovat: TelegramUpdate typ, handleUpdate export

BEZE ZMENY:
lib/telegram.ts                    — low-level API (sendMessage, answerCallbackQuery, atd.) — pouzit
app/api/telegram/route.ts          — webhook endpoint — beze zmeny (uz vola handleUpdate)
scripts/telegram-poll.ts           — polling script — beze zmeny
```

---

## 8. Bezpecnost

### Rate limiting
```
- 20 zprav / 1 minuta per chat_id
- 100 zprav / 1 hodina per chat_id
- Po prekroceni: "Prilis mnoho zprav. Zkus to za par minut."
- Neresetuj na kazde zprave — sliding window
```

### Spam / abuse detection
```
- Vulgarni / agresivni jazyk → Claude to zvladne v system promptu
  ("Omlouvam se, takto nemohu pokracovat")
- Opakujici se zpravy (3x stejna za 1 min) → ignore
- Prilis dlouhe zpravy (>1000 znaku) → orizni na 1000
```

### Max tool calls per turn
```
- Max 5 tool calls per uzivatelska zprava
- Pokud Claude chce vic → finalni odpoved s tim co ma
- Prevence nekonecnych loopu
```

### Max konverzacni delka
```
- Context window: poslednich 20 zprav (= 10 user + 10 assistant)
- Starsi zpravy se neposilaji → Claude nevi o nich
- Cron: DELETE telegram_messages WHERE created_at < datetime('now', '-7 days')
  (historie se uchovava 7 dni, pak se maze)
```

### Data filtering
```
- Tool handlery NIKDY nevraceni:
  - Presne adresy (jen mestska cast)
  - Telefonni cisla divek
  - Email adresy
  - Interni poznamky
  - Cenove marze
  - Data jinych klientu
```

### Neregistrovani klienti
```
- Mohou se ptat na dostupnost, profily, cenik
- NEMOHOU vytvaret/rusit bookings
- AI jim rekne: "Pro rezervaci je potreba se zaregistrovat.
  Zavolej nam na XXX XXX XXX nebo prid na prvni navstevu."
```

---

## 9. Cost estimation

```
Model: claude-sonnet-4-6
Input: ~2000 tokens/turn (system prompt ~800 + historie ~800 + zprava ~400)
Output: ~200 tokens/turn (kratka odpoved)
Tool use: +500 tokens/tool call (1-3 tools per turn)

Prumerna konverzace: 6 zprav = 6 turnu
Per turn: ~2500 input + ~300 output = ~2800 tokens
Per konverzace: ~16800 tokens

Cena (claude-sonnet-4-6):
  Input: $3/M tokens = $0.0075 per konverzace
  Output: $15/M tokens = $0.0027 per konverzace
  Total: ~$0.01 per konverzace = ~0.25 CZK

Pri 50 konverzacich/den = ~12.5 CZK/den = ~375 CZK/mesic

→ Zanedbatelny naklad vs. mzda operatorky
```

---

## 10. Env vars (nove)

```env
# Existujici
TELEGRAM_BOT_TOKEN=              # od @BotFather
TELEGRAM_WEBHOOK_SECRET=         # pro webhook overeni
TELEGRAM_LINK_SECRET=            # pro deep link HMAC

# Nove pro AI operator
ANTHROPIC_API_KEY=               # Claude API key
AI_OPERATOR_MODEL=claude-sonnet-4-6  # model (konfigurovatelny)
AI_OPERATOR_MAX_TOKENS=1024      # max output tokenu
AI_OPERATOR_CONTEXT_SIZE=20      # pocet zprav v kontextu
```

---

## 11. Implementacni poradi

```
1. npm install @anthropic-ai/sdk                    — SDK dependency
2. lib/telegram-ai/types.ts                         — typy
3. lib/telegram-ai/system-prompt.ts                 — system prompt
4. lib/telegram-ai/tools.ts                         — tools definice
5. lib/telegram-ai/context.ts                       — client context builder
6. lib/telegram-ai/rate-limit.ts                    — rate limiting
7. lib/telegram-ai/tool-handlers.ts                 — DB queries per tool
   ─── TESTOVAT: unit testy na tool-handlers (mock DB) ───
8. lib/telegram-ai/handler.ts                       — hlavni orchestrator
   ─── TESTOVAT: integration test (mock Claude API) ───
9. lib/telegram-bot.ts                              — prepis na AI delegaci
10. lib/db.ts                                       — migrace (telegram_messages, rate_limits)
   ─── TESTOVAT: end-to-end pres telegram-poll.ts ───
11. Nasadit + monitor (logovani tokenu, ceny, chyb)
```

---

## 12. Priklad konverzace (end-to-end)

```
KLIENT: Ahoj, kdo dnes pracuje?

  → handler: nacti kontext (Josef, VIP, 6 navstev)
  → Claude API call s tools
  → Claude: tool_use getAvailableGirls({date: "2026-09-14"})
  → handler: proved query → vysledek: [Emily 11-22, Nika 12-20, Caty 14-22]
  → Claude: "Ahoj Josefe! Dnes pracuji:
             • Emily (11:00-22:00)
             • Nika (12:00-20:00)
             • Caty (14:00-22:00)
             Mas zajem o nekoho?"

KLIENT: Emily ma volno v 16?

  → Claude: tool_use checkAvailability({girlId: 5, date: "2026-09-14"})
  → handler: volne sloty [15:30, 16:00, 16:30, 17:00, 18:30, 19:00, ...]
  → Claude: "Ano, Emily ma v 16:00 volno! Na jak dlouho? (30/45/60/90/120 min)"

KLIENT: Hodinka

  → Claude: tool_use createBooking({girlId: 5, date: "2026-09-14",
             startTime: "16:00", durationMinutes: 60})
  → handler: vytvori booking #312, status=confirmed, cena=3000
  → Claude: "✅ Potvrzeno!
             Emily / dnes 16:00-17:00 / 60 min / 3 000 Kč
             Oblast: Praha 2 — Vinohrady
             Adresu ti poslu 1h pred terminem."

KLIENT: Diky!

  → Claude: "Rádo se stalo! Těšíme se na tebe 😊"
```

### Priklad s preferencemi:

```
KLIENT: Mam rad brunetky co mluvi anglicky

  → Claude: tool_use searchGirls({hairColor: "bruneta", language: "en"})
  → handler: [Caty (bruneta, EN+CS, 4.8★), Nina (bruneta, EN+CS+DE, 4.6★)]
  → Claude: "Skvely vkus! Doporucuji:
             • Caty — brunetka, mluvi anglicky, 4.8★ (23 recenzi)
             • Nina — brunetka, mluvi anglicky i nemecky, 4.6★
             Chces se podivat na jejich profil?"

KLIENT: Caty, kdy pracuje?

  → Claude: tool_use getWeekSchedule({girlId: 8})
  → handler: [Po nepracuje, Ut 12-22, St nepracuje, Ct 14-22, Pa 11-20, So nepracuje, Ne nepracuje]
  → Claude: "Caty tento tyden:
             • Ut 16.9. (12:00-22:00)
             • Ct 18.9. (14:00-22:00)
             • Pa 19.9. (11:00-20:00)
             Kdy by se ti hodilo?"
```

### Priklad s neregistrovanym:

```
KLIENT: Ahoj, chci si objednat

  → handler: neregistrovany klient (telegram_users nenalezen)
  → Claude: "Ahoj! Rad ti pomuzu s informacemi.
             Pro rezervaci je potreba byt registrovany klient.
             Zavolej nam na telefon nebo prid na prvni navstevu —
             operatorka te zaregistruje a priste si muzes
             objednavat pohodlne tady pres bota 😊"

KLIENT: Ok, kdo dnes pracuje?

  → Claude: tool_use getAvailableGirls({})
  → ... (muze se ptat na info, jen nemuze bookovat)
```
