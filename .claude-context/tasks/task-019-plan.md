# TASK-019: Hybridní Booking Flow — Plán

## Status: PLAN (čeká na schválení)

---

## 1. Cíl

Ušetřit Claude API kredity tím, že **po identifikaci dívky** přepneme z AI konverzace na **strukturované inline keyboard tlačítka**. AI zpracovává maximálně ~6 úvodních zpráv (přirozená konverzace), pak předá řízení booking flow přes callback buttons.

**Aktuální stav:** Celý booking flow (výběr času, délky, potvrzení) jde přes Claude API — každý krok = API call ($$$).

**Cílový stav:** AI → identifikuje dívku → zavolá tool `startBookingFlow` → od teď inline keyboard buttons BEZ Claude API.

---

## 2. Architektura

```
Klient: "Chtěl bych Katy dnes"
    ↓
AI handler (Claude API) — normální konverzace
    ↓ AI tool_use: startBookingFlow(girlId=5, date="2026-09-14")
    ↓
tool-handlers.ts: startBookingFlow()
    ├─ Vytvoří booking_drafts záznam (step='select_time', session_id=uuid)
    ├─ Zamkne slot_lock na 12 min (celý draft TTL)
    └─ Vrátí AI result: "Booking flow started, buttons sent to client"
    ↓
Zároveň pošle Telegram zprávu s inline keyboard:
    "🕐 Katy — volné časy dnes:"
    [10:00] [10:30] [11:00] [11:30] ...
    [❌ Zrušit]
    ↓
Klient klikne [10:30]  →  callback_data = "bk_time:<draftId>:10:30"
    ↓
telegram-bot.ts: handleUpdate()
    ├─ Rozpozná prefix "bk_" → NEPŘEDÁVÁ do AI
    └─ Volá handleBookingCallback() PŘÍMO
    ↓
lib/telegram-booking/handler.ts: handleBookingCallback()
    ├─ Parsuje callback_data
    ├─ Aktualizuje booking_drafts (step, start_time)
    └─ Pošle další krok (inline keyboard s délkami):
        "⏱ Vyber délku programu:"
        [30 min — 2000 Kč] [60 min — 3000 Kč] [90 min — 4500 Kč]
        [⬅ Zpět] [❌ Zrušit]
    ↓
Klient klikne [60 min]  →  callback_data = "bk_dur:<draftId>:60"
    ↓
handleBookingCallback()
    └─ Pošle shrnutí + potvrzení:
        "📋 Shrnutí rezervace:
         👩 Katy
         📅 14.9.2026
         🕐 10:30 — 11:30
         ⏱ 60 min
         💰 3 000 Kč
         📍 Praha 2 — Vinohrady"
        [✅ Potvrdit] [❌ Zrušit]
    ↓
Klient klikne [✅ Potvrdit]  →  callback_data = "bk_ok:<draftId>"
    ↓
handleBookingCallback()
    ├─ Vytvoří bookings_v2 záznam (status='confirmed')
    ├─ Označí draft is_converted=1
    ├─ Uvolní/přepíše slot_lock
    ├─ Audit log
    └─ Pošle potvrzení:
        "✅ Rezervace potvrzena! #1234
         Katy — 14.9.2026, 10:30–11:30 (60 min)
         Adresu obdržíš 1h předem."
```

---

## 3. Soubory k úpravě / vytvoření

### 3.1 Nový soubor: `lib/telegram-booking/handler.ts`

**Hlavní handler pro booking callback buttons.** Žádné Claude API volání.

```typescript
// Exporty:
export async function handleBookingCallback(
  chatId: string,
  username: string | null,
  draftId: number,
  action: string,   // 'time' | 'dur' | 'ok' | 'cancel' | 'back'
  value: string,     // '10:30' | '60' | '' 
): Promise<void>

// Interní funkce:
async function sendTimeSelection(chatId: string, draft: BookingDraft): Promise<void>
async function sendDurationSelection(chatId: string, draft: BookingDraft): Promise<void>
async function sendConfirmation(chatId: string, draft: BookingDraft): Promise<void>
async function confirmBooking(chatId: string, draft: BookingDraft, ctx: ClientContext): Promise<void>
async function cancelDraft(chatId: string, draftId: number): Promise<void>
```

### 3.2 Nový soubor: `lib/telegram-booking/queries.ts`

**DB queries specifické pro booking draft flow.**

```typescript
export interface BookingDraft {
  id: number;
  clientId: number | null;
  chatId: string;
  girlId: number;
  girlName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  price: number | null;
  location: string | null;
  step: string;   // 'select_time' | 'select_duration' | 'confirm'
  sessionId: string;
  expiresAt: string;
}

export async function getDraft(draftId: number): Promise<BookingDraft | null>
export async function updateDraftStep(draftId: number, step: string, fields: Partial<BookingDraft>): Promise<void>
export async function getFreeSlotsForDraft(draft: BookingDraft): Promise<string[]>
export async function getPricingForDuration(duration: number, startHour: number): Promise<number>
export async function convertDraftToBooking(draft: BookingDraft, clientId: number): Promise<number>  // returns bookingId
export async function expireOrCancelDraft(draftId: number): Promise<void>
```

### 3.3 Upravit: `lib/telegram-ai/tools.ts`

**Přidat nový tool `startBookingFlow`:**

```typescript
{
  name: 'startBookingFlow',
  description:
    'Spusti structured booking flow s inline tlacitky. Pouzij jakmile klient potvrdil konkretni divku a datum. Od tohoto bodu se nepouziva AI — klient vybira cas, delku a potvrzuje pres tlacitka.',
  input_schema: {
    type: 'object',
    properties: {
      girlId: { type: 'integer', description: 'ID divky' },
      date: { type: 'string', description: 'Datum YYYY-MM-DD' },
    },
    required: ['girlId', 'date'],
  },
}
```

### 3.4 Upravit: `lib/telegram-ai/tool-handlers.ts`

**Přidat handler pro `startBookingFlow`:**

```typescript
case 'startBookingFlow': return await startBookingFlow(input, ctx);
```

**Implementace `startBookingFlow()`:**
1. Ověří ctx.isRegistered a ctx.totalVisits >= 3 (stejné podmínky jako createBooking)
2. Ověří dostupnost dívky pro daný den (volá interně checkAvailability logiku)
3. Vytvoří `booking_drafts` záznam:
   - `telegram_chat_id = ctx.chatId`
   - `client_id = ctx.clientId`
   - `girl_id = girlId`
   - `date = date`
   - `step = 'select_time'`
   - `session_id = crypto.randomUUID()`
   - `expires_at = datetime('now', '+12 minutes')`
   - `channel = 'telegram'`
4. Pošle Telegram zprávu s inline keyboard (volné časy) přímo přes `sendMessage()`
5. Vrátí AI: `{ success: true, message: "Klientovi jsem poslala tlacitka s volnymi casy. Pokracuj odpovedi typu: Vyber si cas ze seznamu 👇" }`

### 3.5 Upravit: `lib/telegram-bot.ts`

**Přidat routing pro booking callbacks PŘED AI handlerem:**

```typescript
// V callback_query sekci:
if (data.startsWith('bk_')) {
  // Booking flow callback — handle WITHOUT AI
  const parsed = parseBookingCallback(data);
  if (parsed && chatId) {
    await handleBookingCallback(chatId, username, parsed.draftId, parsed.action, parsed.value);
  }
  return { type: 'booking_callback', from: displayName, text: data, response: 'done' };
}
// Else → existing AI callback handler
```

### 3.6 Upravit: `lib/telegram-ai/handler.ts`

**V `callbackDataToText()`** přidat:

```typescript
// Booking flow callbacks — handled directly, not via AI
if (data.startsWith('bk_')) return null;
```

Tím zajistíme, že i kdyby se `bk_*` callback dostal do AI handleru, vrátí null a neprojde.

### 3.7 Upravit: `lib/telegram-ai/system-prompt.ts`

**Přidat do systémového promptu instrukce pro nový tool:**

```
## Booking flow
- Když klient jasně řekne kterou dívku chce a na jaký den → zavolej startBookingFlow
- Nemusíš se ptát na přesný čas ani délku — to si klient vybere přes tlačítka
- Po zavolání startBookingFlow odpověz krátce: "Super, vyber si čas 👇"
- NEPOKRAČUJ v konverzaci o bookingu po startBookingFlow — tlačítka to řeší
- Pokud klient nespecifikuje den, zeptej se. Default = dnes.
- startBookingFlow smaš volat POUZE pro registrované klienty s 3+ návštěvami
```

---

## 4. Callback Data Format

```
bk_time:<draftId>:<HH:MM>     — výběr času (např. bk_time:42:10:30)
bk_dur:<draftId>:<minutes>     — výběr délky (např. bk_dur:42:60)
bk_ok:<draftId>                — potvrzení
bk_cancel:<draftId>            — zrušení
bk_back:<draftId>              — krok zpět
```

**Parser funkce** (v `lib/telegram-booking/handler.ts`):

```typescript
function parseBookingCallback(data: string): { draftId: number; action: string; value: string } | null {
  const match = data.match(/^bk_(time|dur|ok|cancel|back):(\d+)(?::(.+))?$/);
  if (!match) return null;
  return { action: match[1], draftId: Number(match[2]), value: match[3] ?? '' };
}
```

---

## 5. Inline Keyboard Layouts

### 5.1 Krok 1: Výběr času

```
🕐 <b>Katy</b> — volné časy na 14.9.:

[10:00] [10:30] [11:00]
[11:30] [12:00] [12:30]
[13:00] [13:30] [14:00]
[❌ Zrušit]
```

- Max 3 tlačítka na řádek (Telegram UX)
- Filtrovat minulé časy pokud date = dnes
- Pokud žádný volný slot → zpráva "Bohužel žádný volný termín" + nabídka jiného dne

### 5.2 Krok 2: Výběr délky

```
⏱ <b>Vyber délku programu:</b>

[30 min — 2 000 Kč]
[45 min — 2 200 Kč]
[60 min — 3 000 Kč]
[90 min — 4 500 Kč]
[120 min — 5 500 Kč]
[⬅ Zpět] [❌ Zrušit]
```

- Ceny z `pricing_plans` tabulky (day/night price dle zvoleného času)
- Filtrovat délky, pro které nestačí volné sloty (např. pokud zbývá 45 min do konce směny, nenabídnout 60/90/120)

### 5.3 Krok 3: Shrnutí + potvrzení

```
📋 <b>Shrnutí rezervace:</b>

👩 Katy
📅 14.9.2026
🕐 10:30 — 11:30
⏱ 60 min
💰 3 000 Kč
📍 Praha 2 — Vinohrady

[✅ Potvrdit] [❌ Zrušit]
```

### 5.4 Krok 4: Potvrzení

```
✅ <b>Rezervace potvrzena!</b> #1234

👩 Katy
📅 14.9.2026
🕐 10:30 — 11:30 (60 min)
💰 3 000 Kč

Adresu obdržíš 1 hodinu předem 📍
```

---

## 6. Draft Lifecycle & Expiry

1. **Vytvoření:** `startBookingFlow` → `booking_drafts` s `expires_at = now + 12 min`
2. **Každý krok:** aktualizuje `step` a relevantní pole, **NEresetuje** expires_at
3. **Potvrzení:** `bk_ok` → konvertuje draft na `bookings_v2`, `is_converted = 1`
4. **Zrušení:** `bk_cancel` → smaže draft, uvolní slot_lock
5. **Expiry:** Pokud klient neklikne 12 min → draft expiruje automaticky
   - `checkAvailability` v tool-handlers.ts UŽ kontroluje `expires_at > datetime('now')` — expirované drafty se automaticky ignorují
   - Nepotřebujeme cron job — stačí filtr při čtení

**Bezpečnost:** Před každou akcí ověřit:
- `draft.telegram_chat_id === chatId` (nemůže jiný uživatel manipulovat cizí draft)
- `draft.is_converted === 0` (draft ještě nebyl potvrzen)
- `draft.expires_at > now` (draft nevypršel)

---

## 7. Edge Cases

| Situace | Řešení |
|---------|--------|
| Klient klikne na expirovaný draft | Zpráva: "Tento výběr vypršel. Napiš mi znovu a začneme od začátku 😊" |
| Klient má už běžící draft a AI zavolá nový startBookingFlow | Zrušit starý draft, vytvořit nový |
| Klient napíše textovou zprávu uprostřed button flow | AI handler ji normálně zpracuje (draft existuje paralelně) |
| Slot se mezitím obsadí (jiný klient) | Při `bk_ok` znovu ověřit dostupnost; pokud obsazený → "Tento čas byl právě zabrán, vyber jiný" |
| Neregistrovaný/nový klient (< 3 návštěv) | `startBookingFlow` vrátí error → AI sdělí klientovi že musí zavolat |
| Dívka ten den nepracuje | `startBookingFlow` vrátí error → AI nabídne jiný den/dívku |
| Callback data > 64 bytes (TG limit) | Formát `bk_time:42:10:30` = max ~20 bytes — OK |

---

## 8. Existující kód — co se zachová

- **`createBooking` tool** v tools.ts + tool-handlers.ts → **ZACHOVAT** beze změny. AI ho stále může zavolat jako fallback (např. pokud startBookingFlow selže). Ale system prompt ho nebude propagovat.
- **`checkAvailability`** → **ZACHOVAT**. Booking handler ho bude interně volat (nebo reimplementuje logiku).
- **`booking_drafts` tabulka** → **UŽ EXISTUJE** v DB (z migrate-studioflow-booking.sql). Schéma přesně odpovídá potřebám. Klíčové sloupce: `telegram_chat_id`, `girl_id`, `date`, `start_time`, `end_time`, `duration_minutes`, `step`, `session_id`, `expires_at`, `is_converted`.
- **`slot_locks` tabulka** → **UŽ EXISTUJE**. Používá se v checkAvailability.
- **`sendMessage` s replyMarkup** → **UŽ PODPOROVÁNO** v lib/telegram.ts.
- **`answerCallbackQuery`** → **UŽ EXPORTOVÁNO** z lib/telegram.ts.

---

## 9. Implementační pořadí

### Krok 1: Nové soubory
1. `lib/telegram-booking/queries.ts` — DB operace pro drafty
2. `lib/telegram-booking/handler.ts` — callback handler + inline keyboard builder

### Krok 2: Napojení na AI flow
3. Přidat `startBookingFlow` do `tools.ts`
4. Přidat handler do `tool-handlers.ts` (volá queries + posílá keyboard)
5. Aktualizovat `system-prompt.ts` — instrukce kdy volat startBookingFlow

### Krok 3: Routing v hlavním handleru
6. Upravit `telegram-bot.ts` — routing `bk_*` callbacks přímo do booking handleru
7. Upravit `handler.ts` — `callbackDataToText` ignoruje `bk_*`

### Krok 4: Edge cases
8. Draft expiry check v handleru
9. Ověření chatId ownership
10. Zpětný krok (bk_back) — vrátí na předchozí krok

---

## 10. Odhad náročnosti

- **2 nové soubory** (~200 řádků celkem)
- **5 existujících souborů k úpravě** (celkem ~50 řádků změn)
- **0 nových DB tabulek** (booking_drafts + slot_locks už existují)
- **0 migrace** — vše využívá existující schema

---

## 11. Metriky úspěchu

- **Claude API volání na booking:** z ~8-12 (celý flow přes AI) → na ~2-4 (jen úvodní konverzace)
- **Úspora kreditů:** ~70% na booking flow
- **UX:** Rychlejší odezva (tlačítka = okamžitě, bez čekání na AI response)
- **Reliability:** Méně šancí na AI hallucination při bookingu (strukturovaná data místo free-text)
