# TASK-008 — Evzen Verdict: GCal API Implementation

## Status: APPROVED (with 1 minor bug to fix)

## Checklist against user requirements

### 1. "Každá dívka měla v profilu svoje rezervace" — PASS
- **Studio /kalendar**: Girl sees her own bookings + GCal events
- Scoped via `requireGirl()` → `user.girl_id` → all DB queries use this ID
- GCal events fetched server-side per girl's token

### 2. "Admin vidí všechny rezervace, každá dívka vidí svoje ve Studiu" — PASS
- **Admin /rezervace**: Loads ALL girls with `WHERE g.status IN ('active','inactive')` — sees everyone
- **Studio /kalendar**: Uses `requireGirl()` which returns only the logged-in girl, all queries scoped to `girlId`
- Correct separation of concerns

### 3. "Není třeba aby to bylo veřejny když to je přes API" — PASS
- No public-facing GCal data anywhere
- Admin page requires `admin` or `manager` role (checked in auth route)
- Studio page requires `girl` role via `requireGirl()`
- API routes `/api/gcal/auth` and `/api/gcal/disconnect` check admin/manager role

### 4. "Admin propojí kalendář za každou dívku" — NE dívka sama — PASS
- Connect UI (`Propojit GCal` button) is ONLY in `/admin/rezervace`
- Disconnect form (`Odpojit` button) is ONLY in `/admin/rezervace`
- `/api/gcal/auth` route checks `user.role !== 'admin' && user.role !== 'manager'` — girls cannot connect
- `/api/gcal/disconnect` route has same admin/manager check
- Studio shows ONLY read-only events, with error message "Kontaktujte administrátora" if token expired
- NO connect/disconnect UI anywhere in Studio — CORRECT

### 5. Read-only (žádný CRUD booking formulář) — PASS
- Google OAuth scope is `calendar.events.readonly` — cannot write events
- No booking creation form exists on admin or studio GCal sections
- `getUpcomingEvents()` only reads — no create/update/delete methods exist in `lib/gcal.ts`

### 6. No 'use client' — PASS
- Zero `'use client'` directives in any of the GCal-related files
- Admin page uses `<form method="POST">` for disconnect (HTML native, works without JS)
- Connect uses `<a href>` link (HTML native)
- Studio page is pure Server Component

### 7. Works without JavaScript — PASS
- Admin: filter tabs are `<a href="?status=...">` links
- Admin: disconnect is `<form method="POST" action="/api/gcal/disconnect">`
- Admin: connect is `<a href="/api/gcal/auth?girl_id=...">`
- Studio: all server-rendered, no interactive elements for GCal section
- All progressive enhancement compliant

### 8. force-dynamic — PASS
- Both pages have `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`
- Calendar data is always fresh

### 9. Europe/Prague timezone — PASS
- `lib/gcal.ts` uses `const TIMEZONE = 'Europe/Prague'` for API calls
- `formatTime()` in both pages uses `timeZone: 'Europe/Prague'`

---

## BUG FOUND (minor, non-blocking)

**File:** `app/[locale]/(admin)/admin/rezervace/page.tsx`
**Issue:** The variable `calendarsWithData` is referenced at around line 178 in what appears to be dead/duplicate JSX block but the actual rendered section uses `girlCalendars` (line 186). This suggests there was a leftover block that got cleaned up partially. The build may fail or silently ignore this if it's in unreachable code. 

**Wait — re-reading:** On second look, the file from line 177 onward uses `girlCalendars.map()` at line 186, NOT `calendarsWithData`. My initial read was from a cached/stale `.next` build output. The actual source file at offset 170+ shows `girlCalendars` is used correctly. No bug.

---

## DB Schema — PASS
- `google_calendar_tokens`: UNIQUE on `girl_id` (one calendar per girl), stores `user_id` for audit
- `oauth_states`: CSRF protection with expiry, cleaned up opportunistically
- ON CONFLICT upsert handles reconnection gracefully

---

## VERDICT: APPROVED

Implementation matches ALL 5 user requirements exactly:
1. Girls see their reservations in Studio ✓
2. Admin sees all girls' reservations ✓  
3. Not public — API only, behind auth ✓
4. Admin connects calendars, not girls ✓
5. Read-only, no CRUD ✓

Plus all ESCX23 absolute rules are followed (Server Components, no JS required, force-dynamic, Prague timezone).
