# Google Calendar Booking Sync in Studio — Implementation Plan

## Context

- **Goal:** Each girl connects her Google account in Studio, sees bookings synced to her Google Calendar
- **Credentials ready:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_API_KEY` in `.env.local`
- **Prior research:** `.claude-context/tasks/TASK-gcal-research.md` — Variant B (one-way export) recommended
- **Booking system:** Sprint 5 per CLAUDE.md, but `bookings` table already exists with schema (0 rows currently)
- **Current state:** Studio `/kalendar` already shows 14-day grid with DB bookings + optional Google Calendar iframe embed

---

## 1. How does the girl connect her Google account?

### OAuth flow (server-side, no `'use client'`)

The connection happens via a standard OAuth 2.0 authorization code flow. The girl clicks a link, Google asks for permission, Google redirects back with a code, server exchanges it for tokens.

**Step-by-step:**

1. Girl visits `/studio/kalendar` — sees "Propojit Google Calendar" button (a plain `<a>` link, no JS)
2. Link goes to `/api/gcal/auth?user_id={userId}` — server action that:
   - Generates a random `state` token (CSRF protection)
   - Stores `state` + `user_id` + `expires_at` in `oauth_states` table
   - Redirects to Google's OAuth consent screen
3. Girl grants permission on Google → Google redirects to `/api/gcal/callback?code=...&state=...`
4. Callback handler:
   - Validates `state` against `oauth_states` table (CSRF check)
   - Exchanges `code` for `access_token` + `refresh_token` via Google's token endpoint
   - Stores tokens in `google_calendar_tokens` table
   - Redirects girl back to `/studio/kalendar?gcal=connected`
5. Girl sees "Google Calendar propojen" status on the page

**Why server-side (not `'use client'`):**
- ESCX23 principle: everything works without JS
- The OAuth flow is a series of HTTP redirects — no client-side JS needed
- Secretstory used a `'use client'` component (`GoogleCalendarConnect.tsx`) with `fetch()` calls — we don't port this

**Google Cloud project config needed:**
- OAuth consent screen: External, app name "LovelyGirls Studio"
- Authorized redirect URI: `https://lovelygirls.cz/api/gcal/callback` (and `http://localhost:3000/api/gcal/callback` for dev)
- Scopes: `https://www.googleapis.com/auth/calendar.events` (read/write events only, not full calendar access)

---

## 2. Where in Studio does she see reservations?

### Existing `/studio/kalendar` page — enhance it

The current `/studio/kalendar` page (`app/[locale]/studio/kalendar/page.tsx`) already:
- Shows a 14-day grid with shifts + bookings from DB
- Shows a Google Calendar iframe embed (if `calendar_embed_url` is set on the girl)

**After enhancement:**

```
┌──────────────────────────────────────────────┐
│ KALENDÁŘ                                     │
│ Emily · 5.6. — 18.6.                        │
├──────────────────────────────────────────────┤
│                                              │
│ [14-day grid — same as now]                  │
│  Each day shows: shift times + DB bookings   │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ GOOGLE CALENDAR                              │
│ ● Propojeno · Poslední sync: dnes 14:23     │
│ [Synchronizovat nyní]  [Odpojit]             │
│                                              │
│ ┌─ Google Calendar events (next 7 days) ──┐  │
│ │ Čt 5.6.  14:00-15:00  Exclusive 60      │  │
│ │ Pá 6.6.  18:00-19:30  Premium 90        │  │
│ │ So 7.6.  —  (žádné rezervace)            │  │
│ └──────────────────────────────────────────┘  │
│                                              │
│ — OR if not connected: —                     │
│                                              │
│ [Propojit Google Calendar]                   │
│  Vaše rezervace se budou automaticky         │
│  zobrazovat ve vašem Google Calendar.        │
│                                              │
└──────────────────────────────────────────────┘
```

**No new page needed.** Enhance the existing `/studio/kalendar` to:
1. Show Google Calendar connection status (connected / not connected)
2. Show "Connect" link if not connected (starts OAuth flow)
3. Show "Sync now" + "Disconnect" links if connected (server actions via `<form>`)
4. Optionally: show a list of upcoming Google Calendar events fetched via API (replacing the iframe)

---

## 3. Data flow

### Recommended: One-way export (ESCX23 → Google Calendar)

```
Admin creates/confirms booking in /admin/rezervace
         ↓
    INSERT into bookings table
         ↓
    lib/gcal.ts → createEvent() on girl's Google Calendar
         ↓
    Girl sees event in her Google Calendar app on phone
    Girl sees event in Studio /kalendar (from DB)
```

### What gets synced to Google Calendar:
- **Confirmed bookings** — when status changes to `confirmed`
- **Cancelled bookings** — delete the Google Calendar event
- **Schedule changes** — NOT synced (schedules are managed separately, shown in the 14-day grid)

### What does NOT flow back:
- Changes made in Google Calendar are NOT pulled back into ESCX23
- The girl's personal Google Calendar events stay in Google — ESCX23 doesn't read them
- This avoids conflict resolution complexity

### When sync triggers:
1. **On booking confirm:** admin action → `syncBookingToGCal(bookingId)` 
2. **On booking cancel:** admin action → `deleteBookingFromGCal(bookingId)`
3. **Manual sync:** girl clicks "Synchronizovat" in Studio → re-syncs all pending bookings

---

## 4. Existing booking data in DB

### Current `bookings` table schema (from `docs/secretstory-export/bookings.sql`):

```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  girl_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,       -- user_id who created it
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  date TEXT NOT NULL,                 -- '2026-06-12'
  start_time TEXT NOT NULL,           -- '14:00:00'
  end_time TEXT NOT NULL,             -- '15:00:00'
  duration INTEGER,                   -- 60
  location TEXT,                      -- 'Vinohrady'
  location_type TEXT,                 -- 'incall'/'outcall'
  services TEXT,                      -- JSON array
  price INTEGER,
  status TEXT DEFAULT 'pending',      -- pending/confirmed/completed/cancelled
  notes TEXT,
  communication_type TEXT,            -- sms/call/whatsapp/telegram
  -- discount fields...
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Currently 0 rows** — booking management is Sprint 4-5.

### Columns needed for GCal sync (add to bookings table):
```sql
ALTER TABLE bookings ADD COLUMN google_event_id TEXT;
ALTER TABLE bookings ADD COLUMN gcal_sync_status TEXT DEFAULT 'pending'
  CHECK(gcal_sync_status IN ('pending', 'synced', 'error', 'no_gcal'));
ALTER TABLE bookings ADD COLUMN gcal_synced_at DATETIME;
```

---

## 5. What can we build NOW vs what needs bookings?

### Build NOW (no bookings needed):
1. OAuth flow (connect/disconnect Google account)
2. Token storage (`google_calendar_tokens` table)
3. Studio UI (connection status, connect/disconnect links)
4. `lib/gcal.ts` library (OAuth helpers, API wrappers)
5. Migration script for new DB tables/columns

### Build when bookings exist (Sprint 4-5):
1. `syncBookingToGCal()` — called from booking confirm action
2. `deleteBookingFromGCal()` — called from booking cancel action
3. "Sync now" manual trigger
4. Booking reminder cron (optional)

**Recommendation: Build Phase 1 (OAuth + Studio UI) now. It's self-contained and gives the girl a "Google Calendar connected" status. When bookings come in Sprint 4-5, adding the sync calls is trivial (2-3 lines per action).**

---

## 6. Implementation Steps

### Phase 1: OAuth + Token Storage (build now)

#### Step 1: Create DB table for OAuth tokens

**File: `scripts/migrate-gcal.sql`** (run manually or via seed script)

```sql
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at DATETIME NOT NULL,
  scope TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  sync_enabled INTEGER DEFAULT 1,
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  redirect_to TEXT,
  expires_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gcal_tokens_user ON google_calendar_tokens(user_id);
```

#### Step 2: Create Google Calendar API library

**File: `lib/gcal.ts`** (new file)

Functions:
- `getGCalAuthUrl(state: string): string` — builds Google OAuth URL
- `exchangeCodeForTokens(code: string): Promise<GCalTokens>` — POST to Google token endpoint
- `refreshAccessToken(refreshToken: string): Promise<GCalTokens>` — refresh expired tokens
- `getValidAccessToken(userId: number): Promise<string | null>` — get token, refresh if needed
- `createCalendarEvent(accessToken: string, event: GCalEvent): Promise<string>` — returns event ID
- `deleteCalendarEvent(accessToken: string, eventId: string): Promise<void>`
- `bookingToGCalEvent(booking, girlName): GCalEvent` — format converter

Constants:
- `GOOGLE_OAUTH_URL`, `GOOGLE_TOKEN_URL`, `GOOGLE_CALENDAR_API`
- `SCOPES = ['https://www.googleapis.com/auth/calendar.events']`
- `TIMEZONE = 'Europe/Prague'`

#### Step 3: Create OAuth API routes

**File: `app/api/gcal/auth/route.ts`** (GET — initiates OAuth)
- Verify user is logged in (call `getCurrentUser()`)
- Generate random `state`, store in `oauth_states` with `user_id` + expiry (10 min)
- Redirect to Google OAuth URL with `state`, `redirect_uri`, `scope`, `access_type=offline`, `prompt=consent`

**File: `app/api/gcal/callback/route.ts`** (GET — handles OAuth redirect)
- Extract `code` and `state` from query params
- Validate `state` against `oauth_states` table (+ check expiry)
- Delete the `oauth_states` row
- Exchange `code` for tokens via `exchangeCodeForTokens()`
- Store tokens in `google_calendar_tokens` table (UPSERT — replace if user reconnects)
- Redirect to `/{locale}/studio/kalendar?gcal=connected`

**File: `app/api/gcal/disconnect/route.ts`** (POST — server action or form handler)
- Verify user is logged in
- Delete from `google_calendar_tokens WHERE user_id = ?`
- Redirect to `/{locale}/studio/kalendar?gcal=disconnected`

#### Step 4: Add env vars

**File: `.env.local`** (add):
```
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gcal/callback
```

**File: `.env.production`** (for Vercel):
```
GOOGLE_REDIRECT_URI=https://lovelygirls.cz/api/gcal/callback
```

(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET already exist in .env.local)

#### Step 5: Update Studio `/kalendar` page

**File: `app/[locale]/studio/kalendar/page.tsx`** (edit)

Changes:
1. Query `google_calendar_tokens` for the current user to get connection status
2. Replace the Google Calendar iframe section with:
   - If NOT connected: show "Propojit Google Calendar" link → `/api/gcal/auth`
   - If connected: show status (connected since, last sync) + "Odpojit" form + "Synchronizovat" form
3. If connected AND there's a success param `?gcal=connected`: show success banner

```tsx
// Add to the parallel data fetch:
const gcalRes = await db.execute({
  sql: `SELECT sync_enabled, last_sync_at, created_at FROM google_calendar_tokens WHERE user_id = ?`,
  args: [user.id],
});
const gcalConnected = gcalRes.rows.length > 0;
const gcalData = gcalRes.rows[0] ?? null;
```

#### Step 6: Add GOOGLE_REDIRECT_URI to env validation (if any)

Check if there's an env validation schema and add the new var.

---

### Phase 2: Booking Sync (build when bookings exist — Sprint 4-5)

#### Step 7: Add GCal columns to bookings table

```sql
ALTER TABLE bookings ADD COLUMN google_event_id TEXT;
ALTER TABLE bookings ADD COLUMN gcal_sync_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN gcal_synced_at DATETIME;
```

#### Step 8: Create sync function

**File: `lib/gcal.ts`** (add to existing)

```typescript
export async function syncBookingToGCal(bookingId: number): Promise<boolean> {
  // 1. Get booking from DB
  // 2. Get girl's user_id from girls → users table
  // 3. Get valid access token (refresh if needed)
  // 4. Convert booking to GCal event format
  // 5. If booking has google_event_id → updateEvent, else → createEvent
  // 6. Update bookings SET google_event_id, gcal_sync_status='synced', gcal_synced_at=NOW
  // 7. Return true/false
}

export async function deleteBookingFromGCal(bookingId: number): Promise<boolean> {
  // 1. Get booking's google_event_id from DB
  // 2. If no event_id, return (nothing to delete)
  // 3. Get girl's access token
  // 4. deleteCalendarEvent()
  // 5. Update bookings SET gcal_sync_status='deleted'
}
```

#### Step 9: Wire sync into booking actions

When admin booking actions are built (Sprint 4-5), add calls:

```typescript
// In the "confirm booking" server action:
await syncBookingToGCal(bookingId);

// In the "cancel booking" server action:
await deleteBookingFromGCal(bookingId);
```

#### Step 10: "Sync now" action in Studio

**File: `app/[locale]/studio/kalendar/actions.ts`** (new)

```typescript
'use server';
export async function syncAllBookings() {
  // Get all bookings for girl where gcal_sync_status = 'pending'
  // For each: call syncBookingToGCal()
  // Redirect back to /studio/kalendar?gcal=synced
}
```

Wire it as a `<form action={syncAllBookings}>` button on the kalendar page.

---

## 7. Files Summary

### New files:
| File | Phase | Description |
|---|---|---|
| `lib/gcal.ts` | 1 | Google Calendar API library (OAuth + events) |
| `app/api/gcal/auth/route.ts` | 1 | OAuth initiation (redirect to Google) |
| `app/api/gcal/callback/route.ts` | 1 | OAuth callback (exchange code for tokens) |
| `app/api/gcal/disconnect/route.ts` | 1 | Disconnect Google Calendar |
| `scripts/migrate-gcal.sql` | 1 | DB migration for oauth tables |
| `app/[locale]/studio/kalendar/actions.ts` | 2 | Server actions for sync |

### Modified files:
| File | Phase | Change |
|---|---|---|
| `app/[locale]/studio/kalendar/page.tsx` | 1 | Add GCal connection status, connect/disconnect UI |
| `.env.local` | 1 | Add `GOOGLE_REDIRECT_URI` |
| Booking actions (TBD) | 2 | Add `syncBookingToGCal()` calls |

### No changes needed to:
- `lib/calendar.ts` (keep existing embed URL helper — can coexist)
- `lib/queries.ts` (no new query functions needed, direct DB calls in gcal.ts)
- `app/[locale]/(admin)/admin/rezervace/page.tsx` (admin page unchanged)

---

## 8. Effort Estimate

| Phase | Work | Days |
|---|---|---|
| Phase 1 (OAuth + UI) | DB migration, lib/gcal.ts, 3 API routes, update kalendar page | 1.5-2 days |
| Phase 2 (Booking sync) | Sync functions, wire into booking actions, sync-now button | 0.5-1 day |
| **Total** | | **2-3 days** |

---

## 9. Open Questions for User

1. **Should the girl be able to choose which Google Calendar to sync to?** (e.g., personal vs work calendar) — or always use `primary`?
2. **Should we keep the existing iframe embed as fallback for girls who don't OAuth?** — or replace it entirely?
3. **When booking actions are built, should sync be automatic (every confirm triggers GCal push) or manual only (girl clicks "Sync")?**
4. **Should admin also see GCal connection status per girl in `/admin/divky/{id}`?**
