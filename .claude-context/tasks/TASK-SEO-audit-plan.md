# SEO Audit: www.lovelygirls.cz — Findings & Fix Plan

## BLOCKER: NEXT_PUBLIC_SITE_URL

**All SEO findings below depend on `NEXT_PUBLIC_SITE_URL` being correctly set to `https://www.lovelygirls.cz` in Vercel production.**

If it still points to `https://escx23.vercel.app`, ALL canonical URLs, hreflang tags, OG URLs, sitemap URLs, and JSON-LD `@id` values will reference the old domain.

The code uses `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz'` as fallback, but in production the env var exists with wrong value — fallback won't kick in.

---

## 1. CANONICAL URLs

### Architecture
- **Layout-level injection** (`app/[locale]/layout.tsx:103`): Injects `<link rel="canonical">` into `<head>` for ALL public pages via `getCanonicalForPath()` from `lib/seo/hreflang.ts`
- **Page-level metadata**: Some pages also set `alternates.canonical` in their `generateMetadata()`, which Next.js renders as another `<link rel="canonical">`

### Issue: Potential Duplicate Canonical Tags
Pages that set `alternates.canonical` in `generateMetadata` AND get it from the layout `<head>` may render TWO `<link rel="canonical">` tags. Affected pages:
- `/profil/[slug]` — sets `alternates.canonical` (line 107)
- `/rozvrh` — sets `alternates.canonical` (line 95)
- `/blog/[slug]` — sets `alternates.canonical` (line 43)
- `/blog` — sets `alternates.canonical` (line 25)
- `/recenze` — sets `alternates.canonical` (line 123)
- `/faq` — sets `alternates.canonical` (line 55)
- `/hashtag/[slug]` — sets `alternates.canonical` (line 86)
- `/pobocka/[slug]` — sets `alternates.canonical` (line 206)

**Verdict:** Need to verify by viewing source in production. If Next.js dedupes `<link rel="canonical">` tags (it should via `metadataBase`), this is fine. If not, remove layout-level canonical injection and rely solely on page-level `generateMetadata`.

### Issue: Pages Missing Page-Level Canonical
Pages that DON'T set `alternates.canonical` in generateMetadata (rely only on layout injection):
- Homepage (`/page.tsx`)
- `/cenik`
- `/slevy`
- `/o-nas`
- `/kontakt`
- `/podminky`
- `/soukromi`
- `/join`
- `/clenstvi/zadost`
- `/sluzba/[slug]`
- `/divky`

**Verdict:** These still get canonical from the layout, so they work. But inconsistency could be cleaned up.

**Severity:** LOW — layout handles it, just inconsistent code patterns.

---

## 2. HREFLANG TAGS

### Architecture
- **Layout-level injection** (`app/[locale]/layout.tsx:104-107`): Injects `<link rel="alternate" hrefLang="...">` for ALL public pages via `getHreflangsForPath()` from `lib/seo/hreflang.ts`
- This covers all 4 locales (en, cs, de, uk) + x-default

### Issue: Some Pages Also Set `alternates.languages` in generateMetadata
- `/profil/[slug]` — `getProfileAlternates(slug)` (line 108)
- `/rozvrh` — `getAlternates('/rozvrh')` (line 96-98)
- `/blog/[slug]` — custom alternates (line 44-48)
- `/recenze` — `getAlternates('/recenze')` (line 124-126)
- `/faq` — `getAlternates('/faq')` (line 56-58)
- `/hashtag/[slug]` — custom alternates (line 87-92)

Same potential duplicate issue as canonical. Need to verify in production HTML output.

### Hreflang Path Resolution Quality
`lib/seo/hreflang.ts` uses `SEGMENT_TO_KEY` mapping built from `routing.pathnames` to correctly translate paths between locales. This is well-implemented — it handles dynamic segments like `[slug]` and properly resolves localized paths (e.g., `/girls` for en, `/divky` for cs).

**Verdict:** GOOD — comprehensive coverage via layout. Potential duplicates if Next.js doesn't dedupe.

**Severity:** LOW

---

## 3. OG TAGS (og:url, og:image, og:title, og:description)

### Coverage
Every page with `generateMetadata` sets `openGraph` with:
- `title` — localized
- `description` — localized
- `url` — canonical URL (using `NEXT_PUBLIC_SITE_URL`)
- `locale` — mapped via `ogLocale()` (en_US, cs_CZ, de_DE, uk_UA)

### Pages Missing OG Tags
- `/o-nas` — no `openGraph` in metadata (line 16-19)
- `/kontakt` — likely missing (need to check)
- `/podminky` — likely missing
- `/soukromi` — likely missing
- `/join` — has OG but need to verify
- `/sluzba/[slug]` — no `openGraph` in metadata (line 32)
- `/clenstvi/zadost` — need to verify

**Fix:** Add `openGraph` with at minimum `title`, `description`, `url` to these pages.

**Severity:** MEDIUM — these pages can appear in social shares without proper previews.

### OG Image Coverage
Dynamic `opengraph-image.tsx` files exist for:
homepage, divky, profil/[slug], cenik, rozvrh, slevy, faq, blog, kontakt, o-nas, pobocka/[slug], hashtag/[slug]

Missing opengraph-image.tsx for:
- `/sluzba/[slug]`
- `/recenze`
- `/podminky`
- `/soukromi`
- `/join`
- `/clenstvi/zadost`

**Severity:** LOW — these will fall back to layout-level default OG image.

---

## 4. SITEMAP.XML

### Architecture
`app/sitemap.ts` — dynamic, `force-dynamic`, generates all pages.

### Coverage
- Homepage (per locale) -- OK
- `/divky` (per locale) -- OK
- Static pages: cenik, slevy, rozvrh, faq, recenze, o-nas, kontakt, podminky, soukromi, blog -- OK
- Profile pages (per girl x per locale) with image sitemap -- OK
- Location pages -- OK
- Service pages -- OK
- Blog posts -- OK
- Hashtag pages (32 static slugs) -- OK

### Issue: Missing Pages in Sitemap
- `/join` (pridat-se) — NOT in sitemap
- `/clenstvi/zadost` — NOT in sitemap (probably intentional, internal flow)
- `/sluzba/[slug]` — IS included via `getAllServices()` -- OK

### Issue: Sitemap Uses `NEXT_PUBLIC_SITE_URL`
All URLs in sitemap use `const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz'`. If env is wrong, all sitemap URLs are wrong.

### Image Sitemap
Profile pages include image entries via `resolveImages()` — photos are resolved to absolute URLs using `photoUrl()` + BASE. Good implementation.

**Verdict:** GOOD coverage. Minor: consider adding `/join` page.

**Severity:** LOW

---

## 5. ROBOTS.TXT

### Architecture
`app/robots.ts` — dynamic, `force-dynamic`, uses `host` header for domain detection.

### Analysis
- Correctly allows `/` for major crawlers (Google, Bing, Seznam)
- Correctly blocks `/admin/`, `/studio/`, `/api/`
- AI crawler rules: allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended
- Blocks training-only scrapers: CCBot, anthropic-ai, Bytespider, Diffbot, Meta-ExternalAgent
- Blocks SEO audit bots: SemrushBot, AhrefsBot, MJ12bot
- Preview detection: blocks all on Vercel preview deploys
- Sitemap reference uses correct dynamic base URL

**Verdict:** EXCELLENT — well-thought-out crawler policy.

**Severity:** NONE

---

## 6. LLMS.TXT

### Architecture
`app/llms.txt/route.ts` — dynamic, uses `host` header.

### Analysis
- All links use dynamic `${base}` from host header — domain-safe
- Covers: homepage, pricing, FAQ, discounts, schedule, about, girls, blog
- Localized index links (cs, de, uk)
- Profile URL pattern documented
- Key facts section with pricing, hours, contact, legal
- Permission section: allows citation, blocks photo training

**Verdict:** EXCELLENT

**Severity:** NONE

---

## 7. JSON-LD STRUCTURED DATA

### Coverage

| Page | Schema Types | Status |
|------|-------------|--------|
| Homepage | LocalBusiness, Organization, WebSite, AggregateRating, BreadcrumbList | GOOD |
| Profile | Person (with occupation, aggregateRating), BreadcrumbList | GOOD |
| FAQ | FAQPage | GOOD |
| Divky (listing) | CollectionPage | GOOD |
| Cenik | OfferCatalog | Probably yes (need to verify) |

### Issue: JSON-LD Uses `NEXT_PUBLIC_SITE_URL`
`lib/seo/jsonld.ts:1`: `const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lovelygirls.cz'`

All `@id`, `url`, `image`, `logo` fields use this BASE. Same env dependency.

### Issue: Profile Person Schema Uses Non-Localized URL
`lib/seo/jsonld.ts:162-163`:
```ts
'@id': `${BASE}/profil/${slug}#person`,
url: `${BASE}/profil/${slug}`,
```

This hardcodes `/profil/` (Czech path) but uses it as the canonical schema URL. For English locale, the URL should be `/profile/${slug}`. However, for schema.org `@id`, consistency is more important than localization — using one canonical `@id` across locales is correct practice.

**Verdict:** GOOD — minor inconsistency but following best practice.

### Issue: WebSite SearchAction URL
`lib/seo/jsonld.ts:77`:
```ts
urlTemplate: `${BASE}/divky?q={search_term_string}`,
```

Hardcodes `/divky` (Czech path). For English should be `/girls?q=...`. Low priority since Google understands the redirect.

**Severity:** LOW

---

## 8. META TITLE/DESCRIPTION

### Page-Level Coverage

All pages have `generateMetadata` or static `metadata` export. Well-localized with translation files.

### Issue: Some Pages Have Minimal Metadata
- `/o-nas` — only `title` and `description`, no OG, no canonical, no alternates
- `/kontakt` — need to verify (same pattern likely)
- `/podminky` — minimal
- `/soukromi` — minimal
- `/sluzba/[slug]` — only `title` and `description`

These rely on:
1. Layout-level canonical + hreflang (works)
2. Layout-level default OG image (works)
3. Layout-level default Twitter card (works)

**Verdict:** Functional but not optimal for social sharing.

**Severity:** LOW

---

## 9. HARDCODED OLD URLS

### In Source Code
- `next.config.ts:28` — `escx23.vercel.app` in redirect rule (CORRECT — this IS the redirect)
- No other source files reference `escx23.vercel.app`

### In Non-Source Files
- `audit_results.json`, `audit_deep_results.json` — old audit data files (NOT served, safe to delete)

**Verdict:** CLEAN

---

## 10. X-ROBOTS-TAG HEADERS

`next.config.ts:34-49`:
- `/admin/:path*` — `noindex, nofollow`
- `/studio/:path*` — `noindex, nofollow`
- `/:locale/admin/:path*` — `noindex, nofollow`

### Issue: Missing Header for `/:locale/studio/:path*`
Only `/studio/:path*` is covered, not `/:locale/studio/:path*`.

**Fix:** Add:
```ts
{
  source: '/:locale/studio/:path*',
  headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
},
```

**Severity:** LOW — studio layout has `robots: { index: false }` in metadata, this is belt-and-suspenders.

---

## SUMMARY: Issues by Priority

### HIGH (fix before or during launch)
1. **NEXT_PUBLIC_SITE_URL** must be `https://www.lovelygirls.cz` on Vercel (affects ALL SEO)

### MEDIUM (should fix)
2. **Missing OG tags** on `/o-nas`, `/kontakt`, `/podminky`, `/soukromi`, `/sluzba/[slug]` — add `openGraph` with `title`, `description`, `url`
3. **Verify duplicate canonical/hreflang** — check production HTML source for `<link rel="canonical">` count. If 2, remove layout injection OR page-level `alternates`

### LOW (nice to have)
4. **Missing `/:locale/studio/:path*`** X-Robots-Tag header in next.config.ts
5. **Add `/join` to sitemap** if it should be crawlable
6. **Clean up old audit JSON files** from repo root
7. **Standardize metadata pattern** — all pages should have consistent OG + alternates

### NO ACTION NEEDED
- robots.txt -- excellent
- llms.txt -- excellent
- hreflang -- covered by layout-level injection
- canonical -- covered by layout-level injection
- sitemap -- comprehensive with image entries
- JSON-LD -- good coverage on key pages
- No hardcoded old URLs in source

---

## Files to Modify (if fixing MEDIUM issues)

| File | Fix |
|------|-----|
| `app/[locale]/o-nas/page.tsx` | Add `openGraph`, `alternates` to metadata |
| `app/[locale]/kontakt/page.tsx` | Add `openGraph`, `alternates` to metadata |
| `app/[locale]/podminky/page.tsx` | Add `openGraph`, `alternates` to metadata |
| `app/[locale]/soukromi/page.tsx` | Add `openGraph`, `alternates` to metadata |
| `app/[locale]/sluzba/[slug]/page.tsx` | Add `openGraph` with title, desc, url, locale |
| `next.config.ts` | Add `/:locale/studio/:path*` X-Robots-Tag |
