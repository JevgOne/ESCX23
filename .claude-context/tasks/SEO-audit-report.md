# SEO Audit Report — www.lovelygirls.cz

**Datum:** 2026-06-14 | **Auditor:** planovac agent
**Metoda:** Kombinace live WebFetch produkce + analýza zdrojového kódu

---

## 1. CANONICAL URLs

### Live ověření (produkce)

| Stránka | Canonical tag | Počet | Stav |
|---------|--------------|-------|------|
| `/` (EN homepage) | `https://www.lovelygirls.cz/` | 1 | OK |
| `/cs` (CZ homepage) | `https://www.lovelygirls.cz/cs/` | 1 | OK |
| `/cs/profil/anetta` | `https://www.lovelygirls.cz/cs/profil/anetta` | 1 | OK |
| `/en/profile/anetta` | `https://www.lovelygirls.cz/profile/anetta` | 1 | OK |
| `/cs/rozvrh` | `https://www.lovelygirls.cz/cs/rozvrh` | 1 | OK |
| `/cs/faq` | `https://www.lovelygirls.cz/cs/faq` | 1 | OK |
| `/cs/divky` | `https://www.lovelygirls.cz/cs/divky` | 1 | OK |
| `/cs/cenik` | `https://www.lovelygirls.cz/cs/cenik` | 1 | OK |
| `/cs/blog` | `https://www.lovelygirls.cz/cs/blog` | 1 | OK |
| `/cs/recenze` | `https://www.lovelygirls.cz/cs/recenze` | 1 | OK |
| `/cs/o-nas` | `https://www.lovelygirls.cz/cs/o-nas` | 1 | OK |
| `/cs/kontakt` | `https://www.lovelygirls.cz/cs/kontakt` | 1 | OK |
| `/cs/podminky` | `https://www.lovelygirls.cz/cs/podminky` | 1 | OK |
| `/cs/soukromi` | `https://www.lovelygirls.cz/cs/soukromi` | 1 | OK |

**Verdikt:** EXCELLENT — Všechny canonical URL jsou správné, ukazují na `www.lovelygirls.cz`, žádné duplikáty.

### Architektura (kód)

Layout (`app/[locale]/layout.tsx:103`) injektuje `<link rel="canonical">` pro VŠECHNY veřejné stránky přes `getCanonicalForPath()`. Některé stránky navíc nastavují `alternates.canonical` v `generateMetadata()`. Next.js tyto tagy správně **deduplikuje** — v produkci je vždy jen 1 canonical tag.

**Severity:** NONE — funguje správně

---

## 2. HREFLANG TAGS

### Live ověření (produkce)

| Stránka | Počet hreflang tagů | Tagy | Stav |
|---------|-------------------|------|------|
| `/` (EN) | 5 | en, cs, de, uk, x-default | OK |
| `/cs` (CZ) | 5 | en, cs, de, uk, x-default | OK |
| `/cs/profil/anetta` | 5 | en, cs, de, uk, x-default | OK |
| `/en/profile/anetta` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/rozvrh` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/faq` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/blog` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/recenze` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/o-nas` | 5 | en, cs, de, uk, x-default | OK |
| `/cs/kontakt` | 5 | en, cs, de, uk, x-default | OK |

**TASK-012 hlásil 10 hreflang tagů na profilu — VYVRÁCENO:**
Live kontrola ukazuje přesně 5 tagů na profilu (cs, en, de, uk, x-default). Buď to byl falešně pozitivní nález, nebo byl mezitím opraven. Aktuální stav je správný.

### Správnost lokalizovaných cest

Hreflang URL jsou správně lokalizované (ověřeno na profilu):
- `en` → `/profile/anetta`
- `cs` → `/cs/profil/anetta`
- `de` → `/de/profil/anetta`
- `uk` → `/uk/profil/anetta`
- `x-default` → `/profile/anetta`

**Verdikt:** EXCELLENT — kompletní pokrytí, správné lokalizované cesty, žádné duplikáty.

**Severity:** NONE

---

## 3. OG TAGS (Open Graph)

### Live ověření (produkce)

| Stránka | og:title | og:description | og:url | og:image | og:locale | Stav |
|---------|----------|---------------|--------|----------|-----------|------|
| `/cs` (homepage) | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/` (EN homepage) | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/divky` | ANO | ANO | ANO | ANO | cs_CZ | OK |
| `/cs/cenik` | ANO | ANO | ANO | ANO | cs_CZ | OK |
| `/cs/rozvrh` | ANO | ANO | ANO | ANO | cs_CZ | OK |
| `/cs/blog` | ANO | ANO | ANO | ANO | cs_CZ | OK |
| `/cs/profil/anetta` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/en/profile/anetta` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/faq` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/recenze` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/o-nas` | ANO* | ANO* | CHYBI | ANO | cs_CZ | MEDIUM |
| `/cs/kontakt` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/podminky` | CHYBI | CHYBI | CHYBI | CHYBI | CHYBI | CRITICAL |
| `/cs/soukromi` | ANO* | ANO* | CHYBI | ANO | — | MEDIUM |

*`/cs/o-nas` má OG tagy přes `opengraph-image.tsx` (generované og:image), plus og:title/og:description z layout-level, ale chybí og:url.*
*`/cs/soukromi` má částečné OG (title, desc, image) ale chybí og:url a og:locale.*

### Kód vs. Produkce — rozpor!

**KLÍČOVÝ NÁLEZ:** Stránky jako homepage a profil MAJÍ `openGraph` v `generateMetadata()` v kódu, ALE v produkčním HTML se OG tagy NEOBJEVUJÍ.

**Příčina:** Pravděpodobně `applyDBOverride()` funkce nebo jiný mechanismus OG tagy potlačuje. Homepage kód (`page.tsx:52-60`) nastavuje openGraph s title, description, url, locale, images — ale v produkci nic z toho není v HTML.

**Doporučení:** Prioritně ověřit funkci `applyDBOverride()` — možná přemazává openGraph metadata pokud v DB existuje override bez OG polí, nebo se to ztratí v konfiguraci `metadataBase`.

### Stránky s chybějícím OG v KÓDU (záměrně nenastaveno)

| Stránka | V kódu má openGraph? |
|---------|---------------------|
| `/o-nas` | NE — jen `title` + `description` |
| `/kontakt` | NE — jen `title` + `description` |
| `/podminky` | NE — jen `title` + `description` + `robots: noindex` |
| `/soukromi` | NE — jen `title` + `description` + `robots: noindex` |
| `/sluzba/[slug]` | NE — jen `title` + `description` |

**Severity:** HIGH — Homepage a profily bez OG tagů v produkci je vážný problém pro social sharing. Potřeba zjistit proč se OG z kódu nerendruje.

---

## 4. SITEMAP.XML

### Live ověření (produkce)

- **Status:** 200 OK
- **Doména:** Všechny URL používají `https://www.lovelygirls.cz` — SPRÁVNĚ
- **Žádné staré URL:** Žádný výskyt `escx23.vercel.app`
- **Počet URL:** ~100+ (homepage × 4 locales, statické stránky × 4, profily × 4, lokace, služby, blog, hashtagy)
- **Image sitemap:** Profily obsahují image entries s absolutními URL na Vercel Blob storage
- **Hreflang alternates:** Zahrnuty v sitemap entries

### Chybějící stránky v sitemap

- `/join` (`/pridat-se`) — CHYBÍ (zvážit přidání)
- `/clenstvi/zadost` — CHYBÍ (záměrně — interní flow)

**Verdikt:** EXCELLENT

**Severity:** NONE (minor: přidat /join)

---

## 5. ROBOTS.TXT

### Live ověření (produkce)

- **Status:** 200 OK
- **User-agent pravidla:** 27 různých crawler pravidel — VÝBORNÉ
- **Allow:** Google, Bing, Seznam, SklikBot — povoleno vše
- **Disallow:** `/admin/`, `/studio/`, `/api/`, `/clen/`, parametry sort/filter
- **AI crawlers:** ChatGPT-User, Claude-SearchBot, Perplexity-User — povoleny
- **Training scrapers:** CCBot, anthropic-ai, Bytespider, Diffbot — blokováni
- **SEO bots:** SemrushBot, AhrefsBot, MJ12bot — blokováni
- **Crawl-delay:** 1s default, 2s GPTBot
- **Host:** `https://www.lovelygirls.cz`
- **Sitemap:** `https://www.lovelygirls.cz/sitemap.xml`

**TASK-012 hlásil "chybí User-agent" — VYVRÁCENO:** Live kontrola potvrzuje 27 User-agent deklarací. Původní nález byl falešně pozitivní (Playwright parsoval HTML wrapper místo raw textu).

**Verdikt:** EXCELLENT

**Severity:** NONE

---

## 6. LLMS.TXT

### Live ověření (produkce)

- **Status:** 200 OK
- **Doména:** Všechny URL používají `www.lovelygirls.cz` — SPRÁVNĚ
- **Pokrytí:** Homepage, pricing, FAQ, discounts, schedule, about, companions, blog
- **Lokalizované indexy:** CS, DE, UK varianty
- **Profil URL pattern:** Dokumentován
- **Key facts:** Hodiny, ceny, kontakt, právní info
- **AI permissions:** Povolena citace, zakázán trénink na fotkách

**Verdikt:** EXCELLENT

**Severity:** NONE

---

## 7. JSON-LD STRUCTURED DATA

### Live ověření (produkce)

| Stránka | Schema typy | Stav |
|---------|------------|------|
| `/cs` (homepage) | LocalBusiness, Organization, WebSite, AggregateRating | EXCELLENT |
| `/cs/profil/anetta` | Person (occupation, age, languages), BreadcrumbList | OK |
| `/cs/faq` | FAQPage (16 Q&A), BreadcrumbList | EXCELLENT |
| `/cs/cenik` | OfferCatalog (5 packages), BreadcrumbList | EXCELLENT |

### Kód (lib/seo/jsonld.ts)

- `homepageLocalBusiness()` — LocalBusiness/ProfessionalService
- `organizationJsonLd()` — Organization se social links
- `websiteJsonLd()` — WebSite se SearchAction
- `aggregateRatingJsonLd()` — AggregateRating
- `profilePersonJsonLd()` — Person se skills, languages, rating
- `faqPageJsonLd()` — FAQPage
- `breadcrumbListJsonLd()` — BreadcrumbList

### Známé drobnosti (LOW)

- SearchAction URL hardcoduje `/divky?q=` (česká cesta) — Google to zvládne přes redirect
- Person `@id` hardcoduje `/profil/` — OK, `@id` má být konzistentní canonical identifikátor

**Verdikt:** EXCELLENT

**Severity:** NONE

---

## 8. META TITLE / DESCRIPTION

### Live ověření (produkce)

| Stránka | `<title>` | `<meta description>` | Stav |
|---------|-----------|---------------------|------|
| `/` (EN) | ANO | CHYBI | WARN |
| `/cs` | nelze ověřit* | nelze ověřit* | CHECK |
| `/cs/divky` | ANO (lokalizovaný) | ANO | OK |
| `/cs/cenik` | ANO | ANO | OK |
| `/cs/profil/anetta` | ANO (`Anetta, 19 — Společnice Praha`) | CHYBI | WARN |
| `/en/profile/anetta` | ANO | CHYBI | WARN |
| `/cs/o-nas` | ANO | ANO | OK |
| `/cs/kontakt` | CHYBI** | CHYBI | CRITICAL |
| `/cs/podminky` | ANO | CHYBI | WARN |
| `/cs/soukromi` | ANO | ANO | OK |
| `/cs/rozvrh` | ANO | ANO | OK |
| `/cs/blog` | ANO | ANO | OK |
| `/cs/recenze` | ANO | ANO | OK |
| `/cs/faq` | ANO | ANO | OK |

*WebFetch extrakce nemusí zachytit všechny meta tagy z Next.js streaming output — potřeba ověřit curl/view-source.*
**Kontakt page — WebFetch nedetekoval title/description — může být falešně negativní.*

### Kód

Všechny stránky mají `generateMetadata()` s `title` a `description`. Kód je v pořádku — rozpor s produkcí může být způsoben:
1. `applyDBOverride()` potlačuje metadata
2. Next.js streaming/suspense timing
3. WebFetch parsování (ne vždy zachytí `<head>` kompletně)

**Doporučení:** Ověřit přes `curl -s URL | grep '<meta'` na serveru.

**Severity:** MEDIUM — meta description chybí na profilu a homepage v produkci, i když kód je správný

---

## 9. HARDCODED OLD URLs

### Kód (Grep analýza z předchozí audit fáze)

- `next.config.ts:28` — `escx23.vercel.app` v redirect pravidle — SPRÁVNĚ (JE to redirect)
- Žádný jiný zdrojový soubor neobsahuje `escx23.vercel.app`

### Produkce (live ověření)

- Sitemap: žádné staré URL
- robots.txt: Host = `www.lovelygirls.cz`
- llms.txt: všechny URL `www.lovelygirls.cz`
- Canonical tagy: všechny `www.lovelygirls.cz`
- Hreflang: všechny `www.lovelygirls.cz`

**Verdikt:** CLEAN — žádné úniky starých URL

**Severity:** NONE

---

## 10. X-ROBOTS-TAG HEADERS

### Kód (`next.config.ts:34-49`)

Aktuální pravidla:
- `/admin/:path*` — noindex, nofollow ✓
- `/studio/:path*` — noindex, nofollow ✓
- `/:locale/admin/:path*` — noindex, nofollow ✓

**Chybí:** `/:locale/studio/:path*`

Studio layout má `robots: { index: false }` v metadata, takže to funguje přes meta tag. X-Robots-Tag header je jen belt-and-suspenders.

**Fix:**
```ts
{
  source: '/:locale/studio/:path*',
  headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
},
```

**Severity:** LOW

---

## 11. DUPLICATE HREFLANG (TASK-012 nález)

**TASK-012 hlásil:** Profil má 10 hreflang tagů místo 5

**Live ověření:** Profil `/cs/profil/anetta` má přesně 5 hreflang tagů (cs, en, de, uk, x-default). Žádné duplikáty.

**Možné vysvětlení:**
- TASK-012 test mohl zachytit mezistav kde layout + page-level oba injikovaly hreflang
- Next.js deduplikace funguje správně
- Nebo to bylo od té doby opraveno

**Verdikt:** RESOLVED — aktuální stav je správný

---

## SOUHRN: Issues by Priority

### CRITICAL — Vyšetřit okamžitě

1. **OG tagy chybí na klíčových stránkách v PRODUKCI** (homepage, profily, FAQ, recenze, kontakt)
   - Kód nastavuje `openGraph` v `generateMetadata()` ale v produkčním HTML se neobjevuje
   - **Příčina k vyšetření:** `applyDBOverride()` nebo metadataBase konfigurace
   - **Dopad:** Social sharing (Facebook, Twitter, Telegram) zobrazí stránky bez preview

### MEDIUM — Opravit

2. **Meta description chybí na profilu v produkci** — kód je nastavuje ale v HTML nejsou
3. **Chybí OG v KÓDU** na: `/o-nas`, `/kontakt`, `/sluzba/[slug]`
   - Přidat `openGraph` s title, description, url, locale
4. **`/cs/kontakt` — možná chybí title/description** — potřeba ověřit curl

### LOW — Nice to have

5. **Chybí `/:locale/studio/:path*`** X-Robots-Tag v `next.config.ts`
6. **Přidat `/join` do sitemap** pokud má být crawlable
7. **Podminky + soukromi** mají `robots: noindex` — OK záměrně, ale nemají OG (nepotřebují)

### EXCELLENT — Žádná akce

- Canonical URLs — 1 tag, správná doména, všechny stránky
- Hreflang — 5 tagů, správné lokalizované cesty, žádné duplikáty
- Sitemap — kompletní, správná doména, image entries
- robots.txt — 27 crawler pravidel, správná politika
- llms.txt — kompletní, správná doména
- JSON-LD — LocalBusiness, Person, FAQPage, OfferCatalog, BreadcrumbList
- Žádné hardcoded staré URL

---

## Soubory k úpravě

| Soubor | Fix | Priorita |
|--------|-----|----------|
| `lib/seo/db-override.ts` | Vyšetřit zda nepotlačuje openGraph | CRITICAL |
| `app/[locale]/layout.tsx` | Zkontrolovat metadataBase | CRITICAL |
| `app/[locale]/o-nas/page.tsx` | Přidat `openGraph` do metadata | MEDIUM |
| `app/[locale]/kontakt/page.tsx` | Přidat `openGraph` do metadata | MEDIUM |
| `app/[locale]/sluzba/[slug]/page.tsx` | Přidat `openGraph` do metadata | MEDIUM |
| `next.config.ts` | Přidat `/:locale/studio/:path*` X-Robots-Tag | LOW |
| `app/sitemap.ts` | Přidat `/join` | LOW |
