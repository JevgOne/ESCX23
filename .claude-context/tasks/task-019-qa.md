# TASK-019 QA Report — Hybridní Booking Flow

**Datum:** 2026-09-14  
**Kontrolor:** kontrolor  
**Status: SCHVÁLIT S OPRAVOU**

---

## Výsledek: 1 BUG (kritický), 2 poznámky (nekritické)

---

## 1. SIMPLIFY — komplexnost kódu

**Verdikt: OK s poznámkou**

- Implementátor zvolil jiné umístění souborů než plán (`lib/telegram-ai/booking-flow.ts` místo `lib/telegram-booking/`). Funkčně ekvivalentní, přijatelné.
- `getPragueNow()`, `getPragueToday()`, `addMinutes()` jsou zduplikované mezi `booking-flow.ts` a `tool-handlers.ts`. Komentář v kódu to uznává (`// duplicated to avoid circular deps`). Přijatelné jako pragmatické řešení.
- `getAvailableSlots()` v booking-flow.ts duplicuje logiku z `checkAvailability()` v tool-handlers.ts. Plán s tím počítal. OK.
- Routing je čistý: `bk_*` → `handleBookingCallback()` → příslušný handler. Bez AI.

---

## 2. DEBUG — errory, warningy, build

**TypeScript:** `npx tsc --noEmit` — čistý (nulové chyby ve zdrojovém kódu, e2e test chyby nesouvisí s tímto taskem).

### BUG #1 — KRITICKÝ: Expiry 12 HODIN místo 12 MINUT

**Soubor:** `lib/telegram-ai/booking-flow.ts:99`

```typescript
// ŠPATNĚ (aktuální kód):
const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); // 12h expiry

// SPRÁVNĚ (dle plánu, sekce 6):
const expiresAt = new Date(Date.now() + 12 * 60 * 1000).toISOString(); // 12min expiry
```

**Dopad:** Draft nevyprší po 12 minutách ale po 12 hodinách. Sloty jsou zbytečně long blokované, slot_locks nejsou konzistentní s draft TTL. Plán explicitně uvádí `expires_at = datetime('now', '+12 minutes')`.

**Opravit před deploym.**

---

### Poznámka #2 — Nekritická: `AND start_time IS NOT NULL` chybí v tool-handlers.ts

**Soubor:** `lib/telegram-ai/tool-handlers.ts:282-285` (funkce `checkAvailability`)

V `booking-flow.ts:562` je správně `AND start_time IS NOT NULL` při čtení draftů.
V `tool-handlers.ts:282` tento filtr chybí:

```sql
-- tool-handlers.ts (chybí filtr):
SELECT start_time, end_time FROM booking_drafts
WHERE girl_id = ? AND date = ? AND is_converted = 0
  AND expires_at > datetime('now')
-- chybí: AND start_time IS NOT NULL
```

Drafty ve stavu `select_time` (start_time IS NULL) by mohly způsobit NaN v `String(null).split(':')` a přidat `NaN` do occupied setu. Existující kód dělá `String(row.start_time).substring(0, 5).split(':')` — `String(null)` = `"null"`, split dá `['null']`, `Number('null')` = `NaN` — `NaN * 60 + NaN = NaN` → `occupied.add(NaN)`. Prakticky neškodné (NaN v Set), ale potenciálně matoucí. Nepovažuji za blokující.

---

### Poznámka #3 — Nekritická: `points_earned = price`

**Soubor:** `lib/telegram-ai/booking-flow.ts:297`

`points_earned` je nastaveno na stejnou hodnotu jako `price` (cena v Kč). Stejnou logiku používá i starý `createBooking` v tool-handlers.ts:479. Pravděpodobně záměr nebo bude řešeno jindy. Nekritické.

---

## 3. REVERZNÍ KONTROLA — odpovídá implementace zadání?

| Bod plánu | Implementace | Status |
|-----------|--------------|--------|
| AI → startBookingFlow tool | ✅ Přidáno do tools.ts | OK |
| startBookingFlow handler v tool-handlers.ts | ✅ handleStartBookingFlow() | OK |
| Vytvoření booking_drafts záznamu | ✅ INSERT s telegram_chat_id, client_id, girl_id, date, session_id, expires_at, channel | OK |
| Zrušení existujícího draftu při novém | ✅ UPDATE expires_at = now() | OK |
| Validace (registered + 3+ visits) | ✅ Kontrolováno | OK |
| Inline keyboard s časy (max 3/řádek) | ✅ buildTimeSlotKeyboard() | OK |
| Filtrování minulých časů pro dnešek | ✅ currentMin = now + 30min buffer | OK |
| bk_time routing v telegram-bot.ts | ✅ data.startsWith('bk_') → handleBookingCallback | OK |
| bk_dur routing | ✅ | OK |
| bk_ok routing | ✅ | OK |
| bk_cancel routing | ✅ | OK |
| bk_back routing | ✅ handleBack() (private) | OK |
| callbackDataToText vrací null pro bk_* | ✅ handler.ts:123 | OK |
| Ověření chatId ownership v getDraft | ✅ `AND bd.telegram_chat_id = ?` | OK |
| Ověření is_converted = 0 | ✅ | OK |
| Ověření expires_at > now | ✅ | OK |
| Race condition při bk_ok: check + slot_lock | ✅ conflictCheck + INSERT slot_locks | OK |
| Audit log při potvrzení | ✅ logAudit() | OK |
| Lokace v potvrzovací zprávě | ✅ dotaz na girl_schedules + locations | OK |
| system-prompt instrukce pro startBookingFlow | ✅ Přidáno | OK |
| Callback format bk_time:sessionId:HH:MM | ✅ bk_time:{sessionId}:{HH:MM} | OK |
| Parser handleBookingCallback | ✅ string.split(':') | OK |
| Draft expiry: 12 MINUT | ❌ **IMPLEMENTOVÁNO JAKO 12 HODIN** | **BUG** |
| Ceny dle pricing_plans (day/night) | ✅ isNight check + night_price | OK |
| Filtrování délek dle zbývajícího času | ✅ maxAvailable + 15min buffer | OK |
| createBooking zachován jako fallback | ✅ Stále v tools.ts | OK |

**Výsledek reverzní kontroly:** 22/23 bodů OK, 1 kritický bug (expiry).

---

## Závěr

Implementace je funkčně kompletní a architekturálně správná. Všechny klíčové komponenty jsou implementovány dle plánu:
- Routing bk_* callbacks bez AI ✅
- Booking draft lifecycle ✅  
- Inline keyboard UX (časy, délky, potvrzení) ✅
- Race condition ochrana ✅
- Bezpečnostní ověření chatId ownership ✅

**Jediná blokující chyba:** expiry = 12 hodin místo 12 minut (`booking-flow.ts:99`).

**Doporučení:** Opravit Bug #1 a nasadit.
