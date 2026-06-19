# TASK-010: Full SEO Audit + Fix All Pages Missing Meta

## Current State Summary

### Admin SEO Dashboard Numbers
- **288 total** rows in `seo_metadata` table
- **42 have meta_title** filled in
- **246 have empty meta_title** (no SEO data)
- **6 score >= 80** ("optimized")
- **255 score < 50** ("needs work")

### Breakdown by Page Type

| Type | Total | Has Title | Has Desc | Has Keyword | Has OG Image | Has Canonical | Avg Score |
|------|-------|-----------|----------|-------------|-------------|-------------|-----------|
| static | 52 | 38 | 38 | 30 | 40 | 29 | 41.6 |
| girl | 60 | 4 | 4 | 4 | 4 | 4 | 5.9 |
| hashtag | 176 | 0 | 0 | 0 | 0 | 0 | 0.0 |

### The Big Problem: TWO DISCONNECTED SEO SYSTEMS

**System A — `seo_metadata` DB table** (admin SEO page reads/writes this):
- Stores meta_title, meta_description, focus_keyword, og_image, etc.
- Admin can edit via `/admin/seo/edit?path=...`
- `lib/seo-metadata.ts` has `generatePageMetadata()` that reads from this table
- **BUT: NO PAGE ACTUALLY CALLS `generatePageMetadata()`**

**System B — Inline `generateMetadata()` in each page.tsx**:
- 23 pages have their own `generateMetadata()` with hardcoded TITLES/DESCRIPTIONS per locale
- These use `lib/seo/meta.ts` for canonical URLs and hreflang
- They do NOT read from `seo_metadata` table at all
- This is the system that ACTUALLY outputs `<title>` and `<meta>` tags

**Result:** The admin SEO dashboard shows 288 pages with scores, but editing SEO data in admin **has zero effect** on the actual page HTML. The two systems are completely disconnected.

---

## Actual Page Inventory

### Public Pages with `generateMetadata()` (23 pages, WORKING SEO):

| Route | Type | Has generateMetadata | Notes |
|-------|------|---------------------|-------|
| `/[locale]/page.tsx` | Homepage | Yes | Hardcoded TITLES per locale + custom OG |
| `/[locale]/divky/page.tsx` | Listing | Yes | 4 locales |
| `/[locale]/profil/[slug]/page.tsx` | Dynamic (12 girls) | Yes | Localized, DB-driven title/desc, girl photo as OG |
| `/[locale]/cenik/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/rozvrh/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/faq/page.tsx` | Static | Yes | 4 locales + structured data |
| `/[locale]/slevy/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/blog/page.tsx` | Listing | Yes | 4 locales |
| `/[locale]/blog/[slug]/page.tsx` | Dynamic (5 posts) | Yes | Localized |
| `/[locale]/hashtag/[slug]/page.tsx` | Dynamic (44 slugs) | Yes | Localized fallbacks per locale |
| `/[locale]/sluzba/[slug]/page.tsx` | Dynamic (29 services) | Yes | Localized |
| `/[locale]/pobocka/[slug]/page.tsx` | Dynamic (3 locations) | Yes | Localized |
| `/[locale]/o-nas/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/kontakt/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/soukromi/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/podminky/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/recenze/page.tsx` | Listing | Yes | 4 locales |
| `/[locale]/join/page.tsx` | Static | Yes | 4 locales |
| `/[locale]/clenstvi/zadost/page.tsx` | Form | Yes | 4 locales |
| `/[locale]/clenstvi/zadost/odeslano/page.tsx` | Thank-you | Yes | 4 locales |

### Public Pages WITHOUT `generateMetadata()` (2 pages):

| Route | Type | Fix needed |
|-------|------|-----------|
| `/[locale]/join/success/page.tsx` | Thank-you | Add noindex or basic metadata |
| `/[locale]/recenze/nova/[slug]/page.tsx` | Review form | Add noindex (user form, not indexable) |

### Non-public Pages (no SEO needed):

- All `/admin/*` pages (behind auth, have `noindex` via layout metadata)
- All `/studio/*` pages (behind auth, have `noindex` via layout metadata)

---

## Why 194 Pages Show "Needs Fix" in Admin

### `lib/pages.ts` — Incorrect Page List

The `getAllPages()` function generates URLs with WRONG slugs:

| pages.ts slug | Actual route | Mismatch? |
|---------------|-------------|-----------|
| `/{locale}/schedule` | `/{locale}/rozvrh` | YES — wrong slug |
| `/{locale}/discounts` | `/{locale}/slevy` | YES — wrong slug |
| `/{locale}/sluzby` | N/A (individual services at `/sluzba/{slug}`) | YES — no `/sluzby` route |

### `/api/pages` adds more phantom pages:

- `/{locale}/join` — duplicated (already in staticPages)
- `/{locale}/reviews` — wrong slug, actual route is `/recenze`

### Missing from page list:

| Route | Why missing |
|-------|-----------|
| `/{locale}/o-nas` | Not in `staticPages` array |
| `/{locale}/kontakt` | Not in `staticPages` array |
| `/{locale}/rozvrh` | Listed as `/schedule` instead |
| `/{locale}/slevy` | Listed as `/discounts` instead |
| `/{locale}/recenze` | Listed as `/reviews` instead |
| `/{locale}/profil/{slug}` | Not generated (should be `girl` type, 12 x 4 = 48 pages) |
| `/{locale}/sluzba/{slug}` | Not generated (29 x 4 = 116 pages) |
| `/{locale}/pobocka/{slug}` | Not generated (3 x 4 = 12 pages) |
| `/{locale}/blog/{slug}` | Not generated (5 x 4 = 20 pages) |
| `/{locale}/clenstvi/zadost` | Not in list |

---

## Fix Plan

### Problem 1: The two SEO systems are disconnected
### Problem 2: `lib/pages.ts` has wrong URLs and missing pages  
### Problem 3: Score logic doesn't account for inline `generateMetadata()`

### Approach: Bridge System B (inline) to System A (admin DB)

**Option A — Make pages read from DB** (big refactor, risky):
- Change all 23 `generateMetadata()` functions to call `generatePageMetadata()` from `lib/seo-metadata.ts`
- Fallback to current hardcoded values if no DB record
- Risk: breaks existing good SEO if DB is empty/wrong

**Option B — Populate DB from inline metadata** (one-time sync + ongoing bridge):
- Write a script/API that reads what each page's `generateMetadata()` actually produces
- INSERT that into `seo_metadata` table so admin dashboard shows reality
- Then wire pages to read from DB as override (DB > inline fallback)
- Less risky: current SEO keeps working, DB is additive

**Option C — Fix admin dashboard to show real state** (simplest, most honest):
- Fix `lib/pages.ts` with correct URLs
- Add missing page types (profiles, services, locations, blog posts)
- Make the SEO score calculation aware that pages have inline metadata
- Admin SEO edit becomes an OVERRIDE, not the sole source
- Pages check DB first, fall back to inline

**Recommendation: Option C** — fix the dashboard + make DB an override layer.

---

## Concrete Implementation Steps

### Step 1: Fix `lib/pages.ts` — correct URLs and add all page types

**Modify `lib/pages.ts`** to:

```typescript
export function getAllPages(): PageDefinition[] {
  const locales = ['cs', 'en', 'de', 'uk'];
  const pages: PageDefinition[] = [];

  // Static pages — CORRECT Czech slugs
  const staticPages = [
    { slug: '', name: 'Homepage' },
    { slug: '/divky', name: 'Girls' },
    { slug: '/cenik', name: 'Pricing' },
    { slug: '/rozvrh', name: 'Schedule' },          // was /schedule
    { slug: '/slevy', name: 'Discounts' },           // was /discounts
    { slug: '/faq', name: 'FAQ' },
    { slug: '/blog', name: 'Blog' },
    { slug: '/recenze', name: 'Reviews' },           // was missing
    { slug: '/o-nas', name: 'About Us' },            // was missing
    { slug: '/kontakt', name: 'Contact' },           // was missing
    { slug: '/podminky', name: 'Terms' },
    { slug: '/soukromi', name: 'Privacy' },
    { slug: '/join', name: 'Join' },
    { slug: '/clenstvi/zadost', name: 'Membership Application' },  // was missing
  ];

  for (const locale of locales) {
    for (const page of staticPages) {
      pages.push({
        path: `/${locale}${page.slug}`,
        type: 'static',
        name: `${page.name} (${locale.toUpperCase()})`,
      });
    }
  }

  return pages;
}
```

Remove `/sluzby` (no such route — services are at `/sluzba/{slug}`).

### Step 2: Fix `/api/pages/route.ts` — add dynamic pages from DB

**Modify `app/api/pages/route.ts`** to fetch dynamic content from DB:

```typescript
// After static pages, add:

// 4. Girl profile pages (from DB)
const girlsResult = await db.execute(
  `SELECT slug, name FROM girls WHERE status IN ('active','inactive') ORDER BY name`
);
for (const girl of girlsResult.rows) {
  for (const locale of locales) {
    allPages.push({
      path: `/${locale}/profil/${girl.slug}`,
      type: 'girl',
      name: `${girl.name} (${locale.toUpperCase()})`,
    });
  }
}

// 5. Service pages (from DB)
const servicesResult = await db.execute(
  `SELECT slug, name_cs FROM services ORDER BY name_cs`
);
for (const svc of servicesResult.rows) {
  for (const locale of locales) {
    allPages.push({
      path: `/${locale}/sluzba/${svc.slug}`,
      type: 'service',
      name: `${svc.name_cs} (${locale.toUpperCase()})`,
    });
  }
}

// 6. Location pages (from DB)
const locationsResult = await db.execute(
  `SELECT name, display_name FROM locations WHERE is_active = 1 ORDER BY name`
);
for (const loc of locationsResult.rows) {
  for (const locale of locales) {
    allPages.push({
      path: `/${locale}/pobocka/${loc.name}`,
      type: 'location',
      name: `${loc.display_name} (${locale.toUpperCase()})`,
    });
  }
}

// 7. Blog post pages (from DB)
const blogResult = await db.execute(
  `SELECT slug, title_cs FROM blog_posts WHERE status = 'published' ORDER BY slug`
);
for (const post of blogResult.rows) {
  for (const locale of locales) {
    allPages.push({
      path: `/${locale}/blog/${post.slug}`,
      type: 'blog',
      name: `${post.title_cs} (${locale.toUpperCase()})`,
    });
  }
}

// 8. Hashtag pages (already handled, keep existing)
```

Remove the duplicate `/join` and `/reviews` additions (they're now in staticPages with correct slugs).

### Step 3: Update `lib/seo-utils.ts` — scoring for pages with inline metadata

Add scoring boost for pages that have inline `generateMetadata()` (i.e., their actual HTML has good SEO even if DB record is empty):

```typescript
// Pages known to have inline generateMetadata with full SEO
const PAGES_WITH_INLINE_META = new Set([
  '/divky', '/cenik', '/rozvrh', '/slevy', '/faq', '/blog',
  '/recenze', '/o-nas', '/kontakt', '/soukromi', '/podminky', '/join',
  // Dynamic patterns
  '/profil/', '/sluzba/', '/pobocka/', '/blog/', '/hashtag/',
]);

export function hasInlineMetadata(pagePath: string): boolean {
  // Strip locale prefix
  const withoutLocale = pagePath.replace(/^\/[a-z]{2}/, '');
  return PAGES_WITH_INLINE_META.has(withoutLocale) ||
    [...PAGES_WITH_INLINE_META].some(p => p.endsWith('/') && withoutLocale.startsWith(p));
}
```

Update the admin SEO page to show a badge "Has inline metadata" for pages that already have good SEO from code.

### Step 4: Wire pages to check DB override, fall back to inline

**Create `lib/seo/db-override.ts`** — helper that each page's `generateMetadata()` can call:

```typescript
import { getSEOMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';

export async function applyDBOverride(
  pagePath: string,
  inlineMetadata: Metadata
): Promise<Metadata> {
  const dbSeo = await getSEOMetadata(pagePath);
  if (!dbSeo || (!dbSeo.meta_title && !dbSeo.meta_description)) {
    return inlineMetadata; // No DB override — use inline
  }

  // Merge: DB values override inline where present
  return {
    ...inlineMetadata,
    ...(dbSeo.meta_title ? { title: dbSeo.meta_title } : {}),
    ...(dbSeo.meta_description ? { description: dbSeo.meta_description } : {}),
    ...(dbSeo.meta_keywords ? { keywords: dbSeo.meta_keywords } : {}),
    openGraph: {
      ...(inlineMetadata.openGraph as any),
      ...(dbSeo.og_title ? { title: dbSeo.og_title } : {}),
      ...(dbSeo.og_description ? { description: dbSeo.og_description } : {}),
      ...(dbSeo.og_image ? { images: [{ url: dbSeo.og_image, width: 1200, height: 630 }] } : {}),
    },
    ...(dbSeo.canonical_url ? { alternates: { ...inlineMetadata.alternates, canonical: dbSeo.canonical_url } } : {}),
  };
}
```

Then in each page's `generateMetadata()`, wrap the return:

```typescript
// Before:
return { title, description, ... };

// After:
return applyDBOverride(`/${locale}/divky`, { title, description, ... });
```

This makes admin SEO edits actually work while keeping all inline defaults intact.

### Step 5: Populate `seo_metadata` with existing inline data

**Create `scripts/sync-seo-metadata.ts`** — one-time script that:

1. For each page in `getAllPages()` (corrected):
   - Check if `seo_metadata` row exists
   - If exists but empty (score 0, no title): populate with the inline defaults
   - If exists with data: keep existing (admin already edited)
   - If doesn't exist: create with inline defaults

This brings the admin dashboard score from 6 "optimized" up to ~70+ immediately (all pages with inline metadata get their real values reflected).

### Step 6: Clean up stale `seo_metadata` rows

Delete rows with wrong paths (old `/schedule`, `/discounts`, `/reviews` paths):

```sql
DELETE FROM seo_metadata WHERE page_path LIKE '%/schedule';
DELETE FROM seo_metadata WHERE page_path LIKE '%/discounts';
DELETE FROM seo_metadata WHERE page_path LIKE '%/reviews';
DELETE FROM seo_metadata WHERE page_path LIKE '%/sluzby' AND page_type = 'static';
```

### Step 7: Add `generateMetadata` to 2 missing pages

- `app/[locale]/join/success/page.tsx` — add `robots: { index: false, follow: false }`
- `app/[locale]/recenze/nova/[slug]/page.tsx` — add `robots: { index: false, follow: false }`

---

## Files Summary

### Modified Files:

| # | File | Change |
|---|------|--------|
| 1 | `lib/pages.ts` | Fix slugs, add missing static pages |
| 2 | `app/api/pages/route.ts` | Add dynamic pages (girls, services, locations, blog) from DB, remove duplicates |
| 3 | `lib/seo-utils.ts` | Add `hasInlineMetadata()` helper |
| 4 | `app/[locale]/join/success/page.tsx` | Add noindex metadata |
| 5 | `app/[locale]/recenze/nova/[slug]/page.tsx` | Add noindex metadata |

### New Files:

| # | File | Description |
|---|------|-------------|
| 6 | `lib/seo/db-override.ts` | `applyDBOverride()` — merge DB SEO data onto inline metadata |
| 7 | `scripts/sync-seo-metadata.ts` | One-time: populate `seo_metadata` with inline defaults |

### Pages to Add `applyDBOverride()` Call (23 files):

All pages with existing `generateMetadata()`. This is a mechanical change — wrap the return value:

```
app/[locale]/page.tsx
app/[locale]/divky/page.tsx
app/[locale]/profil/[slug]/page.tsx
app/[locale]/cenik/page.tsx
app/[locale]/rozvrh/page.tsx
app/[locale]/faq/page.tsx
app/[locale]/slevy/page.tsx
app/[locale]/blog/page.tsx
app/[locale]/blog/[slug]/page.tsx
app/[locale]/hashtag/[slug]/page.tsx
app/[locale]/sluzba/[slug]/page.tsx
app/[locale]/pobocka/[slug]/page.tsx
app/[locale]/o-nas/page.tsx
app/[locale]/kontakt/page.tsx
app/[locale]/soukromi/page.tsx
app/[locale]/podminky/page.tsx
app/[locale]/recenze/page.tsx
app/[locale]/join/page.tsx
app/[locale]/clenstvi/zadost/page.tsx
app/[locale]/clenstvi/zadost/odeslano/page.tsx
```

---

## Implementation Order

```
Step 1: lib/pages.ts                    ← fix URL slugs (5 min)
Step 2: app/api/pages/route.ts          ← add dynamic pages from DB (15 min)
Step 3: Clean stale seo_metadata rows   ← SQL DELETE (2 min)
Step 4: scripts/sync-seo-metadata.ts    ← populate DB with inline defaults (20 min)
Step 5: lib/seo/db-override.ts          ← create override helper (10 min)
Step 6: Wire applyDBOverride to pages   ← mechanical edit x 20 files (30 min)
Step 7: Add noindex to 2 pages          ← quick (5 min)
Step 8: lib/seo-utils.ts update         ← scoring awareness (10 min)
```

Steps 1-3 can be done first as quick wins (admin dashboard immediately shows correct pages).
Steps 4-6 bridge the two systems.
Step 7-8 are polish.

---

## Expected Result After All Steps

### Before:
- 288 pages, 6 optimized, 255 need work
- Admin SEO edits have NO effect on actual HTML
- Wrong URLs in page list

### After:
- ~340 pages (correct count: 56 static + 48 profiles + 116 services + 12 locations + 20 blog posts + 176 hashtags - stale rows)
- ~160+ optimized (all pages with inline metadata score 70-90)
- Admin SEO edits OVERRIDE inline defaults (actually work)
- Correct URLs matching real routes

---

## Page Count Breakdown (Expected)

| Type | Count | Source |
|------|-------|--------|
| Static pages | 14 routes x 4 locales = **56** | Homepage, divky, cenik, rozvrh, slevy, faq, blog, recenze, o-nas, kontakt, soukromi, podminky, join, clenstvi/zadost |
| Girl profiles | 12 girls x 4 locales = **48** | From `girls` table |
| Services | 29 services x 4 locales = **116** | From `services` table |
| Locations | 3 locations x 4 locales = **12** | From `locations` table |
| Blog posts | 5 posts x 4 locales = **20** | From `blog_posts` table |
| Hashtag pages | 44 hashtags x 4 locales = **176** | From `lib/hashtags.ts` |
| **Total** | **428** | |

---

## Notes for Implementor

1. **DO NOT delete existing `seo_metadata` rows with real data** (the 42 with meta_title filled in were manually edited by admin). Only clean stale/wrong-URL rows.
2. The `seo_metadata` table uses paths like `/cs/profily/niky` but the actual route is `/cs/profil/niky`. Check if this is a typo in existing data (profily vs profil).
3. `lib/seo-metadata.ts` with `generatePageMetadata()` already exists and works — just no page calls it. The new `applyDBOverride()` is simpler (merge, not replace).
4. The hashtag pages (176) will likely stay at score 0 in admin since they have inline metadata but admin hasn't edited them. That's OK — the actual HTML has good SEO from code.
