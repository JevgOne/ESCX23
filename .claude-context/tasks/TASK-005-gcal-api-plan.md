# TASK-005: Read-Only GCal Events via API Key (Simplified)

## Scope

**ONLY:** Server-side read of Google Calendar events using API key, displayed as HTML on admin Rezervace page. No OAuth, no per-girl login, no CRUD, no booking forms.

## How It Works

Google Calendar API allows **reading public calendars** with just an API key (no OAuth):

```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?key={API_KEY}
```

**Prerequisite:** Each girl's Google Calendar must be set to **"Make available to public"** in her Google Calendar settings. The admin stores her calendar ID in the DB.

---

## Implementation Plan (3 steps)

### Step 1: Rename DB column — `calendar_embed_url` → `google_calendar_id`

The existing `girls.calendar_embed_url` column holds embed URLs. We repurpose it to hold the raw **Google Calendar ID** (e.g. `abc123@gmail.com` or `abc123@group.calendar.google.com`).

**No schema change needed** — the column is TEXT, just store a different value. But rename for clarity:

Option A (simple, no migration): Keep column name `calendar_embed_url`, just store calendar IDs in it. Code treats the value as a calendar ID.

Option B (clean): `ALTER TABLE girls RENAME COLUMN calendar_embed_url TO google_calendar_id;`

**Recommendation: Option A** — no migration risk, just update the 2 test rows and change the code.

```sql
-- Update test data to use actual calendar IDs (admin does this in UI later, but for dev):
UPDATE girls SET calendar_embed_url = NULL WHERE id IN (20, 22);
-- When real calendar IDs are available:
-- UPDATE girls SET calendar_embed_url = 'real-calendar-id@gmail.com' WHERE id = 22;
```

### Step 2: Create `lib/gcal.ts` — event fetcher

**New file.** Single function, ~60 lines:

```typescript
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const TIMEZONE = 'Europe/Prague';

export interface GCalEvent {
  id: string;
  summary: string;
  start: string;      // "2026-06-05T14:00:00+02:00" or "2026-06-05" (all-day)
  end: string;
  allDay: boolean;
}

export async function getCalendarEvents(
  calendarId: string,
  days: number = 7
): Promise<GCalEvent[]> {
  if (!API_KEY) return [];

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + days * 86400000).toISOString();

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin,
    timeMax,
    timeZone: TIMEZONE,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });

  const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) return [];
    const data = await res.json();

    return (data.items ?? [])
      .filter((item: any) => item.status !== 'cancelled')
      .map((item: any) => ({
        id: item.id,
        summary: item.summary ?? '(bez nazvu)',
        start: item.start?.dateTime ?? item.start?.date ?? '',
        end: item.end?.dateTime ?? item.end?.date ?? '',
        allDay: !item.start?.dateTime,
      }));
  } catch {
    return []; // API error — silent fail, show empty
  }
}

// Helper: extract calendar ID from various URL formats (backward compat)
export function extractCalendarId(raw: string): string {
  const trimmed = raw.trim();

  // Already a calendar ID (contains @, no http)
  if (trimmed.includes('@') && !trimmed.startsWith('http')) {
    return trimmed;
  }

  // Embed URL: extract src= param
  const srcMatch = trimmed.match(/[?&]src=([^&]+)/);
  if (srcMatch) {
    return decodeURIComponent(srcMatch[1]);
  }

  // Sharing link with ?cid= (base64)
  const cidMatch = trimmed.match(/[?&]cid=([A-Za-z0-9+/=_-]+)/);
  if (cidMatch) {
    try {
      return Buffer.from(cidMatch[1], 'base64').toString('utf-8');
    } catch {}
  }

  return trimmed;
}
```

**Key points:**
- Uses `GOOGLE_CALENDAR_API_KEY` from `.env.local` (already exists)
- `fetch` with `{ next: { revalidate: 300 } }` — Next.js caches for 5 min
- `extractCalendarId()` handles backward compatibility with existing embed URLs in DB
- Returns empty array on any error — page shows "no events" instead of crashing

### Step 3: Update `admin/rezervace/page.tsx` — replace iframe with event list

**Modify existing file.** Changes:

**Imports:** Replace `toCalendarEmbedUrl` with `getCalendarEvents, extractCalendarId` from `@/lib/gcal`.

**Data fetch (replace lines 38-52):**

```typescript
// Fetch girls with calendar IDs
const calResult = await db.execute(
  `SELECT g.id, g.name, g.calendar_embed_url,
     (SELECT url FROM girl_photos WHERE girl_id = g.id AND is_primary = 1 LIMIT 1) AS photo
   FROM girls g
   WHERE g.calendar_embed_url IS NOT NULL AND g.calendar_embed_url != ''
     AND g.status IN ('active','inactive')
   ORDER BY g.name`
);

// Fetch events for each girl in parallel
const calendars = await Promise.all(
  calResult.rows.map(async (r) => {
    const calId = extractCalendarId(String(r.calendar_embed_url));
    const events = await getCalendarEvents(calId, 7);
    return {
      id: Number(r.id),
      name: String(r.name),
      photo: r.photo ? photoUrl(String(r.photo)) : null,
      calendarId: calId,
      events,
    };
  })
);
```

**Render (replace lines 151-189 — the entire iframe section):**

Replace iframe cards with server-rendered event lists per girl. Each girl card shows:
- Header: photo + name + event count
- Body: list of events with date, time, title
- Empty state: "Zadne udalosti v nasledujicich 7 dnech"

**Helper functions (add at top of page file):**

```typescript
function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('cs-CZ', {
    weekday: 'short', day: 'numeric', month: 'numeric',
    timeZone: 'Europe/Prague',
  });
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('cs-CZ', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Prague',
  });
}
```

---

## Files Summary

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `lib/gcal.ts` | **NEW** | `getCalendarEvents()` + `extractCalendarId()` (~60 lines) |
| 2 | `app/[locale]/(admin)/admin/rezervace/page.tsx` | **MODIFY** | Replace iframe with server-fetched event list |

**No DB migration. No new tables. No OAuth. No env changes** (API key already exists in `.env.local`).

---

## Implementation Order

```
Step 1: lib/gcal.ts                         ← new file, no dependencies
Step 2: admin/rezervace/page.tsx            ← import from lib/gcal.ts, replace iframe section
Done.
```

**Total: 1 new file + 1 modified file. ~100 lines of new code.**

---

## Prerequisite for Real Data

For this to show real events (not empty), the girl's Google Calendar must be:
1. **Set to public** in Google Calendar settings (Settings > calendar > Access permissions > Make available to public)
2. Her **calendar ID** stored in `girls.calendar_embed_url` column (e.g. `luna.example@gmail.com`)

The existing test data uses `cs.czech#holiday@group.v.calendar.google.com` (Czech public holidays) which IS public — so it will work immediately as a demo showing Czech holidays.

---

## Optional (NOT in scope, for later)

- Update `studio/kalendar/page.tsx` with same pattern (replace its iframe too)
- Add admin UI to edit girl's calendar ID (currently: manual DB update)
- OAuth flow for private calendars (if public sharing is not acceptable)
