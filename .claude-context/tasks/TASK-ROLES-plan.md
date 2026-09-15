# TASK #6: Manažerský správce + operátorka role systém

## Status: PLÁN HOTOVÝ — čeká na implementaci

## Analýza

### Aktuální role systém

#### DB tabulka `users`
```sql
role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'operator', 'girl'))
```
4 role existují v DB, ale ne všechny jsou plně implementované.

#### Auth funkce (`lib/auth.ts`)

| Funkce | Povolené role | Použití |
|--------|--------------|---------|
| `requireAdmin()` | admin, manager | Admin panel (`/admin/*`) |
| `requireFullAdmin()` | admin only | CMS, pricing, settings |
| `requireBooking()` | admin, operator | Booking systém (`/booking/*`) |
| `requireBookingAdmin()` | admin only | Admin-only booking pages |
| `requireGirl()` | girl only | Studio PWA (`/studio/*`) |

#### Klíčové zjištění
1. **Manager** má přístup do admin panelu ale NE do booking systému
2. **Operator** má přístup do booking systému ale NE do admin panelu  
3. **Admin** má přístup všude
4. `requireBooking()` (řádek 217): `user.role !== 'admin' && user.role !== 'operator'` — **manager je vyloučen!**

#### Booking layout (`app/booking/layout.tsx` řádek 111)
```ts
const roleLabel = user.role === 'admin' ? 'Admin' : 'Operátorka';
```
Jen 2 labely — manager by zobrazil "Operátorka" (fallback).

#### Sidebar (`components/booking/BookingSidebar.tsx`)
```ts
const isAdmin = role === 'admin';
```
Sekce "Správa" a "Systém" jsou `adminOnly: true` — operator/manager je nevidí.

#### Admin sidebar (`components/admin/AdminSidebar.tsx`)
Používá `managerCanSee: true/false` pro granulární přístup.

### Co task požaduje
1. **Manager = plný přístup** — vidí vše co admin (nebo skoro vše)
2. **Operátorka = dostává notifikace z bota** — když TG bot vytvoří booking, operátorka je notifikována

### Současný notifikační systém
- `admin_notifications` tabulka — globální notifikace pro admin panel
- `girl_notifications` tabulka — notifikace pro dívky (studio PWA)
- **Chybí:** notifikace specificky pro operátorku v booking systému
- TG bot (`lib/telegram-bot.ts`) deleguje na AI operátora, ale neposílá notifikace do booking panelu

## Plán implementace

### Část A: Manager přístup do booking systému

#### Krok 1: Upravit `requireBooking()` v `lib/auth.ts`
Řádek 217 — přidat `manager`:
```ts
// PŘED:
if (user.role !== 'admin' && user.role !== 'operator') {
// PO:
if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'operator') {
```

#### Krok 2: Upravit booking layout role label
`app/booking/layout.tsx` řádek 111:
```ts
// PŘED:
const roleLabel = user.role === 'admin' ? 'Admin' : 'Operátorka';
// PO:
const roleLabel = user.role === 'admin' ? 'Admin' 
  : user.role === 'manager' ? 'Správce' 
  : 'Operátorka';
```

#### Krok 3: Přidat manager CSS styl do topbar
`app/booking/layout.tsx` — přidat do SHELL_STYLES:
```css
.sf-topbar-role.manager { background: rgba(251,191,36,0.2); color: var(--yellow); }
```

#### Krok 4: Upravit sidebar pro manager
`components/booking/BookingSidebar.tsx` řádek 169:
```ts
// PŘED:
const isAdmin = role === 'admin';
// PO:
const isAdmin = role === 'admin' || role === 'manager';
```
Manager vidí stejné sekce jako admin (Správa, Systém).

### Část B: Operátorka notifikace z bota

#### Krok 1: Vytvořit booking notification systém
Rozšířit existující `admin_notifications` tabulku NEBO vytvořit nový systém v booking:

**Varianta 1 (jednodušší):** Přidat sloupec `target_role` do `admin_notifications`:
```sql
ALTER TABLE admin_notifications ADD COLUMN target_role TEXT DEFAULT 'admin';
-- 'admin' = jen admin, 'booking' = admin + operator, 'all' = všichni
```

**Varianta 2 (čistší):** Vytvořit `booking_notifications` tabulku:
```sql
CREATE TABLE IF NOT EXISTS booking_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'new_booking', 'booking_cancelled', 'no_show', 'bot_booking'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id INTEGER,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings_v2(id)
);
```

**Doporučení:** Varianta 2 — oddělený systém pro booking, nezávislý na admin panelu.

#### Krok 2: Přidat notifikaci při bot bookingu
V `lib/telegram-ai/booking-flow.ts` — po úspěšném vytvoření bookingu přidat:
```ts
import { createBookingNotification } from '@/lib/booking-notifications';

// Po INSERT do bookings_v2:
await createBookingNotification({
  type: 'bot_booking',
  title: `Nová TG rezervace: ${girlName}`,
  message: `${clientNick} — ${date} ${startTime}-${endTime} (${duration} min)`,
  bookingId: newBookingId,
  link: `/booking/calendar?view=day&date=${date}&detail=${newBookingId}`,
});
```

#### Krok 3: Zobrazit notifikace v booking UI
Přidat notifikační badge do booking topbar/sidebar:
- Červený badge s počtem nepřečtených notifikací
- Dropdown nebo stránka `/booking/notifications` se seznamem

### Část C: Operátorka real-time notifikace (budoucí enhancement)
Pro okamžité notifikace při nové TG rezervaci:
- Server-Sent Events (SSE) nebo polling
- Zvukový alert v booking panelu
- **Toto je enhancement — ne MVP**

## Soubory k editovat

### Část A (Manager přístup):
1. `lib/auth.ts` řádek 217 — přidat `manager` do `requireBooking()`
2. `app/booking/layout.tsx` řádek 111 — přidat manager label + CSS
3. `components/booking/BookingSidebar.tsx` řádek 169 — manager = admin visibility

### Část B (Notifikace):
1. `lib/db.ts` — přidat `booking_notifications` tabulku do migrací
2. `lib/booking-notifications.ts` — NOVÝ soubor (CRUD pro notifikace)
3. `lib/telegram-ai/booking-flow.ts` — přidat notifikaci po bot bookingu
4. `app/booking/layout.tsx` — přidat notifikační badge do topbar
5. Volitelně: `app/booking/notifications/page.tsx` — stránka s notifikacemi

## Priorita implementace
1. **Část A** (Manager přístup) — malá změna, 3 soubory, rychlé
2. **Část B** (Notifikace) — střední, nová tabulka + UI, ~5 souborů
3. **Část C** (Real-time) — enhancement, odložit

## Bezpečnostní poznámky
- Manager NEMÁ mít přístup k `requireBookingAdmin()` stránkám (audit log, users management)
- `requireBookingAdmin()` kontroluje `user.role !== 'admin'` — manager bude korektně vyloučen
- Operator nesmí vidět admin-only booking stránky — to je zajištěno
