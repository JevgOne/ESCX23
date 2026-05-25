# Sprint 1 — Homepage implementation plan

> Scope: only `/` (and localized `/cs`, `/de`, `/uk`). Other Sprint 1 pages (/divky, /profil, /cenik, /faq, /slevy, /rozvrh) follow after homepage is verified.

## 1. Component breakdown

All components are **Server Components** by default. `'use client'` is forbidden in Sprint 1 — the existing `LanguageSwitcher` already uses headers (server) and we keep it as the only documented client-friendly component.

| Component | Type | Notes |
|---|---|---|
| `Topbar` | Server | Static info (✓ Verified, 🔒 Discreet), language pills, phone. |
| `SiteHeader` | Server | Logo + nav + Telegram/WhatsApp CTAs. Replaces inline header in `layout.tsx`. |
| `Hero` | Server | H1, subtitle, 3 CTAs, hero stats from server (`getHomepageStats`). |
| `FeaturedNew` | Server | Single card with newest girl (`isNew === true`, first by created_at desc). |
| `GirlCard` | Server | Single source of truth per ZADANI sec 5. Reused in `/divky`, `/rozvrh`, `/hashtag/*`. |
| `GirlGrid` | Server | Section wrapper + section-head + 4-col grid + "Show all" button. |
| `ActivityFeed` | Server | Items derived from `getRecentActivity()`. |
| `TrustRow` | Server | Pure static (4 trust cards). i18n strings only. |
| `ReviewsStrip` | Server | 3-4 latest approved reviews across all girls. |
| `HashtagCloud` | Server | Hardcoded curated list for Sprint 1. Real tag system in Sprint 2. |
| `LocationsRow` | Server | 3 location cards. Falls back to hardcoded list if DB has < 3 rows. |
| `ContactSteps` | Server | 3-step "How to contact us" — pure static. |
| `FinalCta` | Server | Final "Have time today?" + 3 CTA buttons. Static. |
| `SiteFooter` | Server | Footer grid + disclaimer. Static + i18n. |

`'use client'` only on existing `LanguageSwitcher.tsx` (already documented).

## 2. File-by-file plan

### Create
- `components/layout/Topbar.tsx`
- `components/layout/SiteHeader.tsx`
- `components/layout/SiteFooter.tsx`
- `components/girl/GirlCard.tsx` — **single source of truth**
- `components/girl/GirlCardGrid.tsx`
- `components/home/Hero.tsx`, `FeaturedNew.tsx`, `ActivityFeed.tsx`, `TrustRow.tsx`, `ReviewsStrip.tsx`, `HashtagCloud.tsx`, `LocationsRow.tsx`, `ContactSteps.tsx`, `FinalCta.tsx`
- `components/ui/LogoMark.tsx` — inline SVG `<symbol>` reused header+footer
- `i18n/navigation.ts` — `createNavigation(routing)` exports
- `lib/photoUrl.ts` — absolute URL helper for photos

### Modify
- `app/[locale]/layout.tsx` — strip inline header; render `Topbar`, `SiteHeader`, `{children}`, `SiteFooter`
- `app/[locale]/page.tsx` — replace placeholder with composed homepage
- `app/globals.css` — add CSS for `.topbar`, `.header`, `.btn`, `.section-head`, `.girl-card`, `.show-all-btn`, `.hero` (token-driven, ported from mockup)
- `lib/queries.ts` — add 4 helpers (see §3)
- `lib/utils.ts` — add `prettyDistrict()` mapper for "Praha 2" → "Vinohrady" display
- `messages/{en,cs,de,uk}.json` — add keys per §4 (translations done by copywriter agents in later phase)

## 3. Data flow

| Section | Data source |
|---|---|
| Topbar / SiteHeader | i18n only |
| Hero | new `getHomepageStats()` → `{ totalLive, workingNow, totalReviews, avgRating }` |
| FeaturedNew | `getGirlsWithToday()` → filter `isNew` → `[0]` |
| GirlGrid | `getGirlsWithToday()` → take first 8 |
| ActivityFeed | new `getRecentActivity(limit=5)` — UNION of latest reviews + photos |
| ReviewsStrip | new `getRecentApprovedReviews(limit=4)` |
| LocationsRow | new `getActiveLocations()`; fallback hardcoded if < 3 rows |
| HashtagCloud | hardcoded array (Sprint 2 reads `companion_tags`) |
| TrustRow / ContactSteps / FinalCta / Footer | i18n only |

## 4. i18n keys to add (translations later, by copywriters)

`homepage.topbar.*`, `homepage.hero.*`, `homepage.featuredNew.*`, `homepage.girlsGrid.*`, `homepage.activity.*`, `homepage.reviews.*`, `homepage.trust.*`, `homepage.hashtags.*`, `homepage.locations.*`, `homepage.contact.*`, `homepage.finalCta.*`, `card.location_format`, `card.away_label`, `footer.*`.

Logik nepíše copy — to dělají `copywriter-{en,cs,de,uk}` agenti.

## 5. Top 3 risks

1. **Locations data incomplete.** DB má 1 řádek (`Praha 2`) ale mockup ukazuje 3 lokace (Vinohrady/Karlín/Nové Město). Mitigation: `LocationsRow` fallback hardcoded list. `prettyDistrict("Praha 2") → "Vinohrady"` mapper pro display v kartě. Sprint 2 vyřeší proper M:N `companion_locations`.
2. **i18n + dynamic SSR + cache.** S `force-dynamic` + per-locale render = každý request hits SQLite. `getGirlsWithToday()` má N+1-ish subqueries per girl. Mitigation: jeden CTE/JOIN, nebo `React.cache()` per request. Acceptance: < 500ms dev.
3. **Photo URLs.** Z dumpu může být absolutní (Unsplash) nebo relativní. Helper `lib/photoUrl.ts` vrátí vždy absolutní. `<img>` ne `next/image` v Sprint 1 (žádný drama s domain whitelist).

Bonus: `'use client'` creep. Hover = CSS, klik = `<a href>`. Senior reviewer odmítá jakýkoliv `'use client'` mimo §1 list.

## 6. Acceptance criteria

- [ ] Visual matches `mockups/index.html` (spacing, fonts, gradient, layout)
- [ ] `curl -s http://localhost:3000 | grep -E "Nika|Luna|Sara"` vrací matches (real DB names)
- [ ] `curl -s http://localhost:3000 | grep -i 'use client'` vrací nic
- [ ] `/cs`, `/de`, `/uk` renderují stejnou strukturu s lokalizovanými stringy
- [ ] `grep -rl "use client" components/ | wc -l == 1` (jen LanguageSwitcher)
- [ ] `npx tsc --noEmit` passes
- [ ] `next build` projde
- [ ] TTFB v dev < 500ms po warmupu
- [ ] S vypnutým JS web pořád plně funguje
- [ ] Všechny photo `src` jsou absolutní URLs
