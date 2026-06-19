# TASK-010: Admin panel fix — Implementation Report

## Changes Made

### 1. Renamed `proxy.ts` → `middleware.ts`
The `proxy.ts` middleware was NOT being included in the build output (middleware manifest was empty). Despite Next.js 16 deprecation warning recommending `proxy.ts`, the build system only populates the middleware manifest for `middleware.ts`. After rename, middleware manifest is correctly populated and the `x-pathname` header is now properly set by our code.

### 2. SESSION_SECRET production check (`lib/auth.ts`)
Added a production warning when `SESSION_SECRET` is not set. Without this, each serverless cold start generates a random secret, invalidating all existing sessions (users can never stay logged in).

**User action required:** Set `SESSION_SECRET` in Vercel env vars:
```bash
openssl rand -hex 32
```

### 3. Locale-aware auth redirects (`lib/auth.ts`, `lib/auth-actions.ts`)
Removed hardcoded `/cs/` prefix from all auth redirect calls:
- `requireAdmin()` — now detects locale from `x-pathname` header
- `requireFullAdmin()` — same
- `requireGirl()` — same
- `loginAdmin()` — same
- `loginGirl()` — same
- `logoutAction()` — same

### 4. Locale-aware admin action redirects (`lib/admin-actions.ts`)
Created `adminRedirect()` helper that reads locale from request and builds locale-prefixed path. Replaced all ~40 hardcoded `redirect('/cs/admin/...')` calls.

### 5. Locale-aware studio action redirects (`lib/studio-actions.ts`)
Created `studioRedirect()` helper, same pattern. Replaced all ~25 hardcoded `redirect('/cs/studio/...')` calls. Fixed a TypeScript narrowing issue with `file` nullability.

### 6. Locale-aware dashboard links (`app/[locale]/(admin)/admin/page.tsx`)
Fixed 3 hardcoded quick-action links to use `locale` from params.

### 7. Locale-aware admin page links (23 admin page files)
Replaced all `href="/cs/admin/..."` with `href={`/${locale}/admin/...`}` across all admin pages (divky, slevy, cenik, pobocky, blog, faq, aplikace).

## Files Changed

| File | Change |
|------|--------|
| `proxy.ts` → `middleware.ts` | Renamed (makes middleware actually run) |
| `lib/auth.ts` | SESSION_SECRET check + locale-aware redirects |
| `lib/auth-actions.ts` | Locale-aware login/logout redirects |
| `lib/admin-actions.ts` | `adminRedirect()` helper + all redirects |
| `lib/studio-actions.ts` | `studioRedirect()` helper + all redirects |
| `app/[locale]/(admin)/admin/page.tsx` | Locale-aware quick-action links |
| 23 admin page files | `href="/cs/admin/..."` → `href={`/${locale}/admin/...`}` |

## Build Status
- TypeScript: clean
- Build: successful
- Middleware manifest: populated (was empty before)

## User Actions Required
1. Set `SESSION_SECRET` in Vercel env vars (production)
2. Update `NEXT_PUBLIC_SITE_URL` to `https://www.lovelygirls.cz` in Vercel
3. Redeploy after env var changes
