# TASK-004: GCal Iframe Embed — Diagnostics & Fix Plan

## 1. Current DB State

```sql
SELECT id, name, calendar_embed_url FROM girls
WHERE calendar_embed_url IS NOT NULL AND calendar_embed_url != '';
```

| id | name | calendar_embed_url |
|----|------|--------------------|
| 20 | Sara | `https://calendar.google.com/calendar/embed?src=cs.czech%23holiday%40group.v.calendar.google.com` |
| 22 | Luna | `https://calendar.google.com/calendar/embed?src=cs.czech%23holiday%40group.v.calendar.google.com` |

Both girls have the **same URL** pointing to Czech public holidays calendar (`cs.czech#holiday@group.v.calendar.google.com`). This is placeholder/test data.

## 2. How the Embed URL Is Constructed

### Admin Rezervace page (`app/[locale]/(admin)/admin/rezervace/page.tsx`)

1. Queries girls with non-empty `calendar_embed_url` (line 39-46)
2. Passes URL through `toCalendarEmbedUrl()` (line 51)
3. Renders iframe with `src={cal.embedUrl}` (line 178) — **no extra params appended**

### Studio Kalendar page (`app/[locale]/studio/kalendar/page.tsx`)

Same flow but appends extra params to the embed URL:
```
${googleCalUrl}&mode=AGENDA&showTitle=0&showNav=1&showTabs=0&showCalendars=0&showPrint=0
```

### `lib/calendar.ts` — `toCalendarEmbedUrl()`

Handles 3 input formats:
- Already embed URL (`/calendar/embed`) → **pass through** (this is the current case)
- Sharing link with `?cid=` param → decode base64 → build embed URL
- Raw calendar ID (contains `@`) → build embed URL

For the current DB values, the URL already contains `/calendar/embed`, so it's returned **as-is**.

## 3. Root Cause of "K vašemu uctu Google se nelze pripojit"

The Czech holidays calendar URL (`cs.czech#holiday@group.v.calendar.google.com`) is a **public Google calendar** — HTTP request returns 200. The embed should work.

The error "K vašemu uctu Google se nelze pripojit" (Cannot connect to your Google account) is a **browser-level iframe issue**, not a URL/code issue. Possible causes:

### Cause A: Third-party cookie blocking (MOST LIKELY)
Google Calendar embeds require cookies from `google.com` domain. Modern browsers (Chrome 2024+, Safari, Firefox) block third-party cookies by default. When embedded in an iframe on a different domain (`localhost:3000` or `lovelygirls.cz`), Google can't set its session cookies → shows the error.

**Evidence:** The same URL works when opened directly in a browser tab but fails in an iframe.

### Cause B: CSP / X-Frame-Options
Google Calendar `/embed` endpoint is designed to be embeddable and sends proper `X-Frame-Options: ALLOWALL` headers, so this is unlikely.

### Cause C: Dark mode filter interaction
The admin page applies `filter: invert(1) hue-rotate(180deg)` to the iframe (line 182). This is purely visual and wouldn't cause the connection error.

## 4. Fix Options

### Option 1: Add `&wkst=2` and `&hl=cs` params (quick, might not fix)
Append locale and week-start params. Won't fix the cookie issue.

### Option 2: Replace placeholder with real calendar URLs
The Czech holidays calendar is test data. Replace with actual girl calendars that are:
- Set to **public** (Google Calendar settings → "Make available to public")
- Using the correct calendar ID

### Option 3: Use Google Calendar API instead of iframe (recommended long-term)
Per Task #3 plan, switch from passive iframe embeds to API-based calendar reading:
- Use the existing `GOOGLE_CALENDAR_API_KEY` from `.env.local` for read-only access to public calendars
- Fetch events server-side via `https://www.googleapis.com/calendar/v3/calendars/{id}/events?key={API_KEY}`
- Render events in custom HTML (no iframe, no cookie issues, dark theme native)

### Option 4: Open calendar in new tab instead of iframe (quick workaround)
Replace `<iframe>` with `<a href={url} target="_blank">` link. Avoids all iframe issues.

## 5. Recommended Approach

**Short-term (now):**
- Replace test Czech holidays URLs with real girl calendar URLs (or remove if not available)
- Add a fallback link: if iframe fails to load, show "Open in Google Calendar" link
- Consider Option 4 (link instead of iframe) as the most reliable cross-browser approach

**Long-term (Sprint 4-5):**
- Implement API-based calendar reading per Task #3 plan (no iframe needed)
- Server-side fetching eliminates all browser cookie/iframe issues

## 6. Code Locations

| File | What it does |
|------|-------------|
| `lib/calendar.ts` | URL conversion — works correctly |
| `lib/queries.ts:1086` | `getBookings()` — works correctly (0 rows) |
| `app/[locale]/(admin)/admin/rezervace/page.tsx:39-52` | DB query for calendars — correct |
| `app/[locale]/(admin)/admin/rezervace/page.tsx:177-189` | iframe rendering — no extra params |
| `app/[locale]/studio/kalendar/page.tsx:247-249` | Studio iframe — has extra params |
| `.env.local` | Has `GOOGLE_CALENDAR_API_KEY` ready for API approach |
