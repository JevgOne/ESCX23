# QA Report — Task #4: Střední SEO bugy (BUG-5, BUG-7, BUG-8, BUG-9, NOTE-1)

**Datum:** 2026-09-03
**Kontrolor:** kontrolor agent
**Zadání:** Review implementace BUG-5, BUG-7, BUG-8, BUG-9, NOTE-1 z TASK-012

---

## 1. Simplify — čistota kódu

### `lib/seo/jsonld.ts` — profilePersonJsonLd (BUG-5)
- Funkce má `locale = 'cs'` jako default parametr ✅
- Řádek 154: `const profileUrl = locale === 'en' ? \`${BASE}/profile/${slug}\` : \`${BASE}/${locale}/profil/${slug}\``
- Logika je čistá, přímočará
- Poznámka: Pro DE a UK vrací `/de/profil/` a `/uk/profil/` — správné

### `app/[locale]/blog/page.tsx` — siteName locale-aware (BUG-7)
- Řádek 40: `siteName: locale === 'cs' ? 'LovelyGirls Praha' : locale === 'de' ? 'LovelyGirls Prag' : locale === 'uk' ? 'LovelyGirls Прага' : 'LovelyGirls Prague'`
- Inline ternary řetěz — funkční, ale mohl by použít BRAND objekt (který existuje v blog/[slug]/page.tsx)
- Řádek 41: `locale: locale === 'cs' ? 'cs_CZ' : locale === 'de' ? 'de_DE' : locale === 'uk' ? 'uk_UA' : 'en_US'` — mohlo by použít `ogLocale()` helper
- Toto je mírná nečistota (NOTE-1 částečně splněno jen v [slug], ne v listing), ale funkčně správné

### `app/[locale]/blog/[slug]/page.tsx` — BlogPosting JSON-LD + ogLocale (BUG-8, NOTE-1)
- Rozsáhlý `articleSchema` objekt (řádky 187–237) — správně strukturovaný BlogPosting
- `BRAND` objekt (řádky 20–25) — čistý locale-aware brand lookup
- `LANG_MAP` (řádek 185) pro JSON-LD `inLanguage` — správné
- OG: `locale: ogLocale(locale)` (řádek 72) — ✅ používá helper
- OG: `siteName: brand` (řádek 71) — ✅ locale-aware
- Kód je o něco delší, ale strukturovaný a čitelný

### `app/[locale]/rozvrh/page.tsx` — canonical zjednodušení (BUG-9)
- Řádek 102: `const canonical = getCanonicalUrl(locale, '/rozvrh');`
- Řádek 106: `return applyDBOverride(\`/${locale}/rozvrh\`, {` — obsahuje `canonical` v metadatech
- `CANONICAL_PATH` mapping (řádky 33–38) stále existuje pro jiné účely (redirect, basePath, breadcrumb)
- Metadata canonical správně používá `getCanonicalUrl(locale, '/rozvrh')` — OK

**Simplify verdict: PASS s poznámkou** — blog/page.tsx (listing) používá inline ternary místo helperu `ogLocale()` — funkční, ale nekonzistentní s `[slug]/page.tsx`. Není blocker.

---

## 2. Debug — technické ověření

### TypeScript check (`npx tsc --noEmit`)
- **Produkční kód: 0 chyb** ✅
- Pouze `e2e/tests/full-test.spec.ts(26)` — nesouvisí s implementací

### BUG-5: profilePersonJsonLd locale-aware URL — ověření

`lib/seo/jsonld.ts:154`:
```typescript
const profileUrl = locale === 'en' ? `${BASE}/profile/${slug}` : `${BASE}/${locale}/profil/${slug}`;
```

Výsledky pro jednotlivé locale:
| locale | profileUrl |
|--------|-----------|
| `en` | `https://www.lovelygirls.cz/profile/{slug}` ✅ |
| `cs` | `https://www.lovelygirls.cz/cs/profil/{slug}` ✅ |
| `de` | `https://www.lovelygirls.cz/de/profil/{slug}` ✅ |
| `uk` | `https://www.lovelygirls.cz/uk/profil/{slug}` ✅ |

- Funkce `getProfileCanonical()` v `lib/seo/meta.ts` (řádky 99–107) dělá totéž — mapování je konzistentní
- **BUG-5: OPRAVENO ✅**

### BUG-7: Blog listing siteName locale-aware — ověření

`app/[locale]/blog/page.tsx:40`:
```typescript
siteName: locale === 'cs' ? 'LovelyGirls Praha' : locale === 'de' ? 'LovelyGirls Prag' : locale === 'uk' ? 'LovelyGirls Прага' : 'LovelyGirls Prague'
```

- CS → `LovelyGirls Praha` ✅
- DE → `LovelyGirls Prag` ✅
- UK → `LovelyGirls Прага` ✅
- EN (default) → `LovelyGirls Prague` ✅
- **BUG-7: OPRAVENO ✅**

### BUG-8: Blog article — BlogPosting JSON-LD — ověření

`app/[locale]/blog/[slug]/page.tsx`:
- `articleSchema` (řádky 187–237): `@type: 'BlogPosting'` ✅
- `@id`, `headline`, `description`, `author`, `datePublished`, `dateModified` ✅
- `mainEntityOfPage`, `publisher` (locale-aware `brand`) ✅
- `inLanguage` via `LANG_MAP` ✅
- `wordCount`, `timeRequired`, `image` (conditional) ✅
- `keywords`, `articleSection`, `about` (conditional na tags) ✅
- `hasPart` pro TOC headings (conditional) ✅
- `speakable` spec ✅
- `potentialAction: ReadAction` ✅
- FAQSchema (conditional na FAQ obsah z HTML) ✅
- WebPage schema + BreadcrumbList schema ✅
- Všechny 3–4 JSON-LD bloky renderovány v `<script type="application/ld+json">` ✅
- **BUG-8: OPRAVENO ✅**

### BUG-9: Rozvrh — canonical zjednodušení — ověření

`app/[locale]/rozvrh/page.tsx:102`:
```typescript
const canonical = getCanonicalUrl(locale, '/rozvrh');
```

- Používá interní cestu `/rozvrh` — `getCanonicalUrl` interně volá `localizedPath()` která vrátí `/rozvrh`, `/schedule`, `/zeitplan`, `/rozklad` dle locale ✅
- `applyDBOverride` s `canonical` v `alternates` a `openGraph.url` ✅
- `CANONICAL_PATH` mapping zachován pouze pro: redirect logiku (řádek 146), `basePath` pro UI komponenty (řádek 171), breadcrumb path (řádek 174) — legitimní použití
- **BUG-9: OPRAVENO ✅**

### NOTE-1: Blog article — ogLocale() helper — ověření

`app/[locale]/blog/[slug]/page.tsx:72`:
```typescript
locale: ogLocale(locale),
```

- ✅ Používá `ogLocale()` helper z `@/lib/seo/meta`
- Import přítomen (řádek 2): `import { localePrefix, localeHref, ogLocale } from '@/lib/seo/meta';`
- **NOTE-1: OPRAVENO ✅** (v blog [slug] page)

**Poznámka:** Blog listing page (`app/[locale]/blog/page.tsx:41`) stále používá inline ternary pro `locale` v OG, místo `ogLocale()`. Toto bylo pravděpodobně mimo scope fixu (NOTE-1 odkazuje na `[slug]/page.tsx`). Není blocker.

**Debug verdict: PASS**

---

## 3. Reverzní kontrola — zadání vs. implementace

| Bug | Zadání (TASK-012-full-web-audit.md §2.2) | Implementace | Shoda |
|-----|------------------------------------------|--------------|-------|
| BUG-5 | profilePersonJsonLd — přidat locale param, použít správné URL pro EN vs CS | `locale` param přidán, EN→`/profile/`, ostatní→`/{locale}/profil/` | ✅ |
| BUG-7 | Blog listing siteName hardcoded `LovelyGirls Praha` → locale-aware | siteName použije ternary mapování cs/de/uk/en | ✅ |
| BUG-8 | Blog article — přidat BlogPosting JSON-LD | Komplexní articleSchema + FAQSchema + WebPage + Breadcrumb | ✅ |
| BUG-9 | Rozvrh — použít `getCanonicalUrl(locale, '/rozvrh')` místo vlastního CANONICAL_PATH v metadatech | `getCanonicalUrl(locale, '/rozvrh')` použito v canonical | ✅ |
| NOTE-1 | Blog article — použít `ogLocale()` helper místo inline ternary | `ogLocale(locale)` použito v `[slug]/page.tsx` | ✅ |

**Reverzní kontrola verdict: PASS**

---

## Celkový výsledek

| Kontrola | Výsledek |
|----------|----------|
| 1. Simplify | PASS (drobná nečistota v blog listing — mimo scope) |
| 2. Debug | PASS — 0 TS chyb v produkčním kódu |
| 3. Reverzní kontrola | PASS — všechny bugy odpovídají zadání |

**CELKOVÝ VERDICT: APPROVED — všechny střední SEO bugy správně implementovány.**

### Drobné poznámky (neblokující)
1. `app/[locale]/blog/page.tsx` listing stále používá inline ternary pro `ogLocale` a `siteName` — NOTE-1 fix byl aplikován pouze na `[slug]/page.tsx` (dle zadání), listing je mimo scope
2. `CANONICAL_PATH` mapping v rozvrh page je zachován pro UI logiku — správné rozhodnutí, metadata canonical je oddělené
3. TS chyba v `e2e/tests/full-test.spec.ts:26` přetrvává — nesouvisí s touto implementací
