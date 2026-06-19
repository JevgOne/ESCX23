# TASK-010: Admin panel fix — Implementation Plan

## Status of Previous Fixes
- Auth redirects already use `/cs/` prefix -- OK
- Domain migration in 13 files completed -- OK
- `NEXT_PUBLIC_SITE_URL` set on Vercel -- OK
- `middleware.ts` renamed from `proxy.ts` -- OK
- curl test on `/cs/admin/login` returns 200 -- OK
- GCal routes (`app/api/gcal/auth/route.ts`, `app/api/gcal/disconnect/route.ts`) already redirect to `/cs/admin/login` -- OK

## Remaining Issue: SESSION_SECRET in Production

### The Core Problem

**File:** `lib/auth.ts:25-27`

```ts
const SECRET =
  process.env.SESSION_SECRET ||
  'dev-secret-change-in-prod-' + Math.random().toString(36);
```

The Vercel production environment has `SESSION_SECRET=""` (confirmed in `.env.prod.local:8`, `.env.prod-check.local:8`, `.env.prod-pull.local:11` -- all show `SESSION_SECRET=""`).

Empty string is falsy in JavaScript, so the fallback `'dev-secret-change-in-prod-' + Math.random()` is used. `Math.random()` generates a **different value for every cold start / serverless function invocation**. This means:

1. User submits login form on `/cs/admin/login`
2. `loginAdmin` Server Action in `lib/auth-actions.ts` authenticates, calls `setSession()` which creates an HMAC-signed token with SECRET from instance A
3. Redirect to `/cs/admin` hits a different serverless instance B with different SECRET
4. `requireAdmin()` in admin layout calls `getCurrentUser()` -> `verifyToken()` -> HMAC check fails because SECRET differs
5. User is redirected back to `/cs/admin/login` -- infinite login loop

**This is the only blocker.** The login form renders (curl 200), the Server Action code is correct, the redirect paths are correct, the cookie settings are correct -- but the session token is signed with a random secret that changes per invocation.

### Fix

**Two-part fix:**

#### Part 1: Vercel Dashboard (USER ACTION REQUIRED)

The user must set `SESSION_SECRET` in Vercel production environment variables:

```bash
# Generate a strong secret
openssl rand -hex 32
```

Set this value as `SESSION_SECRET` in Vercel Dashboard -> Project Settings -> Environment Variables -> Production.

Then redeploy (any push or manual redeploy from dashboard).

#### Part 2: Code Hardening (IMPLEMENTOR)

Add a production guard in `lib/auth.ts` so this never silently fails again:

```ts
// lib/auth.ts lines 25-27, replace:
const SECRET =
  process.env.SESSION_SECRET ||
  'dev-secret-change-in-prod-' + Math.random().toString(36);

// with:
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET environment variable is required in production. ' +
    'Generate one with: openssl rand -hex 32'
  );
}
const SECRET = process.env.SESSION_SECRET || 'dev-secret-escx23-' + Math.random().toString(36);
```

This will cause the app to fail fast with a clear error message instead of silently creating broken sessions.

## Verification Checklist

After `SESSION_SECRET` is set on Vercel and the app is redeployed, verify:

### 1. Admin Login Flow
- [ ] Navigate to `https://www.lovelygirls.cz/cs/admin/login` -- login form renders
- [ ] Submit with `admin@lovelygirls.cz` / `Admin2026!` -- should redirect to `/cs/admin`
- [ ] Dashboard loads with stats cards and quick actions
- [ ] Session persists: refresh page, still logged in
- [ ] Navigate to sub-pages: `/cs/admin/divky`, `/cs/admin/recenze`, etc. -- all load without re-login

### 2. Admin Session Cookie
- [ ] DevTools -> Application -> Cookies: `escx23_session` cookie present
- [ ] Cookie domain: `www.lovelygirls.cz`
- [ ] Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`

### 3. Admin Server Actions (forms)
- [ ] Edit a girl profile (`/cs/admin/divky/{id}/edit`) -- save works, redirects back
- [ ] Approve/reject a review (`/cs/admin/recenze`) -- action works
- [ ] Any other form submission stays logged in after redirect

### 4. Admin Logout
- [ ] Click logout -> redirects to `/cs/admin/login`
- [ ] Going to `/cs/admin` without session -> redirects to `/cs/admin/login`

### 5. Studio Login Flow
- [ ] Navigate to `https://www.lovelygirls.cz/cs/studio/login`
- [ ] Submit with `anetta@lovelygirls.cz` / `Anetta2026!` -- should redirect to `/cs/studio`
- [ ] Studio dashboard loads
- [ ] Sub-pages work: `/cs/studio/fotky`, `/cs/studio/sluzby`, etc.

### 6. Wrong Credentials
- [ ] Admin login with wrong password -> redirects to `/cs/admin/login?error=invalid`, shows error message
- [ ] Studio login with wrong password -> same pattern

### 7. Cross-domain Redirect
- [ ] `https://lovelygirls.cz/cs/admin` (non-www) -> 301 to `https://www.lovelygirls.cz/cs/admin` -> login works
- [ ] `https://escx23.vercel.app/cs/admin` -> 301 to `https://www.lovelygirls.cz/cs/admin`

## Files to Modify

| File | Change |
|------|--------|
| `lib/auth.ts` | Add production guard for empty `SESSION_SECRET` (lines 25-27) |

**Total: 1 file, ~5 lines changed.**

## No Other Code Changes Needed

The rest of the auth system is correct:
- `lib/auth-actions.ts` -- Server Actions (`loginAdmin`, `loginGirl`, `logoutAction`) correctly call `authenticate()` + `setSession()` + `redirect()`
- `lib/auth.ts` -- `setSession()` cookie settings are correct (`httpOnly`, `secure` in prod, `sameSite: lax`, `path: /`)
- `lib/auth.ts` -- `verifyToken()` correctly validates HMAC signature + expiration
- Admin layout (`app/[locale]/(admin)/admin/layout.tsx`) -- correctly uses `requireAdmin()` and skips auth for login page via `x-pathname` header
- Studio layout (`app/[locale]/studio/layout.tsx`) -- correctly uses `requireGirl()` and skips for login page
- `middleware.ts` -- correctly sets `x-pathname` header
- `next.config.ts` -- redirects are correct
- All GCal API routes redirect to `/cs/admin/login` on auth failure -- correct
