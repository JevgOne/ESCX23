# TASK-012: Kompletní audit webu www.lovelygirls.cz

**Datum:** 2026-09-03
**Status:** Plán hotový, čeká na implementaci

---

## 1. STRÁNKY — Přehled všech route

### 1.1 Veřejné stránky (app/[locale]/...)

| Route (interní) | CS | EN | DE | UK | Canonical | Hreflang | OG:url | JSON-LD |
|---|---|---|---|---|---|---|---|---|
| `/` (homepage) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (getAlternates) | ✅ | ✅ LocalBusiness + Organization + WebSite + FAQ |
| `/divky` | `/divky` | `/girls` | `/maedchen` | `/divchata` | ✅ | ✅ (getAlternates) | ✅ | ✅ CollectionPage + Breadcrumb |
| `/profil/[slug]` | `/profil/X` | `/profile/X` | `/profil/X` | `/profil/X` | ✅ | ✅ (getProfileAlternates) | ✅ | ✅ Person + Breadcrumb |
| `/cenik` | `/cenik` | `/pricing` | `/preise` | `/tsiny` | ✅ | ✅ (getAlternates) | ✅ | ✅ OfferCatalog + Breadcrumb + FAQ |
| `/rozvrh` | `/rozvrh` | `/schedule` | `/zeitplan` | `/rozklad` | ✅ | ✅ (manuální) | ✅ | ✅ Breadcrumb |
| `/slevy` | `/slevy` | `/discounts` | `/rabatte` | `/znyzhky` | ✅ | ✅ (getAlternates) | ✅ | ✅ Offer + Breadcrumb + FAQ |
| `/faq` | `/faq` | `/faq` | `/faq` | `/faq` | ✅ | ✅ (manuální) | ✅ | ✅ FAQPage + Breadcrumb |
| `/recenze` | `/recenze` | `/reviews` | `/rezensionen` | `/vidhuky` | ✅ | ✅ (manuální) | ✅ | ✅ Breadcrumb |
| `/recenze/nova/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ noindex | N/A | N/A (noindex) |
| `/kontakt` | `/kontakt` | `/contact` | `/kontakt` | `/kontakt` | ✅ | ✅ (getAlternates) | ✅ | ✅ Breadcrumb |
| `/o-nas` | `/o-nas` | `/about` | `/ueber-uns` | `/pro-nas` | ✅ | ✅ (getAlternates) | ✅ | ✅ Breadcrumb |
| `/blog` | `/blog` | `/blog` | `/blog` | `/blog` | ✅ | ⚠️ **BUG** | ✅ | ❌ (žádný) |
| `/blog/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (z DB locales) | ✅ | ❌ (Article JSON-LD chybí) |
| `/novinky` | `/novinky` | `/whats-new` | `/neuigkeiten` | `/novynky` | ✅ | ✅ (getAlternates) | ⚠️ **BUG** | ❌ (žádný) |
| `/podminky` | `/podminky` | `/terms` | `/agb` | `/umovy` | ✅ | ✅ (getAlternates) | ✅ | ✅ Breadcrumb |
| `/soukromi` | `/soukromi` | `/privacy` | `/datenschutz` | `/konfidentsiinist` | ✅ | ✅ (getAlternates) | ✅ | ✅ Breadcrumb |
| `/join` | `/pridat-se` | `/join` | `/bewerben` | `/dodaty-sia` | ✅ | ✅ (getAlternates) | N/A (noindex) | N/A |
| `/join/success` | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/clenstvi/zadost` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (getAlternates) | N/A (noindex) | ✅ Breadcrumb |
| `/clenstvi/zadost/odeslano` | ✅ | ✅ | ✅ | ✅ | N/A | N/A | N/A | N/A |
| `/pobocka/[slug]` | `/pobocka/X` | `/location/X` | `/standort/X` | `/lokatsiya/X` | ✅ | ✅ (manuální) | ✅ | ✅ LocalBusiness + Breadcrumb + FAQ + ItemList |
| `/sluzba/[slug]` | `/sluzba/X` | `/service/X` | `/leistung/X` | `/posluha/X` | ✅ | ✅ (getAlternates) | ✅ | ✅ Breadcrumb |
| `/hashtag/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (manuální) | ✅ | ✅ Breadcrumb + CollectionPage + FAQ + ItemList |
| `/stories/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A (noindex) | N/A | N/A |

### 1.2 Admin panel (app/[locale]/(admin)/admin/...)

| Route | Auth | robots | X-Robots-Tag |
|---|---|---|---|
| `/admin/login` | ❌ veřejný | `noindex, nofollow, nocache` (layout) | ✅ (next.config headers) |
| `/admin` (dashboard) | ✅ requireAdmin() | ✅ | ✅ |
| `/admin/divky` + `/[id]` + `/[id]/edit` + `/[id]/fotky` + `/[id]/videa` + `/[id]/dostupnost` | ✅ | ✅ | ✅ |
| `/admin/cenik` + plány + extras | ✅ | ✅ | ✅ |
| `/admin/blog` + `/[id]` + `/novy` + tagy | ✅ | ✅ | ✅ |
| `/admin/faq` + `/[id]` + `/nova` | ✅ | ✅ | ✅ |
| `/admin/pobocky` + `/[id]` + `/nova` | ✅ | ✅ | ✅ |
| `/admin/slevy` + `/[id]` + `/nova` | ✅ | ✅ | ✅ |
| `/admin/seo` + `/edit` | ✅ | ✅ | ✅ |
| `/admin/og` | ✅ | ✅ | ✅ |
| `/admin/recenze` | ✅ | ✅ | ✅ |
| `/admin/recenze-apartmanu` | ✅ | ✅ | ✅ |
| `/admin/rezervace` | ✅ | ✅ | ✅ |
| `/admin/stories` | ✅ | ✅ | ✅ |
| `/admin/verifikace` | ✅ | ✅ | ✅ |
| `/admin/notifikace` | ✅ | ✅ | ✅ |
| `/admin/schedules` | ✅ | ✅ | ✅ |
| `/admin/clenove` | ✅ | ✅ | ✅ |
| `/admin/aplikace` + `/[id]` | ✅ | ✅ | ✅ |
| `/admin/divky/nova` | ✅ | ✅ | ✅ |

### 1.3 Studio panel (app/[locale]/studio/...)

| Route | Auth | robots |
|---|---|---|
| `/studio/login` | ❌ veřejný | `noindex, nofollow, nocache` (layout) |
| `/studio` (dashboard) | ✅ requireGirl() | ✅ |
| `/studio/zakladni` | ✅ | ✅ |
| `/studio/fotky` | ✅ | ✅ |
| `/studio/videa` | ✅ | ✅ |
| `/studio/telo` | ✅ | ✅ |
| `/studio/jazyky` | ✅ | ✅ |
| `/studio/sluzby` | ✅ | ✅ |
| `/studio/program` | ✅ | ✅ |
| `/studio/dostupnost` | ✅ | ✅ |
| `/studio/kalendar` | ✅ | ✅ |
| `/studio/stories` | ✅ | ✅ |
| `/studio/recenze` | ✅ | ✅ |
| `/studio/statistiky` | ✅ | ✅ |
| `/studio/hashtagy` | ✅ | ✅ |
| `/studio/hlas` | ✅ | ✅ |
| `/studio/zprava` | ✅ | ✅ |
| `/studio/zivotni-styl` | ✅ | ✅ |
| `/studio/rezervace` | ✅ | ✅ |
| `/studio/profil-status` | ✅ | ✅ |

---

## 2. NALEZENÉ CHYBY A PROBLÉMY

### 2.1 KRITICKÉ (SEO / funkční)

#### BUG-1: Blog listing — chybí DE a UK hreflang alternates
**Soubor:** `app/[locale]/blog/page.tsx:26-30`
**Problém:** Hreflang alternates zahrnují pouze `en` a `cs`, chybí `de` a `uk`.
```ts
// AKTUÁLNĚ:
languages: {
  en: `${BASE}/blog`,
  cs: `${BASE}/cs/blog`,
  'x-default': `${BASE}/blog`,
}
// CHYBÍ: de: `${BASE}/de/blog`, uk: `${BASE}/uk/blog`
```
**Dopad:** Google nevidí DE/UK verze blog listingu → duplikátní obsah, žádné hreflang signály pro tyto locale.
**Fix:** Přidat `de` a `uk` alternates.

#### BUG-2: Novinky page — chybí OG `url`
**Soubor:** `app/[locale]/novinky/page.tsx:34-41`
**Problém:** `openGraph` objekt nemá `url` property.
```ts
openGraph: {
  images: ogImages,
  title: t('h1'),
  description: t('lead'),
  locale: ogLocale(locale),
  type: 'website',
  // CHYBÍ: url: canonical,
}
```
**Dopad:** `og:url` tag nebude vygenerován → Facebook/sociální sítě nemají kanonickou URL.
**Fix:** Přidat `url: canonical` do openGraph objektu.

#### BUG-3: GOOGLE_REDIRECT_URI — stará escx23.vercel.app URL v env souborech
**Soubory:**
- `.env.production.local:6`
- `.env.prod-pull.local:6`
- `.env.prod-pulled.local:6`
- `.env.blob:6`

**Problém:** `GOOGLE_REDIRECT_URI="https://escx23.vercel.app/api/gcal/callback\n"` — stará doména + trailing `\n`.
**Dopad:** Google Calendar callback redirect může selhat pokud se tyto env soubory použijí. Navíc trailing `\n` v hodnotě.
**Fix:** Opravit na `https://www.lovelygirls.cz/api/gcal/callback` (bez `\n`). Správné verze jsou v `.env.vercel-prod.local` a `.env.prod-check.local`.

#### BUG-4: Chybí llms.txt
**Soubor:** Neexistuje (middleware ho zmiňuje v matcher exclusion)
**Problém:** Middleware má v matcher `llms\\.txt` exclusion, ale soubor neexistuje (ani jako route handler, ani jako static file v public/).
**Dopad:** AI crawlers (ClaudeBot, GPTBot atd.) dostanou 404 na `/llms.txt`. Zmírněno tím, že robots.txt pro ně povoluje crawling, ale llms.txt by poskytl strukturované info o webu.
**Fix:** Vytvořit `app/llms.txt/route.ts` nebo `public/llms.txt`.

### 2.2 STŘEDNÍ PRIORITA

#### BUG-5: profilePersonJsonLd — hardcoded `/profil/` path místo lokalizovaného
**Soubor:** `lib/seo/jsonld.ts:158`
**Problém:** `url: \`${BASE}/profil/${slug}\`` — vždy používá CS cestu `/profil/` i pro EN stránky (kde je skutečná URL `/profile/{slug}`).
**Dopad:** JSON-LD `url` field ukazuje na neexistující URL pro EN/DE/UK. Nízký dopad protože JSON-LD Person není kritický typ pro rich results, ale je to technicky nesprávné.
**Fix:** Přidat `locale` parametr a použít `getProfileCanonical(locale, slug)` nebo přímo EN kanoniku.

#### BUG-6: Blog listing — x-default ukazuje na EN místo CS
**Soubor:** `app/[locale]/blog/page.tsx:30`
**Problém:** `'x-default': \`${BASE}/blog\`` — ukazuje na EN verzi. Ostatní stránky mají x-default = EN (správně protože EN je defaultLocale). Pro blog to je konzistentní, ale články jsou primárně CS. Nicméně protože EN je defaultLocale v routingu, je to technicky OK.
**Status:** Konzistentní se zbytkem webu. Není bug.

#### BUG-7: Blog listing — `siteName: 'LovelyGirls Praha'` hardcoded
**Soubor:** `app/[locale]/blog/page.tsx:38`
**Problém:** OG siteName je hardcoded jako česká varianta `LovelyGirls Praha`, i pro EN/DE/UK.
**Dopad:** Minor — sociální sítě zobrazí „Praha" místo „Prague" pro nečeské locale.
**Fix:** Použít locale-dependent brand name.

#### BUG-8: Blog article — chybí Article JSON-LD
**Soubor:** `app/[locale]/blog/[slug]/page.tsx`
**Problém:** Blog články nemají Article/BlogPosting JSON-LD structured data, ačkoli mají správné OG article metadata.
**Dopad:** Žádné rich results (article carousel, published date, author) v Google.
**Fix:** Přidat `blogPostingJsonLd()` do `lib/seo/jsonld.ts` a renderovat v blog article page.

#### BUG-9: Rozvrh page — redundantní CANONICAL_PATH mapping
**Soubor:** `app/[locale]/rozvrh/page.tsx:33-38, 102-103`
**Problém:** Page definuje vlastní `CANONICAL_PATH` mapping a pak ho předává do `getCanonicalUrl(locale, path)`, kde `path` je už lokalizovaná cesta (e.g., `/schedule` pro EN). To funguje náhodou — `localizedPath('en', '/schedule')` nenajde match a vrátí `/schedule` jako-je.
**Dopad:** Funguje správně, ale je to fragile pattern. Kdyby se routing změnil, mohlo by se to rozbít.
**Fix:** Použít `getCanonicalUrl(locale, '/rozvrh')` (interní cestu) jako všechny ostatní stránky.

### 2.3 NÍZKÁ PRIORITA

#### NOTE-1: Blog article — OG locale nepoužívá ogLocale() helper
**Soubor:** `app/[locale]/blog/[slug]/page.tsx:72`
**Problém:** Locale se mapuje inline (`locale === 'cs' ? 'cs_CZ' : ...`) místo použití sdíleného `ogLocale()` helper.
**Dopad:** Funguje, ale není konzistentní se zbytkem codebase.

#### NOTE-2: Blog listing — chybějící JSON-LD
**Soubor:** `app/[locale]/blog/page.tsx`
**Problém:** Blog listing nemá žádný JSON-LD (ani BreadcrumbList, ani CollectionPage).
**Dopad:** Minor — blog listing nezíská breadcrumb rich results.

#### NOTE-3: Novinky page — chybějící JSON-LD
**Soubor:** `app/[locale]/novinky/page.tsx`
**Problém:** Žádný JSON-LD na novinky stránce.

#### NOTE-4: audit_results.json + audit_deep_results.json — staré audit soubory s escx23.vercel.app
**Soubor:** Root directory
**Problém:** Staré audit JSON soubory obsahují ~60 referencí na `escx23.vercel.app`. Tyto soubory nejsou součástí buildů, ale zabírají místo.
**Dopad:** Žádný — jsou to data soubory, ne source code.
**Fix:** Smazat nebo ignorovat.

---

## 3. SEO AUDIT

### 3.1 Canonical URLs ✅
- Všechny veřejné stránky generují `canonical` URL
- Vždy používají `https://www.lovelygirls.cz` jako base
- Korektně přidávají locale prefix pro non-EN locales
- DB override systém (`applyDBOverride`) umožňuje admin přepsání

### 3.2 Hreflang Alternates ⚠️
- **Většina stránek:** ✅ Správně — 4 locale (en, cs, de, uk) + x-default
- **Blog listing:** ❌ Chybí de + uk (BUG-1)
- **noindex stránky** (stories, recenze/nova, join): Správně nemají hreflang

### 3.3 OG Tags ⚠️
- **og:title, og:description:** ✅ Na všech stránkách
- **og:url:** ⚠️ Chybí na `/novinky` (BUG-2)
- **og:locale:** ✅ Správně mapované (en_US, cs_CZ, de_DE, uk_UA)
- **og:image:** ✅ Systém buildOgImages s DB override + opengraph-image.tsx fallback

### 3.4 Sitemap ✅
- `app/sitemap.ts` — dynamicky generovaný z DB
- Správně používá `www.lovelygirls.cz`

### 3.5 Robots.txt ✅
- Dynamicky generovaný (`app/robots.ts`)
- Správně blokuje: `/admin/`, `/studio/`, `/api/`, preview deploys
- AI crawlers (GPTBot, ClaudeBot, PerplexityBot) — ALLOWED
- Training scrapers (CCBot, Bytespider, Diffbot) — BLOCKED
- SEO audit tools (SemrushBot, AhrefsBot) — BLOCKED
- Sitemap reference: ✅

### 3.6 Structured Data (JSON-LD) ⚠️
- **Homepage:** ✅ 4 schemas (LocalBusiness, Organization, WebSite, FAQPage)
- **Profile pages:** ✅ Person + Breadcrumb (bez review — intentional, viz comment v kódu)
- **Listing pages:** ✅ CollectionPage + Breadcrumb
- **Service pages:** ✅ Breadcrumb
- **Pricing page:** ✅ OfferCatalog + Breadcrumb + FAQ
- **FAQ page:** ✅ FAQPage + Breadcrumb
- **Location pages:** ✅ LocalBusiness (AdultEntertainment) + Breadcrumb + FAQ + ItemList
- **Blog article:** ❌ Chybí BlogPosting/Article JSON-LD (BUG-8)
- **Blog listing:** ❌ Chybí Breadcrumb JSON-LD (NOTE-2)

### 3.7 llms.txt ❌ (BUG-4)
- Middleware exempts it from middleware processing
- File does not exist anywhere

---

## 4. REDIRECTY ✅

### 4.1 Domain redirects (next.config.ts)
- `lovelygirls.cz` → `www.lovelygirls.cz` — ✅ 301
- `escx23.vercel.app` → `www.lovelygirls.cz` — ✅ 301

### 4.2 Legacy redirects ✅
- Old profile URLs (`/girls/:slug`, `/girls-cz/:slug`, `/profily/:slug`) → new profile URLs
- Old blog URLs (`/blog-cs/:slug`, `/blogs-cz/:slug`) → `/cs/blog/:slug`
- Old landing pages → hashtag/service pages
- Old Secretstory URLs (per all locales, ~200+ rules) → current pages
- Old WordPress URLs → current pages
- Old sitemap URLs → `/sitemap.xml`
- `/cz/:path*` → `/cs/:path*` (catchall)

---

## 5. STARÁ URL V KÓDU

### 5.1 Source code (*.ts, *.tsx) ✅
- **escx23.vercel.app:** Pouze v `next.config.ts` redirect rule (správné použití) — ✅
- **lovelygirls.cz bez www:** Nenalezeno — ✅
- **Všechny BASE konstanty:** Správně `https://www.lovelygirls.cz` — ✅

### 5.2 Env soubory ⚠️
- **NEXT_PUBLIC_SITE_URL:** Všechny produkční env mají správně `https://www.lovelygirls.cz` — ✅
- **GOOGLE_REDIRECT_URI:** 4 env soubory mají stále starou `escx23.vercel.app` URL + trailing `\n` — ⚠️ BUG-3

### 5.3 Data soubory ⚠️
- `audit_results.json`, `audit_deep_results.json` — staré audit data s escx23 URLs — minor, non-functional

---

## 6. ADMIN & STUDIO OCHRANA ✅

- **Admin layout:** `robots: { index: false, follow: false, nocache: true }` + `X-Robots-Tag: noindex, nofollow` (next.config headers) + `requireAdmin()` auth
- **Studio layout:** `robots: { index: false, follow: false, nocache: true }` + `X-Robots-Tag: noindex, nofollow` + `requireGirl()` auth
- **robots.txt:** Disallow `/admin/`, `/studio/`, `/api/`
- **Manager access:** RBAC enforcement via `isManagerAllowed()` path checking

---

## 7. IMPLEMENTAČNÍ PLÁN OPRAV

### Priorita 1 — Kritické SEO bugy
1. **BUG-1:** Přidat de + uk hreflang do blog listing
2. **BUG-2:** Přidat `url: canonical` do novinky OG metadata
3. **BUG-3:** Opravit GOOGLE_REDIRECT_URI ve 4 env souborech
4. **BUG-4:** Vytvořit llms.txt (route handler nebo static file)

### Priorita 2 — Střední
5. **BUG-5:** Opravit profilePersonJsonLd URL (locale-aware)
7. **BUG-7:** Locale-aware siteName v blog listing OG
8. **BUG-8:** Přidat BlogPosting JSON-LD pro blog články
9. **BUG-9:** Zjednodušit rozvrh canonical path (použít interní cestu)

### Priorita 3 — Nízká (nice-to-have)
10. **NOTE-1:** Unifikovat blog article OG locale na ogLocale() helper
11. **NOTE-2:** Přidat BreadcrumbList JSON-LD na blog listing
12. **NOTE-3:** Přidat JSON-LD na novinky page
13. **NOTE-4:** Cleanup starých audit JSON souborů

---

## 8. CELKOVÉ HODNOCENÍ

| Oblast | Stav | Poznámka |
|---|---|---|
| Stránky & routes | ✅ | Kompletní pokrytí 4 locale |
| SEO metadata | ⚠️ | 2 minor bugy (blog hreflang, novinky og:url) |
| Canonical URLs | ✅ | Všechny správné, www.lovelygirls.cz base |
| Hreflang | ⚠️ | Blog listing chybí de/uk |
| Structured data | ⚠️ | Blog articles chybí Article JSON-LD |
| Redirecty | ✅ | Komprehensivní, 200+ pravidel |
| Admin/Studio ochrana | ✅ | Triple protection (meta + header + auth) |
| robots.txt | ✅ | Pokročilé, per-crawler pravidla |
| Sitemap | ✅ | Dynamický, www base |
| Staré URL v kódu | ⚠️ | 4 env soubory s escx23 REDIRECT_URI |
| llms.txt | ❌ | Neexistuje |

**Celkový SEO health score: 85/100** — solidní základ, 4 kritické a 5 středních oprav potřeba.
