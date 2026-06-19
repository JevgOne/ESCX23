# SEO Implementation Report

**Date:** 2026-06-14 | **Implementor:** implementator agent

## P0 — OG Tags Missing in Production

### Investigation
- `lib/seo/db-override.ts` — code is correct. When no DB override exists, returns `inlineMetadata` unchanged (including openGraph). When DB override exists, merges OG fields properly.
- **Root cause:** `NEXT_PUBLIC_SITE_URL` env var in `.env.prod.local` is set to `https://escx23.vercel.app` instead of `https://www.lovelygirls.cz`. This causes OG image URLs to point to the old Vercel preview domain.
- **Fix:** User must update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to `https://www.lovelygirls.cz` (tracked in Task #13).

### Additional fix: Duplicate hreflang/canonical
- `app/[locale]/layout.tsx` was injecting manual `<link rel="canonical">` and `<link rel="alternate" hrefLang>` via `<head>` tags, AND pages also set `alternates` in `generateMetadata`. Both rendered → duplicates (10 tags instead of 5).
- **Fix:** Removed manual `<link>` tags from layout, removed unused `getHreflangsForPath`/`getCanonicalForPath` import. All pages now use `generateMetadata` `alternates` as single source of truth.

## P1 — Updated Titles/Descriptions (all 4 languages)

| Page | File | Old Title (cs) | New Title (cs) |
|------|------|----------------|----------------|
| Homepage | `app/[locale]/page.tsx` | LovelyGirls Praha — Ověřené společnice | Escort Praha — Ověřené společnice v privátním apartmánu \| LovelyGirls |
| Ceník | `app/[locale]/cenik/page.tsx` | Ceník | Ceník společnic Praha — Programy a ceny \| LovelyGirls |
| Rozvrh | `app/[locale]/rozvrh/page.tsx` | Rozvrh | Rozvrh společnic dnes — Kdo je k dispozici \| LovelyGirls Praha |
| Slevy | `app/[locale]/slevy/page.tsx` | Slevy | Slevy a věrnostní program — Až 20 % sleva \| LovelyGirls Praha |
| FAQ | `app/[locale]/faq/page.tsx` | Časté dotazy | Časté dotazy — Escort Praha, rezervace, platba \| LovelyGirls |
| Recenze | `app/[locale]/recenze/page.tsx` | Recenze | Recenze klientů — Zkušenosti se společnicemi \| LovelyGirls Praha |

All pages updated with keyword-rich descriptions in cs, en, de, uk.

## P1 — Added OG Meta to Pages Missing It

| Page | Changes |
|------|---------|
| `/o-nas` | Added `openGraph` (images, title, desc, url, locale) + `alternates` (canonical + hreflang) |
| `/kontakt` | Same |
| `/podminky` | Same (kept `robots: noindex`) |
| `/soukromi` | Same (kept `robots: noindex`) |
| `/sluzba/[slug]` | Same (dynamic slug in alternates) |

## Additional Fixes

- **Homepage, cenik, slevy, divky** — added missing `alternates` to `generateMetadata` (were computed but not returned)
- **`next.config.ts`** — added `/:locale/studio/:path*` X-Robots-Tag (was missing, only `/studio/:path*` existed)
- **Profile page** — added `meta_title_*` and `og_title_*` column support in `generateMetadata` (admin can now override profile SEO titles)

## Build Status
Clean — no TypeScript errors.
