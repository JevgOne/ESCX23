# BUG: /cs/cenik → EN → "/" místo "/pricing"

**Datum:** 2026-08-30
**Task:** z team-lead

---

## ANALYZA

### Je logika LanguageSwitcheru spravna?

**ANO.** Overeno runtime testem (npx tsx). SEGMENT_TO_KEY mapovani i buildLocalizedHref produkuji spravne vysledky pro VSECHNY vstupy:

```
/cs/cenik  → stripped: /cenik → key: /cenik → EN: /pricing  ✓
/cs/slevy  → stripped: /slevy → key: /slevy → EN: /discounts ✓
/pricing   → stripped: /pricing → key: /cenik → CS: /cs/cenik ✓
/cenik     → stripped: /cenik → key: /cenik → EN: /pricing  ✓
```

**Problem NENI v URL generovani.** LanguageSwitcher generuje `/pricing` spravne.

### Kde je skutecny problem?

**V middleware.ts** — fix z Task #3 rozbil next-intl rewrite mechanismus.

#### Jak next-intl middleware funguje:
S `localePrefix: 'as-needed'` a `defaultLocale: 'en'` a lokalizovanymi `pathnames`:
- `/cs/cenik` → next-intl **rewrite** na `/cs/cenik` (internal route) — beze zmeny
- `/pricing` → next-intl **rewrite** na `/en/cenik` (protoze filesystem ma `app/[locale]/cenik/page.tsx`, ne `app/[locale]/pricing/page.tsx`)
- `/discounts` → next-intl **rewrite** na `/en/slevy`

Next-intl pouziva `NextResponse.rewrite()` pro tuto transformaci. Rewrite se propaguje pres header `x-middleware-rewrite`.

#### Co udelal Task #3 fix:
```ts
// Aktualni middleware.ts (po Task #3 fixu)
const response = intl(request);  // response je NextResponse.rewrite(...)
if (response.status >= 300 && response.status < 400) return response;

// PROBLEM: Vytvorime NOVY NextResponse.next() — tim ZAHODIME rewrite!
const result = NextResponse.next({ request: { headers: requestHeaders } });
// Kopirujeme headery, ale x-middleware-rewrite se nekopiruje spravne
```

`NextResponse.next()` != `NextResponse.rewrite()`. Rewrite ma interni URL target ktery se ztrati.

#### Proc /cs/cenik → EN nefunguje ale /cs/slevy → EN ano?

Moznosti:
1. **Obe nefunguji** — uzivatel si nevsiml, nebo slevy testoval jinak (full reload vs soft nav)
2. **Next.js caching** — pokud slevy byly navstiveny drive (pred fixem middleware), RSC payload muze byt zcachovany se spravnymi URL
3. **Nahodne** — oba by mely selhat stejne, protoze oba EN URL (/pricing, /discounts) vyzaduji rewrite

NEJPRAVDEPODOBNEJSI: **oba nefunguji konzistentne** ale uzivatel nahlasil jen cenik. Nebo: pri kliknuti na `/pricing` browser posle request, middleware ho nerewrites na `/en/cenik`, Next.js nenajde route `/pricing` → redirect/fallback na homepage `/`.

---

## ROOT CAUSE

**Middleware z Task #3 zahazuje next-intl rewrite.** Kdyz uzivatel klikne na language link `/pricing`:
1. Browser posle GET /pricing
2. Middleware: `intl(request)` vraci `NextResponse.rewrite('/en/cenik')` 
3. Middleware: vytvorí novy `NextResponse.next()` — **rewrite zahozena**
4. Next.js hleda `app/[locale]/pricing/page.tsx` — NEEXISTUJE
5. Next.js fallback → homepage `/` nebo 404

Pro CS URL (`/cs/cenik`) toto neni problem protoze `/cs/cenik` matchne `app/[locale]/cenik/page.tsx` primo (segment `cenik` = slozka `cenik`).

Pro EN URL (`/pricing`) JE problem protoze `/pricing` nematchne zadnou slozku ve filesystemu.

---

## FIX PLAN

### Soubor: `middleware.ts`

Opravit tak aby zachoval next-intl rewrite response a jen pridala request header:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Set x-pathname on request headers BEFORE passing to intl
  // This way the header propagates through next-intl's response
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Create a modified request with the new headers
  // We need to pass this to intl so the header reaches Server Components
  const modifiedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
    // @ts-expect-error - NextRequest accepts these in practice
    nextConfig: request.nextUrl,
  });

  return intl(modifiedRequest);
}
```

**PROBLEM:** `NextRequest` constructor je komplikovany a `intl()` funkce ocekava spravny NextRequest objekt. Tento pristup nemusi fungovat.

### LEPSI FIX — pouzit next-intl response a jen pridat request header:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = intl(request);

  // Preserve the ORIGINAL response from next-intl (including rewrites!)
  // Just add our custom header for Server Components
  response.headers.set('x-pathname', pathname);

  return response;
}
```

**POZOR:** Toto je vlastne navrat k PUVODNIMU kodu (pred Task #3 fixem). Problem z Task #3 byl ze response headery se "nepropaguji do headers() v Server Components".

ALE — ted kdyz LanguageSwitcher pouziva `usePathname()` misto `headers()`, x-pathname header uz NENI potreba pro LanguageSwitcher. 

**OTAZKA:** Kdo jiny jeste cte `x-pathname`? Pojdme to overit:

- `lib/auth.ts:9` — cte pathname pro auth check
- `lib/studio-actions.ts:14` — cte pro redirect
- `lib/admin-actions.ts:12` — cte pro redirect  
- `lib/auth-actions.ts:9` — cte pro redirect
- `lib/apartment-review-actions.ts:12` — cte pro redirect
- `app/[locale]/layout.tsx:107` — cte pro isProtectedArea check
- `app/[locale]/studio/layout.tsx:24` — cte pro auth redirect
- `app/[locale]/(admin)/admin/layout.tsx:43` — cte pro auth redirect
- `components/admin/AdminSidebar.tsx:37` — pouziva `x-invoke-path`
- `components/studio/StudioSidebar.tsx:34` — pouziva `x-invoke-path`

Tato mista STALE potrebuji `x-pathname` header. A protoze jsou to Server Components/server actions (ne client components), `headers()` JE spravny zpusob jak ho cist.

### FINALNI FIX — kombinace obou pristupu:

Musime zachovat next-intl response (vcetne rewrite) a ZAROVEN propagovat x-pathname header pres request:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let next-intl handle locale routing (rewrites, redirects, cookies)
  const response = intl(request);

  // For redirects, return as-is (no need to set headers)
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  // CRITICAL: We must preserve next-intl's rewrite!
  // The response may be NextResponse.rewrite() which includes x-middleware-rewrite header.
  // We need to keep this response intact.

  // Get the rewrite URL from the response (if any)
  const rewriteUrl = response.headers.get('x-middleware-rewrite');

  if (rewriteUrl) {
    // next-intl did a rewrite — create new rewrite response with our request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    const result = NextResponse.rewrite(new URL(rewriteUrl), {
      request: { headers: requestHeaders },
    });

    // Copy response headers (except internal middleware ones)
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== 'x-middleware-rewrite' && lower !== 'x-middleware-next') {
        result.headers.set(key, value);
      }
    });

    // Copy cookies
    for (const cookie of response.cookies.getAll()) {
      result.cookies.set(cookie);
    }

    return result;
  }

  // No rewrite — just NextResponse.next() with request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const result = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'x-middleware-next') {
      result.headers.set(key, value);
    }
  });

  for (const cookie of response.cookies.getAll()) {
    result.cookies.set(cookie);
  }

  return result;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|favicon|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\..*).*)'],
};
```

---

## SOUBORY K UPRAVE

| Soubor | Zmena |
|--------|-------|
| `middleware.ts` | Zachovat next-intl rewrite (x-middleware-rewrite header) pri vytvareni noveho response |

**Zmeny v LanguageSwitcher NEJSOU POTREBA** — URL logika je spravna.

---

## TESTOVACI SCENARE

1. **EN lokalizovane URL:** Nacist `/pricing` → stranka se musi zobrazit (ne homepage/404)
2. **EN lokalizovane URL 2:** Nacist `/discounts` → stranka se musi zobrazit
3. **EN lokalizovane URL 3:** Nacist `/girls` → stranka se musi zobrazit
4. **CS URL s prepnutim na EN:** Na `/cs/cenik` kliknout EN → `/pricing` se musi nacist spravne
5. **CS URL s prepnutim na DE:** Na `/cs/cenik` kliknout DE → `/de/preise` se musi nacist spravne
6. **Dynamicke stranky:** `/cs/profil/anna` → EN → `/profile/anna` musi fungovat
7. **x-pathname v admin:** `/cs/admin/divky` → layout musi spravne detekovat isProtectedArea
8. **Studio auth:** `/cs/studio` → auth redirect musi fungovat (cte x-pathname)
