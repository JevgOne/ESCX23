# TASK-014: Implementace — Auth session expirace + remember me

## Datum: 2026-06-21

## Změněné soubory

### 1. `lib/auth.ts`
- Nahrazen `SESSION_MAX_AGE_DAYS = 30` za role-based `SESSION_MAX_AGE_SECONDS`: admin/manager 8h, girl 72h (3 dny)
- Přidána konstanta `REMEMBER_ME_MAX_AGE = 7 dní`
- `createToken()` nyní přijímá `maxAgeSeconds` parametr místo pevné hodnoty
- `setSession()` přijímá `remember` boolean (default `false`):
  - `remember=true`: cookie maxAge 7 dní, token expiration 7 dní
  - `remember=false`: session cookie (bez maxAge — browser zavře = session pryč), token expiration dle role

### 2. `lib/auth-actions.ts`
- `loginAdmin()`: čte `formData.get('remember')`, předává do `setSession()`
- `loginGirl()`: čte `formData.get('remember')`, předává do `setSession()`

### 3. `app/[locale]/(admin)/admin/login/page.tsx`
- Přidán CSS pro `.escx-login-remember` (checkbox label styling)
- Přidán HTML checkbox `<input type="checkbox" name="remember" />` s labelem "Zapamatovat si mě (7 dní)"

### 4. `app/[locale]/studio/login/page.tsx`
- Přidán inline-styled checkbox s labelem "Zapamatovat si mě (7 dní)"

## Chování po změně

| Scénář | Session trvání | Cookie typ |
|--------|---------------|------------|
| Admin login, bez remember | 8h token expiry | Session cookie (browser close = logout) |
| Manager login, bez remember | 8h token expiry | Session cookie |
| Studio login, bez remember | 72h token expiry | Session cookie |
| Jakýkoli login + remember me | 7d token expiry | Persistent cookie (maxAge 7d) |

## Ověření
- TypeScript kompilace: OK (tsc --noEmit bez chyb)
