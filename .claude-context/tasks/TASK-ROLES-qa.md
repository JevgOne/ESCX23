# QA Report — Task #6: Manažerský správce + operátorka role systém

**Datum:** 2026-09-15  
**Kontrolor:** kontrolor  
**Soubory:** `lib/auth.ts`, `lib/user-actions.ts`, `app/booking/users/page.tsx`, `app/booking/users/[id]/page.tsx`, `lib/telegram-ai/tools.ts`, `lib/telegram-ai/tool-handlers.ts`, `lib/telegram-ai/system-prompt.ts`, `components/booking/BookingSidebar.tsx`, `app/booking/layout.tsx`, `lib/db.ts`

---

## 1. Simplify — kvalita kódu

**PASS** — Kód je přehledný, bez zbytečné komplexity.

Poznámky:
- `VALID_ROLES` whitelist v `user-actions.ts` — čistý pattern, snadno rozšiřitelný.
- `handleSubmit` jako inline server action ve stránce (Next.js 15+ pattern) — OK pro jednoduchou formu.
- Eskalace notifikuje VŠECHNY dostupné operatory/managery/adminy s telegram_chat_id — iterace přes výsledky s per-item catch — správně, chyba u jednoho neblokuje ostatní.
- `logAudit` pro eskalaci s `.catch(() => {})` — nezablokuje flow při audit chybě. OK.

---

## 2. Debug a bezpečnost

**PASS s 1 důležitou poznámkou**

### Pozitivní nálezy:
- SQL parametrizace v `user-actions.ts`: dynamické `updates.join(', ')` s `args` polem — parametrizované, bez SQL injection rizika.
- `requireBookingAdmin()` voláno na začátku obou server actions (`updateUser`, `createUser`) — auth check před jakoukoliv DB operací.
- `requireBookingAdmin()` v `app/booking/users/page.tsx` i `[id]/page.tsx` — stránky chráněny.
- Duplicate email check při vytváření uživatele (case-insensitive přes `email.trim().toLowerCase()`).
- Heslo minimálně 6 znaků, hashováno přes `bcrypt` (salt rounds=12 dle `lib/auth.ts`).
- `telegram_chat_id` migrace v `db.ts` — idempotentní `ALTER TABLE ... ADD COLUMN` s catch — OK.

### Bezpečnostní poznámka — hidden input role bypass:
V `[id]/page.tsx` řádek 130–132: pro `isSelf` je `<select name="role">` disabled a přidán `<input type="hidden" name="role" value={user.role}>`. Disabled select se nepošle v FormData, hidden input posílá `user.role`.

**Problém:** Pokud by útočník (admin editující sám sebe) odstranil `disabled` ze selectu v DevTools, form by odeslal dvě hodnoty `role` — `user.role` (hidden) i novou roli (select). Chování závisí na tom, co Next.js Server Action vybere z duplicitních klíčů.

**Ale:** Server-side ochrana v `updateUser` (řádek 24):
```
if (currentUser.id === userId && data.role && data.role !== 'admin') {
  return { error: 'Nemuzes zmenit svoji vlastni roli.' }
```
Tato ochrana je robustní — i kdyby frontend bypass fungoval, server odmítne změnu. **Bezpečnostní riziko je tedy zmírněno server-side ochranou.** Frontend je jen UX vrstva.

**Drobná slabina:** Podmínka je `data.role !== 'admin'` — admin si technicky může "změnit" roli na `admin` (no-op), ale ne na nižší. Manager si ale nemůže zvýšit roli, protože `requireBookingAdmin()` pouští jen admin/manager a manager→admin by prošel podmínkou (role není `!== 'admin'` ale je `'admin'`). Riziko: manager si může nastavit roli `admin`?

Ověření: `currentUser.id === userId && data.role && data.role !== 'admin'` → vrátí error jen když je role != 'admin'. Pokud manager edituje SEBE a nastaví roli na 'admin', podmínka NEVYVOLÁ error (protože `data.role === 'admin'`). **Toto je bezpečnostní díra: manager může povýšit sám sebe na admina.**

**Závažnost: STŘEDNÍ** — vyžaduje, aby se manager/admin editoval sám sebe přes URL, ale je to privilege escalation.

---

## 3. Reverzní kontrola — porovnání se zadáním

| Požadavek | Stav | Poznámka |
|-----------|------|----------|
| Manager má plný přístup k booking | PASS | `requireBooking()` a `requireBookingAdmin()` přijímají manager roli |
| Manager vidí admin menu items | PASS | `isAdmin = role === 'admin' \|\| role === 'manager'` v BookingSidebar |
| Manager badge v topbaru | PASS | `layout.tsx` — 'Manažerka' label, fialová barva |
| Operátorka dostává TG notifikaci | PASS | `escalateToOperator` tool notifikuje operators/managers/admins s telegram_chat_id |
| Bot eskaluje když neví odpověď | PASS | system-prompt pravidlo: "Pokud NEVIS odpoved → pouzij escalateToOperator" |
| User management stránka | PASS | `/booking/users` existuje, chráněna `requireBookingAdmin()` |
| User edit stránka | PASS | `/booking/users/[id]` existuje, chráněna |
| Nelze změnit vlastní roli | PASS (s výhradou) | UI zakáže + server check — ale manager→admin bypass možný (viz výše) |
| Nelze deaktivovat sebe | PASS | server check v `updateUser` + disabled checkbox v UI |
| SQL parametrizace | PASS | všechny queries parametrizované |
| Auth checks | PASS | `requireBookingAdmin()` na obou serverových vstupech |
| `telegram_chat_id` migrace | PASS | idempotentní ALTER TABLE v `db.ts` |
| Audit log eskalace | PASS | `bot.escalate` action v audit logu |

---

## Verdikt

**APPROVED s opravou doporučenou**

Systém je funkční a splňuje zadání. Bezpečnostní díra: manager si může povýšit sám sebe na admina přes edit stránku (podmínka `data.role !== 'admin'` ignoruje případ manager→admin).

**Doporučená oprava v `lib/user-actions.ts` řádek 24:**
```ts
// Stávající (chybné):
if (currentUser.id === userId && data.role && data.role !== 'admin') {

// Správně:
if (currentUser.id === userId && data.role !== undefined) {
  return { error: 'Nemuzes zmenit svoji vlastni roli.' };
}
```
Nebo alternativně: manager nesmí editovat vlastní roli vůbec (ani no-op na stejnou hodnotu). Tato oprava by měla být provedena před nasazením do produkce.
