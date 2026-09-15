# BUG FIX: Přepínač jazyků hází na homepage místo stejné stránky

**Datum:** 2026-08-30
**Priorita:** HIGH — user-facing bug

---

## ROOT CAUSE ANALYZA

### Problem
Kdyz uzivatel na strance (napr. `/cs/cenik`) prepne jazyk, je presmerovan na homepage (`/`) misto ocekavane stranky v jinem jazyce (napr. `/pricing`).

### Root cause
Middleware v `middleware.ts` nastavuje custom header `x-pathname` na **response** object:

```ts
// middleware.ts (radek 9-10)
const response = intl(request);
response.headers.set('x-pathname', originalPathname);  // BUG: na response!
```

`LanguageSwitcher.tsx` pak tento header cte pres `headers()`:

```ts
// LanguageSwitcher.tsx (radek 84)
const pathname = hdrs.get('x-pathname') ?? hdrs.get('next-url') ?? '/';
```

**V Next.js 15+/16 se headery nastavene na `response` v middleware NEPROPAGUJI do `headers()` v Server Components.** Spravny zpusob je nastavit headery na **request** pres `NextResponse.next({ request: { headers: ... } })`.

Protoze `x-pathname` nikdy nedorazi do Server Component, `hdrs.get('x-pathname')` vraci `null`, `hdrs.get('next-url')` taky `null`, a fallback `'/'` zpusobi ze vsechny language links smeruji na homepage.

### Proc to obcas funguje
Na nekterych stránkách/prostředích může `next-url` header existovat (nastavovaný Next.js interně), takže fallback `hdrs.get('next-url')` vrátí správnou hodnotu. Ale to není spolehlivé.

---

## PLAN OPRAVY

### Krok 1: Opravit middleware.ts

**Soubor:** `/Users/zen/Projects/ESCX23/middleware.ts`

**Soucasny kod:**
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;
  const response = intl(request);
  response.headers.set('x-pathname', originalPathname);
  return response;
}
```

**Novy kod:**
```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const originalPathname = request.nextUrl.pathname;

  // Set x-pathname on REQUEST headers so Server Components can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', originalPathname);

  // Let next-intl handle locale routing
  const response = intl(request);

  // If next-intl returns a redirect, pass it through as-is
  if (response.headers.get('location')) {
    return response;
  }

  // For non-redirect responses, create a new response with the modified request headers
  const newResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Copy any headers set by next-intl (cookies, etc.)
  response.headers.forEach((value, key) => {
    newResponse.headers.set(key, value);
  });

  return newResponse;
}
```

**POZOR:** Toto je hlavni fix. Ale je tu komplikace — `intl(request)` z next-intl muze vracet:
1. `NextResponse.next()` — rewrite (bezna navigace)
2. `NextResponse.redirect()` — redirect (napr. locale detection)

Pro redirect musi zustat redirect response. Pro next/rewrite musime zajistit ze request headers se propagují.

### Alternativni pristup (jednodussi, doporuceny):

Misto boje s response/request headers, **nastavit header na request PRED volanim intl()**:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Set x-pathname on request headers BEFORE intl processes it
  // This way it propagates through next-intl's internal handling
  request.headers.set('x-pathname', request.nextUrl.pathname);

  return intl(request);
}
```

**PROBLEM:** `request.headers` je v Next.js readonly (Headers objekt z incoming request). Nelze na nej primo zapisovat.

### Finalni doporuceny pristup:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = intl(request);

  // For redirects, just return as-is
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // For rewrites/next, rebuild with request header propagation
  const headers = new Headers(request.headers);
  headers.set('x-pathname', pathname);

  const result = NextResponse.next({
    request: { headers },
  });

  // Preserve next-intl's response headers (cookies for locale, etc.)
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'x-middleware-next') {
      result.headers.set(key, value);
    }
  });

  // Preserve next-intl's cookies
  for (const cookie of response.cookies.getAll()) {
    result.cookies.set(cookie);
  }

  return result;
}
```

### Krok 2: Overit LanguageSwitcher.tsx

**Soubor:** `/Users/zen/Projects/ESCX23/components/LanguageSwitcher.tsx`

Zadne zmeny nejsou potreba — logika generovani URL je spravna. Jakmile `x-pathname` bude spravne propagovan, switcher bude fungovat.

Ale doporucuji pridat robustnejsi fallback:

**Radek 84, zmenit z:**
```ts
const pathname = hdrs.get('x-pathname') ?? hdrs.get('next-url') ?? '/';
```

**Na:**
```ts
const pathname = hdrs.get('x-pathname')
  ?? hdrs.get('x-invoke-path')
  ?? hdrs.get('x-next-url')
  ?? hdrs.get('next-url')
  ?? '/';
```

Toto pridava vice fallbacku na Next.js interni headery, pro pripad ze by `x-pathname` nebylo dostupne.

### Krok 3: Overit ostatni mista kde se cte x-pathname

Vsechna mista co ctou `x-pathname` budou po oprave middleware fungovat:
- `lib/auth.ts:9`
- `lib/studio-actions.ts:14`
- `lib/admin-actions.ts:12`
- `lib/auth-actions.ts:9`
- `lib/apartment-review-actions.ts:12`
- `app/[locale]/layout.tsx:107`
- `app/[locale]/studio/layout.tsx:24`
- `app/[locale]/(admin)/admin/layout.tsx:43`
- `components/LanguageSwitcher.tsx:84`

---

## TESTOVACI SCENARE

Po implementaci overit:

1. **`/cs/cenik` → klik EN** → melo prejit na `/pricing`
2. **`/pricing` → klik CS** → melo prejit na `/cs/cenik`
3. **`/cs/divky` → klik DE** → melo prejit na `/de/maedchen`
4. **`/cs/profil/anna` → klik EN** → melo prejit na `/profile/anna`
5. **Homepage `/` → klik CS** → melo prejit na `/cs`
6. **`/cs/hashtag/blondynky-praha` → klik EN** → melo prejit na `/hashtag/blondynky-praha`
7. **`/cs/faq` → klik EN** → melo prejit na `/faq` (same for all locales)

---

## SOUBORY K UPRAVE

| Soubor | Zmena | Priorita |
|--------|-------|----------|
| `middleware.ts` | Prepsat propagaci x-pathname headeru z response na request | CRITICAL |
| `components/LanguageSwitcher.tsx` | Pridat robustnejsi fallback headery (optional) | NICE-TO-HAVE |

**Odhadovana slozitost:** Mala — zmena cca 15 radku v middleware.ts.
