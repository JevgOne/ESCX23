# FIX: Přepínač jazyků si pamatuje předchozí stránku po client-side navigaci

**Datum:** 2026-08-30
**Task:** #8
**Navazuje na:** Task #3 (x-pathname header propagace)

---

## ROOT CAUSE

`LanguageSwitcher` je Server Component ctouci `x-pathname` z request headeru. Tento header se nastavuje v middleware pri kazdem HTTP requestu. Ale pri **client-side navigaci** (soft navigation pres `<Link>`) se middleware NEVOLA — probiha jen client-side fetch RSC payloadu. Server Component v layoutu se sice re-renderuje na serveru, ale `headers()` stale vraci headery z puvodniho requestu (ktere browser poslal pri prvnim page load).

**Dusledek:** Uzivatel prijde na `/cs/cenik`, pak klikne na "Slevy" v menu (`<Link href="/slevy">`). Stranka se zmeni na slevy, ale LanguageSwitcher stale ma `x-pathname = '/cs/cenik'` a generuje language linky pro cenik misto slev.

---

## ANALYZA MOZNYCH RESENI

### Reseni A: Cely LanguageSwitcher jako 'use client'
- **Pro:** Jednoduche, `usePathname()` se automaticky aktualizuje pri navigaci
- **Proti:** Porusuje CLAUDE.md pravidlo "Server Component default". Ale LanguageSwitcher je maly leaf-component, neprodukuje velky bundle. Navic uz mame precedent s `NavCloseOnRoute` (taky `usePathname()` v layoutu).
- **Problem:** URL-building logika (SEGMENT_TO_KEY, findCanonicalKey, buildLocalizedHref) by musela byt v client bundle. Ale `routing` objekt je uz v client bundle kvuli `next-intl/navigation`.

### Reseni B: Server Component + Client wrapper pro aktualizaci href
- **Pro:** Server renderuje spravne HTML pro prvni load (SEO, no-JS). Client component pak jen aktualizuje href atributy.
- **Proti:** Slozitejsi, dva soubory, potencialni flash spatnych linku.

### Reseni C: Pouzit `<a>` misto `<Link>` v hlavni navigaci
- **Pro:** Full page reload = middleware se vzdy zavola = headery aktualni
- **Proti:** Horsi UX (pomalejsi navigace), nestandard.

### Reseni D: Force revalidation v layoutu
- **Pro:** Layout by se re-renderoval pri kazde navigaci
- **Proti:** Next.js App Router cachuje layout RSC payload — i s `headers()` se nezmeni pathname pri soft nav.

---

## DOPORUCENE RESENI: A (s hybrid fallbackem)

Predelat LanguageSwitcher na **'use client'** komponentu, ale zachovat **no-JS fallback** tim ze language linky budou vzdy `<a href>` (ne `<Link>`). Pri kliknuti na language link dojde vzdy k full page reload (coz je spravne — menicime jazyk = meni se cely obsah stranky).

### Proc 'use client' je tu opravnene:
1. CLAUDE.md povoluje `'use client'` pro interaktivni leaf-komponenty
2. Komponent MUSI reagovat na navigaci — to je inherentne client-side concern
3. Renderuje jen maly dropdown, ne celou stranku
4. Fallback bez JS: na serveru se vyrenderuji linky pro aktualni stranku (z prvniho requestu), coz je lepsi nez nic

---

## IMPLEMENTACNI PLAN

### Krok 1: Prepsat LanguageSwitcher.tsx na 'use client'

**Soubor:** `components/LanguageSwitcher.tsx`

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';

interface Props {
  currentLocale: string;
}

const LABELS: Record<Locale, string> = {
  en: 'EN',
  cs: 'CS',
  de: 'DE',
  uk: 'UK',
};

const FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  cs: '🇨🇿',
  de: '🇩🇪',
  uk: '🇺🇦',
};

// Map any localized URL segment → canonical key (e.g. /girls → /divky)
const SEGMENT_TO_KEY: Record<string, string> = {};
for (const [key, val] of Object.entries(routing.pathnames)) {
  if (typeof val === 'string') {
    SEGMENT_TO_KEY[val] = key;
  } else {
    for (const localized of Object.values(val as Record<string, string>)) {
      SEGMENT_TO_KEY[localized] = key;
    }
  }
}

function stripLocale(path: string): string {
  for (const loc of routing.locales) {
    if (path === `/${loc}` || path.startsWith(`/${loc}/`)) {
      return path.replace(new RegExp(`^/${loc}`), '') || '/';
    }
  }
  return path;
}

function findCanonicalKey(strippedPath: string): { key: string; params: Record<string, string> } {
  if (SEGMENT_TO_KEY[strippedPath]) return { key: SEGMENT_TO_KEY[strippedPath], params: {} };
  for (const [seg, key] of Object.entries(SEGMENT_TO_KEY)) {
    if (!seg.includes('[')) continue;
    const paramNames: string[] = [];
    const pattern = seg.replace(/\[([^\]]+)\]/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const m = strippedPath.match(new RegExp('^' + pattern + '$'));
    if (m) {
      const params: Record<string, string> = {};
      paramNames.forEach((n, i) => { params[n] = m[i + 1] ?? ''; });
      return { key, params };
    }
  }
  return { key: strippedPath, params: {} };
}

function buildLocalizedHref(canonicalKey: string, params: Record<string, string>, targetLocale: Locale): string {
  const def = routing.pathnames[canonicalKey as keyof typeof routing.pathnames];
  let template: string;
  if (def == null) {
    template = canonicalKey;
  } else if (typeof def === 'string') {
    template = def;
  } else {
    const localized = (def as Record<string, string>)[targetLocale];
    template = localized ?? canonicalKey;
  }
  let result = template;
  for (const [name, val] of Object.entries(params)) {
    result = result.replace(`[${name}]`, val);
  }
  const prefix = targetLocale === routing.defaultLocale ? '' : `/${targetLocale}`;
  return (prefix + result) || '/';
}

export default function LanguageSwitcher({ currentLocale }: Props) {
  const pathname = usePathname();  // Aktualizuje se pri KAZDE navigaci
  const stripped = stripLocale(pathname);
  const { key: canonicalKey, params } = findCanonicalKey(stripped);
  const activeLoc = currentLocale as Locale;

  return (
    <details className="lang-switcher" aria-label="Language">
      <summary className="lang-switcher-summary">
        <span aria-hidden className="lang-chip-flag">{FLAGS[activeLoc]}</span>
        <span className="lang-chip-label">{LABELS[activeLoc]}</span>
        <svg className="lang-switcher-chev" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="lang-switcher-menu" role="menu">
        {routing.locales.map((loc) => {
          const isActive = loc === currentLocale;
          const href = buildLocalizedHref(canonicalKey, params, loc);
          return (
            <a
              key={loc}
              href={href}
              hrefLang={loc}
              aria-current={isActive ? 'true' : undefined}
              role="menuitem"
              className={`lang-chip${isActive ? ' lang-chip-active' : ''}`}
            >
              <span aria-hidden className="lang-chip-flag">{FLAGS[loc]}</span>
              <span className="lang-chip-label">{LABELS[loc]}</span>
            </a>
          );
        })}
      </div>
    </details>
  );
}
```

### Krok 2: Upravit importy v SiteHeader.tsx a Topbar.tsx

Zadne zmeny v importech nejsou potreba — oba soubory importuji `LanguageSwitcher` defaultne, a zmena z async Server Component na Client Component je zpetne kompatibilni. 

**ALE:** SiteHeader.tsx je `async function` (Server Component). Pouziti Client Component LanguageSwitcher uvnitr je OK — to je standardni Server/Client boundary pattern.

Jedina zmena: SiteHeader a Topbar predavaji `locale` jako prop — to zustava stejne.

### Krok 3: Overit ze middleware fix z Task #3 je taky implementovan

Middleware fix (x-pathname na request headers) je stale potreba pro ostatni mista v codebase co ctou `x-pathname` (auth, admin layout, studio layout). Ale LanguageSwitcher ho uz nebude potrebovat — pouziva `usePathname()`.

---

## CO SE MENI A CO NE

| Aspekt | Pred | Po |
|--------|------|----|
| LanguageSwitcher typ | Server Component (async) | Client Component ('use client') |
| Zdroj pathname | `headers().get('x-pathname')` | `usePathname()` (react to navigation) |
| Aktualizace pri navigaci | NE (stale header) | ANO (usePathname hook) |
| SSR initial render | Server-rendered HTML | Server-rendered HTML (hydrated) |
| Bez JS | Linky z prvniho requestu | Linky z prvniho requestu (same) |
| `<a href>` vs `<Link>` | `<a href>` (full reload) | `<a href>` (full reload) — ZACHOVANO |
| Bundle size impact | 0 | Minimalni (~2KB — routing config + helper funkce) |

---

## SOUBORY K UPRAVE

| Soubor | Zmena |
|--------|-------|
| `components/LanguageSwitcher.tsx` | Kompletni prepis: pridat 'use client', nahradit headers() za usePathname(), odebrat async |
| `middleware.ts` | Fix z Task #3 (x-pathname na request headers) — pro ostatni konzumenty |

---

## TESTOVACI SCENARE

1. **Navigace a switch:** `/cs/cenik` → klik "Slevy" v menu → klik EN v language switcher → melo prejit na `/discounts` (NE `/pricing`)
2. **Primo na strance:** Nacist `/cs/slevy` primo → klik EN → melo prejit na `/discounts`
3. **Dynamicke stranky:** `/cs/profil/anna` → klik na jiny profil `/cs/profil/bella` → klik EN → melo prejit na `/profile/bella`
4. **Homepage:** `/cs` → klik EN → melo prejit na `/`
5. **Bez JS:** Nacist stranku s vypnutym JS → language linky by mely ukazovat na spravne URL (z initial server renderu)
6. **Vicenasobna navigace:** Kliknout postupne na 3+ ruzne stranky, pak prepnout jazyk — musi ukazovat posledni navstivenou stranku
