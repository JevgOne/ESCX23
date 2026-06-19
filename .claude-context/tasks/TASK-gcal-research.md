# Google Calendar Integration Research — ESCX23

## 1. Current Schedule System in ESCX23

### Data model (two-layer)
- **`girl_schedules`** — weekly default: per-girl, per day_of_week (0-6), with start_time, end_time, is_active, location_id
- **`schedule_exceptions`** — daily override: per-girl, per date, with exception_type (unavailable / custom_hours), start_time, end_time

### Display hierarchy
```
For each (date, girl):
  IF schedule_exception exists for that date → use it
  ELSE → use girl_schedules default for that day_of_week
```

### Existing pages
| Page | What it does |
|---|---|
| `/rozvrh` (public) | Server-rendered, shows who works when. force-dynamic, no cache. Tabs for 7 days, location pills. |
| `/studio/dostupnost` | Girl sees her own schedule (read-only). Agency manages it. |
| `/studio/kalendar` | 14-day calendar view with bookings + optional **Google Calendar iframe embed** |
| `/admin/schedules` | Admin manages all girls' weekly schedules (add/delete per day) |
| `/admin/divky/{id}/dostupnost` | Admin per-girl: Today panel, Weekly form, Calendar override grid |
| Cron `cleanup-old-overrides` | Deletes schedule_exceptions older than 30 days |

### Already existing Google Calendar integration
- **`calendar_embed_url`** column on `girls` table — admin sets a public Google Calendar embed URL per girl
- **`lib/calendar.ts`** — `toCalendarEmbedUrl()` converts sharing links / raw calendar IDs to embed format
- **Studio `/kalendar`** page renders the Google Calendar as a read-only `<iframe>` embed below the internal schedule
- This is a **passive, read-only embed** — no API interaction, no OAuth, no sync

---

## 2. Secretstory Reference (Google Calendar)

Secretstory had a full Google Calendar API integration that was explicitly excluded from the ESCX23 port (SECRETSTORY-REFERENCES.md line 49: "NEpřejímat: google_calendar_integration").

### What Secretstory built

**Migration `013_google_calendar_integration.sql`:**
- `google_calendar_tokens` table — OAuth tokens per user (access_token, refresh_token, calendar_id, sync_token, webhook_channel_id)
- `oauth_states` table — CSRF protection for OAuth flow
- Columns on `bookings`: `google_event_id`, `sync_status`, `last_synced_at`, `booking_source`

**`lib/google-calendar.ts`** — Full Google Calendar API wrapper:
- OAuth URL generation, code exchange, token refresh
- CRUD for calendar events (create, update, delete, get, list)
- `bookingToCalendarEvent()` / `calendarEventToBookingUpdate()` converters
- Push notifications via `watchCalendar()` / `stopWatching()` webhooks

**`lib/calendar-sync.ts`** — Bidirectional sync service:
- `syncBookingToGoogle()` — push a local booking as a Google Calendar event
- `deleteBookingFromGoogle()` — remove event when booking cancelled
- `importFromGoogleCalendar()` — pull Google events into local bookings table
- `fullSync()` — bidirectional: import from Google, then export local pending bookings
- Incremental sync via `syncToken`

**Complexity level in Secretstory: HIGH.** Full OAuth flow, token persistence, webhook setup, error handling, incremental sync.

**Why it was excluded from ESCX23 port:** The CLAUDE.md and SECRETSTORY-REFERENCES.md explicitly say "NEpřejímat" (don't port). The client originally deemed it unnecessary complexity.

---

## 3. Integration Variants

### Variant A: Read-Only Embed (CURRENT STATE)

**What it is:** Admin pastes a public Google Calendar embed URL per girl. The girl sees her Google Calendar as an iframe in Studio `/kalendar`.

**Who uses it:** Admin (sets the URL), Girls (view in Studio)

**How it works today:**
1. Admin goes to `/admin/divky/{id}/edit`
2. Pastes Google Calendar embed/share URL into "Google Calendar Embed URL" field
3. `lib/calendar.ts` normalizes it to an embed URL
4. Girl sees the iframe in `/studio/kalendar`

**Pros:**
- Already implemented and working
- Zero API complexity, no OAuth, no tokens
- No secrets to manage, no Google Cloud project needed
- Works with any public Google Calendar
- Girl can use Google Calendar independently (add personal events, share with friends)

**Cons:**
- No data flows between systems — schedules are managed separately in ESCX23 and Google Calendar
- Girl must manually keep both in sync
- Iframe is read-only, can't create events from ESCX23
- No booking-to-calendar sync

**Complexity:** Already done (0 additional work)

**Best for:** Current stage (Sprint 1-2) — visual-first approach

---

### Variant B: One-Way Export (ESCX23 → Google Calendar)

**What it is:** When admin creates/updates a booking or schedule, ESCX23 pushes the event to Google Calendar via API. Google Calendar is a **read destination** — changes made there are not pulled back.

**Who uses it:** Admin (triggers sync), Girls (see events in their Google Calendar app)

**How it works:**
1. Each girl (or admin) connects a Google Calendar via OAuth (one-time setup in Studio or Admin)
2. Store OAuth tokens in DB (new `google_calendar_tokens` table)
3. When a booking is confirmed → `createEvent()` on girl's Google Calendar
4. When a booking is cancelled → `deleteEvent()`
5. When schedule changes → optionally create/update all-day or time-block events

**Technical requirements:**
- Google Cloud project with Calendar API enabled
- OAuth 2.0 consent screen (external, limited users initially)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` env vars
- New DB table: `google_calendar_tokens` (user_id, access_token, refresh_token, expires_at, calendar_id)
- New columns on `bookings`: `google_event_id`, `sync_status`
- Token refresh logic (access tokens expire in 1 hour)
- New API route: `/api/calendar/callback` (OAuth redirect handler)
- New settings page: `/studio/nastaveni/kalendar` or `/admin/divky/{id}/kalendar`

**Pros:**
- Girls see confirmed bookings in their phone's Google Calendar automatically
- Push notifications on phone when booking is confirmed (free via Google Calendar)
- No manual double-entry
- Simpler than two-way sync (no conflict resolution needed)

**Cons:**
- Full OAuth flow required (Google Cloud project setup, consent screen, review if >100 users)
- Token management (refresh, expiration, revocation)
- Google API rate limits (write quotas, but unlikely to hit with ~13 girls)
- If girl changes event in Google Calendar, the change is lost (one-way)
- Need to handle token invalidation gracefully (girl revokes access, etc.)

**Complexity:** MEDIUM (estimated 2-3 days implementation)

**References from Secretstory:** `lib/google-calendar.ts` functions: `createEvent()`, `updateEvent()`, `deleteEvent()`, `getValidAccessToken()`, `bookingToCalendarEvent()`. Can be used as logic reference (not copy).

---

### Variant C: Two-Way Sync (ESCX23 ↔ Google Calendar)

**What it is:** Full bidirectional sync. Bookings created in ESCX23 appear in Google Calendar. Events created in Google Calendar appear as bookings in ESCX23. Changes in either direction propagate.

**Who uses it:** Admin, Girls, potentially clients (if given calendar invite)

**How it works (on top of Variant B):**
1. Everything from Variant B, plus:
2. Periodic sync job (cron every 5-15 min) calls `listEvents()` with `syncToken` for incremental changes
3. New Google Calendar events → create bookings in ESCX23 with `booking_source = 'google_calendar'`
4. Deleted Google Calendar events → cancel corresponding booking
5. Changed Google Calendar events → update booking time/date
6. **OR** use push notifications (webhooks): Google POSTs to `/api/calendar/webhook` when calendar changes

**Technical requirements (on top of Variant B):**
- Webhook endpoint: `/api/calendar/webhook` (POST handler for Google push notifications)
- Public HTTPS URL for webhook (Vercel handles this)
- Webhook renewal every 7 days (cron job or on-demand)
- Conflict resolution logic: "last write wins" or "ESCX23 authoritative"
- `syncToken` storage per user for incremental sync
- Deduplication: don't re-import events that ESCX23 created (use `extendedProperties.private.bookingId`)

**Pros:**
- Girls can manage their bookings from Google Calendar on their phone
- Full integration — single source of truth (sort of)
- Clients could receive Google Calendar invites

**Cons:**
- Significantly more complex than one-way
- Conflict resolution is hard (what if admin and girl change the same booking simultaneously?)
- Webhook management adds operational burden
- Google Cloud project needs domain verification for webhooks
- More failure modes (webhook delivery failures, race conditions, stale sync tokens)
- The current booking model is "admin controls everything" — two-way sync conflicts with this

**Complexity:** HIGH (estimated 5-8 days implementation)

**References from Secretstory:** `lib/calendar-sync.ts` has `fullSync()`, `importFromGoogleCalendar()`, `watchCalendar()`. Was implemented but unclear if it was actively used in production.

---

## 4. Recommendation

### For now (Sprint 1-2): Keep Variant A (current embed)
The embed works. Girls can see their Google Calendar in Studio. Zero maintenance. Focus on other Sprint priorities.

### For Sprint 3 (Studio): Consider Variant B (one-way export)
When the booking system is live and admin is creating real bookings, one-way export to Google Calendar would be high value for girls. They'd get push notifications on their phone for confirmed bookings without checking the web app.

### Skip Variant C (two-way sync) unless specifically requested
The business model is "admin manages everything." Two-way sync creates complexity that conflicts with this. The Secretstory implementation was built but excluded from the ESCX23 spec for a reason.

### Alternative: iCal subscription feed (Variant B-light)
Instead of OAuth + API writes, ESCX23 could expose an `.ics` feed URL per girl:
- `/api/calendar/{girl-token}.ics` — read-only iCal feed
- Girl subscribes in Google Calendar (Add > From URL)
- Google Calendar polls every ~12 hours (not real-time)
- **Zero OAuth, zero tokens, zero Google Cloud project**
- Requires a secret token per girl in the URL (security)
- Down side: 12-24 hour delay on updates (Google's poll interval)

**Complexity:** LOW (1 day implementation)
**Best for:** If real-time sync isn't required and simplicity is paramount.

---

## 5. Decision Matrix

| Criterion | A (embed) | B-light (iCal) | B (one-way API) | C (two-way) |
|---|---|---|---|---|
| Implementation effort | Done | 1 day | 2-3 days | 5-8 days |
| Google Cloud project needed | No | No | Yes | Yes |
| OAuth flow | No | No | Yes | Yes |
| Real-time updates | No | No (12-24h delay) | Yes | Yes |
| Booking → phone notification | No | Delayed | Instant | Instant |
| Girl can edit in Google | N/A | No | No | Yes |
| Conflict resolution | N/A | N/A | N/A | Complex |
| Maintenance burden | None | Low | Medium | High |
| Fits "admin controls" model | Yes | Yes | Yes | Conflicts |
| Server-side principle | Yes | Yes | Yes | Yes |
