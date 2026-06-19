# SEO OG Fix Plan — Proč chybí OG tagy v produkci

**Datum:** 2026-06-14 | **Analyst:** planovac agent

---

## ROOT CAUSE ANALYSIS

### Architektura OG tagů

1. **Layout-level** (`app/[locale]/layout.tsx:69-75`): Static `export const metadata` includes default `openGraph` with `type: 'website'`, `siteName`, `locale: 'en_US'`, `images: /og/default.jpg`

2. **Page-level** (`generateMetadata()`): Each page returns `openGraph` with specific `title`, `description`, `url`, `locale`, `images`

3. **DB Override** (`lib/seo/db-override.ts`): `applyDBOverride()` merges DB values onto inline metadata

### How `applyDBOverride` works (lines 9-35)

```
1. Fetch DB entry for page_path (e.g., '/cs')
2. If no DB entry OR no meta_title AND no meta_description → return inline metadata as-is
3. If DB entry exists with meta_title OR meta_description:
   a. Take inline openGraph as ogBase
   b. Return new Metadata:
      - title: dbSeo.meta_title ?? inline
      - description: dbSeo.meta_description ?? inline
      - openGraph: { ...ogBase, title?: dbSeo.og_title, desc?: dbSeo.og_description, images?: dbSeo.og_image }
```

### DB Data Analysis (local dev DB)

| Page | DB `meta_title` | DB `og_title` | DB `og_image` | Prod OG? |
|------|----------------|--------------|---------------|----------|
| `/cs` | YES | YES | YES | **NO** |
| `/cs/cenik` | YES | YES | YES | **YES** |
| `/cs/divky` | YES | YES | YES | **YES** |
| `/cs/slevy` | YES | EMPTY | EMPTY | **NO** |
| `/cs/faq` | YES | YES | YES | **NO** |
| `/cs/recenze` | YES | ? | ? | **NO** |
| `/cs/profil/anetta` | NO (path mismatch) | NO | NO | **NO** |

### Possible Root Causes

#### Theory 1: Production Turso DB has different data than local (MOST LIKELY)

The `seo_metadata` table was imported from Secretstory export (`docs/secretstory-export/seo_metadata.sql`). But the entries use **old paths** from Secretstory (e.g., `/cs/profily/niky` instead of `/cs/profil/anetta`).

The `scripts/sync-seo-metadata.ts` was created to sync defaults into the DB, but may not have been run on the production Turso instance.

**Evidence:**
- Homepage (`/cs`) has OG data in local DB but not in production HTML
- Cenik (`/cs/cenik`) has OG in both local DB and production — BUT this might be because admin edited it via the SEO dashboard
- Profile (`/cs/profil/anetta`) has no DB entry at all — the old entries use `/cs/profily/niky` path

**If prod Turso DB has NO `seo_metadata` table or different entries:**
- `getSEOMetadata('/cs')` returns `null` (table doesn't exist) or different data
- `applyDBOverride` returns inline metadata untouched
- Inline metadata HAS openGraph (for homepage at least)
- But layout's static `metadata.openGraph` might conflict

#### Theory 2: DB query failure is silently swallowed

`lib/seo-metadata.ts:30-44` wraps the DB query in try/catch and returns `null` on error:
```ts
} catch (error) {
  console.error('Error fetching SEO metadata:', error);
  return null;
}
```

If the `seo_metadata` table doesn't exist in prod Turso, every `getSEOMetadata()` call throws and returns `null`. This means `applyDBOverride` returns the inline metadata untouched (line 16: `return inlineMetadata`).

In this case, the inline metadata WITH openGraph should render correctly. So this theory alone doesn't explain the issue.

#### Theory 3: Next.js metadata merging conflict (POSSIBLE)

The layout has a STATIC `export const metadata` with `openGraph`. The page has DYNAMIC `generateMetadata()` with `openGraph`. Next.js App Router merges these:

- For nested fields like `openGraph`, Next.js does a **shallow merge** (page-level overrides layout-level)
- BUT if the page-level `openGraph` is missing some fields the layout provides (like `type`, `siteName`, `alternateLocale`), those layout defaults are lost

This shouldn't cause MISSING OG tags though — it would just cause INCOMPLETE ones.

#### Theory 4: WebFetch parsing limitation (POSSIBLE FALSE ALARM)

Next.js 16 uses React 19 streaming. The `<head>` section is streamed first, but `generateMetadata()` is async — if the DB query takes time, the OG tags might be inserted AFTER the initial chunk. WebFetch might only capture the first chunk.

**Evidence supporting this:**
- `/cs/cenik` (which works) uses `revalidate = 3600` — so it's cached/ISR, metadata is pre-built
- `/cs` homepage uses `force-dynamic` — metadata is computed on every request, may stream differently
- `/cs/slevy` uses `force-dynamic` — same issue

**Evidence against this:**
- WebFetch consistently shows canonical + hreflang tags (also in `<head>`) for all pages
- `/cs/divky` uses `force-dynamic` too but OG tags ARE present

#### Theory 5: applyDBOverride strips implicit fields (CONFIRMED FOR SOME PAGES)

When the DB has `meta_title` set but NO `og_title`, `applyDBOverride` returns:

```ts
{
  ...inlineMetadata,
  title: dbSeo.meta_title,  // OVERRIDES inline title with DB value
  description: dbSeo.meta_description,
  openGraph: {
    ...ogBase,  // ogBase = inlineMetadata.openGraph (if it exists)
    // NO title override (og_title is empty)
    // NO description override (og_description is empty) 
    // NO images override (og_image is empty)
  },
}
```

For pages like `/cs/slevy` where inline openGraph IS set (`title`, `description`, `url`, `locale`, `images`), `ogBase` preserves those values. The returned object should have valid openGraph.

UNLESS the issue is that `title` in `ogBase` is already the INLINE title (e.g., "Slevy"), but the top-level `title` is now the DB title (e.g., "Slevy a akce | LovelyGirls Praha"). Next.js might use the top-level `title` for OG if `openGraph.title` is not explicitly set.

Actually, rethinking — `inlineMetadata.openGraph` for slevy IS set with explicit `title` and `description`. So `ogBase` should have them. The spread `...ogBase` preserves them. So this shouldn't be the issue either.

---

## DEFINITIVE ROOT CAUSE — Need to verify

The most likely scenario is a **combination of Theory 1 + Theory 4**:

1. **Production DB differs from local dev DB** — many pages have different or missing data
2. **WebFetch may not reliably extract all meta tags from streaming Next.js pages** — false negatives possible

### To verify:

Run this in production (user must do):
```bash
curl -s https://www.lovelygirls.cz/cs | grep -i 'og:'
curl -s https://www.lovelygirls.cz/cs/slevy | grep -i 'og:'
curl -s https://www.lovelygirls.cz/cs/cenik | grep -i 'og:'
```

If `curl` shows OG tags that WebFetch missed → **Theory 4 confirmed** (WebFetch false alarm)
If `curl` also shows no OG tags → **Real issue** in code or DB

### Alternative verification:
Use Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/` with URL `https://www.lovelygirls.cz/cs` — this will show exactly what Facebook sees.

---

## FIX PLAN (regardless of root cause)

### Fix 1: Make applyDBOverride more robust (P0)

**Problem:** When DB has `meta_title` but no `og_title`, the function creates `openGraph` by spreading inline values. If inline values are lost or empty, OG is empty.

**Fix:** If the DB has no OG-specific fields, fall back to using `meta_title` and `meta_description` for OG too:

**File:** `lib/seo/db-override.ts`

```ts
export async function applyDBOverride(
  pagePath: string,
  inlineMetadata: Metadata,
): Promise<Metadata> {
  const dbSeo = await getSEOMetadata(pagePath);
  if (!dbSeo || (!dbSeo.meta_title && !dbSeo.meta_description)) {
    return inlineMetadata;
  }

  const ogBase = (inlineMetadata.openGraph ?? {}) as Record<string, unknown>;
  
  // Use DB OG fields, or fall back to DB meta fields, or keep inline
  const ogTitle = dbSeo.og_title || dbSeo.meta_title || ogBase.title;
  const ogDesc = dbSeo.og_description || dbSeo.meta_description || ogBase.description;

  return {
    ...inlineMetadata,
    ...(dbSeo.meta_title ? { title: dbSeo.meta_title } : {}),
    ...(dbSeo.meta_description ? { description: dbSeo.meta_description } : {}),
    ...(dbSeo.meta_keywords ? { keywords: dbSeo.meta_keywords } : {}),
    openGraph: {
      ...ogBase,
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(ogDesc ? { description: ogDesc } : {}),
      ...(dbSeo.og_image ? { images: [{ url: dbSeo.og_image, width: 1200, height: 630 }] } : {}),
    },
    ...(dbSeo.canonical_url
      ? { alternates: { ...(inlineMetadata.alternates ?? {}), canonical: dbSeo.canonical_url } }
      : {}),
  };
}
```

**Why this helps:** Even when DB has empty `og_title`, the function will use `meta_title` as fallback for OG title. This ensures OG tags are never silently dropped.

### Fix 2: Add openGraph to pages missing it in code (P1)

Pages that currently have NO openGraph in their generateMetadata:

| File | Add |
|------|-----|
| `app/[locale]/o-nas/page.tsx` | `openGraph: { title, description, url: canonical, locale: ogLocale(locale) }` |
| `app/[locale]/kontakt/page.tsx` | Same pattern |
| `app/[locale]/sluzba/[slug]/page.tsx` | Same pattern + dynamic title from DB |
| `app/[locale]/faq/page.tsx` | Already has layout-level OG, but add explicit |

### Fix 3: Verify production DB has seo_metadata table (P0 — user action)

User should run:
```bash
# Check if table exists in Turso production
turso db shell <db-name> "SELECT COUNT(*) FROM seo_metadata"

# If empty or missing, import:
turso db shell <db-name> < docs/secretstory-export/seo_metadata.sql

# Or run sync script against production:
DATABASE_URL=<turso-url> TURSO_AUTH_TOKEN=<token> npx tsx scripts/sync-seo-metadata.ts
```

### Fix 4: Verify with curl on production (P0 — user action)

```bash
curl -s https://www.lovelygirls.cz/cs 2>/dev/null | grep -c 'og:'
curl -s https://www.lovelygirls.cz/cs/cenik 2>/dev/null | grep -c 'og:'
curl -s https://www.lovelygirls.cz/cs/slevy 2>/dev/null | grep -c 'og:'
curl -s https://www.lovelygirls.cz/cs/profil/anetta 2>/dev/null | grep -c 'og:'
```

---

## FILES TO MODIFY

| File | Change | Priority |
|------|--------|----------|
| `lib/seo/db-override.ts` | Add OG fallback logic (og_title ?? meta_title) | P0 |
| `app/[locale]/o-nas/page.tsx` | Add openGraph to generateMetadata | P1 |
| `app/[locale]/kontakt/page.tsx` | Add openGraph to generateMetadata | P1 |
| `app/[locale]/sluzba/[slug]/page.tsx` | Add openGraph to generateMetadata | P1 |
| `app/[locale]/faq/page.tsx` | Add explicit openGraph (currently relies on layout) | P1 |

## USER ACTIONS REQUIRED

1. Verify production Turso DB has `seo_metadata` table with data
2. Run `curl -s URL | grep 'og:'` tests on production
3. Test with Facebook Sharing Debugger
