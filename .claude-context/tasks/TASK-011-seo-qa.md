# QA Report — Task #11: SEO Fix Implementation

**Reviewer:** kontrolor  
**Date:** 2026-06-05  
**Files reviewed:**
- `lib/pages.ts`
- `lib/seo-utils.ts`
- `lib/seo/db-override.ts`
- `lib/seo-metadata.ts`
- `app/api/pages/route.ts`
- `scripts/sync-seo-metadata.ts`
- All 20 pages with `generateMetadata()`

---

## 1. SIMPLIFY CHECK

### No structural issues
- `lib/seo/db-override.ts` is clean — 35 lines, single responsibility (merge DB over inline)
- `lib/seo-utils.ts` is clean — no DB imports, client-safe
- `lib/pages.ts` is clean — no DB imports, pure function
- `scripts/sync-seo-metadata.ts` is a one-shot script — acceptable verbosity

### Minor: unused import in `join/page.tsx:20`
```ts
const tNav = await getTranslations({ locale, namespace: 'nav' });
```
`tNav` is only used in the page body (line 146 — `<Breadcrumbs items={[{ label: tNav('join') }]}`), not inside `generateMetadata`. It's imported at function level inside `generateMetadata` on line 20 — but unused there. The function also has a trailing blank line before closing brace. Minor, not blocking.

---

## 2. DEBUG CHECK

### TypeScript: PASSES ✅
`npx tsc --noEmit` — no errors.

### Build: PASSES ✅
`npm run build` — completes successfully. All SEO-related routes registered: `/api/pages`, `/api/seo`, `/llms.txt`, `/robots.txt`, `/sitemap.xml`.

---

## 3. REVERSE CHECK

### Requirement: Admin SEO edits actually affect HTML meta tags

✅ **DONE** — `applyDBOverride()` in `lib/seo/db-override.ts` merges DB values onto inline metadata:
- Overwrites `title`, `description`, `keywords` if set in DB
- Overwrites `openGraph.title`, `openGraph.description`, `openGraph.images`, `alternates.canonical`
- All 20 public pages call `applyDBOverride()` in their `generateMetadata()`

The flow works: Admin edits `seo_metadata` table → `getSEOMetadata(path)` reads it → `applyDBOverride()` merges it → Next.js renders it into `<head>`.

### Requirement: Correct Czech slugs (rozvrh not schedule, slevy not discounts)

✅ **DONE** — `lib/pages.ts` static list uses:
- `/rozvrh` (line 25) ✅
- `/slevy` (line 26) ✅
- `/profil/`, `/sluzba/`, `/pobocka/` ✅

`app/api/pages/route.ts` also uses correct slugs for dynamic pages.

Note: `app/[locale]/rozvrh/page.tsx:34` and `app/[locale]/slevy/page.tsx:37` contain `en: '/schedule'` and `en: '/discounts'` — these are correct EN alternates for the `alternates.languages` hreflang map, NOT the Czech routes. No issue.

### Requirement: Dynamic pages (profiles, services, locations, blog) in page list

✅ **DONE** — `app/api/pages/route.ts` builds them from DB:
- Girl profiles: `/${locale}/profil/${slug}` (line 31) ✅
- Services: `/${locale}/sluzba/${slug}` (line 43) ✅
- Locations: `/${locale}/pobocka/${loc.name}` (line 59) ✅
- Blog posts: `/${locale}/blog/${slug}` (line 71) ✅
- Hashtags: `/${locale}/hashtag/${hashtag.id}` (line 84) ✅

### Requirement: noindex on join/success and recenze/nova/[slug]

**`/join/success/page.tsx`** ✅ — `metadata: { robots: { index: false, follow: false } }` at line 5. Correct.

**`/recenze/nova/[slug]/page.tsx`** ✅ — `metadata: { robots: { index: false, follow: false } }` at line 11. Correct.

**BUG: `/join/page.tsx` has NO noindex** ⚠️

`app/[locale]/join/page.tsx:21`:
```ts
return applyDBOverride(`/${locale}/join`, { title: t('h1') });
```
No `robots` key is passed as inline metadata. `applyDBOverride()` only touches title/description/keywords/og/canonical — it does NOT write `robots`. Result: the Join page (recruitment page for girls) is **indexable** — it has no noindex in the rendered HTML.

Per `docs/ZADANI.md:1542`: "Admin/Studio NEINDEXOVAT (robots.txt + meta noindex)" — and per the original plan (`TASK-010-seo-full-plan.md:61`), join/page.tsx was listed as a page that has `generateMetadata()` but the implementation omitted `robots: { index: false }`.

**Fix needed:** Add `robots: { index: false, follow: false }` to the inline metadata passed to `applyDBOverride()`:
```ts
return applyDBOverride(`/${locale}/join`, {
  title: t('h1'),
  robots: { index: false, follow: false },
});
```

### Requirement: Build passes

✅ **PASSES** — see Debug Check above.

---

## Summary

| Check | Result |
|---|---|
| Simplify | Minor unused import in join/page.tsx |
| TypeScript | PASSES |
| Build | PASSES |
| DB overrides affect HTML meta | ✅ |
| Correct slugs (rozvrh/slevy) | ✅ |
| Dynamic pages in page list | ✅ |
| noindex join/success | ✅ |
| noindex recenze/nova/[slug] | ✅ |
| noindex join/page.tsx | ❌ MISSING |

---

## Issues to fix

**BLOCKER (SEO safety): `join/page.tsx` missing `robots: { index: false }`**

The girl recruitment page is publicly indexable. This should have noindex — it's a form for candidates, not content Google should rank. One-line fix in `generateMetadata()`.

**LOW: Unused `tNav` inside `generateMetadata` in join/page.tsx (line 20)** — dead code, remove it from inside the metadata function (keep it in the page body).

---

**Overall verdict: CONDITIONAL APPROVAL — one blocker (noindex on /join).** Fix is trivial (one line). All other requirements are correctly implemented.
