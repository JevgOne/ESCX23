# QA Report — Task #6: GCal API Integration

**Reviewer:** kontrolor  
**Date:** 2026-06-05  
**Files reviewed:**
- `scripts/migrate-gcal.sql`
- `lib/gcal.ts`
- `app/api/gcal/auth/route.ts`
- `app/api/gcal/callback/route.ts`
- `app/api/gcal/disconnect/route.ts`
- `app/[locale]/studio/kalendar/page.tsx`
- `app/[locale]/(admin)/admin/rezervace/page.tsx`

---

## 1. SIMPLIFY CHECK

### No major issues found
- `lib/gcal.ts` is well-structured — OAuth helpers, token management, and event fetching are cleanly separated
- `getClientId()`, `getClientSecret()`, `getRedirectUri()` as tiny getters is minor overhead — could be inline reads, but it's not harmful
- `DAY_NAMES_SHORT_CS` in `studio/kalendar/page.tsx` (line 39) duplicates `DAY_NAMES` (line 37) and is defined alongside it — both are Sunday-indexed vs Mon-indexed. Minor, not a bug.
- `generate14Days` function is self-contained and not duplicated anywhere
- No dead code or commented-out blocks

### Minor: `formatEventDate` timezone handling (studio/kalendar/page.tsx:42)
```ts
const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
const pragueStr = d.toLocaleString('en-US', { timeZone: 'Europe/Prague' });
const prague = new Date(pragueStr);
```
The `new Date(toLocaleString(...))` pattern works but is fragile — it parses a locale-formatted string back into a Date, which is locale/engine-dependent. Better: use `Intl.DateTimeFormat` directly. Not blocking, but worth a note.

---

## 2. DEBUG CHECK

### Build: PASSES ✅
`npm run build` completes successfully. All 3 API routes (`/api/gcal/auth`, `/api/gcal/callback`, `/api/gcal/disconnect`) are registered.

### TypeScript: PASSES ✅
`npx tsc --noEmit` returns no errors.

### Bug: Callback route has NO auth check ⚠️
`app/api/gcal/callback/route.ts` does not call `getCurrentUser()` before saving tokens. The CSRF state system (random UUID + expiry) is the only protection. This is architecturally acceptable (the state proves the flow was initiated by an authenticated admin), but it means if a state leaks, an attacker could complete the OAuth flow without being logged in. Low risk in practice, but worth noting.

### Bug: `calResult.rows` query uses raw string (no parameterized args) — admin/rezervace/page.tsx:44
```ts
const calResult = await db.execute(
  `SELECT g.id, g.name, ...`   // no args object
);
```
This is safe here (no user input), but inconsistent with `{sql, args}` style used everywhere else. `libSQL` accepts both forms — this is a style note, not a bug.

### Note: `girlCalendars` fetches sequentially for each girl inside `Promise.all`
Each girl's token refresh (if expired) hits the Google token endpoint before returning. With many girls this could be slow, but since each girl resolves independently in `Promise.all`, it's parallelized correctly.

---

## 3. REVERSE CHECK (against task requirements)

### Requirement: Admin Rezervace zobrazuje eventy všech dívek z GCal (read-only, server-side)
✅ **DONE** — `admin/rezervace/page.tsx` fetches all girls with GCal tokens via `Promise.all`, renders events server-side. No `'use client'`.

### Requirement: Studio kalendář zobrazuje eventy dané dívky (read-only)
✅ **DONE** — `studio/kalendar/page.tsx` fetches only `user.girl_id` events server-side. Marked read-only with comment "admin connects".

### Requirement: ADMIN propojuje GCal za dívky (NE dívka sama) — connect UI musí být v ADMIN, ne ve Studiu
✅ **DONE** — Connect UI (`Propojit GCal` button + `Odpojit` form) is only in `admin/rezervace/page.tsx`. Studio page has no connect/disconnect UI, only a read-only GCal events section with message "Kontaktujte administrátora" on error.

### Requirement: Server Components, žádný 'use client'
✅ **DONE** — No `'use client'` in any of the 5 new/modified files. Existing `'use client'` files are pre-existing (NavCloseOnRoute, TranslateButton, admin/seo pages) — not introduced by this task.

### Requirement: Funguje bez JS
✅ **DONE** — Connect flow uses `<a href>` (GET), disconnect uses `<form method="POST">`. No JS required.

### Requirement: Prague timezone
✅ **DONE** — `TIMEZONE = 'Europe/Prague'` in `lib/gcal.ts` (line 7), used in GCal API query params. `formatTime()` uses `timeZone: 'Europe/Prague'` in both pages. `formatEventDate()` in studio page converts via Prague timezone.

### Requirement: force-dynamic on live pages
✅ **DONE** — Both `studio/kalendar/page.tsx` and `admin/rezervace/page.tsx` have `export const dynamic = 'force-dynamic'` and `revalidate = 0`.

### Requirement: Auth guard — only admin/manager can connect GCal
✅ **DONE** — `auth/route.ts` checks `user.role !== 'admin' && user.role !== 'manager'`. `disconnect/route.ts` does the same.

---

## Summary

| Check | Result |
|---|---|
| Simplify | Minor issues only (fragile date parsing, style inconsistency) |
| Build/TypeScript | PASSES — no errors |
| Reverse check | All requirements met |

### Issues to fix (prioritized)

**LOW** — `formatEventDate` in `studio/kalendar/page.tsx:42-45`: fragile `toLocaleString` → `new Date()` pattern. Not blocking, but could produce wrong dates in edge cases. Recommend replacing with `Intl.DateTimeFormat`.

**STYLE** — `admin/rezervace/page.tsx:44`: raw string passed to `db.execute()` instead of `{sql, args}` object. Consistent with codebase convention, but not blocking.

**INFO** — `callback/route.ts` trusts CSRF state alone (no `getCurrentUser()` call). Acceptable security model, but document it in a comment if not already clear.

---

**Overall verdict: APPROVED with minor notes.** No blockers. All key requirements satisfied. Build and types pass cleanly.
