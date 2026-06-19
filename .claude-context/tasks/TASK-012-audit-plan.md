# TASK-012: Kompletni audit webu na www.lovelygirls.cz — Plan

## Overview

Comprehensive audit checklist for verifying the website works correctly on the new domain `www.lovelygirls.cz`. This covers public pages, locale versions, admin/studio behind auth, SEO assets, redirects, and old URL references.

---

## 1. ENVIRONMENT / DEPLOYMENT ISSUES

### 1.1 NEXT_PUBLIC_SITE_URL Still Points to Old Domain
- **Location:** Vercel Dashboard environment variables
- **Current:** `NEXT_PUBLIC_SITE_URL="https://escx23.vercel.app"`
- **Required:** `NEXT_PUBLIC_SITE_URL="https://www.lovelygirls.cz"`
- **Impact:** All canonical URLs, hreflang, OG tags, sitemap, JSON-LD use this variable. Currently generating old-domain URLs.
- **Affected code files:**
  - `lib/seo/hreflang.ts:3` — canonical/hreflang generation
  - `lib/seo/og.ts:3` — OG image URLs
  - `lib/seo/meta.ts:1` — canonical URL generation
  - `lib/seo/jsonld.ts:1` — structured data URLs
  - `app/sitemap.ts:13` — sitemap URLs
  - `app/[locale]/layout.tsx:35` — metadataBase
  - `lib/photoUrl.ts:6` — photo URL resolution
  - `lib/seo.ts:49` — base URL

### 1.2 SESSION_SECRET Empty in Production
- See TASK-010 plan for details. Without this, admin/studio login fails.

### 1.3 GOOGLE_REDIRECT_URI Points to Old Domain
- **Current:** `https://escx23.vercel.app/api/gcal/callback`
- **Required:** `https://www.lovelygirls.cz/api/gcal/callback`
- Also needs update in Google Cloud Console OAuth settings.

---

## 2. REDIRECTS

### 2.1 Non-www to www (/next.config.ts:18-23)
- **Test:** `curl -I https://lovelygirls.cz/cs/divky` should 301 to `https://www.lovelygirls.cz/cs/divky`
- **Status:** Code looks correct.

### 2.2 Old Vercel domain redirect (next.config.ts:25-30)
- **Test:** `curl -I https://escx23.vercel.app/cs/divky` should 301 to `https://www.lovelygirls.cz/cs/divky`
- **Status:** Code looks correct.

### 2.3 Admin unauthenticated redirect
- **Test:** `GET /admin` without session -> should redirect to `/admin/login` (en) or `/cs/admin/login` (cs)
- **Current issue:** Always redirects to `/cs/admin/login` regardless of locale (see TASK-010).

---

## 3. PUBLIC PAGES — FUNCTIONAL CHECK

All pages should return status 200 and render correct content. Test all 4 locales.

### Pages to check:

| Page | CS URL | EN URL | DE URL | UK URL |
|------|--------|--------|--------|--------|
| Homepage | `/cs` | `/` | `/de` | `/uk` |
| Girls listing | `/cs/divky` | `/girls` | `/de/maedchen` | `/uk/divchata` |
| Profile | `/cs/profil/anetta` | `/profile/anetta` | `/de/profil/anetta` | `/uk/profil/anetta` |
| Pricing | `/cs/cenik` | `/pricing` | `/de/preise` | `/uk/tsiny` |
| Schedule | `/cs/rozvrh` | `/schedule` | `/de/zeitplan` | `/uk/rozklad` |
| Discounts | `/cs/slevy` | `/discounts` | `/de/rabatte` | `/uk/znyzhky` |
| FAQ | `/cs/faq` | `/faq` | `/de/faq` | `/uk/faq` |
| Reviews | `/cs/recenze` | `/reviews` | `/de/rezensionen` | `/uk/vidhuky` |
| About | `/cs/o-nas` | `/about` | `/de/ueber-uns` | `/uk/pro-nas` |
| Contact | `/cs/kontakt` | `/contact` | `/de/kontakt` | `/uk/kontakt` |
| Terms | `/cs/podminky` | `/terms` | `/de/agb` | `/uk/umovy` |
| Privacy | `/cs/soukromi` | `/privacy` | `/de/datenschutz` | `/uk/konfidentsiinist` |
| Blog | `/cs/blog` | `/blog` | `/de/blog` | `/uk/blog` |
| Join | `/cs/pridat-se` | `/join` | `/de/bewerben` | `/uk/dodaty-sia` |
| Membership | `/cs/clenstvi/zadost` | `/membership/apply` | ... | ... |
| Service page | `/cs/sluzba/{slug}` | `/service/{slug}` | `/de/leistung/{slug}` | `/uk/posluha/{slug}` |
| Hashtag | `/cs/hashtag/{slug}` | `/hashtag/{slug}` | ... | ... |
| Location | `/cs/pobocka/{slug}` | `/pobocka/{slug}` | ... | ... |
| Review form | `/cs/recenze/nova/{slug}` | ... | ... | ... |

### Special checks:
- **404 pages:** `/cs/profil/neexistujici` should return 404 with proper error page
- **Schedule past-day redirect:** `/cs/rozvrh?day=2025-01-01` should redirect to today
- **Girls filters:** `/cs/divky?status=available` should filter correctly

---

## 4. SEO AUDIT

### 4.1 Canonical URLs
- Every page should have `<link rel="canonical" href="https://www.lovelygirls.cz/...">` (NOT `escx23.vercel.app`)
- **Current risk:** If `NEXT_PUBLIC_SITE_URL` is not updated, all canonicals point to old domain.
- Check via: view page source, look for `<link rel="canonical">`

### 4.2 Hreflang Tags
- Every public page should have hreflang for all 4 locales + x-default
- All should use `https://www.lovelygirls.cz`
- **Implementation:** `lib/seo/hreflang.ts` — uses `NEXT_PUBLIC_SITE_URL`, so depends on env fix
- Check via: `<link rel="alternate" hreflang="cs" href="...">`

### 4.3 OG Tags (og:url, og:image)
- `og:url` should use `www.lovelygirls.cz`
- `og:image` should resolve correctly (not relative to old domain)
- Check: `<meta property="og:url" content="...">`

### 4.4 sitemap.xml
- **URL:** `https://www.lovelygirls.cz/sitemap.xml`
- All URLs inside must use `www.lovelygirls.cz`
- Must include alternates (hreflang) per page
- Should list all active girls, services, locations, blog posts, hashtags
- **Code:** `app/sitemap.ts` uses `NEXT_PUBLIC_SITE_URL`

### 4.5 robots.txt
- **URL:** `https://www.lovelygirls.cz/robots.txt`
- Should allow `/` for main crawlers, block `/admin/`, `/studio/`, `/api/`
- Sitemap reference should use correct domain
- Preview detection should not trigger on `www.lovelygirls.cz`
- **Code:** `app/robots.ts` — uses `host` header dynamically, looks correct

### 4.6 llms.txt
- **URL:** `https://www.lovelygirls.cz/llms.txt`
- All links inside should use correct domain
- **Code:** `app/llms.txt/route.ts` — uses `host` header dynamically, looks correct

### 4.7 Structured Data (JSON-LD)
- Homepage LocalBusiness schema should have correct `url`, `@id`
- Profile pages should have correct Person/ProfilePage schema
- FAQ pages should have FAQPage schema
- **Code:** `lib/seo/jsonld.ts` — uses `NEXT_PUBLIC_SITE_URL`

### 4.8 X-Robots-Tag Headers
- `/admin/*` and `/studio/*` should have `X-Robots-Tag: noindex, nofollow`
- **Code:** `next.config.ts:34-49` — configured for both prefixed and unprefixed paths

---

## 5. ADMIN & STUDIO (behind auth)

### 5.1 Admin Login & Session
- See TASK-010 for detailed plan (SESSION_SECRET, locale-aware redirects)
- Test: Login, navigate pages, logout, re-login
- Credentials: `admin@lovelygirls.cz` / `Admin2026!`

### 5.2 Admin Pages to Verify
All admin pages should load without errors after login:
- Dashboard (`/cs/admin`)
- Girls list (`/cs/admin/divky`)
- Girl edit (`/cs/admin/divky/{id}`)
- Girl photos (`/cs/admin/divky/{id}/fotky`)
- Girl videos (`/cs/admin/divky/{id}/videa`)
- Girl availability (`/cs/admin/divky/{id}/dostupnost`)
- Schedule overview (`/cs/admin/schedules`)
- Reviews (`/cs/admin/recenze`)
- Reservations (`/cs/admin/rezervace`)
- Pricing (`/cs/admin/cenik`)
- Extras (`/cs/admin/cenik/extras/{id}`)
- Plans (`/cs/admin/cenik/plany/{id}`)
- Discounts (`/cs/admin/slevy`)
- Members (`/cs/admin/clenove`)
- Locations (`/cs/admin/pobocky`)
- Blog (`/cs/admin/blog`)
- Blog tags (`/cs/admin/blog/tagy`)
- FAQ (`/cs/admin/faq`)
- SEO (`/cs/admin/seo`)
- OG images (`/cs/admin/og`)
- Applications (`/cs/admin/aplikace`)
- Verification (`/cs/admin/verifikace`)
- Stories (`/cs/admin/stories`)

### 5.3 Studio Login & Pages
- Credentials: `anetta@lovelygirls.cz` / `Anetta2026!`
- Dashboard (`/cs/studio`)
- All studio sub-pages (profil-status, recenze, sluzby, fotky, etc.)

### 5.4 Admin Form Actions (Server Actions)
- Test that editing a girl, approving a review, managing discounts, etc. actually saves and doesn't error
- Server Actions use `redirect()` which should work on `www.lovelygirls.cz` if cookies are correct

---

## 6. HARDCODED OLD URLS IN HTML OUTPUT

### 6.1 No `escx23.vercel.app` in rendered HTML
- Grep all `.ts/.tsx` source files for `escx23.vercel.app` — only `next.config.ts` redirect is acceptable
- **Result:** Only `next.config.ts:28` has it (redirect rule) — OK
- Old audit result files (`audit_results.json`, `audit_deep_results.json`) have old URLs but these are not served

### 6.2 Hardcoded `www.lovelygirls.cz` in Source
- `lib/seo-metadata.ts:125,159,160` — hardcoded `https://www.lovelygirls.cz` (acceptable, matches production domain)
- `lib/watermark.ts:22` — watermark text `lovelygirls.cz` (correct)
- Various places use it as fallback — all correct

### 6.3 Hardcoded `/cs/` Links in Admin Dashboard
- `app/[locale]/(admin)/admin/page.tsx:64,75,91` — quick-action links hardcoded with `/cs/` prefix
- Should use `/${locale}/admin/...` pattern (see TASK-010 plan)

---

## 7. COOKIE / SESSION CONSIDERATIONS

### 7.1 Session Cookie Domain
- Cookie set with `path: '/'`, no explicit `domain` (lib/auth.ts:57-63)
- Since non-www redirects to www before any page renders, cookie will always be on `www.lovelygirls.cz`
- **Verdict:** Should work correctly with redirect chain

### 7.2 NEXT_LOCALE Cookie
- i18n routing sets `NEXT_LOCALE` cookie for locale persistence
- No domain restriction — should work fine

### 7.3 Age Gate Cookie
- Check that `lib/age-gate-actions.ts` sets cookie correctly on new domain

---

## 8. IMPLEMENTATION PRIORITY

### Must-fix before launch (BLOCKER):
1. **Set `SESSION_SECRET`** in Vercel production env
2. **Update `NEXT_PUBLIC_SITE_URL`** to `https://www.lovelygirls.cz` in Vercel
3. **Redeploy** after env changes

### Should-fix (HIGH):
4. Fix locale-aware auth redirects (TASK-010)
5. Fix hardcoded `/cs/admin/*` links in dashboard (TASK-010)
6. Update `GOOGLE_REDIRECT_URI` in Vercel + Google Cloud Console

### Nice-to-have (LOW):
7. Add production guard for empty `SESSION_SECRET`
8. Clean up old audit JSON files from repo

---

## 9. TESTING METHODOLOGY

### Automated:
- Use Playwright or Chrome DevTools to crawl all public pages in all 4 locales
- Check HTTP status codes (expect 200)
- Check `<link rel="canonical">` contains `www.lovelygirls.cz`
- Check hreflang tags present and correct
- Check OG tags present
- Check JSON-LD present on key pages

### Manual:
- Admin login flow on `www.lovelygirls.cz/cs/admin/login`
- Studio login flow on `www.lovelygirls.cz/cs/studio/login`
- Form submissions (edit girl, approve review, etc.)
- Cookie inspection in DevTools
- Mobile responsive check
- JS-disabled check (forms should work, filters should use URL params)

### Existing Scripts:
- `chrome-test-escx23.mjs` — existing Playwright test (uses old domain, needs URL update)
- `chrome-test-visual.mjs` — visual regression testing
