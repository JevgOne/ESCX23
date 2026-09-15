# Plán: Rezervace pro nové klienty

**Status:** PLAN READY  
**Autor:** Plánovač  
**Datum:** 2026-09-15

---

## 1. Analýza aktuálního stavu

### Co se děje když neznámý uživatel napíše botu

1. `handleUpdate()` v `telegram-bot.ts` (řádek 41) → volá `handleAIMessage(chatId, username, text)`
2. `handleAIMessage()` v `handler.ts` (řádek 164) → `buildClientContext(chatId, username)`
3. `buildClientContext()` v `context.ts` (řádek 27-38) → hledá `booking_clients WHERE telegram_id = ?`
4. Nenajde → vrátí `{ isRegistered: false, clientId: null, ... }`
5. System prompt (řádky 13-17): _"Neregistrovaný klient (jen prohlížení, bez možnosti bookingu) — Naveď ho na kontaktování studia telefonicky"_
6. AI bot odpovídá, ukazuje rozvrhy, posílá fotky — ale **NEMŮŽE** spustit booking flow

### Dvě hard-coded bariéry v `booking-flow.ts` (řádky 67-72)

```ts
if (!ctx.isRegistered || !ctx.clientId) {
  throw new Error('Pro rezervaci musis byt registrovany klient.');
}
if (ctx.totalVisits < 3) {
  throw new Error('Rezervace pres bota je dostupna od 3 navstev. Zavolej nam pro objednani.');
}
```

**Bariéra 1:** `isRegistered === false` → nový klient nemá záznam v `booking_clients`  
**Bariéra 2:** `totalVisits < 3` → i kdyby měl záznam, musí mít 3+ návštěvy

### Operátorčin workflow pro nového klienta (aktuálně)

1. Klient volá → operátorka otevře `/booking/quick`
2. Hledá klienta → nenajde → klikne "Nový klient"
3. Zadá nickname → systém vytvoří záznam přes `createClient()` (`booking-actions.ts:333`)
4. Vybere dívku, čas, délku → potvrdí → booking vytvořen
5. Problém: Nový klient nemá v systému telefon ani Telegram propojení

---

## 2. Doporučené řešení: Auto-registrace přes bota

### Proč NE webový formulář

- Přidává novou veřejnou stránku = nový attack surface
- Klient musí opustit Telegram → klik na link → vyplnit formulář → vrátit se
- Zbytečná komplexita — bot UŽ má všechny nástroje (rozvrh, fotky, booking flow)
- Telegram chat je přirozené prostředí, klient tam zůstane

### Proč NE odkaz na formulář od bota

- Stejný problém jako výše, jen s extra krokem
- Klienti na mobilu nechcou přepínat mezi Telegram a prohlížečem

### Doporučení: Bot automaticky vytvoří `booking_clients` záznam

Když neznámý uživatel projeví zájem o booking, bot:
1. Vytvoří nový záznam v `booking_clients` s `source: 'telegram'`, `telegram_id: chatId`
2. Nastaví `trust_level: 'new'`, `total_visits: 0`
3. Spustí booking flow — ale s **požadavkem na potvrzení operátorkou** (nový status `pending_approval`)

---

## 3. Detailní návrh

### 3.1 Nový AI nástroj: `registerNewClient`

**Soubor:** `lib/telegram-ai/tools.ts` — přidat nový tool:

```ts
{
  name: 'registerNewClient',
  description:
    'Registruje nového klienta který chce poprvé rezervovat. ' +
    'Pouzij POUZE kdyz klient AKTIVNE chce bookovat a neni registrovany. ' +
    'Automaticky propoji jeho Telegram s novou klientskou kartou.',
  input_schema: {
    type: 'object',
    properties: {
      nickname: {
        type: 'string',
        description: 'Jmeno/prezdivka klienta (ptat se nebo pouzit Telegram display name)',
      },
    },
    required: ['nickname'],
  },
}
```

### 3.2 Tool handler: `handleRegisterNewClient`

**Soubor:** `lib/telegram-ai/tool-handlers.ts`

```ts
async function handleRegisterNewClient(
  input: Record<string, unknown>,
  ctx: ClientContext,
): Promise<string> {
  // Guard: already registered
  if (ctx.isRegistered) {
    return JSON.stringify({ error: 'Klient je uz registrovany.', clientId: ctx.clientId });
  }

  const nickname = String(input.nickname || 'Klient').trim();

  // Generate client number (LG-XXXX format)
  const maxRes = await db.execute(
    "SELECT MAX(CAST(REPLACE(client_number, 'LG-', '') AS INTEGER)) AS mx FROM booking_clients WHERE client_number LIKE 'LG-%'"
  );
  const maxNum = Number(maxRes.rows[0]?.mx ?? 0);
  const clientNumber = `LG-${String(maxNum + 1).padStart(4, '0')}`;

  // Generate deep_link_token
  const crypto = await import('crypto');
  const deepLinkToken = crypto.randomBytes(8).toString('hex');

  // Create client record
  const result = await db.execute({
    sql: `INSERT INTO booking_clients
            (client_number, nickname, telegram_id, source, trust_level,
             total_visits, deep_link_token, created_at, updated_at)
          VALUES (?, ?, ?, 'telegram', 'new', 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [clientNumber, nickname, ctx.chatId, deepLinkToken],
  });

  const clientId = Number(result.lastInsertRowid);

  // Also create telegram_users record
  await db.execute({
    sql: `INSERT OR IGNORE INTO telegram_users
            (telegram_user_id, client_id, chat_id, is_active, activated_at)
          VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    args: [ctx.chatId, clientId, ctx.chatId],
  });

  // Audit
  logAudit({
    userId: clientId,
    action: 'client.register',
    actorType: 'bot',
    entityType: 'client',
    entityId: clientId,
    details: { source: 'telegram_auto', chatId: ctx.chatId, nickname },
  }).catch(() => {});

  return JSON.stringify({
    success: true,
    clientId,
    clientNumber,
    nickname,
    message: `Klient zaregistrovan jako ${nickname} (${clientNumber}). Nyni muzes pouzit startBookingFlow.`,
  });
}
```

### 3.3 Úprava booking-flow.ts — odstranit bariéru `totalVisits < 3`

**Soubor:** `lib/telegram-ai/booking-flow.ts` (řádky 67-72)

**Aktuální kód:**
```ts
if (!ctx.isRegistered || !ctx.clientId) {
  throw new Error('Pro rezervaci musis byt registrovany klient.');
}
if (ctx.totalVisits < 3) {
  throw new Error('Rezervace pres bota je dostupna od 3 navstev. Zavolej nam pro objednani.');
}
```

**Nový kód:**
```ts
if (!ctx.isRegistered || !ctx.clientId) {
  throw new Error('Pro rezervaci musis byt registrovany klient. Rekni mi sve jmeno a zaregistruji te.');
}
// totalVisits check removed — new clients can book via bot
// (new bookings get status 'pending' requiring operator confirmation)
```

### 3.4 Nový klient = booking se statusem `pending` (ne `confirmed`)

**Soubor:** `lib/telegram-ai/booking-flow.ts`, funkce `handleConfirm()` (řádek 241)

Aktuálně se booking vytvoří se `status = 'confirmed'`. Pro nového klienta (trust_level = 'new', total_visits = 0) nastavit `status = 'pending'`.

**Změna v handleConfirm() (~řádek 292):**
```ts
// Determine booking status based on client trust
const clientRes = await db.execute({
  sql: 'SELECT trust_level, total_visits FROM booking_clients WHERE id = ? LIMIT 1',
  args: [draft.clientId],
});
const trustLevel = clientRes.rows[0] ? String(clientRes.rows[0].trust_level) : 'new';
const visits = clientRes.rows[0] ? Number(clientRes.rows[0].total_visits) : 0;

// New clients (0 visits) → pending, needs operator confirmation
// Regular/VIP clients → auto-confirmed
const bookingStatus = (visits === 0 || trustLevel === 'new') ? 'pending' : 'confirmed';
```

A v INSERT query změnit `'confirmed'` na `bookingStatus`.

**Proč `pending` a ne `confirmed`:**
- Nový klient = neznámý = riziko no-show
- Operátorka vidí pending booking v kalendáři → může potvrdit nebo zavolat klientovi
- Stálí klienti (3+ návštěvy, regular/vip trust) → automaticky confirmed jako dosud

### 3.5 Úprava system-prompt.ts — instrukce pro nové klienty

**Soubor:** `lib/telegram-ai/system-prompt.ts`

**Aktuální blok pro neregistrovaného klienta (řádky 13-17):**
```ts
- Neregistrovany klient (jen prohlizeni, bez moznosti bookingu)
- Navedni ho na kontaktovani studia telefonicky pro prvni navstevu
```

**Nový blok:**
```ts
- NOVY klient (neni v databazi)
- MUZE bookovat — ale nejdriv ho zaregistruj pomoci registerNewClient
- Zeptej se na jmeno ("Jak ti mam rikat?") a pak zavolej registerNewClient
- Po registraci pokracuj normalne — nabidni divky, spust booking flow
- Rezervace noveho klienta bude cekat na potvrzeni operatorkou
```

**Přidat do pravidel:**
```
- registerNewClient → pouzij PRED startBookingFlow pro neregistrovane klienty
- Po registraci AKTUALIZUJ kontext — klient je nyni registrovany
```

### 3.6 Refresh kontextu po registraci

Po `registerNewClient` se musí aktualizovat `ClientContext` v rámci probíhající konverzace, protože AI bude hned za tím volat `startBookingFlow`.

**Problém:** V aktuální architektuře se `ctx` vytvoří jednou na začátku `handleAIMessage()` a předává se do tool handlerů. Po registraci má ctx stále `isRegistered: false`.

**Řešení:** `handleRegisterNewClient` vrátí `clientId` v JSON odpovědi. AI pak volá `startBookingFlow`, ale ten dostane starý ctx. Je třeba buď:

**Varianta A (jednodušší):** V `handleToolCall` mutovat `ctx` po úspěšné registraci:
```ts
case 'registerNewClient': {
  const result = await handleRegisterNewClient(input, ctx);
  const parsed = JSON.parse(result);
  if (parsed.success) {
    // Mutate ctx so subsequent tools see updated state
    ctx.isRegistered = true;
    ctx.clientId = parsed.clientId;
    ctx.clientNumber = parsed.clientNumber;
    ctx.nickname = parsed.nickname;
    ctx.trustLevel = 'new';
    ctx.totalVisits = 0;
  }
  return result;
}
```

**Varianta B:** Přebudovat context jako objekt s refresh metodou → příliš velký refactoring.

**Doporučení: Varianta A** — jednoduchá mutace kontextu v dispatcheru.

### 3.7 Notifikace operátorce o nové pending rezervaci

Když se vytvoří `pending` booking od nového klienta, poslat notifikaci do admin panelu:

**Soubor:** `lib/telegram-ai/booking-flow.ts`, v `handleConfirm()` po vytvoření bookingu:

```ts
if (bookingStatus === 'pending') {
  // Notify admin panel
  await db.execute({
    sql: `INSERT INTO admin_notifications (type, title, message, link)
          VALUES ('new_booking', 'Nova rezervace k potvrzeni',
                  ?, ?)`,
    args: [
      `Novy klient ${draft.girlName} ${formatDate(draft.date)} ${draft.startTime}`,
      `/booking/calendar?view=day&date=${draft.date}&detail=${bookingId}`,
    ],
  });
}
```

**Klientovi v Telegramu** místo "Rezervace potvrzena!" poslat:
```
📋 Rezervace přijata!

👩 {girlName}
📅 {date}
⏰ {time}
💰 {price} CZK

Vaše rezervace čeká na potvrzení operátorkou.
Ozveme se vám brzy ✅
```

### 3.8 Anti-spam ochrana

**Riziko:** Bot/spammer vytváří desítky falešných klientských záznamů.

**Ochrana (využít stávající infrastrukturu):**

1. **Rate limiting** — už existuje v `rate-limit.ts` (20/min, 100/hod) → dostatečné
2. **Spam check** — `checkSpam()` detekuje 3x stejná zpráva za minutu → OK
3. **Limit registrací per chat_id** — nová podmínka v `handleRegisterNewClient`:
```ts
// Max 1 registration per chat_id
const existing = await db.execute({
  sql: 'SELECT id FROM booking_clients WHERE telegram_id = ? LIMIT 1',
  args: [ctx.chatId],
});
if (existing.rows.length > 0) {
  return JSON.stringify({ error: 'Uz jsi registrovany.' });
}
```
4. **Banned clients** — `ctx.isBanned` check v AI handleru (řádek 166-169) STÁLE funguje, protože banned check je na existujícím záznamu. Nový bot uživatel bez záznamu nemůže být banned. Po registraci se dá banovat normálně přes admin panel.

**Dodatečná ochrana (volitelná, doporučuji pro v2):**
- CAPTCHA-like challenge v botu (např. "Napiš 3+4") před registrací
- Cooldown: max 3 registrace z jedné IP/device za hodinu (vyžaduje trackování, složitější)
- Manual review: operátorka může schválit/zamítnout nového klienta (ale to zpomaluje UX)

**Pro v1 stačí:** 1 registrace per chat_id + stávající rate limiting.

---

## 4. Tok nového klienta (end-to-end)

```
Nový uživatel napíše botu: "Ahoj, chci se objednat k Ellis"
    ↓
AI: "Vitej v LG 😊 Kouknu na Ellis..."  [getGirlProfile + sendGirlPhoto + checkAvailability]
AI: "Ellis pracuje dnes 14:00-22:00. Chces se objednat?"
    ↓
Klient: "Jo, v 18:00"
    ↓
AI rozpozná: neregistrovaný klient chce bookovat
AI: "Super! Jak ti mam rikat?" 
    ↓
Klient: "Pavel"
    ↓
AI → registerNewClient({nickname: "Pavel"}) → booking_clients záznam vytvořen
AI → startBookingFlow({girlId: X, date: "2026-09-15"}) → inline keyboard s časy
    ↓
Klient klikne: 18:00 → 60 min → Potvrdit
    ↓
Booking vytvořen se status: 'pending'
Bot: "Rezervace přijata! Čeká na potvrzení operátorkou."
    ↓
Notifikace v admin panelu: "Nová rezervace k potvrzení"
Operátorka potvrdí → status: 'confirmed'
    ↓
[Volitelně] Bot pošle klientovi: "Vaše rezervace byla potvrzena ✅"
```

---

## 5. Soubory k editaci

| Soubor | Změna |
|--------|-------|
| `lib/telegram-ai/tools.ts` | Přidat `registerNewClient` tool definici |
| `lib/telegram-ai/tool-handlers.ts` | Přidat `handleRegisterNewClient` + context mutace v dispatcheru |
| `lib/telegram-ai/booking-flow.ts` | Odstranit `totalVisits < 3` guard; pending status pro nové klienty; jiná potvrzovací zpráva pro pending |
| `lib/telegram-ai/system-prompt.ts` | Nové instrukce pro neregistrované klienty (registrace → booking) |
| `lib/telegram-ai/types.ts` | Beze změn (ClientContext je dostatečný) |

---

## 6. Co se NEMĚNÍ

- **Operator quick panel** (`/booking/quick`) — funguje nezávisle, operátorka může stále vytvářet klienty ručně
- **Deep-link flow** (task #18) — importovaní klienti používají deep-link, to je jiný vstupní kanál
- **Stávající registrovaní klienti** — žádná změna v chování, auto-confirm jako dosud
- **Rate limiting** — beze změn
- **Encryption** — nový klient nemá telefon → `phone_encrypted = NULL`, `phone_hmac = NULL` (telefon se případně doplní ručně v admin panelu)

---

## 7. Pořadí implementace

```
1. tools.ts — přidat registerNewClient tool definici
2. tool-handlers.ts — handler + context mutace v dispatcheru
3. booking-flow.ts — odstranit visits guard + pending logic
4. system-prompt.ts — nové instrukce pro AI
5. Test: napsat botu jako nový uživatel, projít celý flow
```

---

## 8. Alternativy (zamítnuté)

| Alternativa | Proč NE |
|-------------|---------|
| Webový formulář | Zbytečný nový surface, klient musí opustit TG, komplikace |
| Bot pošle link na formulář | Stejné jako výše + extra krok |
| Jen nasměrovat na telefon | Aktuální stav, uživatel chce změnit |
| Automatická registrace bez ptaní na jméno | Bot potřebuje nickname pro klientskou kartu |
| Registrace + okamžitý confirm | Riziko no-show od neznámých, operátorka nemá kontrolu |
