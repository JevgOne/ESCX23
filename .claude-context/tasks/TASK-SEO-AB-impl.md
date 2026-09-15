# TASK SEO-A+B: Implementation Report

**Status:** COMPLETED
**Date:** 2026-09-13

---

## Changes Made

### 1. `components/layout/SiteFooter.tsx`

**Pobočky link (line ~151):**
- Before: `<a href={\`${localePrefix}/pobocka/${loc.name}\`}>`
- After: `<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>`

**Hashtag kategorie (lines ~165-168):**
- Before: `<a href={\`${localePrefix}/hashtag/blondynky-praha\`}>` (4× raw `<a>`)
- After: `<Link href={{ pathname: '/hashtag/[slug]', params: { slug: 'blondynky-praha' } }}>` (4× next-intl `<Link>`)

**Cleanup:**
- Removed unused `localePrefix` variable (was `locale === 'en' ? '' : \`/${locale}\``)
- `Link` was already imported from `@/i18n/navigation`

### 2. `components/layout/MobileBottomBar.tsx`

**Import change:**
- Before: `import { localePrefix } from '@/lib/seo/meta';`
- After: `import { Link } from '@/i18n/navigation';`

**Pobočky link (lines ~52-62):**
- Before: `<a href={\`${localePrefix(locale)}/pobocka/${loc.name}\`}>...</a>`
- After: `<Link href={{ pathname: '/pobocka/[slug]', params: { slug: loc.name } }}>...</Link>`

### 3. `i18n/routing.ts`

**Added missing pathname:**
- Added `'/hashtag/[slug]': '/hashtag/[slug]'` to pathnames config
- Route `app/[locale]/hashtag/[slug]/page.tsx` existed but was not registered in routing — TypeScript would reject the Link otherwise

---

## Verification

- **`npm run typecheck`** — PASS (0 new errors; pre-existing e2e/tests/full-test.spec.ts errors unrelated)
- **`npm run build`** — Compilation OK ("Compiled successfully in 8.8s"); fails at page data collection due to missing TURSO_DATABASE_URL in local env (pre-existing, not caused by these changes)

## Impact

Eliminates ~254 redirect chain warnings from SEMrush audit:
- Footer appears on EVERY page → 5 fixed links (1 pobočka + 4 hashtag) × all pages in non-CS locale
- MobileBottomBar appears on EVERY page → N fixed links (per location) × all pages in non-CS locale
- Root cause: for EN locale, `localePrefix = ""` so links were `/pobocka/praha-2` instead of `/location/praha-2`, causing 301 redirect chains
