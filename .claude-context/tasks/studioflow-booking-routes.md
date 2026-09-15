# STUDIOFLOW: /booking + /studio — auth, layout, stranky

## Status: PLAN (ceka na schvaleni)

---

## 1. Auth system

### Existujici stav

Projekt uz ma funkcni auth v `lib/auth.ts`:
- `authenticate(email, password)` — bcryptjs, cte z `users` tabulky
- `setSession(userId, role, remember)` — HMAC-signed cookie token
- `getCurrentUser()` — verifikuje token, vraci `AuthUser { id, email, role, girl_id }`
- `requireAdmin()` — vyzaduje role admin|manager
- `requireGirl()` — vyzaduje role girl
- Session cookie: `escx23_session`, httpOnly, secure, sameSite=lax
- Rate limiting: 5 pokusu / 15 min per IP
- Sliding window: admin/manager — 20 min, girl — 72h

Role v DB: `admin | manager | girl` (CHECK constraint v `users` tabulce).

### Co je treba PRIDAT pro STUDIOFLOW

**a) Nova role `operator`:**
- Rozsirime `AuthUser` typ: `role: 'admin' | 'manager' | 'operator' | 'girl'`
- Pridame `SESSION_MAX_AGE_SECONDS.operator = 20 * 60` (stejne jako manager)
- Validace role v aplikacni vrstve (SQLite neumi ALTER CHECK)
- `operator` = role pro operatorky v booking systemu (nahrazuje puvodni `manager` z webu)

**b) Nove auth helpery v `lib/booking-auth.ts`:**
```typescript
// Server-only, pouziva existujici getCurrentUser()

export async function requireBookingUser(): Promise<BookingAuthUser> {
  // Vyzaduje role IN (admin, operator)
  // Redirect na /booking pokud neni prihlaseny
  // Redirect na /booking pokud role = girl (girl patri na /studio-booking)
}

export async function requireBookingAdmin(): Promise<BookingAuthUser> {
  // Vyzaduje role = admin
  // Redirect na /booking/calendar pokud operator
}

export type BookingAuthUser = {
  id: number;
  email: string;
  role: 'admin' | 'operator';
  displayName: string | null;
}
```

**c) Login action v `lib/booking-auth-actions.ts`:**
```typescript
'use server';

export async function loginBooking(formData: FormData) {
  // authenticate(email, password)
  // role check: admin → /booking/dashboard, operator → /booking/calendar, girl → /studio-booking/dashboard
  // setSession(user.id, user.role)
  // Audit log: booking.login.success / booking.login.fail
}

export async function logoutBooking() {
  // clearSession() → redirect /booking
}
```

**d) Middleware rozsireni v `middleware.ts`:**
```typescript
// Pridat pred intl middleware:
if (pathname.startsWith('/booking') || pathname.startsWith('/studio-booking')) {
  // /booking → pokud session existuje, redirect dle role
  // /booking/* (krome /booking) → vyzaduje session, role IN (admin, operator)
  // /studio-booking/* → vyzaduje session, role = girl
  // Bez session → redirect /booking (login)
  return bookingMiddleware(request);
}
// Jinak puvodni intl middleware
```

**DULEZITE:** STUDIOFLOW booking je MIMO `[locale]` — interni system, neni treba i18n. Routy `/booking/*` a `/studio-booking/*` jsou primo v `app/booking/` a `app/studio-booking/`.

> POZNAMKA: `/studio` je uz obsazene existujicim Studio pro divky (`app/[locale]/studio/`). Proto STUDIOFLOW pouzije `/studio-booking` pro divci PWA.

### Session flow

```
GET /booking → je session? → NE → zobraz login form
                            → ANO → role?
                              → admin    → redirect /booking/dashboard
                              → operator → redirect /booking/calendar
                              → girl     → redirect /studio-booking/dashboard

POST /booking (login form submit)
  → authenticate(email, password)
  → role check
  → setSession()
  → redirect dle role (viz vyse)
  → fail → /booking?error=invalid
```

---

## 2. Layout structure

### `/booking/layout.tsx` — Admin/Operator shell

**Typ:** Server Component (layout)

```
+--demo-bar (dev only: role toggle)--+
| SIDEBAR (240px)  | TOPBAR (56px)   |
|                  |                  |
| STUDIOFLOW logo  | Page title       |
| ─────────────    | + Nova rezervace |
| BOOKING          |                  |
|  📅 Kalendar     | ════════════════ |
|  👤 Klienti      |                  |
|  🕐 Rozvrh smen  |  MAIN CONTENT   |
| ─────────────    |  (children)      |
| SPRAVA [admin]   |                  |
|  👩 Divky        |                  |
|  🏠 Pobocky      |                  |
|  📊 Reporty      |                  |
| ─────────────    |                  |
| SYSTEM [admin]   |                  |
|  ⚙ Nastaveni     |                  |
|  📝 Audit log    |                  |
|  👥 Uzivatele    |                  |
|  ✈ TG Bot        |                  |
| ─────────────    |                  |
| user: Jana       |                  |
| role: operatorka |                  |
+------------------+------------------+
```

**DB queries v layoutu:**
- `getCurrentUser()` — session check (uz existuje)
- Operator vidi jen BOOKING sekci, SPRAVA a SYSTEM jsou skryte (ne lockovane — vubec se nerenderuji)

**Soubory:**
- `app/booking/layout.tsx` — Server Component, volá `requireBookingUser()`
- `components/booking/Sidebar.tsx` — Server Component, prijima `role` prop
- `components/booking/Topbar.tsx` — Server Component, prijima `pageTitle` + `actions`

### `/studio-booking/layout.tsx` — Mobilni PWA shell

**Typ:** Server Component (layout)

```
+──────────────────+
| STUDIOFLOW  Emily|  ← app-header
|──────────────────|
|                  |
|   MAIN CONTENT   |
|   (children)     |
|                  |
|──────────────────|
| Prehled | Rozvrh | Notif (2) |  ← bottom-nav
+──────────────────+
```

**DB queries v layoutu:**
- `requireGirl()` — session check (uz existuje)
- `SELECT name FROM girls WHERE id = ?` — jmeno divky pro header

**Soubory:**
- `app/studio-booking/layout.tsx` — Server Component
- `components/studio-booking/MobileShell.tsx` — Server Component
- `components/studio-booking/BottomNav.tsx` — Client Component (aktivni tab highlight)

### PWA manifest
- `public/studio-booking-manifest.json` — name: "STUDIOFLOW", display: "standalone", theme_color: "#0c0a0e"
- `<link rel="manifest">` v studio-booking layout

---

## 3. Stranky — po fazich

### FAZE A: Zaklad (auth + layout + 3 hlavni stranky)

#### A1. `/booking` — Login page

| | |
|---|---|
| **Mockup** | `09-role-overview.html` sekce B (radky 425-431) |
| **Typ** | Server Component |
| **Route** | `app/booking/page.tsx` |
| **DB queries** | zadne (formulář, POST action) |
| **Action** | `loginBooking(formData)` z `lib/booking-auth-actions.ts` |

**Obsah:**
- Logo "STUDIOFLOW" (velke), email input, heslo input, "Prihlasit se" button
- Error zpravy: ?error=invalid, ?error=ratelimit
- Hint: "Jeden login pro vsechny role (/booking)."
- Design: dark theme, centered card, coral accent

---

#### A2. `/booking/dashboard` — Admin dashboard

| | |
|---|---|
| **Mockup** | `10-full-app-prototype.html` radky 837-947 |
| **Typ** | Server Component |
| **Route** | `app/booking/dashboard/page.tsx` |

**DB queries:**
```sql
-- 4 stat karty
SELECT COUNT(*) FROM bookings_v2 WHERE date = ? AND status != 'cancelled_client' AND status != 'cancelled_girl';
SELECT SUM(points_earned) FROM bookings_v2 WHERE date = ? AND status = 'completed';
SELECT COUNT(DISTINCT girl_id) FROM bookings_v2 WHERE date = ? AND status IN ('confirmed','in_progress');
SELECT COUNT(*) FROM bookings_v2 WHERE status = 'pending';
-- POZN: pending = jen manualni phone bookings novych klientu
-- Bot bookings (stali klienti 3+) jdou rovnou do CONFIRMED

-- Pending bookings (cekajici na potvrzeni — BEZ bot bookings, ty jsou auto-confirmed)
SELECT bv2.*, bc.nickname, g.name as girl_name
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
JOIN girls g ON bv2.girl_id = g.id
WHERE bv2.status = 'pending'
ORDER BY bv2.created_at ASC;

-- Body tento tyden (bar chart)
SELECT date, SUM(points_earned) as total_points
FROM bookings_v2
WHERE date BETWEEN ? AND ? AND status = 'completed'
GROUP BY date;
```

**Komponenty:**
- `DashStatCard` — Server Component (stat karta)
- `PendingBookingsList` — Client Component (Potvrdit/Odmitnout = fetch POST)
- `WeeklyPointsChart` — Server Component (CSS-only bar chart, jako v mockupu)
- `QuickActions` — Server Component (linky na calendar, clients, schedule)

**Operator:** vidi stejne, ale bez "TG Bot dnes" karty.

**POZN:** Bot bookings (stali klienti 3+ navstev) jdou rovnou do CONFIRMED — NEvyskakuji v "Cekajici na potvrzeni". Pending = jen manualni phone bookings novych klientu.

---

#### A3. `/booking/calendar` — Tydenni kalendar (default view)

| | |
|---|---|
| **Mockup** | `02-calendar-week.html` |
| **Typ** | Server Component + Client interakce |
| **Route** | `app/booking/calendar/page.tsx` |
| **URL params** | `?week=2026-W37` (ISO tyden), `?view=day&date=2026-09-13` |

**DB queries:**
```sql
-- Vsechny bookings v tydnu
SELECT bv2.*, bc.nickname, g.name as girl_name, g.id as girl_id
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
JOIN girls g ON bv2.girl_id = g.id
WHERE bv2.date BETWEEN ? AND ?
ORDER BY bv2.girl_id, bv2.date, bv2.start_time;

-- Smeny vsech divek v tydnu
SELECT gs.*, g.name, g.id as girl_id
FROM girl_schedules gs
JOIN girls g ON gs.girl_id = g.id
WHERE g.status = 'active'
ORDER BY g.name;

-- Schedule exceptions (override)
SELECT * FROM schedule_exceptions
WHERE date BETWEEN ? AND ?;

-- Body per divka v tydnu
SELECT girl_id, SUM(points_earned) as total_points, COUNT(*) as booking_count
FROM bookings_v2
WHERE date BETWEEN ? AND ? AND status = 'completed'
GROUP BY girl_id;
```

**Komponenty:**
- `WeekGrid` — Server Component (grid: divka × den, mini-booking bloky)
- `WeekHeader` — Server Component (Po-Ne + day nums)
- `GirlRowHeader` — Server Component (avatar + jmeno)
- `MiniBooking` — Server Component (color-coded per divka)
- `GridSummaryRow` — Server Component (celkem rez. + body per den)
- `CalendarTopbar` — Client Component (Den/Tyden toggle, datum navigace, + Nova rezervace)

**Klik na mini-booking:** URL navigace na `/booking/calendar/[id]` (intercepted route → side panel).

---

#### A4. `/booking/calendar/day` — Denni kalendar

| | |
|---|---|
| **Mockup** | `01-calendar-day.html` |
| **Typ** | Server Component + Client |
| **Route** | `app/booking/calendar/day/page.tsx` |
| **URL params** | `?date=2026-09-13` |

**DB queries:** Stejne jako tydenni, ale jen pro 1 den + podrobnejsi (start_time, end_time, location, status).

```sql
-- Bookings pro dany den
SELECT bv2.*, bc.nickname, bc.trust_level, g.name as girl_name
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
JOIN girls g ON bv2.girl_id = g.id
WHERE bv2.date = ?
ORDER BY bv2.girl_id, bv2.start_time;

-- Aktivni drafty (zluty dashed blok)
SELECT bd.*, bc.nickname
FROM booking_drafts bd
LEFT JOIN booking_clients bc ON bd.client_id = bc.id
WHERE bd.date = ? AND bd.is_converted = 0 AND bd.expires_at > datetime('now');

-- Slot locks
SELECT * FROM slot_locks WHERE date = ? AND expires_at > datetime('now');
```

**Komponenty:**
- `DayTimeGrid` — Server Component (10:00-22:00 time sloty, 30min)
- `GirlColumn` — Server Component (header + shift bg + booking bloky)
- `BookingBlock` — Client Component (klik → detail, drag pro presun?)
- `NowLine` — Client Component (cervena cara, aktualizuje se)
- `DatePickerBar` — Client Component (7 dnu, sipky, dnesek)
- `StatsBar` — Server Component (pocty)
- `PointsProgressBar` — Server Component (body per divka)

---

### FAZE B: Core booking CRUD

#### B1. `/booking/calendar/new` — Nova rezervace

| | |
|---|---|
| **Mockup** | `03-new-booking-form.html` |
| **Typ** | Client Component (multi-step wizard) |
| **Route** | `app/booking/calendar/new/page.tsx` (nebo modal intercepted route) |

**DB queries (API routes):**
```sql
-- Krok 1: Hledani klienta
SELECT * FROM booking_clients WHERE phone_hmac = ? OR client_number = ? OR nickname LIKE ?;

-- Krok 1: Vytvoreni noveho klienta (pokud nenalezen)
INSERT INTO booking_clients (client_number, nickname, phone_encrypted, phone_hmac, source, trust_level) VALUES (?, ?, ?, ?, ?, 'new');

-- Krok 2: Dostupne divky pro dany den
SELECT g.id, g.name, gs.start_time, gs.end_time, l.name as location_name
FROM girls g
JOIN girl_schedules gs ON g.id = gs.girl_id AND gs.day_of_week = ?
LEFT JOIN locations l ON gs.location_id = l.id
WHERE g.status = 'active';

-- Krok 2: Existujici bookings divky v dany den (pro obsazenost)
SELECT start_time, end_time FROM bookings_v2 WHERE girl_id = ? AND date = ? AND status NOT IN ('cancelled_client','cancelled_girl','declined');

-- Krok 3: Volne time sloty (odvozene: smena minus existujici bookings)

-- Krok 3: Cena dle programu
SELECT price, night_price FROM pricing_plans WHERE duration = ?;

-- Krok 4: INSERT booking
INSERT INTO bookings_v2 (client_id, girl_id, location_id, date, start_time, end_time, duration_minutes, program_id, price, status, channel, source, notes, created_by) VALUES (...);

-- Krok 4: Audit log
INSERT INTO booking_audit_log (booking_id, user_id, action, actor_type, entity_type, entity_id, details) VALUES (?, ?, 'booking.create', 'user', 'booking', ?, ?);
```

**Komponenty:**
- `NewBookingWizard` — Client Component (4 kroky, state management)
- `ClientSearch` — Client Component (debounced search → API)
- `NewClientForm` — Client Component (inline vytvoreni)
- `GirlSelector` — Client Component (seznam s dostupnosti)
- `TimeSlotPicker` — Client Component (grid 30min, obsazene disabled)
- `BookingSummary` — Client Component (rekapitulace + send confirmation)
- `ConfirmationSender` — Client Component (SMS/WA/TG/kopirovat)

---

#### B2. `/booking/calendar/[id]` — Detail rezervace

| | |
|---|---|
| **Mockup** | `05-booking-detail.html` |
| **Typ** | Server Component + Client akce |
| **Route** | `app/booking/calendar/[id]/page.tsx` |

**DB queries:**
```sql
-- Detail bookingu
SELECT bv2.*, bc.*, g.name as girl_name, l.name as location_name, l.address
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
JOIN girls g ON bv2.girl_id = g.id
LEFT JOIN locations l ON bv2.location_id = l.id
WHERE bv2.id = ?;

-- Audit log pro booking
SELECT bal.*, u.email as user_email
FROM booking_audit_log bal
LEFT JOIN users u ON bal.user_id = u.id
WHERE bal.booking_id = ?
ORDER BY bal.created_at DESC;
```

**API akce (POST /api/booking/[id]/status):**
- Potvrdit → status = 'confirmed', audit log
- Dokonceno → status = 'completed', body +X, audit log
- No-show → status = 'no_show', no_show_count++, no_show_level, audit log
- Zrusit → status = 'cancelled_client' | 'cancelled_girl', audit log
- Presunout → status = 'rescheduled', novy booking s novym casem
- Odeslat adresu → SMS/WA/TG, audit log

**Komponenty:**
- `BookingDetailPanel` — Server Component (hero, client strip, akce)
- `StatusBanner` — Server Component (barva dle statusu)
- `AddressSection` — Client Component (odeslat mestskou cast / presnou adresu)
- `ActionGrid` — Client Component (Potvrdit, Dokoncit, No-show, Zrusit, Presunout)
- `AuditLogCollapsible` — Server Component (`<details>` HTML tag)

---

#### B3. `/booking/clients` — Seznam klientu

| | |
|---|---|
| **Mockup** | `04-client-card.html` (horni polovina) |
| **Typ** | Server Component + Client filtry |
| **Route** | `app/booking/clients/page.tsx` |
| **URL params** | `?q=josef&trust=vip` |

**DB queries:**
```sql
-- Seznam (s filtrem)
SELECT bc.*, 
  (SELECT MAX(date) FROM bookings_v2 WHERE client_id = bc.id AND status = 'completed') as last_visit
FROM booking_clients bc
WHERE (? IS NULL OR bc.trust_level = ?)
  AND (? IS NULL OR bc.nickname LIKE ? OR bc.client_number LIKE ?)
ORDER BY bc.updated_at DESC
LIMIT 50 OFFSET ?;

-- Pocet celkem
SELECT COUNT(*) FROM booking_clients;
```

**Komponenty:**
- `ClientSearchBar` — Client Component (debounced, URL param update)
- `TrustFilterChips` — Client Component (Vsichni/VIP/Stali/Novi/Neduveryh.)
- `ClientTable` — Server Component (radky s avatarem, jmenem, stats, badge)

---

#### B4. `/booking/clients/[id]` — Detail klienta

| | |
|---|---|
| **Mockup** | `04-client-card.html` (dolni polovina) |
| **Typ** | Server Component |
| **Route** | `app/booking/clients/[id]/page.tsx` |

**DB queries:**
```sql
-- Klient (s dekryptovanym PII — auditovano!)
SELECT * FROM booking_clients WHERE id = ?;
-- ↑ phone_encrypted, name_encrypted, surname_encrypted → decrypt v lib/crypto.ts
-- ↑ INSERT INTO booking_audit_log (action='client.decrypt', ...)

-- Statistiky
SELECT COUNT(*) as visits, SUM(CASE WHEN status='no_show' THEN 1 ELSE 0 END) as no_shows,
       SUM(CASE WHEN status='completed' THEN price ELSE 0 END) as total_spent,
       SUM(CASE WHEN status='completed' THEN points_earned ELSE 0 END) as total_points
FROM bookings_v2 WHERE client_id = ?;

-- Navstivene divky
SELECT g.name, COUNT(*) as count
FROM bookings_v2 bv2 JOIN girls g ON bv2.girl_id = g.id
WHERE bv2.client_id = ? AND bv2.status = 'completed'
GROUP BY g.id ORDER BY count DESC;

-- Historie
SELECT bv2.*, g.name as girl_name
FROM bookings_v2 bv2 JOIN girls g ON bv2.girl_id = g.id
WHERE bv2.client_id = ?
ORDER BY bv2.date DESC, bv2.start_time DESC
LIMIT 20;
```

**Komponenty:**
- `ClientDetailHeader` — Server Component (avatar, jmeno, badge, kod, akce)
- `StatCards` — Server Component (4 karty: navstevy, no-shows, utraceno, body)
- `ContactInfoCard` — Server Component (telefon dekryptovany, TG, email)
- `VisitedGirlsChips` — Server Component (chips s poctem)
- `NotesCard` — Client Component (editovatelne poznamky)
- `HistoryTable` — Server Component (datum, divka, program, zdroj, status, cena, body)

---

#### B5. `/booking/schedule` — Rozvrh smen

| | |
|---|---|
| **Mockup** | `10-full-app-prototype.html` radky 1260-1316 |
| **Typ** | Server Component (read) + Client (edit pro admina) |
| **Route** | `app/booking/schedule/page.tsx` |
| **URL params** | `?week=2026-W37` |

**DB queries:**
```sql
-- Smeny vsech aktivnich divek
SELECT gs.*, g.name, g.id as girl_id, l.name as location_name
FROM girl_schedules gs
JOIN girls g ON gs.girl_id = g.id
LEFT JOIN locations l ON gs.location_id = l.id
WHERE g.status = 'active'
ORDER BY g.name, gs.day_of_week;

-- Schedule exceptions pro tyden
SELECT se.*, g.name as girl_name
FROM schedule_exceptions se
JOIN girls g ON se.girl_id = g.id
WHERE se.date BETWEEN ? AND ?;
```

**Admin:** klik na bunku → modal pro upravu smeny (cas, lokace, volno).
**Operator:** jen read-only grid (zadny modal).

---

### FAZE C: Studio PWA + sprava

#### C1. `/studio-booking/dashboard` — Pohled divky

| | |
|---|---|
| **Mockup** | `08-studio-girl-view.html` Screen 1 |
| **Typ** | Server Component |
| **Route** | `app/studio-booking/dashboard/page.tsx` |

**DB queries:**
```sql
-- Dnesni smena
SELECT gs.*, l.name as location_name
FROM girl_schedules gs
LEFT JOIN locations l ON gs.location_id = l.id
WHERE gs.girl_id = ? AND gs.day_of_week = ?;

-- Dnesni bookings
SELECT bv2.*, bc.nickname, bc.trust_level, bc.total_visits
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
WHERE bv2.girl_id = ? AND bv2.date = ?
ORDER BY bv2.start_time;

-- Body dnes
SELECT SUM(points_earned) FROM bookings_v2
WHERE girl_id = ? AND date = ? AND status = 'completed';
```

**Komponenty:** ShiftBanner, PointsBar, BookingList, BookingItem (s countdown).
**Bezpecnost:** divka NEVIDI telefon, prijmeni, adresu, cenu, jine divky.

---

#### C2. `/studio-booking/booking/[id]` — Detail (divka)

| | |
|---|---|
| **Mockup** | `08-studio-girl-view.html` Screen 2 |
| **Typ** | Server Component + Client (countdown, actions) |
| **Route** | `app/studio-booking/booking/[id]/page.tsx` |

**DB queries:**
```sql
SELECT bv2.*, bc.nickname, bc.trust_level, bc.total_visits, l.name as location_name
FROM bookings_v2 bv2
JOIN booking_clients bc ON bv2.client_id = bc.id
LEFT JOIN locations l ON bv2.location_id = l.id
WHERE bv2.id = ? AND bv2.girl_id = ?;  -- !! girl_id check = divka vidi jen SVE bookings
```

**Akce:** "Klient dorazil" → POST /api/booking/[id]/status → status = 'in_progress', arrived_at = NOW.
**Bezpecnost:** girl_id check v query — divka nemuze videt cizi bookings.

---

#### C3. `/studio-booking/schedule` — Rozvrh (divka)

| | |
|---|---|
| **Mockup** | `08-studio-girl-view.html` Screen 3 |
| **Typ** | Server Component |
| **Route** | `app/studio-booking/schedule/page.tsx` |

**DB queries:**
```sql
-- Smeny teto divky (tento tyden)
SELECT gs.*, l.name as location_name
FROM girl_schedules gs
LEFT JOIN locations l ON gs.location_id = l.id
WHERE gs.girl_id = ?
ORDER BY gs.day_of_week;

-- Pocty bookings per den
SELECT date, COUNT(*) as count
FROM bookings_v2
WHERE girl_id = ? AND date BETWEEN ? AND ?
GROUP BY date;
```

**Read-only.** Divka nemuze menit rozvrh.

---

#### C4. `/studio-booking/notifications` — Notifikace (divka)

| | |
|---|---|
| **Mockup** | `08-studio-girl-view.html` Screen 4 |
| **Typ** | Server Component |
| **Route** | `app/studio-booking/notifications/page.tsx` |

**DB queries:**
```sql
-- Notifikace pro tuto divku (z booking_audit_log + filtrovane)
SELECT bal.*
FROM booking_audit_log bal
JOIN bookings_v2 bv2 ON bal.booking_id = bv2.id
WHERE bv2.girl_id = ?
  AND bal.action IN ('booking.create','booking.confirm','booking.cancel','booking.reminder')
ORDER BY bal.created_at DESC
LIMIT 30;
```

**Typy:** nova rezervace (zelena), zrusena (cervena), reminder (zluta), zmena smeny (modra).

---

#### C5-C7. `/booking/girls`, `/booking/locations`, remaining admin

| Stranka | Mockup | Typ | Admin-only |
|---|---|---|---|
| `/booking/girls` | 10-proto L1151-1257 | Server Component | ANO |
| `/booking/girls/[id]` | (neni mockup — jednoduchy profil) | Server Component | ANO |
| `/booking/locations` | 10-proto L1319-1348 | Server Component | ANO |

**Girls DB queries:**
```sql
SELECT g.*, 
  (SELECT COUNT(*) FROM bookings_v2 WHERE girl_id = g.id AND date BETWEEN ? AND ?) as week_bookings,
  (SELECT SUM(points_earned) FROM bookings_v2 WHERE girl_id = g.id AND date BETWEEN ? AND ? AND status='completed') as week_points
FROM girls g WHERE g.status = 'active' ORDER BY g.name;
```

---

### FAZE D: Admin-only stranky

| Stranka | Mockup | Typ | DB |
|---|---|---|---|
| `/booking/reports` | 10-proto L1351-1394 | Server Component | Agregace z bookings_v2 (GROUP BY) |
| `/booking/settings` | 10-proto L1397+ | Server + Client | Konfiguracni tabulka (TBD) |
| `/booking/audit` | 10-proto L1431+ | Server Component | `SELECT * FROM booking_audit_log ORDER BY created_at DESC LIMIT 100` |
| `/booking/users` | 10-proto L1458+ | Server + Client | `SELECT * FROM users WHERE role IN ('admin','operator','girl') ORDER BY role, email` |
| `/booking/telegram` | 10-proto L1503+ | Server Component | `SELECT * FROM telegram_users ORDER BY last_interaction DESC LIMIT 20` |

Vsechny admin-only: `requireBookingAdmin()` na zacatku.

---

## 4. App Router file struktura

```
app/
  booking/
    page.tsx                ← login (Server Component)
    layout.tsx              ← sidebar + topbar shell
    dashboard/
      page.tsx              ← admin dashboard
    calendar/
      page.tsx              ← tydenni grid
      day/
        page.tsx            ← denni view
      new/
        page.tsx            ← nova rezervace wizard
      [id]/
        page.tsx            ← detail rezervace
    clients/
      page.tsx              ← seznam
      new/
        page.tsx            ← nova klientska karta
      [id]/
        page.tsx            ← detail
    girls/
      page.tsx              ← grid karet [admin]
      [id]/
        page.tsx            ← detail divky [admin]
    schedule/
      page.tsx              ← rozvrh smen
    locations/
      page.tsx              ← pobocky [admin]
    reports/
      page.tsx              ← reporty [admin]
    settings/
      page.tsx              ← nastaveni [admin]
    audit/
      page.tsx              ← audit log [admin]
    users/
      page.tsx              ← sprava uzivatelu [admin]
    telegram/
      page.tsx              ← TG bot admin [admin]

  studio-booking/
    page.tsx                ← redirect na /studio-booking/dashboard
    layout.tsx              ← mobilni PWA shell
    dashboard/
      page.tsx              ← prehled dne
    booking/
      [id]/
        page.tsx            ← detail rezervace
    schedule/
      page.tsx              ← tydenni rozvrh
    notifications/
      page.tsx              ← notifikace

  api/
    telegram/
      route.ts              ← webhook (jiz existuje)
    booking/
      route.ts              ← booking list/create
      [id]/
        route.ts            ← booking detail
        status/
          route.ts          ← status transitions
      search/
        route.ts            ← client search
    booking-clients/
      route.ts              ← client CRUD
      [id]/
        route.ts            ← client detail
        decrypt/
          route.ts          ← PII decryption (audited)
```

## 5. Lib soubory k vytvoreni

```
lib/
  booking-auth.ts           ← requireBookingUser(), requireBookingAdmin()
  booking-auth-actions.ts   ← loginBooking(), logoutBooking()
  booking-queries.ts        ← typed query helpers pro booking tabulky
  booking-crypto.ts         ← AES-256-GCM encrypt/decrypt, HMAC-SHA256
  booking-audit.ts          ← logAuditEvent() helper
```

## 6. Implementacni poradi (kriticka cesta)

```
1. lib/booking-auth.ts + booking-auth-actions.ts    (rozsireni existujiciho auth)
2. middleware.ts update                              (booking/studio-booking routing)
3. app/booking/page.tsx (login)                      (prvni viditelna stranka)
4. app/booking/layout.tsx + Sidebar + Topbar         (shell)
5. app/booking/dashboard/page.tsx                    (admin dashboard)
6. app/booking/calendar/page.tsx (tydenni)           (hlavni pracovni nastroj)
7. app/booking/calendar/day/page.tsx (denni)         (detailni pohled)
   ─── FAZE A HOTOVA ───
8. app/booking/calendar/new/page.tsx                 (wizard)
9. app/booking/calendar/[id]/page.tsx                (detail + akce)
10. app/booking/clients/page.tsx + [id]              (klientske karty)
11. app/booking/schedule/page.tsx                    (rozvrh smen)
   ─── FAZE B HOTOVA ───
12. app/studio-booking/layout.tsx                    (mobilni shell)
13. app/studio-booking/dashboard/page.tsx            (divci dashboard)
14. app/studio-booking/schedule + notifications      (divci stranky)
15. app/booking/girls + locations                    (sprava)
   ─── FAZE C HOTOVA ───
16. app/booking/reports                              (reporty)
17. app/booking/settings + audit + users + telegram  (system admin)
   ─── FAZE D HOTOVA ───
```

## 7. Env vars (kompletni)

```env
# Existujici (uz funguje)
SESSION_SECRET=               # pro session token signing
TURSO_DATABASE_URL=           # libSQL URL
TURSO_AUTH_TOKEN=             # Turso token

# Nove pro STUDIOFLOW
BOOKING_ENCRYPTION_KEY=       # 64 hex chars (32 bytes) pro AES-256-GCM
BOOKING_HMAC_SECRET=          # 64 hex chars (32 bytes) pro HMAC-SHA256
TELEGRAM_BOT_TOKEN=           # od @BotFather
TELEGRAM_WEBHOOK_SECRET=      # pro webhook overeni
NEXT_PUBLIC_BASE_URL=         # https://lovelygirls.cz
```
