# TASK-010: Admin panel fix na www.lovelygirls.cz — Implementation Plan

## Problem Analysis

After thorough code analysis, I identified **3 critical issues** and **2 minor issues** that can cause the admin panel to not work on the production domain `www.lovelygirls.cz`.

---

## Critical Issue 1: Empty `SESSION_SECRET` in Production

**Location:** `lib/auth.ts:25-27`

```ts
const SECRET =
  process.env.SESSION_SECRET ||
  'dev-secret-change-in-prod-' + Math.random().toString(36);
```

**Problem:** The Vercel production environment has `SESSION_SECRET=""` (empty string). An empty string is falsy in JS, so the fallback kicks in — but the fallback uses `Math.random()`, which generates a **different secret on every cold start / serverless invocation**. This means:
- User logs in, gets a session token signed with secret A
- Next request hits a different serverless instance with secret B
- Token verification fails → user is immediately redirected to login
- Login loop: user can never stay logged in

**Evidence:** All `.env.prod*.local` files show `SESSION_SECRET=""`.

**Fix:**
1. **Vercel Dashboard:** Set `SESSION_SECRET` to a strong, fixed value (e.g. `openssl rand -hex 32`) in the production environment variables.
2. **Code hardening (optional):** Add a startup check that throws if `SESSION_SECRET` is empty in production, so this never silently breaks again:

```ts
// lib/auth.ts
const SECRET = process.env.SESSION_SECRET;
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is required in production');
}
const SESSION_KEY = SECRET || 'dev-secret-change-in-prod-' + Math.random().toString(36);
```

**Priority:** BLOCKER — nothing works without this.

---

## Critical Issue 2: Hardcoded `/cs/` Locale Prefix in Auth Redirects

**Location:** `lib/auth.ts:119,132,134,142` and `lib/auth-actions.ts:13,17,27,31,39,41`

All redirect paths are hardcoded with `/cs/` prefix:
```ts
redirect('/cs/admin/login');        // auth.ts:119
redirect('/cs/admin');              // auth.ts:132
redirect('/cs/admin/login');        // auth.ts:134
redirect('/cs/studio/login');       // auth.ts:142
redirect('/cs/admin/login?error=invalid');  // auth-actions.ts:13
redirect('/cs/admin');              // auth-actions.ts:17
redirect('/cs/studio/login?error=invalid'); // auth-actions.ts:27
redirect('/cs/studio');             // auth-actions.ts:31
redirect('/cs/studio/login');       // auth-actions.ts:39
redirect('/cs/admin/login');        // auth-actions.ts:41
```

**Problem:** The i18n routing config uses `localePrefix: { mode: 'as-needed' }` with `defaultLocale: 'en'`. This means:
- English URLs don't have a prefix (e.g., `/admin/login`)
- Czech URLs use `/cs/admin/login`
- But auth always redirects to `/cs/...` regardless of the user's current locale

**Impact:** If someone navigates to `/admin/login` (English default), logs in, and the Server Action redirects to `/cs/admin`, they get bounced through the i18n middleware which may strip/change the prefix, potentially losing the session cookie context or causing a redirect loop on the `www.lovelygirls.cz` domain.

**Fix:** Make redirects locale-aware. The Server Actions and auth guards should detect the current locale and redirect accordingly:

```ts
// lib/auth.ts - requireAdmin
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    const hdrs = await headers();
    const pathname = hdrs.get('x-pathname') ?? '';
    const locale = pathname.match(/^\/(cs|en|de|uk)/)?.[1] ?? '';
    const prefix = locale ? `/${locale}` : '';
    redirect(`${prefix}/admin/login`);
  }
  return user;
}
```

Similar fix needed in `auth-actions.ts` — extract locale from the referrer or from the form data.

**Alternative simpler fix:** Since this is an admin panel that's only used in Czech, keep the `/cs/` prefix but ensure the cookie `path: '/'` works correctly with the domain redirect chain. However, the clean fix is locale-aware redirects.

**Priority:** HIGH — causes broken redirects for non-cs locales.

---

## Critical Issue 3: `NEXT_PUBLIC_SITE_URL` Points to Old Vercel Domain

**Location:** Vercel production environment variables

All production env files show:
```
NEXT_PUBLIC_SITE_URL="https://escx23.vercel.app"
```

But `next.config.ts` redirects `escx23.vercel.app` to `www.lovelygirls.cz` with a 301:
```ts
{
  source: '/:path*',
  has: [{ type: 'host', value: 'escx23.vercel.app' }],
  destination: 'https://www.lovelygirls.cz/:path*',
  permanent: true,
}
```

**Impact:** Any code that uses `NEXT_PUBLIC_SITE_URL` for canonical URLs, OG metadata, or sitemap will generate URLs pointing to `escx23.vercel.app`, which then 301-redirects. This doesn't directly break admin login but affects SEO and can confuse cookie domain handling.

**Fix:** Update `NEXT_PUBLIC_SITE_URL` in Vercel Dashboard to `https://www.lovelygirls.cz`.

**Priority:** HIGH — must fix alongside admin, affects all SEO.

---

## Minor Issue 1: Cookie Domain Not Set Explicitly

**Location:** `lib/auth.ts:57-63`

```ts
cookieStore.set(SESSION_COOKIE, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
});
```

**Analysis:** No `domain` is set on the cookie. By default, the browser sets the cookie domain to the exact host that sent the Set-Cookie header. Since `next.config.ts` redirects `lovelygirls.cz` (non-www) to `www.lovelygirls.cz`, if someone goes to `lovelygirls.cz/cs/admin/login`, they get redirected to `www.lovelygirls.cz/cs/admin/login` before the login form renders, so the cookie is set on `www.lovelygirls.cz`. This should work fine.

**Verdict:** No code change needed — the redirect happens before login, so cookie is always set on the correct `www` host. But worth verifying in testing.

**Priority:** LOW — likely not an issue, but test.

---

## Minor Issue 2: Hardcoded `/cs/admin/*` Links in Dashboard

**Location:** `app/[locale]/(admin)/admin/page.tsx:64,75,91`

```tsx
<a href="/cs/admin/verifikace" className="admin-quick-card">
<a href="/cs/admin/recenze" className="admin-quick-card">
<a href="/cs/admin/clenove" className="admin-quick-card">
```

**Problem:** Quick-action links in admin dashboard are hardcoded with `/cs/` prefix. If an admin navigates via English locale, these links jump to Czech.

**Fix:** Use the `locale` from params:
```tsx
<a href={`/${locale}/admin/verifikace`} className="admin-quick-card">
```

**Priority:** LOW — admin is used only in Czech currently, but should be fixed for consistency.

---

## Implementation Steps (ordered by priority)

### Step 1: Fix SESSION_SECRET (BLOCKER)
- **File:** `lib/auth.ts`
- **Action:** Add production safety check for empty `SESSION_SECRET`
- **Vercel:** User must set `SESSION_SECRET` env var in Vercel Dashboard (provide instructions)

### Step 2: Fix Auth Redirects to be Locale-Aware
- **Files:** `lib/auth.ts`, `lib/auth-actions.ts`
- **Action:** Extract locale from `x-pathname` header or pass via form data, use it in redirects
- **Impact:** 10 redirect calls need updating

### Step 3: Update NEXT_PUBLIC_SITE_URL
- **Action:** Vercel Dashboard — change to `https://www.lovelygirls.cz`
- **No code change needed**

### Step 4: Fix Hardcoded Dashboard Links
- **File:** `app/[locale]/(admin)/admin/page.tsx`
- **Action:** Replace hardcoded `/cs/admin/...` with `/${locale}/admin/...`

### Step 5: Test
- Test login flow on `www.lovelygirls.cz/cs/admin/login`
- Test session persistence (navigate between admin pages)
- Test logout and re-login
- Test studio login with `anetta@lovelygirls.cz`
- Verify cookies are set with correct domain and secure flag
- Test with English locale (no prefix) to confirm redirects work

---

## Vercel Dashboard Changes Required (user action)

The implementor cannot make these changes — the user must do them in the Vercel Dashboard:

1. **Set `SESSION_SECRET`** to a strong random value:
   ```bash
   openssl rand -hex 32
   # Example: a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
   ```

2. **Update `NEXT_PUBLIC_SITE_URL`** from `https://escx23.vercel.app` to `https://www.lovelygirls.cz`

3. **Update `GOOGLE_REDIRECT_URI`** from `https://escx23.vercel.app/api/gcal/callback` to `https://www.lovelygirls.cz/api/gcal/callback`

After setting env vars, redeploy.

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/auth.ts` | Add SESSION_SECRET production check; make `requireAdmin`, `requireFullAdmin`, `requireGirl` locale-aware |
| `lib/auth-actions.ts` | Make `loginAdmin`, `loginGirl`, `logoutAction` redirects locale-aware |
| `app/[locale]/(admin)/admin/page.tsx` | Fix hardcoded `/cs/admin/*` links to use `locale` param |

## Estimated Scope
- 3 files modified
- ~30 lines changed
- Low risk — auth logic stays the same, only redirect paths and env validation change
