# TASK-022: GSC Indexing Issues — Soft 404, Duplicity, Redirecty v Sitemap

**Date:** 2026-07-08
**Source:** Google Search Console Coverage Report (3.7.2026)

**Three GSC issue categories:**
1. Soft 404 — pages return 200 but look like 404
2. Duplicate page without user-selected canonical
3. Page with redirect (in sitemap)

---

## ANALYSIS: Which URLs are affected and why

### Category 1: SOFT 404 (pages returning 200 but thin/empty content)

**Likely affected URLs:**

#### 1A. Hashtag pages without content (HIGH probability)

**Sitemap includes 8 hashtag slugs** (HASHTAG_SLUGS in sitemap.ts × 4 locales = 32 URLs).
But many hashtags may have **zero matching girls** on any given day. When `girls.length === 0`, the page shows only:
- H1 title
- "0 spolecnic v Praze"
- "Aktualne zadne vysledky pro tento tag"
- Related categories links

This is **thin content** — Google classifies it as Soft 404.

**Additionally**, hashtag page line 103: `robots: { index: !!content, follow: true }` — hashtags WITHOUT `HASHTAG_CONTENT` entries are already noindex. But those WITH content can still be Soft 404 if no girls match.

**Files:** `app/[locale]/hashtag/[slug]/page.tsx:213-225`, `app/sitemap.ts:237-248`

#### 1B. Blog post pages for DE/UK locales (HIGH probability)

Blog detail page (line 135-137):
```ts
if (locale === 'de' || locale === 'uk') {
  redirect(`/cs/blog/${slug}`);
}
```

But blog metadata (line 44-49) declares hreflang alternates for ALL 4 locales:
```ts
alternates: {
  languages: {
    en: `${BASE}/blog/${slug}`,
    cs: `${BASE}/cs/blog/${slug}`,
    de: `${BASE}/de/blog/${slug}`,    // ← REDIRECTS to /cs/blog/
    uk: `${BASE}/uk/blog/${slug}`,    // ← REDIRECTS to /cs/blog/
    'x-default': `${BASE}/blog/${slug}`,
  },
},
```

Google sees `/de/blog/{slug}` in hreflang → crawls it → gets 302 redirect to `/cs/blog/{slug}` → may classify as Soft 404 or "redirect" issue.

**Blog list page** also redirects DE/UK (line 62-65):
```ts
if (locale === 'de' || locale === 'uk') {
  redirect('/cs/blog');
}
```

**Fix in previous session:** Sitemap was already fixed to only generate EN+CS blog entries. But the **hreflang in metadata still declares DE/UK** URLs.

#### 1C. /novinky (what's-new) page with empty activity (MEDIUM probability)

If `getRecentActivity(50)` returns empty or few items, the page shows an empty state with just "no results" icon. Could trigger Soft 404.

#### 1D. /rozvrh on empty days (MEDIUM probability)

After the cleanup-daily-overrides cron runs at 22:31, today's schedule is wiped. Between 22:31 and midnight, /rozvrh shows "No one is scheduled" for today. Google crawling during this window sees empty content.

#### 1E. Inactive girl profiles (LOW probability)

`profil/[slug]` page: inactive girls have `robots: { index: false, follow: false }`. But sitemap only includes active girls. If a girl was deactivated AFTER Google indexed her, GSC may report Soft 404 during the transition.

### Category 2: DUPLICATE PAGE WITHOUT USER-SELECTED CANONICAL

**Likely affected URLs:**

#### 2A. Pages that had missing canonical/alternates (ALREADY FIXED)

Previous audit identified 6 pages without proper canonical:
- `/podminky` — fixed
- `/soukromi` — fixed
- `/join` — fixed
- `/novinky` — fixed  
- `/clenstvi/zadost` — fixed
- `/recenze/nova/[slug]` — fixed

**These fixes were deployed recently — GSC may still show old data.** GSC takes 2-4 weeks to reflect changes.

#### 2B. Blog DE/UK pages pointing to CS via hreflang (CURRENT BUG)

Blog metadata declares DE/UK alternates → Google sees both `/de/blog/{slug}` (which redirects to /cs/) and `/cs/blog/{slug}` → gets confused about which is canonical.

The canonical is set per-locale:
```ts
const canonical = locale === 'en'
  ? `${BASE}/blog/${slug}`
  : `${BASE}/${locale}/blog/${slug}`;
```

For DE: `canonical = ${BASE}/de/blog/${slug}` — but this URL REDIRECTS. The canonical URL itself is a redirect. Google sees this as a conflict.

#### 2C. Hashtag pages — cross-locale duplicates without HASHTAG_CONTENT

All hashtag pages (30+ slugs in TAG_NAMES) render in 4 locales but only 8 slugs have `HASHTAG_CONTENT`. The ones without content are `robots: { index: !!content }` = noindex, but they still have hreflang pointing to all 4 locales. Google may crawl them via hreflang discovery.

#### 2D. /pobocka slug aliases

`LOCATION_SLUG_ALIASES` (e.g., `praha-2 → vinohrady`, `stare-mesto → praha-1`, `smichov → praha-5`) may create duplicate content if both the alias and the canonical slug are indexed. Need to verify these return 301 or proper canonical.

### Category 3: PAGE WITH REDIRECT (in sitemap)

**Likely affected URLs:**

#### 3A. Blog DE/UK in hreflang (CURRENT BUG)

Even though sitemap was fixed to exclude DE/UK blog entries, the **hreflang alternates in blog metadata** still point to `/de/blog/{slug}` and `/uk/blog/{slug}`. Google follows hreflang links even if not in sitemap.

When Google discovers these via hreflang → crawls → gets 302 redirect → reports "page with redirect."

#### 3B. Old redirect URLs that leaked into index

next.config.ts defines 30+ redirect rules. If any of these old URLs were previously indexed or linked, Google may still be crawling them and reporting redirects. This is expected and will resolve over time.

#### 3C. /join in sitemap but noindex

Sitemap includes `/join` (STATIC_KEYS line 111), but `/join/page.tsx:22` has `robots: { index: false, follow: false }`. This is a **conflict**: submitting a noindex URL in sitemap confuses Google.

#### 3D. /podminky and /soukromi in sitemap but noindex

Sitemap includes these (STATIC_KEYS lines 107-108), but both have `robots: { index: false, follow: true }`. Same conflict as /join.

---

## FIX PLAN

### P0: Remove noindex pages from sitemap

**File:** `app/sitemap.ts`

Remove from `STATIC_KEYS`:
- `/join` — noindex
- `/podminky` — noindex  
- `/soukromi` — noindex

```ts
const STATIC_KEYS = [
  { key: '/cenik', freq: 'weekly', priority: 0.8 },
  { key: '/slevy', freq: 'weekly', priority: 0.7 },
  { key: '/rozvrh', freq: 'hourly', priority: 0.8 },
  { key: '/faq', freq: 'monthly', priority: 0.7 },
  { key: '/recenze', freq: 'daily', priority: 0.6 },
  { key: '/o-nas', freq: 'monthly', priority: 0.5 },
  { key: '/kontakt', freq: 'monthly', priority: 0.5 },
  // REMOVED: /podminky (noindex), /soukromi (noindex), /join (noindex)
  { key: '/novinky', freq: 'daily', priority: 0.5 },
  { key: '/blog', freq: 'daily', priority: 0.8 },
];
```

### P0: Fix blog hreflang — remove DE/UK from blog metadata

**File:** `app/[locale]/blog/[slug]/page.tsx` (generateMetadata, line 42-50)

Change blog detail alternates to CS+EN only (matching sitemap):
```ts
alternates: {
  canonical,
  languages: {
    en: `${BASE}/blog/${slug}`,
    cs: `${BASE}/cs/blog/${slug}`,
    'x-default': `${BASE}/blog/${slug}`,
    // DE/UK removed — these pages redirect to /cs/blog/
  },
},
```

**File:** `app/[locale]/blog/page.tsx` (generateMetadata, line 24-32)

Same fix for blog list page:
```ts
alternates: {
  canonical,
  languages: {
    en: `${BASE}/blog`,
    cs: `${BASE}/cs/blog`,
    'x-default': `${BASE}/blog`,
    // DE/UK removed — these pages redirect to /cs/blog
  },
},
```

### P1: Hashtag pages — strengthen thin content handling

**Option A (simple):** Remove hashtags from sitemap if they currently have 0 matching girls.

This requires a DB query in sitemap generation:
```ts
// In sitemap(), for each hashtag, check if any girls match
for (const slug of HASHTAG_SLUGS) {
  const matchCount = await getGirlCountForHashtag(slug);
  if (matchCount === 0) continue; // skip empty hashtags
  // ... generate sitemap entries
}
```

**Option B (simpler, recommended):** Keep in sitemap (content exists in HASHTAG_CONTENT with intro + FAQ), but ensure the page has enough content even when `girls.length === 0`:
- Always render intro text, FAQ, and related categories
- The page already does this (line 207-263)
- Google should see the intro paragraph + FAQ as sufficient content

**Check:** Is the issue that hashtag pages show "0 spolecnic" with no other content? Let's verify:
- If `content` exists (HASHTAG_CONTENT): intro text + FAQ + related chips are shown. This is NOT thin.
- If `content` is null: page shows ONLY h1 + "0 results" + no intro/FAQ. But these are already `robots: { index: false }`. Should not be in sitemap either.

**Current status:** Only HASHTAG_CONTENT slugs are in sitemap (HASHTAG_SLUGS = those with content). These always have intro + FAQ. So the content is NOT thin — the issue is likely the "0 companions" number + grid being empty.

**Fix:** When `girls.length === 0`, add a more substantial empty state that includes a text paragraph (not just one line), to push it above Soft 404 threshold.

### P1: /pobocka slug aliases — verify redirect behavior

**Check:** Does `/cs/pobocka/praha-2` redirect 301 to `/cs/pobocka/vinohrady`, or does it render the same content with a different canonical?

If it renders content with canonical pointing to the canonical slug, this is correct. If it shows the same content without canonical differentiation, it's a duplicate.

**File:** `app/[locale]/pobocka/[slug]/page.tsx` — check `getLocationBySlug()` for alias handling.

### P2: Verify recently deployed fixes are indexed

The following were fixed in previous sessions — wait 2-4 weeks for GSC to reflect:
- 6 pages got canonical/alternates (podminky, soukromi, join, novinky, clenstvi/zadost, recenze/nova)
- Blog sitemap: DE/UK entries removed
- llms.txt: updated with all locations

### P2: /rozvrh late-night empty state

Low priority — /rozvrh between 22:31-midnight shows empty schedule. This is correct behavior (business closed). But Google may crawl during this window.

**Fix:** Add `<meta name="robots" content="noindex">` when the schedule is genuinely empty AND it's after 22:30 Prague time? Or accept it — this is a dynamic page with `force-dynamic`, Google understands it changes.

---

## SUMMARY TABLE

| Issue | GSC Category | Affected URLs | Fix | Priority | Status |
|-------|-------------|---------------|-----|----------|--------|
| /join, /podminky, /soukromi in sitemap but noindex | Redirect / Soft 404 | 12 URLs (3 pages × 4 locales) | Remove from STATIC_KEYS | P0 | NEW |
| Blog DE/UK hreflang points to redirect | Redirect + Duplicate | ~24 URLs (12 posts × DE+UK) | Remove DE/UK from blog hreflang | P0 | NEW |
| Blog DE/UK blog list hreflang | Redirect | 2 URLs (/de/blog, /uk/blog) | Remove DE/UK from blog list hreflang | P0 | NEW |
| Hashtag 0-girls Soft 404 | Soft 404 | Up to 32 URLs | Improve empty state content | P1 | NEW |
| /pobocka alias duplicates | Duplicate | ~12 URLs | Verify alias → redirect or canonical | P1 | INVESTIGATE |
| 6 pages missing canonical | Duplicate | 24 URLs | Already fixed, wait for GSC re-crawl | P2 | DEPLOYED |
| /rozvrh empty after 22:31 | Soft 404 | 4 URLs | Accept or add late-night noindex | P3 | LOW |

---

## IMPLEMENTATION FILES

| File | Change |
|------|--------|
| `app/sitemap.ts` | Remove /join, /podminky, /soukromi from STATIC_KEYS |
| `app/[locale]/blog/[slug]/page.tsx` | Remove DE/UK from hreflang alternates in generateMetadata |
| `app/[locale]/blog/page.tsx` | Remove DE/UK from hreflang alternates in generateMetadata |
| `app/[locale]/hashtag/[slug]/page.tsx` | Improve 0-girls empty state content (more text) |
| `app/[locale]/pobocka/[slug]/page.tsx` | Verify alias handling (investigate) |

---

## ADDITIONAL FINDINGS (2026-07-08)

### Category 4: "Stránka indexována bez obsahu" (indexed without content)

**Likely thin content candidates:**
- Hashtag pages with 0 matching girls (already in Category 1A above)
- `/novinky` when activity list is empty — shows only "no results" icon
- Any filtered views with 0 results (e.g., `/recenze?girl=nonexistent`)

### Category 5: CRITICAL — BreadcrumbList JSON-LD "Chybí pole itemListElement"

**Date:** 7.7.2026 — GSC reports "Navigační struktura" (BreadcrumbList) missing required field `itemListElement`.

**Analysis:**

The `breadcrumbListJsonLd()` function in `lib/seo/jsonld.ts:95-106` is correctly structured — it always produces `itemListElement`. Two BreadcrumbList generators exist:
- `breadcrumbListJsonLd()` (line 95) — used by 8 pages
- `breadcrumbJsonLd()` (line 249) — exists but UNUSED by any page

**8 pages with BreadcrumbList JSON-LD (all correct):**
1. `faq/page.tsx:93` — 1 item (FAQ)
2. `rozvrh/page.tsx:163` — 1 item (Schedule)
3. `cenik/page.tsx:95` — 1 item (Pricing)
4. `divky/page.tsx:74` — 1 item (Girls)
5. `profil/[slug]/page.tsx:294` — 2 items (Girls → Profile)
6. `sluzba/[slug]/page.tsx:130` — 2 items (Pricing → Service)
7. `hashtag/[slug]/page.tsx:139` — 3 items (Home → Girls → Hashtag)
8. `pobocka/[slug]/page.tsx:328` — 2 items (Apartments → Location)

**2 pages with inline BreadcrumbList (also correct):**
- `blog/page.tsx:123-129` — nested inside CollectionPage.breadcrumb
- `blog/[slug]/page.tsx:241-265` — standalone BreadcrumbList with 3 items

**9 pages with VISUAL breadcrumbs but NO JSON-LD BreadcrumbList:**
- `slevy/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `kontakt/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `novinky/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `o-nas/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `join/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `podminky/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `soukromi/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `recenze/page.tsx` — has Breadcrumbs component, NO JSON-LD
- `clenstvi/zadost/page.tsx` — has Breadcrumbs component, NO JSON-LD

**Root cause hypothesis:**

The Breadcrumbs component renders `<nav aria-label="Breadcrumb"><ol>...</ol></nav>`. Google auto-detects this semantic HTML pattern and tries to parse it as structured breadcrumb data. When there's no matching JSON-LD BreadcrumbList, Google generates an implicit one from the HTML but fails to map it to the required `itemListElement` schema field.

**Evidence:** The 9 pages WITHOUT JSON-LD have visual breadcrumbs that Google tries to interpret, causing the "missing `itemListElement`" error.

**FIX:** Add `breadcrumbListJsonLd()` JSON-LD to ALL pages that render the `<Breadcrumbs>` component. This gives Google explicit structured data instead of relying on auto-detection.

### P0: Add BreadcrumbList JSON-LD to 9 pages

Add breadcrumb JSON-LD to pages that currently only have visual breadcrumbs:

```ts
// Pattern for each page:
import { breadcrumbListJsonLd } from '@/lib/seo/jsonld';
import { getCanonicalUrl } from '@/lib/seo/meta';

// In the component:
const breadcrumbSchema = breadcrumbListJsonLd([
  { name: 'Page Name', url: getCanonicalUrl(locale, '/path') },
]);

// In JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
/>
```

**Files to update:**

| File | Breadcrumb items |
|------|-----------------|
| `app/[locale]/slevy/page.tsx` | [Discounts] |
| `app/[locale]/kontakt/page.tsx` | [Contact] |
| `app/[locale]/novinky/page.tsx` | [What's New] |
| `app/[locale]/o-nas/page.tsx` | [About Us] |
| `app/[locale]/recenze/page.tsx` | [Reviews] |
| `app/[locale]/podminky/page.tsx` | [Terms] |
| `app/[locale]/soukromi/page.tsx` | [Privacy] |
| `app/[locale]/join/page.tsx` | [Join] |
| `app/[locale]/clenstvi/zadost/page.tsx` | [Membership → Application] |

### Category 6: CONCRETE Soft 404 — 8x /de/leistung/ URLs with non-existent slugs

**Date:** 7.7.2026 — GSC reports these specific URLs as Soft 404:
1. `/de/leistung/classic`
2. `/de/leistung/cuddling`
3. `/de/leistung/licking`
4. `/de/leistung/massage`
5. `/de/leistung/deepthroat`
6. `/de/leistung/cim`
7. `/de/leistung/light_sm`
8. `/de/leistung/shared_shower`

**Analysis:**

`/de/leistung/[slug]` maps to `app/[locale]/sluzba/[slug]/page.tsx` via next-intl routing (`i18n/routing.ts:93`).

The slugs `classic`, `cuddling`, `licking` etc. come from `lib/services.ts` — these are **companion-level service tag IDs** (used in checkboxes on join form and admin), NOT database service page slugs.

**DB service slugs** (in `services` table): `klasicky-sex`, `oral-bez-ochrany`, `hluboky-oral`, `eroticka-masaz`, `bdsm-lehke` etc. (29 total, all Czech slugs).

**When `/de/leistung/classic` is requested:**
1. next-intl resolves it to `sluzba/[slug]` with `slug='classic'`, `locale='de'`
2. `getServiceBySlug('classic')` queries DB → returns `null` (no such slug)
3. Page calls `notFound()` → Next.js 404

**Why "Soft 404"?**
Next.js `notFound()` SHOULD return HTTP 404. But GSC may classify it as "Soft 404" because:
- The 404 page (`app/[locale]/not-found.tsx`) has very thin content (just H1 + P + button)
- These URLs might have been valid on the old Secretstory site and Google cached them
- Google may be re-discovering these through internal links or cached index

**Where these URLs come from:**
- NOT in current sitemap (sitemap uses DB slugs)
- NOT generated by current code — ProfilHero generates slugified localized names, ProfilDetails uses DB `svc.slug`
- Likely legacy from old Secretstory site or Google's cached index

**Two issues with profile service links (RELATED BUG):**

`components/profil/ProfilHero.tsx:340-347` generates service links by slugifying the **localized display name**:
```ts
const svcSlug = s.name.toLowerCase().normalize('NFD')...
const prefix = locale === 'en' ? '' : `/${locale}`;
return <a href={`${prefix}/sluzba/${svcSlug}`}>
```

Problems:
1. Uses `<a href>` (plain HTML) instead of i18n `<Link>` — doesn't get localized path (`/sluzba/` instead of `/de/leistung/`)
2. Slugifies the display name instead of using the DB slug — produces non-existent URLs
3. For EN locale: "Classic Sex" → `/sluzba/classic-sex` (should be `/service/klasicky-sex`)
4. For DE locale: "Klassischer Sex" → `/de/sluzba/klassischer-sex` (should be `/de/leistung/klasicky-sex`)

`components/profil/ProfilDetails.tsx:373-378` has similar issue — uses `next/link` (not i18n Link) with hardcoded `/sluzba/` path:
```ts
<Link href={`/${locale}/sluzba/${svc.slug}`}>
```
For DE locale: `/de/sluzba/klasicky-sex` — wrong path, should be `/de/leistung/klasicky-sex`.

**FIX (P0):**

**Option A (recommended):** Fix BOTH components to use the i18n `Link` from `@/i18n/navigation` with proper pathname:
```tsx
import { Link } from '@/i18n/navigation';
<Link href={{ pathname: '/sluzba/[slug]', params: { slug: svc.slug } }}>
```
This automatically resolves to `/de/leistung/klasicky-sex` for DE locale.

**Option B (quick):** Keep `<a>` tags but build the correct localized path manually using the PATHS mapping from sitemap.ts.

**Additionally:** Add redirects in `next.config.ts` for the most common old slugs → new DB slugs:
```ts
{ source: '/:locale/leistung/classic', destination: '/:locale/leistung/klasicky-sex', permanent: true },
// ... etc. for the 8 reported URLs
```

Or a catch-all slug mapping function in the service page that tries to match old English IDs to DB slugs.

---

## UPDATED SUMMARY TABLE

| Issue | GSC Category | Affected URLs | Fix | Priority | Status |
|-------|-------------|---------------|-----|----------|--------|
| /join, /podminky, /soukromi in sitemap but noindex | Redirect / Soft 404 | 12 URLs (3 pages × 4 locales) | Remove from STATIC_KEYS | P0 | NEW |
| Blog DE/UK hreflang points to redirect | Redirect + Duplicate | ~24 URLs (12 posts × DE+UK) | Remove DE/UK from blog hreflang | P0 | NEW |
| Blog DE/UK blog list hreflang | Redirect | 2 URLs (/de/blog, /uk/blog) | Remove DE/UK from blog list hreflang | P0 | NEW |
| **BreadcrumbList missing itemListElement** | **Structured Data error** | **36 URLs (9 pages × 4 locales)** | **Add JSON-LD to 9 pages** | **P0** | **NEW** |
| **8x /de/leistung/ Soft 404 (legacy slugs)** | **Soft 404** | **8 URLs** | **Fix ProfilHero/Details links + add slug redirects** | **P0** | **NEW** |
| **ProfilHero broken service links (all locales)** | **Broken links** | **All profile pages** | **Use i18n Link + DB slug** | **P0** | **NEW** |
| Hashtag 0-girls Soft 404 | Soft 404 | Up to 32 URLs | Improve empty state content | P1 | NEW |
| /pobocka alias duplicates | Duplicate | ~12 URLs | Verify alias → redirect or canonical | P1 | INVESTIGATE |
| 6 pages missing canonical | Duplicate | 24 URLs | Already fixed, wait for GSC re-crawl | P2 | DEPLOYED |
| /rozvrh empty after 22:31 | Soft 404 | 4 URLs | Accept or add late-night noindex | P3 | LOW |

---

## UPDATED IMPLEMENTATION FILES

| File | Change |
|------|--------|
| `app/sitemap.ts` | Remove /join, /podminky, /soukromi from STATIC_KEYS |
| `app/[locale]/blog/[slug]/page.tsx` | Remove DE/UK from hreflang alternates in generateMetadata |
| `app/[locale]/blog/page.tsx` | Remove DE/UK from hreflang alternates in generateMetadata |
| `app/[locale]/slevy/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/kontakt/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/novinky/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/o-nas/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/recenze/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/podminky/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/soukromi/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/join/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/clenstvi/zadost/page.tsx` | Add breadcrumbListJsonLd JSON-LD |
| `app/[locale]/hashtag/[slug]/page.tsx` | Improve 0-girls empty state content (more text) |
| `app/[locale]/pobocka/[slug]/page.tsx` | Verify alias handling (investigate) |
| `components/profil/ProfilHero.tsx` | **FIX:** Use i18n Link + DB slug (not slugified name + plain `<a>`) |
| `components/profil/ProfilDetails.tsx` | **FIX:** Use i18n Link (not next/link with hardcoded `/sluzba/`) |
| `next.config.ts` | Add redirects for 8 legacy English service slugs → DB Czech slugs |

---

## TESTING

1. `/sitemap.xml` — verify /join, /podminky, /soukromi are NOT present
2. `/de/blog/escort-praha-kompletni-pruvodce` — verify NO hreflang for /de/ or /uk/ in HTML
3. `/cs/blog/escort-praha-kompletni-pruvodce` — verify hreflang lists only en, cs, x-default
4. `/cs/hashtag/blondynky-praha` with 0 matching girls — verify substantial content (intro, FAQ)
5. `/cs/pobocka/praha-2` — verify 301 redirect to /cs/pobocka/vinohrady (or canonical setup)
6. Run `curl -I` on blog DE/UK URLs — should get 307/302 redirect, NOT 200
7. Validate sitemap against robots.txt (no sitemap URLs that are disallowed or noindex)
8. **NEW:** Validate BreadcrumbList JSON-LD on all 9 newly-added pages using Google Rich Results Test
9. **NEW:** Check that ALL pages with `<Breadcrumbs>` component also have a `<script type="application/ld+json">` BreadcrumbList
10. **NEW:** Validate JSON-LD output with https://validator.schema.org for each page type
