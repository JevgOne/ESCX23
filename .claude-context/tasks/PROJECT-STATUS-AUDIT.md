# ESCX23 Project Status Audit
**Date:** 2026-06-21  
**Branch:** main (commit 0dd77b7)

---

## 1. Build & Dependencies

| Aspect | Status | Notes |
|--------|--------|-------|
| Next.js | ^16.0.7 | Latest Next.js 16 |
| React | 19.2.0 | Latest React 19 |
| TypeScript | ^5 | strict mode |
| Tailwind CSS | ^4 | v4 with `@tailwindcss/postcss` |
| next-intl | ^4.5.6 | i18n routing |
| @libsql/client | ^0.15.15 | Direct libSQL (no Prisma) |
| @vercel/blob | ^2.3.3 | Photo storage |
| bcryptjs | ^3.0.3 | Password hashing |
| sharp | ^0.34.5 | Image processing |
| playwright | ^1.59.1 | devDep, testing |

**Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `set-admin-password`

**Status: Funguje** -- dependencies are clean, no Prisma (raw SQL via libSQL client).

---

## 2. Project Structure

```
app/
  [locale]/                    # i18n routing (cs/en/de/uk)
    (admin)/admin/             # Admin panel (route group)
    studio/                    # Girl self-service panel
    page.tsx                   # Homepage
    layout.tsx                 # Root locale layout
    error.tsx                  # Error boundary (use client)
  api/                         # API routes
  sitemap.ts                   # Dynamic sitemap
  robots.ts                    # Dynamic robots.txt
  llms.txt/route.ts            # LLM-readable site summary
  globals.css                  # 14,709 lines (!)
components/                    # 57 components
lib/                           # 30 modules (queries, auth, SEO, utils)
messages/                      # cs.json, en.json, de.json, uk.json
data/                          # app.db (SQLite), blog-seed.sql
scripts/                       # 9 utility scripts
i18n/                          # routing.ts, request.ts
middleware.ts                  # next-intl middleware + x-pathname header
```

---

## 3. Routes Inventory

### Public Pages (20 routes, each x4 locales)

| Route | Page | Status |
|-------|------|--------|
| `/` | Homepage | Funguje |
| `/divky` (`/girls`, `/maedchen`, `/divchata`) | Girls listing + filters | Funguje |
| `/profil/[slug]` (`/profile/[slug]`) | Girl profile detail | Funguje |
| `/cenik` (`/pricing`, `/preise`, `/tsiny`) | Pricing programs & extras | Funguje |
| `/rozvrh` (`/schedule`, `/zeitplan`, `/rozklad`) | 7-day schedule | Funguje (force-dynamic) |
| `/slevy` (`/discounts`, `/rabatte`, `/znyzhky`) | Discounts & loyalty | Funguje |
| `/faq` | FAQ (native `<details>`) | Funguje |
| `/recenze` (`/reviews`, `/rezensionen`, `/vidhuky`) | Reviews listing | Funguje |
| `/recenze/nova/[slug]` | Write new review for girl | Funguje |
| `/o-nas` (`/about`, `/ueber-uns`, `/pro-nas`) | About us | Funguje |
| `/kontakt` (`/contact`) | Contact page | Funguje |
| `/podminky` (`/terms`, `/agb`, `/umovy`) | Terms & conditions | Funguje |
| `/soukromi` (`/privacy`, `/datenschutz`) | Privacy policy | Funguje |
| `/blog` | Blog listing | Funguje |
| `/blog/[slug]` | Blog post detail | Funguje |
| `/hashtag/[slug]` | Hashtag landing pages (32 slugs) | Funguje |
| `/pobocka/[slug]` | Location detail | Funguje |
| `/sluzba/[slug]` | Service detail | Funguje |
| `/join` (`/pridat-se`, `/bewerben`, `/dodaty-sia`) | Girl application form | Funguje |
| `/join/success` | Application success page | Funguje |
| `/clenstvi/zadost` (`/membership/apply`) | Member application | Funguje |
| `/clenstvi/zadost/odeslano` | Application sent confirmation | Funguje |

### Admin Panel (26 pages under `/admin/*`)

| Route | Purpose |
|-------|---------|
| `/admin/login` | Admin login form |
| `/admin` | Dashboard (stats, quick actions) |
| `/admin/divky` | Girls list |
| `/admin/divky/nova` | Add new girl |
| `/admin/divky/[id]` | Girl detail |
| `/admin/divky/[id]/edit` | Edit girl profile |
| `/admin/divky/[id]/fotky` | Manage girl photos |
| `/admin/divky/[id]/videa` | Manage girl videos |
| `/admin/divky/[id]/dostupnost` | Weekly schedule editor |
| `/admin/divky/[id]/dostupnost/den/[date]` | Daily override editor |
| `/admin/schedules` | All schedules overview |
| `/admin/recenze` | Review moderation |
| `/admin/verifikace` | Photo verification |
| `/admin/aplikace` | Girl applications list |
| `/admin/aplikace/[id]` | Application detail |
| `/admin/clenove` | Member management |
| `/admin/cenik` | Pricing plans & extras |
| `/admin/cenik/nova-plan` | New pricing plan |
| `/admin/cenik/nova-extra` | New extra |
| `/admin/cenik/plany/[id]` | Edit plan |
| `/admin/cenik/extras/[id]` | Edit extra |
| `/admin/slevy` | Discounts management |
| `/admin/slevy/nova` | New discount |
| `/admin/slevy/[id]` | Edit discount |
| `/admin/pobocky` | Locations management |
| `/admin/pobocky/nova` | New location |
| `/admin/pobocky/[id]` | Edit location |
| `/admin/faq` | FAQ management |
| `/admin/faq/nova` | New FAQ item |
| `/admin/faq/[id]` | Edit FAQ item |
| `/admin/blog` | Blog posts management |
| `/admin/blog/novy` | New blog post |
| `/admin/blog/[id]` | Edit blog post |
| `/admin/blog/tagy` | Blog tags management |
| `/admin/blog/tagy/novy` | New blog tag |
| `/admin/blog/tagy/[id]` | Edit blog tag |
| `/admin/notifikace` | Admin notifications |
| `/admin/stories` | Stories management |
| `/admin/rezervace` | Bookings |
| `/admin/seo` | SEO dashboard |
| `/admin/seo/edit` | SEO metadata editor |
| `/admin/og` | OG image generator |

### Studio Panel (19 pages under `/studio/*`)

| Route | Purpose |
|-------|---------|
| `/studio/login` | Girl login form |
| `/studio` | Studio dashboard |
| `/studio/zakladni` | Basic info |
| `/studio/telo` | Body stats |
| `/studio/fotky` | Photo management |
| `/studio/sluzby` | Services selection |
| `/studio/program` | Program/pricing |
| `/studio/jazyky` | Languages |
| `/studio/dostupnost` | Weekly availability |
| `/studio/kalendar` | Calendar (Google Cal integration) |
| `/studio/recenze` | My reviews |
| `/studio/statistiky` | Stats |
| `/studio/stories` | Stories management |
| `/studio/hlas` | Voice intro upload |
| `/studio/zprava` | Message/bio |
| `/studio/zivotni-styl` | Lifestyle |
| `/studio/hashtagy` | Hashtag selection |
| `/studio/profil-status` | Profile status toggle |
| `/studio/rezervace` | My bookings |

### API Routes (11 endpoints)

| Route | Purpose |
|-------|---------|
| `POST /api/admin/seo/upload-image` | SEO image upload |
| `GET /api/cron/cleanup-old-overrides` | Daily cleanup cron |
| `GET /api/cron/expire-loyalty-discounts` | Loyalty discount expiry cron |
| `GET /api/cron/expire-stories` | Hourly stories expiry cron |
| `GET /api/cron/recalc-stats` | Nightly stats recalculation cron |
| `GET /api/gcal/auth` | Google Calendar OAuth init |
| `GET /api/gcal/callback` | Google Calendar OAuth callback |
| `POST /api/gcal/disconnect` | Google Calendar disconnect |
| `GET /api/pages` | SEO pages list |
| `GET/PUT /api/seo` | SEO metadata CRUD |
| `GET /llms.txt` | LLM-readable site summary |

---

## 4. Auth System

**Status: Funguje (s bugy na produkci, viz TASK-010)**

- Custom session-based auth (no NextAuth)
- HMAC-signed token in `escx23_session` cookie
- `httpOnly`, `secure` (production), `sameSite: lax`, `path: /`
- 30-day session max age
- Roles: `admin`, `manager`, `girl`
- Password hashing: bcryptjs with cost 12
- Server Actions: `loginAdmin`, `loginGirl`, `logoutAction` in `lib/auth-actions.ts`
- Auth guards: `requireAdmin()`, `requireFullAdmin()`, `requireGirl()` in `lib/auth.ts`
- Manager access control: MANAGER_ALLOWED_PATHS whitelist in admin layout

**Produkce bugs (TASK-010):**
- Chybejici `allowedOrigins` pro Server Actions CSRF
- `SESSION_SECRET` s trailing `\n`

---

## 5. Database

**Status: Funguje**

- **Engine:** libSQL via `@libsql/client` (raw SQL, no ORM)
- **Local:** SQLite file `data/app.db`
- **Production:** Turso (but `TURSO_DATABASE_URL=""` in some env snapshots -- needs verification)
- **Schema:** Imported from Secretstory (tables: `girls`, `girl_photos`, `girl_videos`, `girl_services`, `girl_schedules`, `schedule_exceptions`, `services`, `pricing_plans`, `pricing_extras`, `pricing_plan_features`, `bookings`, `reviews`, `discount_codes`, `discounts`, `faq_items`, `users`, `locations`, `girl_applications`, `members`, `member_applications`, `admin_notifications`, `blog_posts`, `blog_tags`, `blog_post_tags`, `seo_overrides`, `pages`)
- **Migrations:** Inline in `lib/db.ts` (ALTER TABLE + CREATE TABLE IF NOT EXISTS)
- **No Prisma** -- Sprint 1 uses raw SQL, Prisma planned for Sprint 2

---

## 6. i18n

**Status: Funguje**

- 4 locales: `en` (default), `cs`, `de`, `uk`
- Default locale: `en` (prefix `as-needed`, so English URLs have no prefix)
- Locale detection: disabled (explicit only)
- Translation files: `messages/{cs,en,de,uk}.json`
- Localized URL paths for all public routes (see `i18n/routing.ts`)
- `NEXT_LOCALE` cookie for persistence

---

## 7. SEO & GEO

**Status: Funguje -- velmi propracované**

| Feature | File | Status |
|---------|------|--------|
| Dynamic sitemap | `app/sitemap.ts` | Funguje -- all locales, alternates, image sitemap |
| Dynamic robots.txt | `app/robots.ts` | Funguje -- preview blocking, AI crawler rules |
| llms.txt | `app/llms.txt/route.ts` | Funguje -- comprehensive LLM-readable summary |
| JSON-LD structured data | `lib/seo/jsonld.ts` | Funguje |
| OpenGraph tags | `lib/seo/og.ts` | Funguje |
| Hreflang alternates | `lib/seo/hreflang.ts` | Funguje |
| Meta generator | `lib/seo/meta.ts` | Funguje |
| SEO DB overrides | `lib/seo/db-override.ts` | Funguje -- admin can override meta per page |
| OG image generator | `/admin/og` | Funguje |
| X-Robots-Tag noindex | `next.config.ts` | Funguje -- admin/studio routes |
| Hashtag landing pages | `/hashtag/[slug]` (32 slugs) | Funguje -- SEO landing pages |

---

## 8. Server-Side Rendering Compliance

**Status: Vynikající -- dodržuje SSR pravidla**

`'use client'` components (only 6 files total):
1. `components/profil/PhotoLightbox.tsx` -- photo gallery overlay (required)
2. `components/layout/NavCloseOnRoute.tsx` -- mobile nav close on route change
3. `components/ui/TranslateButton.tsx` -- Google Translate button
4. `app/[locale]/error.tsx` -- Next.js error boundary (required)
5. `app/[locale]/(admin)/admin/seo/page.tsx` -- SEO dashboard with client interactivity
6. `app/[locale]/(admin)/admin/seo/edit/page.tsx` -- SEO editor with client interactivity

Everything else is Server Components. Filters use URL params (`<form method="GET">`), schedule tabs use `<a>` links, FAQ uses `<details>`/`<summary>`.

---

## 9. Middleware

**Status: Funguje**

```ts
// middleware.ts
- next-intl routing middleware
- Sets x-pathname header (used by auth for locale detection)
- Matcher excludes: api, _next, _vercel, static assets
```

---

## 10. Vercel Deployment

**Status: Nakonfigurováno, s problémy**

- Project: `escx23` (Vercel Pro plan)
- Custom domain: `www.lovelygirls.cz`
- Redirects: `lovelygirls.cz` -> `www.lovelygirls.cz`, `escx23.vercel.app` -> `www.lovelygirls.cz`
- Crons: 4 scheduled jobs in `vercel.json`
- `NEXT_PUBLIC_SITE_URL` = `https://www.lovelygirls.cz`

**Problémy (TASK-010):**
- `SESSION_SECRET` s trailing `\n`
- `GOOGLE_REDIRECT_URI` odkazuje na starý `escx23.vercel.app`
- Chybejici `allowedOrigins` v `next.config.ts`
- Některé env vars s trailing `\n` (Google keys)

---

## 11. CSS

**Status: Funguje, ale obrovský soubor**

- Single `globals.css` -- **14,709 řádků**
- Contains all component styles, responsive breakpoints, admin panel, studio panel
- No CSS modules or Tailwind utility classes in components -- all hand-written CSS
- CSS variables for theming (dark theme, brand colors)

---

## 12. Recent Commits (last 20)

Focused on:
- Schedule display fixes (tomorrow badges, finished girls)
- Admin error handling, delete actions, status labels
- Lightbox fixes (z-index, React Portal, overlay)
- Photo lightbox feature
- DB constraint fixes
- Photo upload fixes (watermark removal, error handling)
- Admin notifications + badge
- Vimeo video embeds
- Girl application nationality field
- i18n location translation

---

## 13. Summary

### Funguje (done)
- Complete public website (20+ page types x 4 locales)
- Full admin panel (26 pages)
- Full studio panel (19 pages)
- Auth system (admin, manager, girl roles)
- Database layer (libSQL, Secretstory schema)
- i18n (cs/en/de/uk with localized URLs)
- SEO (sitemap, robots, llms.txt, JSON-LD, OG, hreflang)
- Server-side rendering (only 6 client components)
- Photo management (upload, verification, lightbox)
- Blog system
- Cron jobs (stories expiry, override cleanup, stats recalc, loyalty)
- Vercel deployment with custom domain

### Potřebuje pozornost
- Admin panel auth on production (TASK-010 -- allowedOrigins + SESSION_SECRET)
- globals.css (14,709 lines -- functional but large single file)
- GOOGLE_REDIRECT_URI points to old domain
- Some env vars with trailing `\n` in Vercel

### Chybí / Planned
- Prisma ORM (planned Sprint 2, currently raw SQL)
- Member VIP area (planned Sprint 5)
- WhatsApp deep link booking flow (planned Sprint 5)
- Resend email integration (RESEND_API_KEY="" in env)
- Google Calendar integration partially setup but redirect URI outdated
- `data/app.db` -- dev.db at root is empty (0 bytes)
