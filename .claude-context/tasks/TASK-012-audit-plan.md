# TASK-012: Kompletni audit webu www.lovelygirls.cz — Detailni plan

**Datum:** 2026-07-06
**Stav:** Aktualizovany plan (nahradi predesly draft)

---

## SOUHRN

Kompletni audit webu na produkci `www.lovelygirls.cz`. Pokryva:
- Vsechny verejne stranky ve 4 locale (cs/en/de/uk)
- Admin panel za prihlasenim
- Studio za prihlasenim
- SEO: canonical, hreflang, og:url, sitemap, robots.txt, llms.txt, JSON-LD
- Redirecty: non-www → www, escx23.vercel.app → www
- Kontrola starych URL v HTML vystupu

---

## FAZE 1: ENV / CONFIG KONTROLA (pred testovanim)

### 1.1 Lokalni .env soubory — NALEZENY PROBLEMY

| Soubor | Problem | Fix |
|--------|---------|-----|
| `.env.prod.local:5` | `NEXT_PUBLIC_SITE_URL="https://escx23.vercel.app"` — STARY DOMAIN! | Zmenit na `https://www.lovelygirls.cz` |
| `.env.prod-check.local:6` | `GOOGLE_REDIRECT_URI="https://escx23.vercel.app/api/gcal/callback\n"` | Zmenit na `https://www.lovelygirls.cz/api/gcal/callback` + odstranit trailing `\n` |
| `.env.vercel-prod.local:6` | `GOOGLE_REDIRECT_URI="https://escx23.vercel.app/api/gcal/callback\n"` | Stejny fix |
| `.env.prod-pull.local:6` | `GOOGLE_REDIRECT_URI="https://escx23.vercel.app/api/gcal/callback\n"` | Stejny fix |

**KRITICKE:** Overit ze na Vercel dashboard `NEXT_PUBLIC_SITE_URL=https://www.lovelygirls.cz` — pokud ne, VSECHNY canonical/hreflang/og/sitemap/jsonld budou spatne.

### 1.2 Vercel Dashboard Environment Variables

Overit na Vercel:
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://www.lovelygirls.cz`
- [ ] `SESSION_SECRET` — neni prazdny
- [ ] `GOOGLE_REDIRECT_URI` = `https://www.lovelygirls.cz/api/gcal/callback`
- [ ] Custom domain `www.lovelygirls.cz` nakonfigurovana a funguje

---

## FAZE 2: REDIRECTY

### 2.1 Non-www → www (next.config.ts:24-29)
```
Test: curl -I https://lovelygirls.cz/cs/divky
Ocekavano: 301 → https://www.lovelygirls.cz/cs/divky
```

### 2.2 Vercel preview → www (next.config.ts:31-36)
```
Test: curl -I https://escx23.vercel.app/cs/divky
Ocekavano: 301 → https://www.lovelygirls.cz/cs/divky
```

### 2.3 Stare URL redirecty (next.config.ts:39-97)
Otestovat kazdy redirect:

| Source | Expected destination | Type |
|--------|---------------------|------|
| `/cs/girls/anetta` | `/cs/profil/anetta` | 301 |
| `/cs/profily/anetta` | `/cs/profil/anetta` | 301 |
| `/cs/profiles` | `/cs/divky` | 301 |
| `/cz/profiles` | `/cs/divky` | 301 |
| `/cs/landing/escort-prague` | `/cs/divky` | 301 |
| `/cs/landing/spolecnice-praha` | `/cs/hashtag/spolecnice-praha` | 301 |
| `/cs/landing/blondynky` | `/cs/hashtag/blondynky-praha` | 301 |
| `/cs/landing/brunetky` | `/cs/hashtag/brunetky-praha` | 301 |
| `/cs/landing/gfe` | `/cs/hashtag/gfe-praha` | 301 |
| `/cs/landing/vinohrady` | `/cs/pobocka/praha-2` | 301 |
| `/cs/landing/zizkov` | `/cs/pobocka/praha-3` | 301 |
| `/cs/landing/nejakyrandom` | `/cs/` | 301 (catchall) |
| `/blog-cs/nejaky-slug` | `/cs/blog/nejaky-slug` | 301 |
| `/blog` | `/cs/blog` | 301 |
| `/cz/main` | `/cs/` | 301 |
| `/cs/pricing` | `/cs/cenik` | 301 |
| `/escort-praha` | `/cs/divky` | 301 |
| `/escort-prague` | `/girls` | 301 |
| `/slecny-sitemap.xml` | `/sitemap.xml` | 301 |
| `/cz/cokoliv` | `/cs/cokoliv` | 301 (wildcard) |

---

## FAZE 3: VEREJNE STRANKY — FUNKCNI KONTROLA

### 3.1 Kompletni matice URL (vychazi z i18n/routing.ts)

Pro KAZDY radek overit: HTTP 200, stranka se renderuje, neni error.

| Stranka | CS | EN | DE | UK |
|---------|----|----|----|----|
| Homepage | `/cs` | `/` | `/de` | `/uk` |
| Divky listing | `/cs/divky` | `/girls` | `/de/maedchen` | `/uk/divchata` |
| Profil (anetta) | `/cs/profil/anetta` | `/profile/anetta` | `/de/profil/anetta` | `/uk/profil/anetta` |
| Cenik | `/cs/cenik` | `/pricing` | `/de/preise` | `/uk/tsiny` |
| Rozvrh | `/cs/rozvrh` | `/schedule` | `/de/zeitplan` | `/uk/rozklad` |
| Slevy | `/cs/slevy` | `/discounts` | `/de/rabatte` | `/uk/znyzhky` |
| FAQ | `/cs/faq` | `/faq` | `/de/faq` | `/uk/faq` |
| Recenze | `/cs/recenze` | `/reviews` | `/de/rezensionen` | `/uk/vidhuky` |
| O nas | `/cs/o-nas` | `/about` | `/de/ueber-uns` | `/uk/pro-nas` |
| Kontakt | `/cs/kontakt` | `/contact` | `/de/kontakt` | `/uk/kontakt` |
| Podminky | `/cs/podminky` | `/terms` | `/de/agb` | `/uk/umovy` |
| Soukromi | `/cs/soukromi` | `/privacy` | `/de/datenschutz` | `/uk/konfidentsiinist` |
| Blog index | `/cs/blog` | `/blog` | `/de/blog`* | `/uk/blog`* |
| Blog clanek | `/cs/blog/{slug}` | `/blog/{slug}` | `/de/blog/{slug}` | `/uk/blog/{slug}` |
| Hashtag | `/cs/hashtag/{slug}` | `/hashtag/{slug}` | `/de/hashtag/{slug}` | `/uk/hashtag/{slug}` |
| Pobocka | `/cs/pobocka/{slug}` | `/pobocka/{slug}` | `/de/pobocka/{slug}` | `/uk/pobocka/{slug}` |
| Sluzba | `/cs/sluzba/{slug}` | `/service/{slug}` | `/de/leistung/{slug}` | `/uk/posluha/{slug}` |
| Pridat se | `/cs/pridat-se` | `/join` | `/de/bewerben` | `/uk/dodaty-sia` |
| Pridat se uspech | `/cs/pridat-se/uspech` | `/join/success` | `/de/bewerben/erfolg` | `/uk/dodaty-sia/uspikh` |
| Clenstvi zadost | `/cs/clenstvi/zadost` | `/membership/apply` | `/de/mitgliedschaft/bewerben` | `/uk/chlenstvo/zaiavka` |
| Clenstvi odeslano | `/cs/clenstvi/zadost/odeslano` | `/membership/apply/sent` | ... | ... |
| Recenze nova | `/cs/recenze/nova/{slug}` | (same for all locales) | | |
| Novinky | `/cs/novinky` | `/whats-new` | `/de/neuigkeiten` | `/uk/novynky` |
| Stories | `/cs/stories/{id}` | `/stories/{id}` | (same) | (same) |

*Poznamka: `/de/blog` a `/uk/blog` presmerovavaji na `/cs/blog` (app/[locale]/blog/page.tsx:63-66). Overit ze redirect funguje.

### 3.2 Specialni scenare

- [ ] **404 strana:** `/cs/profil/neexistujici-slug` → 404 s proper not-found page
- [ ] **404 hashtag:** `/cs/hashtag/neexistujici-tag` → 404
- [ ] **404 blog:** `/cs/blog/neexistujici-post` → 404
- [ ] **404 pobocka:** `/cs/pobocka/neexistujici` → 404
- [ ] **Rozvrh past redirect:** `/cs/rozvrh?day=2025-01-01` → redirect na dnesek
- [ ] **Filtry divky:** `/cs/divky?status=available` → funguje, filtruje
- [ ] **Filtry divky sort:** `/cs/divky?sort=name` → funguje
- [ ] **Review form:** `/cs/recenze/nova/anetta` → formular se zobrazi

### 3.3 JS-disabled kontrola

Overit s vypnutym JavaScriptem:
- [ ] Filtry na `/divky` fungiji pres URL params (`<form method="GET">`)
- [ ] Rozvrh dny pres `<a href>` tagy
- [ ] FAQ akordeon pres `<details>/<summary>`
- [ ] Navigace funguje
- [ ] Formulare fungiji (join, review, contact)

---

## FAZE 4: SEO AUDIT

### 4.1 Canonical URLs

**Kde se generuji:** `lib/seo/meta.ts` (getCanonicalUrl), `lib/seo/hreflang.ts` (getCanonicalForPath)
**Base:** `NEXT_PUBLIC_SITE_URL` fallback `https://www.lovelygirls.cz`

Overit na KAZDE verejne strance:
- [ ] `<link rel="canonical" href="https://www.lovelygirls.cz/...">` — NE `escx23.vercel.app`
- [ ] Canonical URL odpovida aktualni strance (spravny locale prefix, spravna cesta)

**NALEZENY PROBLEM — Stranky BEZ canonical/alternates:**
Tyto stranky nemaji v `generateMetadata` nastavene `alternates.canonical` ani `alternates.languages`:
- `/join` (pridat-se) — `app/[locale]/join/page.tsx`
- `/join/success` — `app/[locale]/join/success/page.tsx`
- `/stories/[id]` — `app/[locale]/stories/[id]/page.tsx`
- `/clenstvi/zadost` — `app/[locale]/clenstvi/zadost/page.tsx`
- `/clenstvi/zadost/odeslano` — `app/[locale]/clenstvi/zadost/odeslano/page.tsx`
- `/recenze/nova/[slug]` — `app/[locale]/recenze/nova/[slug]/page.tsx`
- `/novinky` — `app/[locale]/novinky/page.tsx`

**Fix:** Pridat canonical + alternates languages do `generateMetadata` techto stranek.
Pozn.: Nektere z nich by meli mit `robots: { index: false }` (recenze/nova, clenstvi/zadost/odeslano, stories/[id]) — overit.

### 4.2 Hreflang Tags

**Kde se generuji:** `lib/seo/hreflang.ts` — `getHreflangsForPath()`
**Druha implementace:** `lib/seo/meta.ts` — `getAlternates()`

**POTENCIALNI PROBLEM:** Dve nezavisle implementace hreflang (hreflang.ts a meta.ts) — overit ze davaji stejne vysledky. `hreflang.ts` pouziva routing.ts pathnames dynamicky, `meta.ts` ma hardcoded LOCALIZED_PATHS dictionary. Pokud se pridaji nove stranky, `meta.ts` se neaktualizuje automaticky.

Overit na kazde strance:
- [ ] 5 hreflang tagu: `en`, `cs`, `de`, `uk`, `x-default`
- [ ] Vsechny URL zacitaji `https://www.lovelygirls.cz`
- [ ] URL pouzivaji spravne lokalizovane cesty (en: /girls, cs: /divky, de: /maedchen, uk: /divchata)
- [ ] `x-default` odkazuje na EN verzi

**SPECIFICKE OVERENI:**
- [ ] Stranky `pobocka/[slug]` a `hashtag/[slug]` — neni v LOCALIZED_PATHS dictionary v meta.ts, takze `getAlternates()` je nemuze lokalizovat. Overit ze pouzivaji `getHreflangsForPath()` nebo vlastni alternates.

### 4.3 OG Tags

Overit na kazde verejne strance:
- [ ] `<meta property="og:url" content="https://www.lovelygirls.cz/...">` — spravna domena
- [ ] `<meta property="og:title">` — existuje a je relevantni
- [ ] `<meta property="og:description">` — existuje
- [ ] `<meta property="og:image">` — existuje a URL je dosazitelna (200)
- [ ] `<meta property="og:locale">` — spravny (cs_CZ, en_US, de_DE, uk_UA)
- [ ] `<meta property="og:type">` — website nebo article (blog)

### 4.4 Twitter Cards

- [ ] `<meta name="twitter:card" content="summary_large_image">`
- [ ] `<meta name="twitter:title">` existuje
- [ ] `<meta name="twitter:description">` existuje
- [ ] `<meta name="twitter:image">` existuje a URL je dosazitelna

### 4.5 sitemap.xml

**Soubor:** `app/sitemap.ts`
**URL:** `https://www.lovelygirls.cz/sitemap.xml`

Overit:
- [ ] Vsechny URL v sitemap zacitaji `https://www.lovelygirls.cz`
- [ ] Obsahuje homepage (4 locales)
- [ ] Obsahuje /divky (4 locales)
- [ ] Obsahuje vsechny aktivni profily (4 locales kazdy)
- [ ] Obsahuje staticke stranky: cenik, slevy, rozvrh, faq, recenze, o-nas, kontakt, blog (4 locales)
- [ ] Obsahuje blog posty (sitemap ma jen en+cs dle kodu — viz radek 219)
- [ ] Obsahuje pobocky (4 locales)
- [ ] Obsahuje sluzby (4 locales)
- [ ] Obsahuje hashtagy (HASHTAG_SLUGS — 8 ks × 4 locales)
- [ ] Alternates (hreflang) v sitemap odpovidaji hreflang v HTML

**NALEZENE NEDOSTATKY v sitemap:**
- **Chybi:** `/join` (pridat-se), `/novinky`, `/clenstvi/zadost` — tyto stranky nejsou v sitemap vubec
- **Blog de/uk:** Sitemap je generuje jen pro en+cs (radek 219), ale hreflang alternates odkazuji i na de/uk. Bud pridat do sitemap, nebo upravit alternates aby de/uk nebyly zahrnuty (blog de/uk redirectuje na cs).
- **Podminky, soukromi:** Nejsou v STATIC_KEYS (radek 97-106) — chybi v sitemap

### 4.6 robots.txt

**Soubor:** `app/robots.ts`
**URL:** `https://www.lovelygirls.cz/robots.txt`

Overit:
- [ ] `Sitemap: https://www.lovelygirls.cz/sitemap.xml`
- [ ] `Host: https://www.lovelygirls.cz`
- [ ] Allow `/` pro hlavni crawlery
- [ ] Disallow `/admin/`, `/studio/`, `/api/`
- [ ] Preview detection nespousti blokovani na www.lovelygirls.cz (process.env.VERCEL_ENV !== 'preview')
- [ ] AI crawlery (GPTBot, ClaudeBot, PerplexityBot) maji explicitni Allow

### 4.7 llms.txt

**Soubor:** `app/llms.txt/route.ts`
**URL:** `https://www.lovelygirls.cz/llms.txt`

Overit:
- [ ] Vsechny linky pouzivaji aktualni domenu
- [ ] Ceny jsou aktualni
- [ ] Provozni doba je spravna (10:00-22:30)
- [ ] Kontakt je spravny (+420 734 332 131)

**NALEZENE NEDOSTATKY:**
- **LAST_UPDATED = '2026-05-28'** — zastarale, aktualizovat
- **Apartments sekce:** Zminuje pouze Vinohrady (Praha 2). Chybi: Zizkov (Praha 3, otevreno 18.6.2026), Karlin (Praha 8), Praha 1 Nove Mesto. Viz `MEMORY.md` — Zizkov otevren 18.6., Smichov 25.7.2026.
- **Pricing "from 2 500 CZK" pro 30 i 60 min** — overit aktualni cenik v DB
- **Pocet spolecnic:** Rika "13+" ale muze se menit — overit aktualni pocet

### 4.8 Structured Data (JSON-LD)

**Soubor:** `lib/seo/jsonld.ts`

Stranky a jejich JSON-LD schematau:

| Stranka | JSON-LD typy | Overit |
|---------|-------------|--------|
| Homepage | LocalBusiness, Organization, WebSite | @id, url, aggregateRating, openingHours |
| Profil | Person + AggregateRating + Review | url, aggregateRating vzdy ma reviewCount pokud review existuji |
| Divky listing | ItemList + CollectionPage | spravne URL profilu |
| Cenik | OfferCatalog | ceny, nazvy programu |
| FAQ | FAQPage | otazky/odpovedi |
| Slevy | Offer[] | nazvy a popisy slev |
| Hashtag | BreadcrumbList + FAQPage + ItemList + CollectionPage | spravne URL |
| Pobocka | LocalBusiness (AdultEntertainment) + BreadcrumbList | adresa, opening hours |
| Sluzba | BreadcrumbList + CollectionPage | spravne URL |
| Rozvrh | BreadcrumbList | spravne URL |

**NALEZENY NEDOSTATEK:**
- **Blog stranky** (`/blog`, `/blog/[slug]`) — NEMAJI zadne JSON-LD. Blog clanky by meli mit `Article` schema.
- **Novinky** (`/novinky`) — zadne JSON-LD

### 4.9 X-Robots-Tag Headers

**Nastaveno v:** `next.config.ts:99-117`

Overit ze tyto patterny maji `X-Robots-Tag: noindex, nofollow`:
- [ ] `/admin/*`
- [ ] `/studio/*`
- [ ] `/{locale}/admin/*`
- [ ] `/{locale}/studio/*`

Take v layout souborech:
- `app/[locale]/(admin)/admin/layout.tsx:11-12` — `robots: { index: false, follow: false, nocache: true }`
- `app/[locale]/studio/layout.tsx:9-10` — `robots: { index: false, follow: false, nocache: true }`

---

## FAZE 5: ADMIN PANEL

### 5.1 Login
- [ ] Pristupovat na `www.lovelygirls.cz/cs/admin` → redirect na login
- [ ] Prihlasit se (admin@lovelygirls.cz / Admin2026!)
- [ ] Session cookie se nastavi spravne na www.lovelygirls.cz domain

### 5.2 Admin stranky (po prihlaseni)

Overit HTTP 200 + stranka se renderuje:

| Stranka | URL | Specificke overeni |
|---------|-----|-------------------|
| Dashboard | `/cs/admin` | Quick-action linky vedou na spravne URL (ne hardcoded /cs/) |
| Divky seznam | `/cs/admin/divky` | Seznam divek se zobrazi |
| Divka edit | `/cs/admin/divky/{id}/edit` | Formular se nacte |
| Divka fotky | `/cs/admin/divky/{id}/fotky` | Galerie se zobrazi |
| Divka videa | `/cs/admin/divky/{id}/videa` | |
| Divka dostupnost | `/cs/admin/divky/{id}/dostupnost` | Kalendar funguje |
| Divka dostupnost den | `/cs/admin/divky/{id}/dostupnost/den/{date}` | |
| Nova divka | `/cs/admin/divky/nova` | |
| Rozvrhy | `/cs/admin/schedules` | |
| Recenze | `/cs/admin/recenze` | |
| Recenze apartmanu | `/cs/admin/recenze-apartmanu` | |
| Rezervace | `/cs/admin/rezervace` | |
| Cenik | `/cs/admin/cenik` | |
| Nova plan | `/cs/admin/cenik/nova-plan` | |
| Plan edit | `/cs/admin/cenik/plany/{id}` | |
| Nova extra | `/cs/admin/cenik/nova-extra` | |
| Extra edit | `/cs/admin/cenik/extras/{id}` | |
| Slevy | `/cs/admin/slevy` | |
| Nova sleva | `/cs/admin/slevy/nova` | |
| Sleva edit | `/cs/admin/slevy/{id}` | |
| Clenove | `/cs/admin/clenove` | |
| Aplikace | `/cs/admin/aplikace` | |
| Aplikace detail | `/cs/admin/aplikace/{id}` | |
| Verifikace | `/cs/admin/verifikace` | |
| Pobocky | `/cs/admin/pobocky` | |
| Pobocka edit | `/cs/admin/pobocky/{id}` | |
| Nova pobocka | `/cs/admin/pobocky/nova` | |
| FAQ | `/cs/admin/faq` | |
| FAQ edit | `/cs/admin/faq/{id}` | |
| Nova FAQ | `/cs/admin/faq/nova` | |
| Blog | `/cs/admin/blog` | |
| Novy blog | `/cs/admin/blog/novy` | |
| Blog edit | `/cs/admin/blog/{id}` | |
| Blog tagy | `/cs/admin/blog/tagy` | |
| Blog tag edit | `/cs/admin/blog/tagy/{id}` | |
| Novy tag | `/cs/admin/blog/tagy/novy` | |
| SEO | `/cs/admin/seo` | |
| SEO edit | `/cs/admin/seo/edit` | |
| OG images | `/cs/admin/og` | |
| Notifikace | `/cs/admin/notifikace` | |
| Stories | `/cs/admin/stories` | |

### 5.3 Admin CRUD operace

- [ ] Edit divku → ulozit → zmena se projevi
- [ ] Schvaleni recenze
- [ ] Uprava slevy
- [ ] CRUD blog postu
- [ ] Upload fotky

### 5.4 Manager role

- [ ] Manager nemuze pristupovat na stranky mimo `MANAGER_ALLOWED_PATHS` (layout.tsx:16-24)
- [ ] Manager moze pristupovat: /admin, /admin/notifikace, /admin/divky, /admin/schedules, /admin/recenze, /admin/rezervace, /admin/stories

---

## FAZE 6: STUDIO PANEL

### 6.1 Login
- [ ] Pristupovat na `www.lovelygirls.cz/cs/studio` → redirect na login
- [ ] Prihlasit se (ucet divky)
- [ ] Session cookie se nastavi spravne

### 6.2 Studio stranky (po prihlaseni)

| Stranka | URL |
|---------|-----|
| Dashboard | `/cs/studio` |
| Profil status | `/cs/studio/profil-status` |
| Zakladni udaje | `/cs/studio/zakladni` |
| Telo | `/cs/studio/telo` |
| Fotky | `/cs/studio/fotky` |
| Videa | `/cs/studio/videa` |
| Sluzby | `/cs/studio/sluzby` |
| Program | `/cs/studio/program` |
| Jazyky | `/cs/studio/jazyky` |
| Zivotni styl | `/cs/studio/zivotni-styl` |
| Hashtagy | `/cs/studio/hashtagy` |
| Dostupnost/Kalendar | `/cs/studio/kalendar` |
| Dostupnost | `/cs/studio/dostupnost` |
| Recenze | `/cs/studio/recenze` |
| Statistiky | `/cs/studio/statistiky` |
| Rezervace | `/cs/studio/rezervace` |
| Stories | `/cs/studio/stories` |
| Zprava | `/cs/studio/zprava` |
| Hlas | `/cs/studio/hlas` |

---

## FAZE 7: STARE URL V HTML VYSTUPU

### 7.1 Zdrojovy kod — grep `escx23.vercel.app`

**Akceptovatelne vyskyty (NE v HTML):**
- `next.config.ts:33` — redirect pravidlo (spravne)
- `audit_results.json`, `audit_deep_results.json` — stare audit soubory (neslouzi se)
- `.env.prod.local:5` — **OPRAVIT** (viz Faze 1)
- `.env.prod-check.local:6`, `.env.vercel-prod.local:6`, `.env.prod-pull.local:6` — GOOGLE_REDIRECT_URI **OPRAVIT**

**Akce:** Grep HTML output na produkci (view-source) pro `escx23.vercel.app` — nesmi se nikde objevit.

### 7.2 Zdrojovy kod — grep `https://lovelygirls.cz` (bez www)

**Aktualni stav:** Zadne vyskyty v .ts/.tsx souborech. OK.

### 7.3 Hardcoded `/cs/` linky

- `app/[locale]/(admin)/admin/page.tsx` — dashboard quick-action linky — overit ze pouzivaji dynamicky locale

---

## FAZE 8: CHYBEJICI PRVKY — SOUHRN NALEZU Z ANALYZY

### 8.1 Stranky bez canonical/alternates v generateMetadata

| Stranka | Soubor | Doporuceni |
|---------|--------|-----------|
| /join | `app/[locale]/join/page.tsx` | Pridat canonical + alternates |
| /join/success | `app/[locale]/join/success/page.tsx` | robots: noindex (dekujeme stranka) |
| /stories/[id] | `app/[locale]/stories/[id]/page.tsx` | robots: noindex (ephemeral content) |
| /clenstvi/zadost | `app/[locale]/clenstvi/zadost/page.tsx` | Pridat canonical + alternates |
| /clenstvi/zadost/odeslano | `app/[locale]/clenstvi/zadost/odeslano/page.tsx` | robots: noindex |
| /recenze/nova/[slug] | `app/[locale]/recenze/nova/[slug]/page.tsx` | robots: noindex (form page) |
| /novinky | `app/[locale]/novinky/page.tsx` | Pridat canonical + alternates |

### 8.2 Stranky chybejici v sitemap.xml

| Stranka | Zaradeni do sitemap? |
|---------|---------------------|
| /join (pridat-se) | ANO — dulezita pro SEO |
| /novinky (whats-new) | ANO — obsah stranka |
| /podminky (terms) | ANO — chybi v STATIC_KEYS |
| /soukromi (privacy) | ANO — chybi v STATIC_KEYS |
| /clenstvi/zadost | NE — formularova stranka |
| /stories/[id] | NE — ephemeral |
| /recenze/nova/[slug] | NE — formular |

### 8.3 Blog sitemap vs redirect nesoulad

Blog `/de/blog` a `/uk/blog` redirectuji na `/cs/blog` (page.tsx:63-66), ale sitemap generuje alternates pro de/uk. Reseni:
- Bud odstranit redirect a zobrazovat blog v de/uk
- Nebo v sitemap alternates nahradit de/uk za cs URL

### 8.4 llms.txt neaktualni obsah

- `LAST_UPDATED`: 2026-05-28 → aktualizovat
- Apartments: Chybi Zizkov (Praha 3), Karlin (Praha 8), Praha 1 Nove Mesto
- Pocet spolecnic: overit aktualni

### 8.5 Blog stranky bez JSON-LD Article schema

`/blog/[slug]` nema strukturovana data. Pridat:
```json
{
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Person", "name": "..." },
  "datePublished": "...",
  "publisher": { "@id": "BASE/#organization" }
}
```

---

## FAZE 9: TESTOVACI METODIKA

### 9.1 Automatizovane testy (Chrome / Playwright)

Skript `chrome-test-escx23.mjs` — aktualizovat na `www.lovelygirls.cz`.

Pro kazdou verejnou stranku:
1. Fetch URL, overit HTTP 200
2. Parsovat HTML:
   - `<link rel="canonical">` — spravna domena + cesta
   - `<link rel="alternate" hreflang="*">` — vsech 5 (en, cs, de, uk, x-default)
   - `<meta property="og:url">` — spravna domena
   - `<meta property="og:title">` — existuje
   - `<meta property="og:image">` — existuje, URL dosazitelna
   - `<script type="application/ld+json">` — validni JSON, spravne @type

### 9.2 Manualni testy

- [ ] Admin login → navigace → CRUD
- [ ] Studio login → navigace → edit profilu
- [ ] Mobile responsive (320px, 375px, 768px, 1024px)
- [ ] JS-disabled test (viz Faze 3.3)
- [ ] Age gate funguje
- [ ] WhatsApp deep link funguje
- [ ] Google Rich Results Test na: homepage, profil, FAQ, blog clanek

### 9.3 SEO nastroje

- [ ] Google Search Console — zkontrolovat indexaci po prechodu na www
- [ ] Schema.org Validator — na homepage, profil, FAQ, cenik
- [ ] PageSpeed Insights — Core Web Vitals

---

## PRIORITIZACE OPRAV

### P0 — KRITICKE (blokuji indexaci)
1. Overit NEXT_PUBLIC_SITE_URL na Vercel = `https://www.lovelygirls.cz`
2. Opravit `.env.prod.local` — stara URL
3. Opravit GOOGLE_REDIRECT_URI ve 3 env souborech

### P1 — VYSOKA (SEO impact)
4. Pridat canonical/alternates na stranky kde chybi (8.1)
5. Pridat /podminky a /soukromi do sitemap STATIC_KEYS
6. Pridat /join do sitemap
7. Opravit blog sitemap vs redirect nesoulad (8.3)
8. Aktualizovat llms.txt (apartments, datum, pocet)

### P2 — STREDNI (quality)
9. Pridat Article JSON-LD na blog stranky
10. Pridat novinky do sitemap
11. Overit admin hardcoded /cs/ linky

### P3 — NIZKA (cleanup)
12. Smazat stare audit JSON soubory z repo
13. Pridat Article JSON-LD na novinky
