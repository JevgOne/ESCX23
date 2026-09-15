# URGENTNI: /admin nefunguje — regrese z middleware fixu

**Datum:** 2026-08-30
**Task:** #13
**Priorita:** CRITICAL

---

## ROOT CAUSE

Middleware (commity 18adcfa, b18a9a2) zahazuje next-intl's request header `X-NEXT-INTL-LOCALE`.

### Co next-intl dela internne:
```js
// next-intl middleware (minified source):
const headers = new Headers(request.headers);
headers.set('X-NEXT-INTL-LOCALE', detectedLocale);  // e.g. 'en'
return NextResponse.rewrite(url, { request: { headers } });
//                                  ^^^^^^^^^^^^^^^^^^
//                    next-intl passes modified request headers
```

### Co nas middleware dela:
```ts
// middleware.ts (radek 17-25):
const requestHeaders = new Headers(request.headers);  // ORIGINAL request headers
requestHeaders.set('x-pathname', pathname);            // pridame x-pathname

const result = rewriteUrl
  ? NextResponse.rewrite(new URL(rewriteUrl), { request: { headers: requestHeaders } })
  : NextResponse.next({ request: { headers: requestHeaders } });
//                                             ^^^^^^^^^^^^^^
//              PREPISEME next-intl's request headers nasimi vlastnimi!
//              → X-NEXT-INTL-LOCALE JE ZTRACENA
```

### Dusledek:
1. next-intl server-side (`getRequestLocale()`) cte `headers().get('X-NEXT-INTL-LOCALE')`
2. Header chybi → vraci `undefined`
3. `getRequestConfig()` v `i18n/request.ts` fallbackne na `defaultLocale` ('en')
4. Ale URL muze byt pro jiny locale → **mismatch**
5. Muze zpusobit: spatny locale, chybejici preklady, error pri renderovani, nebo i **kompletni selhani stranky**

### Proc to postihuje /admin obzvlast:
- `/admin` (bez locale prefixu) → next-intl rewrite na `/en/admin`
- Rewrite se zachova (diky b18a9a2 fixu)
- ALE `X-NEXT-INTL-LOCALE` header chybi
- Admin layout pouziva `setRequestLocale(locale)` a `getTranslations()` ktere zavisejí na tomto headeru
- **Presna chyba zavisi na next-intl verzi** — muze byt 500 error, blank page, nebo redirect loop

---

## FIX

### Jediny spravny pristup: zachovat next-intl response a jen pridat x-pathname

Misto vytvareni NOVEHO response, pouzijeme **response primo z next-intl** a jen na nej pridame x-pathname. Problem z Task #3 (response headers se nepropagovaly do headers()) se resite tim, ze next-intl UZ propaguje headers pres `request: { headers }` — takze x-pathname musime pridat do TECHTO request headers.

### Soubor: `middleware.ts`

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Inject x-pathname into the original request headers BEFORE next-intl processes them.
  // next-intl copies request.headers into its response's request headers,
  // so our custom header will survive through next-intl's processing.
  request.headers.set('x-pathname', request.nextUrl.pathname);

  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
```

**PROBLEM:** `request.headers` v Next.js Edge Runtime MUZE byt readonly (Headers objekt z incoming request). Pokud `.set()` hodi error, potrebujeme alternativu.

### Alternativa pokud request.headers je readonly:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Let next-intl handle everything (locale detection, rewrites, redirects)
  const response = intl(request);

  // For redirects, return as-is
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // Add x-pathname to the response headers.
  // This is the simple approach — just set it on the response.
  // Server Components will read it via headers().
  response.headers.set('x-pathname', pathname);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
```

**POZOR:** Toto je v podstate navrat k puvodnimu kodu PRED Task #3 fixem. Puvodni "problem" z Task #3 (response headers se nepropagovaly do headers()) byl NEPLATNY — protoze next-intl's response UZ OBSAHUJE `{ request: { headers } }` s propagovanymi headery. Takze `response.headers.set('x-pathname', ...)` PRIDAVA response header, ale next-intl's **request** headers (vcetne X-NEXT-INTL-LOCALE) zustanou zachovany.

ALE: pokud `x-pathname` na response NENI dostupny v `headers()` (coz byl puvodni problem), musime ho pridat do next-intl's request headers:

### NEJLEPSI RESENI (doporucene):

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let next-intl handle locale detection, rewrites, redirects
  const response = intl(request);

  // For redirects, just return
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // next-intl already created a response with proper request headers
  // (including X-NEXT-INTL-LOCALE). We need to ADD x-pathname to those
  // same request headers without losing what next-intl set.
  //
  // The response from next-intl used: NextResponse.rewrite/next({ request: { headers } })
  // We can't easily modify the request headers after the fact.
  // 
  // APPROACH: Recreate the response, but start from next-intl's headers
  // instead of fresh request.headers.

  const rewriteUrl = response.headers.get('x-middleware-rewrite');

  // Get the request headers that next-intl set (includes X-NEXT-INTL-LOCALE)
  // Unfortunately, NextResponse doesn't expose the request headers it was
  // created with. We need to reconstruct them.
  
  // next-intl copies ALL original request headers + adds X-NEXT-INTL-LOCALE.
  // So: start with original request.headers, add X-NEXT-INTL-LOCALE ourselves,
  // and add x-pathname.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  // Detect locale the same way next-intl does (from the resolved locale)
  // The locale cookie or the response cookie tells us what locale was resolved
  const localeCookie = response.cookies.get('NEXT_LOCALE');
  const resolvedLocale = localeCookie?.value 
    ?? extractLocaleFromRewrite(rewriteUrl, pathname)
    ?? routing.defaultLocale;
  requestHeaders.set('X-NEXT-INTL-LOCALE', resolvedLocale);

  const result = rewriteUrl
    ? NextResponse.rewrite(new URL(rewriteUrl), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve response headers
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== 'x-middleware-rewrite' && lower !== 'x-middleware-next') {
      result.headers.set(key, value);
    }
  });

  // Preserve cookies
  for (const cookie of response.cookies.getAll()) {
    result.cookies.set(cookie);
  }

  return result;
}

function extractLocaleFromRewrite(rewriteUrl: string | null, pathname: string): string | null {
  // Try to extract locale from rewrite URL (e.g., /en/admin → 'en')
  const url = rewriteUrl ?? pathname;
  const match = url.match(/\/(en|cs|de|uk)\//);
  return match ? match[1] : null;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
```

### NEJJEDNODUSSI RESENI (pokud funguje):

Nejjednodussi fix je **nastavit `x-pathname` na request.headers pred volanim intl()**. V Next.js edge runtime je `request.headers` objekt `Headers` ktery BY MEL byt mutovatelny (na rozdil od Web API spec kde je readonly pro incoming requests, Next.js umoznuje mutaci):

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  request.headers.set('x-pathname', request.nextUrl.pathname);
  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
```

**DOPORUCUJI ZKUSIT TOTO PRVNI** — pokud `request.headers.set()` nehodi error, je to 3 radky a zachova VSECHNO co next-intl nastavuje.

---

## TESTOVACI PLAN (po fixu)

1. **`/admin`** → musi se zobrazit login nebo dashboard (ne 500/blank)
2. **`/cs/admin`** → stejne
3. **`/admin/login`** → login stranka
4. **`/cs/admin/login`** → login stranka
5. **`/pricing`** → cenik stranka (ne homepage)
6. **`/cs/cenik`** → cenik stranka
7. **`/girls`** → divky stranka
8. **`/studio`** → studio login/dashboard
9. **Language switcher:** na `/cs/cenik` kliknout EN → `/pricing` musi fungovat
10. **x-pathname v admin layout:** auth redirect musi fungovat

---

## SOUBORY K UPRAVE

| Soubor | Zmena |
|--------|-------|
| `middleware.ts` | Zachovat next-intl's request headers (X-NEXT-INTL-LOCALE) — viz reseni vyse |
