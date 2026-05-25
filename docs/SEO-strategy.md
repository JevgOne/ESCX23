# SEO Strategy — ESCX23 / lovelygirls.cz

Owner: seo-master agent · Stack: Next.js 16 App Router, next-intl, server components · Locales: en (default), cs, de, uk · Domain: lovelygirls.cz

---

## 1. Executive summary

- **Server-side everything is the moat.** Google deprecated the rich rendering crawler tier for the adult niche years ago; AI crawlers (GPTBot, ClaudeBot, PerplexityBot) almost never run JS. The codebase is already SSR-first — protect it.
- **Czech market needs Seznam.cz parity.** Add `Seznambot` and `SklikBot` to `robots.txt`, register in Seznam Webmaster, and write Czech copy that uses real query phrases (`společnice Praha`, not generic translations of English copy).
- **Ship `robots.txt`, dynamic `app/sitemap.ts`, JSON-LD on 3 page types (Home/Profile/FAQ), and full hreflang BEFORE going live.** These are the four blockers; everything else is iteration.
- **Adopt `meta name="rating" content="adult"` + RTA label site-wide and `noindex` on `/admin`, `/studio`, `/api`.** Keeps the public site indexed while keeping back-office out of search.
- **Profile pages are the moneymaker.** They need `Person` + `aggregateRating` schema, per-locale canonical, `og:image` from primary photo, and stable slugs that never change (slug rename = SEO suicide).

---

## 2. Keyword strategy (per language)

Volumes are estimates from general knowledge of the CZ/DE/UK adult market; verify with Marketing Miner / Collabim / Ahrefs before launch.

### 2.1 Czech (cs) — primary commercial market

| Page | Primary (3) | Secondary (5–8) |
|---|---|---|
| `/` (homepage) | `společnice praha`, `escort praha`, `privát praha` | `eskortní agentura praha`, `luxusní společnice`, `privátní byty praha`, `escort vinohrady`, `escort praha 2`, `společnice na hodinu`, `verifikované společnice` |
| `/divky` | `holky praha`, `dívky praha escort`, `escort dívky` | `česká společnice`, `ukrajinská společnice praha`, `blonďatá společnice`, `mladé dívky escort`, `společnice 20 let`, `výběr společnic` |
| `/profil/[slug]` | `[jméno] praha`, `[jméno] společnice`, `[jméno] escort` | `[jméno] vinohrady`, `[jméno] recenze`, `[jméno] cena`, `[jméno] kontakt`, `[jméno] {věk}` |
| `/cenik` | `cena escort praha`, `ceník společnice`, `escort cena hodina` | `společnice 1 hodina cena`, `escort 30 minut`, `escort celá noc`, `escort víkend`, `programy escort` |
| `/faq` | `escort praha jak`, `escort otázky`, `jak rezervovat společnici` | `je escort legální cz`, `escort platba`, `escort diskrétnost`, `escort co očekávat`, `escort první návštěva` |
| `/slevy` | `escort sleva`, `společnice sleva`, `escort akce praha` | `escort vip program`, `escort happy hour`, `escort first time discount`, `loyalty escort` |
| `/rozvrh` | `escort dnes praha`, `společnice dnes`, `escort otevřeno teď` | `escort víkend praha`, `escort noční`, `kdo pracuje dnes`, `escort dnes večer` |

### 2.2 English (en) — international tourists, expats

| Page | Primary | Secondary |
|---|---|---|
| `/` | `escort prague`, `prague escorts`, `escort agency prague` | `prague companions`, `verified escorts prague`, `prague vip escort`, `vinohrady escort`, `prague city center escort`, `english speaking escort prague` |
| `/girls` | `prague escort girls`, `czech escorts`, `prague escort directory` | `young escort prague`, `blonde escort prague`, `russian speaking escort prague`, `ukrainian escort prague`, `independent escort prague` |
| `/profile/[slug]` | `[name] prague escort`, `[name] companion prague`, `[name] escort reviews` | `[name] vinohrady`, `[name] price`, `[name] booking`, `[name] verified` |
| `/pricing` | `prague escort prices`, `escort rates prague`, `prague escort hourly rate` | `escort overnight prague`, `escort dinner date prague`, `weekend escort prague`, `cheap escort prague` |
| `/faq` | `prague escort how to`, `escort prague legal`, `book escort prague` | `escort etiquette prague`, `escort payment prague`, `escort first time prague`, `escort discreet prague` |
| `/discounts` | `prague escort discount`, `escort deals prague`, `escort vip prague` | `escort first time discount prague`, `escort loyalty program prague` |
| `/schedule` | `escort available now prague`, `escort tonight prague`, `prague escort open now` | `prague escort weekend`, `prague escort late night`, `who is working today prague escort` |

### 2.3 German (de) — DACH tourists, Vienna/Munich weekend traffic

| Page | Primary | Secondary |
|---|---|---|
| `/` | `escort prag`, `begleitservice prag`, `huren prag` (NB: low-quality term, use sparingly) | `begleiterin prag`, `escort agentur prag`, `prag escort verifiziert`, `escort prag innenstadt`, `vip escort prag`, `private escort prag` |
| `/maedchen` | `escort mädchen prag`, `prag escort damen`, `escort verzeichnis prag` | `tschechische escort`, `junge escort prag`, `blonde escort prag`, `osteuropäische escort prag` |
| `/profil/[slug]` | `[name] prag escort`, `[name] begleiterin`, `[name] prag` | `[name] bewertungen`, `[name] preis`, `[name] vinohrady` |
| `/preise` | `escort prag preise`, `escort prag stunde`, `escort prag tarife` | `escort übernachtung prag`, `escort dinner date prag`, `escort wochenende prag` |
| `/faq` | `escort prag tipps`, `escort prag legal`, `escort prag buchen` | `escort prag bezahlung`, `escort prag diskret`, `escort prag das erste mal` |
| `/rabatte` | `escort prag rabatt`, `escort prag angebote`, `escort prag vip` | `escort prag stammkunden`, `escort prag erstkunden rabatt` |
| `/zeitplan` | `escort prag jetzt`, `escort prag heute`, `escort prag heute abend` | `escort prag wochenende`, `escort prag nacht`, `wer arbeitet heute prag escort` |

### 2.4 Ukrainian (uk) — diaspora, recruitment funnel

| Page | Primary | Secondary |
|---|---|---|
| `/` | `ескорт прага`, `супровід прага`, `ескорт агенція прага` | `українські дівчата прага`, `ескорт чехія`, `елітний ескорт прага`, `vip ескорт прага`, `перевірені ескорт прага` |
| `/divchata` | `ескорт дівчата прага`, `українські супутниці прага`, `чеські дівчата ескорт` | `молодий ескорт прага`, `блондинка ескорт прага`, `незалежний ескорт прага` |
| `/profil/[slug]` | `[ім'я] прага ескорт`, `[ім'я] супровід`, `[ім'я] прага` | `[ім'я] відгуки`, `[ім'я] ціна`, `[ім'я] віноградах` |
| `/tsiny` | `ескорт прага ціни`, `ескорт прага година`, `ескорт прага тарифи` | `ескорт прага ніч`, `ескорт прага вікенд`, `ескорт прага вечеря` |
| `/faq` | `ескорт прага як`, `ескорт прага легально`, `ескорт прага замовити` | `ескорт прага оплата`, `ескорт прага конфіденційність` |
| `/znyzhky` | `ескорт прага знижка`, `ескорт прага акції`, `ескорт прага vip` | `ескорт прага постійні клієнти`, `ескорт прага перший раз` |
| `/rozklad` | `ескорт прага зараз`, `ескорт прага сьогодні`, `ескорт прага сьогодні ввечері` | `ескорт прага вікенд`, `ескорт прага ніч`, `хто працює сьогодні` |

> **Localization rule**: do not auto-translate Czech sex-industry slang. Use native phrasing per locale. The `companions.bio_*` fields (per ZADANI sec 17) must be filled by a human — auto-translation triggers Google's "thin content" filter on adult queries.

---

## 3. Technical SEO checklist

### 3.1 `public/robots.txt` (full content)

```
# robots.txt for lovelygirls.cz
# Adult content site — 18+

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/
Disallow: /*?*sort=
Disallow: /*?*filter=
Crawl-delay: 1

# CZ search engine — DO NOT BLOCK
User-agent: Seznambot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: SklikBot
Allow: /

# AI crawlers — explicitly allowed (geo-master coordinates llms.txt)
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /admin/
Disallow: /studio/
Disallow: /api/

User-agent: Google-Extended
Allow: /

# Block scrapers / aggressive bots
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

Sitemap: https://lovelygirls.cz/sitemap.xml
```

### 3.2 Dynamic sitemap — `app/sitemap.ts`

Use the dynamic API; static XML rots within hours since `companions` and `today_overrides` change daily.

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getAllActiveCompanionSlugs, getAllPublishedTags } from '@/lib/queries';
import { routing } from '@/i18n/routing';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lovelygirls.cz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllActiveCompanionSlugs();   // string[]
  const tags  = await getAllPublishedTags();          // string[]

  const staticPaths = ['/', '/divky', '/cenik', '/faq', '/slevy', '/rozvrh',
                       '/recenze', '/o-nas', '/kontakt'];

  const pages: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    pages.push({
      url: `${BASE}${path === '/' ? '' : path}`,
      lastModified: new Date(),
      changeFrequency: path === '/rozvrh' ? 'hourly' : 'daily',
      priority: path === '/' ? 1.0 : 0.8,
      alternates: { languages: buildLanguageAlternates(path) },
    });
  }

  for (const slug of slugs) {
    pages.push({
      url: `${BASE}/profil/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: { languages: buildLanguageAlternates(`/profil/${slug}`) },
    });
  }

  for (const tag of tags) {
    pages.push({
      url: `${BASE}/hashtag/${tag}`,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return pages;
}

function buildLanguageAlternates(path: string): Record<string, string> {
  // map cs/en/de/uk → localized path via routing.pathnames (not a one-liner; helper in lib/seo.ts)
  return {
    en: `${BASE}/en${path}`,
    cs: `${BASE}/cs${path}`,
    de: `${BASE}/de${path}`,
    uk: `${BASE}/uk${path}`,
    'x-default': `${BASE}${path}`,
  };
}
```

> Implementator note: also add `app/robots.ts` (Next 16 supports both static `public/robots.txt` and dynamic `app/robots.ts`). Pick **one**. Recommendation: static `public/robots.txt` because content rarely changes and we avoid an extra route.

### 3.3 `app/[locale]/layout.tsx` — additions

Add to existing `metadata` export (do not replace; the file already has title template):

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'LovelyGirls Prague — Premium Companions',
           template: '%s · LovelyGirls Prague' },
  description: '…',
  applicationName: 'LovelyGirls Prague',
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large',
                 'max-snippet': -1, 'max-video-preview': -1 },
  },
  other: {
    'rating': 'adult',
    'RATING': 'RTA-5042-1996-1400-1577-RTA',          // RTA label
    'content-rating': 'mature',
    'distribution': 'global',
  },
  twitter: { card: 'summary_large_image', site: '@lovelygirls' },
  openGraph: {
    type: 'website',
    siteName: 'LovelyGirls Prague',
    locale: 'en_US',
    alternateLocale: ['cs_CZ', 'de_DE', 'uk_UA'],
    images: [{ url: '/og/default.jpg', width: 1200, height: 630 }],
  },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
};
```

The `<html lang>` already comes from the locale param — good.

### 3.4 Per-page `generateMetadata()` — profile example

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const girl = await getGirlBySlug(slug);
  if (!girl) return {};
  const name = String(girl.name);
  const age = Number(girl.age);
  const bio = pickLocalizedBio(girl, locale).slice(0, 158);
  const primary = await getPrimaryPhotoUrl(Number(girl.id));

  const localizedPath = buildLocalizedPath('/profil/[slug]', { slug }, locale);

  return {
    title: `${name}, ${age} — ${T(locale, 'profile.titleSuffix')}`,
    description: bio || T(locale, 'profile.fallbackDescription', { name, age }),
    alternates: {
      canonical: localizedPath,
      languages: {
        en: `/en/profile/${slug}`,
        cs: `/profil/${slug}`,
        de: `/de/profil/${slug}`,
        uk: `/uk/profil/${slug}`,
        'x-default': `/en/profile/${slug}`,
      },
    },
    openGraph: {
      title: `${name}, ${age} — Premium companion Prague`,
      description: bio,
      images: primary ? [{ url: primary, width: 1200, height: 1200, alt: name }] : [],
      type: 'profile',
      locale: ogLocale(locale),
    },
    twitter: { card: 'summary_large_image' },
    robots: girl.status === 'published'
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
```

---

## 4. Structured data (JSON-LD) per page

Render via `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />` in the page component (server-side; safe — we control the input).

### 4.1 Homepage — `LocalBusiness`

Schema.org has no `EscortService` type. Use `LocalBusiness` with `@type` array `["LocalBusiness", "ProfessionalService"]`.

```ts
// lib/seo/jsonld.ts
export function homepageLocalBusiness(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    '@id': 'https://lovelygirls.cz/#business',
    name: 'LovelyGirls Prague',
    url: 'https://lovelygirls.cz',
    image: 'https://lovelygirls.cz/og/default.jpg',
    logo: 'https://lovelygirls.cz/logo.png',
    telephone: '+420-XXX-XXX-XXX',
    priceRange: '€€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Prague',
      addressRegion: 'Praha 2',
      postalCode: '120 00',
      addressCountry: 'CZ',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 50.0755, longitude: 14.4378 },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '00:00', closes: '23:59',
    }],
    sameAs: [
      'https://t.me/lovelygirlsprague',
      'https://www.instagram.com/lovelygirlsprague',
    ],
    inLanguage: locale,
    areaServed: { '@type': 'City', name: 'Prague' },
  };
}
```

> **Disambiguation note**: We use `LocalBusiness` because Schema.org does not have a dedicated escort/adult-services type. Google accepts this for adult businesses but does not show rich snippets — the value is for AI crawlers and Bing, plus disambiguation.

### 4.2 `/profil/[slug]` — `Person` + `aggregateRating`

```ts
export function profilePersonJsonLd(g: Girl, photos: Photo[], reviews: Review[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `https://lovelygirls.cz/profil/${g.slug}#person`,
    name: g.name,
    url: `https://lovelygirls.cz/profil/${g.slug}`,
    image: photos.filter(p => p.is_primary).map(p => p.url),
    description: g.bio?.slice(0, 200),
    knowsLanguage: g.languages,                          // ['cs','en','ru']
    worksFor: { '@id': 'https://lovelygirls.cz/#business' },
    aggregateRating: reviews.length ? {
      '@type': 'AggregateRating',
      ratingValue: Number(g.rating).toFixed(1),
      reviewCount: g.reviews_count,
      bestRating: 5, worstRating: 1,
    } : undefined,
  };
}
```

### 4.3 `/faq` — `FAQPage`

```ts
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
```

### 4.4 Optional — `Service` per pricing program

```ts
export function programServiceJsonLd(p: Program, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: p[`title_${locale}`],
    provider: { '@id': 'https://lovelygirls.cz/#business' },
    areaServed: 'Prague',
    offers: { '@type': 'Offer', price: p.price, priceCurrency: 'CZK' },
  };
}
```

---

## 5. Multilingual SEO

### 5.1 hreflang pattern

Render in every page (in layout for static parts; in `generateMetadata.alternates.languages` for parametric pages). Next.js outputs `<link rel="alternate" hreflang>` from the `alternates.languages` map.

Required keys: `en`, `cs`, `de`, `uk`, `x-default`. Set `x-default` → English (default locale) so traffic from unsupported regions lands on en.

### 5.2 Canonical URL strategy

**One canonical per locale.** A Czech profile's canonical is the cs URL, not the en URL. Wrong: pointing every locale at en — that de-indexes 3 of 4 versions.

```ts
// CORRECT
alternates: { canonical: `/profil/${slug}` /* cs current locale */ }

// WRONG (do NOT do this)
alternates: { canonical: `/en/profile/${slug}` /* same for all locales */ }
```

### 5.3 URL structure validation

Current `i18n/routing.ts` uses `localePrefix: 'as-needed'` (en has no prefix because it is default; cs/de/uk get prefixes). Localized pathnames (`/divky` cs, `/girls` en, `/maedchen` de, `/divchata` uk) — **this is correct and optimal**. Each language has natural keywords in the URL.

Two adjustments:
- ZADANI sec 17 says CS is default; `routing.ts` says EN is default. **Conflict.** Recommendation: keep EN as default (broader international audience, and SEO equity already at lovelygirls.cz which the new system inherits). Update ZADANI accordingly, or flip `defaultLocale` to `cs` if the client prefers Czech traffic to live at root.
- The `uk` localized pathname `/profil/[slug]` for profile is the same as `cs`. Either change to a Ukrainian variant (e.g. `/profil-suprovid/[slug]`) **or** keep — but be aware `cs` and `uk` share URL strings, so the only thing distinguishing them is the `/uk/` prefix. That is fine for hreflang as long as the prefix is present.

---

## 6. Adult content compliance

### 6.1 robots/meta tags

- `meta name="rating" content="adult"` — site-wide (in root layout `metadata.other`).
- RTA label: `meta name="RATING" content="RTA-5042-1996-1400-1577-RTA"` — exact string, machine-readable, used by parental filters and SafeSearch heuristics.
- `meta name="content-rating" content="mature"` — Bing-compatible.
- Do **not** use `noindex` on the public site — we want indexing. Adult sites rank fine with Google when properly tagged; the rating tags signal SafeSearch but do not de-index.

### 6.2 Age gate (ZADANI sec 19)

Cookie-based modal on first visit. SEO-safe pattern:

- Render full page HTML server-side (crawlers see content; they don't execute the modal JS).
- Modal is a `'use client'` component that mounts on the client and reads `document.cookie`. If `agegate=accepted` is missing → render the modal overlay (CSS `position: fixed`).
- Crucially: **do not gate at the network level** (no `if (!cookie) redirect('/agegate')`). That would cloak content from crawlers and trigger penalties.
- Set cookie `agegate=accepted; Max-Age=31536000; Secure; SameSite=Lax` on accept.

### 6.3 2257 disclaimer

Footer (already in spec sec 19): `"All visual depictions on this site are of persons 18+. Records required by 18 U.S.C. §2257 are kept by the custodian of records."` — render in `components/layout/SiteFooter.tsx`.

---

## 7. Performance / Core Web Vitals

Targets: **LCP < 2.5s**, **CLS < 0.1**, **INP < 200ms** (mobile, throttled 4G).

### 7.1 Next.js 16 / Turbopack

- Already SSR — good.
- `force-dynamic` on `/profil/[slug]` is correct (live status pill) but costs LCP. Mitigation: `generateMetadata` runs in parallel with the page component — verify no double DB hits.
- Turbopack production build (`next build --turbopack`) — ensure `next.config.ts` does not disable it.

### 7.2 Images — `<img>` vs `next/image`

Current code uses raw `<img>` (per CLAUDE.md). Recommendation: **stay with `<img>` for v1**, migrate to `next/image` in P2 for hero + above-the-fold profile photos only.

Reasons to stay raw:
- No Vercel image-domain whitelist drama with Vercel Blob URLs.
- No surprise transformation costs.
- We control sizing via `srcset` manually.

Reasons to migrate (later):
- Automatic WebP/AVIF.
- Lazy loading + blur placeholder.

Required regardless of choice:
- `width`/`height` on every `<img>` (kills CLS).
- `loading="lazy"` on below-fold; `fetchpriority="high"` on hero photo.
- `decoding="async"` on all images.

### 7.3 Fonts

`app/[locale]/layout.tsx` already uses `next/font/google` with `display: 'swap'` and the right subsets including `cyrillic` for `uk` — verified, no changes.

Add `preconnect` for Vercel Blob domain in `<head>` via metadata.other if photos load from Blob.

### 7.4 Misc

- Enable `compress: true` in `next.config.ts` (default already on).
- HTTP/2 push not needed on Vercel.
- Use `<link rel="preload" as="image" href="...primary-photo">` on profile pages for LCP.

---

## 8. Action items prioritized

### P0 — blockers BEFORE launch

| # | File | Change |
|---|---|---|
| P0-1 | `public/robots.txt` (new) | Paste content from §3.1 verbatim. |
| P0-2 | `app/sitemap.ts` (new) | Paste skeleton from §3.2; wire `getAllActiveCompanionSlugs` query. |
| P0-3 | `app/[locale]/layout.tsx` | Extend `metadata` with `rating`, `RTA`, `robots`, `openGraph.alternateLocale`, `twitter.card` (see §3.3). |
| P0-4 | `app/[locale]/layout.tsx` | Add `<link rel="alternate" hreflang>` via `alternates.languages` for the homepage. |
| P0-5 | `app/[locale]/profil/[slug]/page.tsx` | Replace existing `generateMetadata` with §3.4 version (canonical per locale, hreflang, og:image, robots based on status). |
| P0-6 | `lib/seo/jsonld.ts` (new) | Create with `homepageLocalBusiness`, `profilePersonJsonLd`, `faqJsonLd` helpers (§4). |
| P0-7 | `app/[locale]/page.tsx` | Render `<script type="application/ld+json">` with `homepageLocalBusiness(locale)`. |
| P0-8 | `app/[locale]/profil/[slug]/page.tsx` | Render JSON-LD `profilePersonJsonLd(girl, photos, reviews)`. |
| P0-9 | `app/[locale]/faq/page.tsx` | Render `faqJsonLd(items)` from DB. |
| P0-10 | `app/[locale]/layout.tsx` | Verify `<html lang={locale}>` (already present — confirm). |
| P0-11 | `components/layout/SiteFooter.tsx` | Add 2257 disclaimer + 18+ notice. |
| P0-12 | All `<img>` tags in `components/profil/*` and `components/home/*` | Add `width`, `height`, `loading`, `decoding` attributes. |
| P0-13 | `next.config.ts` | Add `async headers()` returning `X-Robots-Tag: noindex` for `/admin/:path*` and `/studio/:path*`. |
| P0-14 | `i18n/routing.ts` vs ZADANI sec 17 | Resolve default-locale conflict (recommend: keep EN default, update ZADANI). |

### P1 — within 2 weeks of launch

| # | File | Change |
|---|---|---|
| P1-1 | Seznam Webmaster Tools | Register `lovelygirls.cz`, submit sitemap. |
| P1-2 | Google Search Console | Verify domain, submit sitemap, monitor adult-content warnings. |
| P1-3 | Bing Webmaster Tools | Same — Bing has higher adult tolerance. |
| P1-4 | `app/[locale]/divky/page.tsx` | Add `ItemList` JSON-LD enumerating profile cards. |
| P1-5 | `app/[locale]/cenik/page.tsx` | Add `Service` JSON-LD per program (§4.4). |
| P1-6 | `app/[locale]/recenze/page.tsx` | Add aggregated `Review` schema (top 10 most recent, 4+ stars). |
| P1-7 | `lib/seo/breadcrumbs.ts` (new) | Helper for `BreadcrumbList` JSON-LD; render on profile + tag pages. |
| P1-8 | All page components | Run Lighthouse mobile against staging, fix LCP regressions. |
| P1-9 | `components/AgeGate.tsx` (new) | Implement cookie-based modal per §6.2. |
| P1-10 | `messages/{cs,en,de,uk}.json` | Add SEO copy keys: `meta.home.title`, `meta.home.description` etc. |

### P2 — nice to have

| # | Area | Change |
|---|---|---|
| P2-1 | Images | Migrate hero + profile primary photo to `next/image` with Vercel Blob loader. |
| P2-2 | `/blog` | Schedule launch (Sprint 6 in CLAUDE.md). Article schema, hashtag-driven internal linking. |
| P2-3 | Hashtag pages | `/hashtag/[slug]` with `CollectionPage` + `ItemList` schema. |
| P2-4 | Per-locale `og:image` | Generate dynamic OG via `next/og` route handler with locale-specific text overlay. |
| P2-5 | Alternate domain | `lovelygirls.de`, `lovelygirls.eu` — 301 to corresponding locale on main domain. |
| P2-6 | Schema.org | Add `Place` schema for each location (Vinohrady, Karlín, …) under the business. |
| P2-7 | Internal linking | Footer link cluster: top 10 girls, popular tags, locations — boosts crawl depth. |
| P2-8 | Performance | Move from `force-dynamic` to ISR-with-tag-revalidate on profile pages once availability data is split into a lightweight side-channel. |

---

## Appendix A — Files created / changed (summary for implementator)

**New files (12):**

- `public/robots.txt`
- `app/sitemap.ts`
- `lib/seo/jsonld.ts`
- `lib/seo/breadcrumbs.ts` (P1)
- `lib/seo/locale-helpers.ts` (`buildLocalizedPath`, `ogLocale`)
- `components/AgeGate.tsx` (P1)
- `app/[locale]/divky/loading.tsx` if missing (CLS guard)
- `public/og/default.jpg` (1200×630 brand image)
- `public/manifest.webmanifest`
- `public/apple-touch-icon.png`
- `public/favicon.ico` if missing
- `messages/seo-{cs,en,de,uk}.json` namespace

**Modified files (5):**

- `app/[locale]/layout.tsx` — extended metadata
- `app/[locale]/page.tsx` — JSON-LD render
- `app/[locale]/profil/[slug]/page.tsx` — full generateMetadata rewrite, JSON-LD
- `app/[locale]/faq/page.tsx` — FAQ JSON-LD
- `next.config.ts` — `headers()` for `/admin`, `/studio` `X-Robots-Tag: noindex`
- `components/layout/SiteFooter.tsx` — 2257 disclaimer

**Coordinated with geo-master:**

- `public/llms.txt` — geo-master owns; verify it does not disagree with `robots.txt` AI-crawler entries.
- FAQ content quality — geo-master writes the answers; this strategy just specifies the schema wrapper.

---

End of strategy. Hand off to **logik** for plan integration, then **programator-junior** for implementation per the prioritized table above.
