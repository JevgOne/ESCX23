# TASK-020: Redirect mapa — stare URL → nove URL (301)

## Zjisteni z Wayback Machine CDX API

Domena lovelygirls.cz existuje od 2022. Web prosel 3 erami:

### Era 1: WordPress (2022–2024, bez www)
```
lovelygirls.cz/              (homepage)
lovelygirls.cz/author/spravce/
lovelygirls.cz/bdsm/
lovelygirls.cz/blog/
lovelygirls.cz/cenik/
```
WordPress sitemap: `slecny-sitemap.xml`, `page-sitemap.xml` (uz neexistuji, 404).

### Era 2: Secretstory/React (2024–2025, s www)
```
/cs/main         (homepage)
/cz/main         (stara cs homepage)
/cs/girls/{name}  (Amelie, Caty, Ema, Emily)
/cs/profiles      (listing)
/cz/profiles
/cs/pricing
/cz/pricing
/cs/schedule
/cz/schedule
/cz/blog
/cz/faq
```

### Era 3: Secretstory v2 + blog/landing (2025, s www)
```
/cs/profily/{name}  (Anna, Diana, Eliska, Elizabeth, Ema, Emily, Karin, Katy, Lucka, Luna, Marie, Natalie, Nika, Nikol, Rebeca, Sara, Sophie)
/cs/divky
/cs/cenik
/cs/blog
/cs/faq
/cs/recenze
/cs/sluzby
/cs/discount

/blog/{en-slug}       (EN blog clanky — 20+ clanku!)
/blog-cs/{cs-slug}    (CS blog clanky — 11 clanku)
/blogs-cz/{cs-slug}   (starsí CS blog URL — 12 clanku)

/cs/landing/escort-praha
/cs/landing/sex-praha
/cs/landing/privat-praha
/cs/landing/spolecnice-praha
/cs/landing/girlfriend-experience-praha
/cs/landing/nonstop-escort-praha
/cs/landing/outcall-escort-praha
/cs/landing/duo-escort-praha
/cs/landing/eroticke-masaze-praha
/cs/landing/vip-escort-praha

/cs/hashtag/{slug}    (desitky hashtag stranek — tyto FUNGUJI na novem webu)
/de/hashtag/{slug}    (FUNGUJI)
```

---

## Analyza: co je 404 a co funguje

### FUNGUJE (neni treba redirect)
- `/cs/divky` → funguje (current routing)
- `/cs/cenik` → funguje
- `/cs/recenze` → funguje
- `/cs/faq` → funguje
- `/cs/blog` → funguje
- `/cs/hashtag/{slug}` → funguje
- `/de/*` locale stranky → funguji

### 404 — NUTNE REDIRECTY

#### A) Profily (VYSOKA PRIORITA — backlinky na profily)

| Stara URL | Nova URL | Poznamka |
|-----------|----------|----------|
| `/cs/girls/{name}` | `/cs/profil/{name}` | Era 2 profily |
| `/cs/profily/{name}` | `/cs/profil/{name}` | Era 3 profily |
| `/cz/profiles` | `/cs/divky` | Stary listing |
| `/cs/profiles` | `/cs/divky` | Stary listing |

Konkretni jmena z Wayback: amelie, caty, ema, emily, anna, diana, eliska, elizabeth, karin, katy, lucka, luna, marie, natalie, nika, nikol, rebeca, sara, sophie

#### B) Landing pages (VYSOKA PRIORITA — SEO hodnota!)

| Stara URL | Nova URL | Poznamka |
|-----------|----------|----------|
| `/cs/landing/escort-praha` | `/cs/hashtag/spolecnice-praha` | Nejlepsi match |
| `/cs/landing/sex-praha` | `/cs/` | Nebo /cs/divky |
| `/cs/landing/privat-praha` | `/cs/` | Homepage |
| `/cs/landing/spolecnice-praha` | `/cs/hashtag/spolecnice-praha` | Presny match |
| `/cs/landing/girlfriend-experience-praha` | `/cs/hashtag/gfe-praha` | Presny match |
| `/cs/landing/nonstop-escort-praha` | `/cs/rozvrh` | Rozvrh = dostupnost |
| `/cs/landing/outcall-escort-praha` | `/cs/` | Nemame outcall stranku |
| `/cs/landing/duo-escort-praha` | `/cs/divky` | Nemame duo stranku |
| `/cs/landing/eroticke-masaze-praha` | `/cs/` | Nemame masaze stranku |
| `/cs/landing/vip-escort-praha` | `/cs/divky` | VIP filtr |

#### C) Blog clanky (STREDNI PRIORITA — hodne obsahu)

**EN blog** (`/blog/{slug}` → `/en/blog/{slug}` pokud existuje, jinak `/blog`):

| Stary slug | Poznamka |
|------------|----------|
| escort-in-prague-for-visitors-step-by-step | SEO hodnotny |
| escort-prague-prices-what-affects-cost | SEO hodnotny |
| gfe-in-prague-what-it-really-means | SEO hodnotny |
| how-to-choose-an-escort-in-prague-smoothly | SEO hodnotny |
| bdsm-prague-a-practical-guide... | SEO hodnotny |
| discreet-incall-prague-how-it-works | SEO hodnotny |
| escort-etiquette-prague... | SEO hodnotny |
| escort-outcall-prague-a-calm-hotel-guide | SEO hodnotny |
| escort-prague-availability... | SEO hodnotny |
| types-of-companions-in-prague... | SEO hodnotny |
| lovely-specials-monthly-offers | Promo |
| erotic-stories-* (4 clanky) | Obsah |
| experience-*/let-*/discover-*/spend-* (10+ clanku) | Promo profily |

**CS blog** (`/blog-cs/{slug}` a `/blogs-cz/{slug}` → `/cs/blog/{slug}` pokud existuje):

| Stary slug (blog-cs) | Poznamka |
|----------------------|----------|
| escort-v-praze-pro-turisty-srozumitelne | SEO hodnotny |
| ceny-escortu-v-praze-co-ovlivnuje-cenu | SEO hodnotny |
| gfe-v-praze-co-to-doopravdy-znamena | SEO hodnotny |
| jak-si-vybrat-spolecnici... | SEO hodnotny |
| bdsm-praha-pruvodce... | SEO hodnotny |
| diskretni-incall-v-praze... | SEO hodnotny |
| etiketa-escort-praha... | SEO hodnotny |
| outcall-do-hotelu-v-praze... | SEO hodnotny |
| typy-spolecnic-v-praze... | SEO hodnotny |
| kalendar-dostupnosti... | SEO hodnotny |
| lovely-specials-mesicni-zvyhodneni | Promo |
| eroticka-povidka-* / eroticke-pribehy-* | Obsah |

#### D) Stare locale/strukturalni URL

| Stara URL | Nova URL |
|-----------|----------|
| `/cz/main` | `/cs/` |
| `/cs/main` | `/cs/` |
| `/cz/blog` | `/cs/blog` |
| `/cz/faq` | `/cs/faq` |
| `/cz/pricing` | `/cs/cenik` |
| `/cs/pricing` | `/cs/cenik` |
| `/cz/schedule` | `/cs/rozvrh` |
| `/cs/schedule` | `/cs/rozvrh` |
| `/cs/discount` | `/cs/slevy` |
| `/cs/sluzby` | `/cs/divky` | Nemame /sluzby stranku, nejblizsi je /divky |
| `/bdsm/` | `/cs/blog` | WordPress-era, redirect na blog |
| `/author/spravce/` | `/cs/` | WordPress author page |

---

## Implementace v next.config.ts

### Pristup: Wildcard redirecty s regex

```ts
async redirects() {
  return [
    // === Existujici redirecty (zachovat) ===
    // non-www → www
    { source: '/:path*', has: [{ type: 'host', value: 'lovelygirls.cz' }], destination: 'https://www.lovelygirls.cz/:path*', permanent: true },
    // escx23.vercel.app → www
    { source: '/:path*', has: [{ type: 'host', value: 'escx23.vercel.app' }], destination: 'https://www.lovelygirls.cz/:path*', permanent: true },

    // === NOVE: Stare URL redirecty ===

    // A) Profily
    { source: '/cs/girls/:slug', destination: '/cs/profil/:slug', permanent: true },
    { source: '/cs/profily/:slug', destination: '/cs/profil/:slug', permanent: true },
    { source: '/cz/profiles', destination: '/cs/divky', permanent: true },
    { source: '/cs/profiles', destination: '/cs/divky', permanent: true },

    // B) Landing pages
    { source: '/cs/landing/escort-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
    { source: '/cs/landing/spolecnice-praha', destination: '/cs/hashtag/spolecnice-praha', permanent: true },
    { source: '/cs/landing/girlfriend-experience-praha', destination: '/cs/hashtag/gfe-praha', permanent: true },
    { source: '/cs/landing/nonstop-escort-praha', destination: '/cs/rozvrh', permanent: true },
    { source: '/cs/landing/sex-praha', destination: '/cs/', permanent: true },
    { source: '/cs/landing/privat-praha', destination: '/cs/', permanent: true },
    { source: '/cs/landing/outcall-escort-praha', destination: '/cs/', permanent: true },
    { source: '/cs/landing/duo-escort-praha', destination: '/cs/divky', permanent: true },
    { source: '/cs/landing/eroticke-masaze-praha', destination: '/cs/', permanent: true },
    { source: '/cs/landing/vip-escort-praha', destination: '/cs/divky', permanent: true },
    // Catchall pro jake koliv dalsi landing
    { source: '/cs/landing/:slug', destination: '/cs/', permanent: true },

    // C) Blog — stare URL patterny
    // blog-cs → cs/blog (CS blog clanky)
    { source: '/blog-cs/:slug', destination: '/cs/blog/:slug', permanent: true },
    // blogs-cz → cs/blog (starsi CS blog URL)
    { source: '/blogs-cz/:slug', destination: '/cs/blog/:slug', permanent: true },
    // /blog/{en-slug} → /blog/{slug} (EN blog — funguje pokud clanek existuje v DB)
    // POZOR: /blog uz je route, takze /blog/{slug} by mel fungovat
    // Stare /blog/ (WordPress) → /cs/blog
    { source: '/blog/', destination: '/cs/blog', permanent: true },

    // D) Stare locale/strukturalni
    { source: '/cz/main', destination: '/cs/', permanent: true },
    { source: '/cs/main', destination: '/cs/', permanent: true },
    { source: '/cz/blog', destination: '/cs/blog', permanent: true },
    { source: '/cz/faq', destination: '/cs/faq', permanent: true },
    { source: '/cz/pricing', destination: '/cs/cenik', permanent: true },
    { source: '/cs/pricing', destination: '/cs/cenik', permanent: true },
    { source: '/cz/schedule', destination: '/cs/rozvrh', permanent: true },
    { source: '/cs/schedule', destination: '/cs/rozvrh', permanent: true },
    { source: '/cs/discount', destination: '/cs/slevy', permanent: true },
    { source: '/cs/sluzby', destination: '/cs/divky', permanent: true },
    { source: '/cz/:path*', destination: '/cs/:path*', permanent: true },

    // E) WordPress-era
    { source: '/bdsm', destination: '/cs/blog', permanent: true },
    { source: '/bdsm/', destination: '/cs/blog', permanent: true },
    { source: '/author/:slug', destination: '/cs/', permanent: true },
    { source: '/author/:slug/', destination: '/cs/', permanent: true },

    // F) WordPress sitemap URLs (vraci 404, nemaji vyznam)
    { source: '/slecny-sitemap.xml', destination: '/sitemap.xml', permanent: true },
    { source: '/page-sitemap.xml', destination: '/sitemap.xml', permanent: true },
    { source: '/wp-sitemap.xml', destination: '/sitemap.xml', permanent: true },
    { source: '/sitemap_index.xml', destination: '/sitemap.xml', permanent: true },
  ];
}
```

---

## Dulezita poznamka o blog clancich

Stary web mel **30+ blog clanku** s SEO hodnotnym obsahem:
- "Escort in Prague for Visitors" (EN)
- "Ceny escortu v Praze" (CS)
- "GFE in Prague — what it really means" (EN)
- "Jak si vybrat spolecnici" (CS)
- atd.

Tyto clanky ted vracejí 404. Redirecty na `/cs/blog/:slug` pomohou JEN pokud clanky existuji v nasi DB. 

**Doporuceni:** Reimportovat SEO-hodnotne clanky do DB (nebo napsat nove s podobnymi slugy). Blog obsah je jeden z hlavnich SEO assetu ktere stary web mel.

Viz TASK-017 (Blog drafty) — mel by zahrnout reimport starych clanku.

---

## Priorita redirectu

| Priorita | Kategorie | Pocet | SEO dopad |
|----------|-----------|-------|-----------|
| P0 | Profily (girls/, profily/) | ~19 jmen × 2 patterny | VYSOKY — backlinky na profily |
| P0 | Landing pages (landing/*) | 10 | VYSOKY — SEO KW stranky |
| P1 | Blog clanky (blog-cs/, blogs-cz/) | ~23 | STREDNI — SEO obsah |
| P1 | Stare locale (/cz/*) | ~6 | STREDNI |
| P2 | WordPress-era (bdsm/, author/) | ~3 | NIZKY |
| P2 | Stare sitemaps | ~4 | NIZKY |

---

## Soubory k upravit

| # | Soubor | Akce |
|---|--------|------|
| 1 | `next.config.ts` | UPRAVIT — pridat ~30 redirect pravidel do `redirects()` |

Zadne dalsi soubory. Vsechny redirecty jsou v Next.js config.

---

## Rizika

1. **Pocet redirectu** — Next.js podporuje stovky redirectu, 30-40 neni problem
2. **Poradi** — specificke redirecty pred wildcard (`/cz/:path*` musi byt POSLEDNI)
3. **Blog slugy** — redirect `/blog-cs/:slug` → `/cs/blog/:slug` funguje jen pokud clanek v DB existuje. Pokud ne, uzivatel uvidí 404 na cilovem URL. Lepsi nez 404 na starem URL (Google vidi ze se snazime).
4. **Trailing slash** — Next.js default je BEZ trailing slash. Stare WordPress URL maji trailing slash. Next.js `trailingSlash: false` (default) automaticky stripuje.

---

## DOPLNENI: GSC Coverage analyza (32 x 5xx, 662 x crawled-not-indexed, 70 x redirect chains)

### 1. 5xx Server Errors (32 stranek)

#### Pravdepodobne priciny

**A) Turso DB cold start / timeout na Vercel Serverless**

Temer VSECHNY verejne stranky maji `force-dynamic` + `revalidate = 0`, takze kazdy request jde na Turso DB. Kriticke stranky s nejvice DB queries:

| Stranka | Pocet DB queries | Riziko 5xx |
|---------|-----------------|------------|
| `/profil/[slug]` | 8 paralelnich queries (girl, photos, reviews, plans, services, girlServices, schedule, videos) + 1 v generateMetadata + 1 seo-metadata + 1 SimilarGirls | VYSOKE |
| `/pobocka/[slug]` | 4-5 queries (location, reviews, ratings, others, girls) + seo-metadata | STREDNI |
| `/` (homepage) | getHomepageStats + seo-metadata + kazda komponenta (StoriesRow, FeaturedNew, GirlsGridSection, ActivityFeed, ReviewsStrip...) = 8-10 queries | VYSOKE |
| `/divky` | getGirlsWithToday (slozity JOIN s 5 args) + seo-metadata | STREDNI |
| `/rozvrh` | Slozity schedule query + seo-metadata | STREDNI |
| `/hashtag/[slug]` | getGirlsForHashtag + seo-metadata | NIZKE |
| `/sluzba/[slug]` | getServiceBySlug + getRelatedServices + getGirlsForService + seo-metadata | STREDNI |

Vercel Serverless ma default timeout 10s (Hobby) nebo 60s (Pro). Turso cold start muze byt 1-3s. Pri 8 paralelnich queries na `/profil/[slug]` se celkovy response time muze presahnout limit.

**Klicovy problem:** Kazdá stránka navic vola `applyDBOverride()` → `getSEOMetadata()` → `db.execute('SELECT * FROM seo_metadata WHERE page_path = ?')`. To je EXTRA DB query na kazdem requestu (i kdyz je cachována pres `unstable_cache`, pri cold startu neni cache).

**B) Chybejici `not-found.tsx`**

Projekt NEMA soubor `app/[locale]/not-found.tsx` (ani `app/not-found.tsx`). Kdyz se zavola `notFound()` (napr. v profil/[slug] pro neexistujici slug), Next.js pouzije default 404 page. Pokud default 404 handler zpusobi chybu (napr. pri pristupu k neexistujicim translation keys), muze vysledkem byt 500 misto 404.

**C) `generateMetadata` bez error boundary**

V `/profil/[slug]/page.tsx` radek 73-80:
```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  let girl;
  try {
    girl = await getGirlBySlug(slug);
  } catch {
    return {};
  }
```

Tato funkce NEDOSTATECNE chyta chyby. `applyDBOverride()` volany na radku 117 NENI v try/catch — pokud selze DB pripojeni pri SEO override, metadata generator crashne → 500.

V `/pobocka/[slug]` generateMetadata (radky 250-302) je `getLocationBySlug` v try/catch, ale `applyDBOverride()` na radku 295 NE.

V `/sluzba/[slug]` je cely `generateMetadata` v try/catch (radek 28-55) — OK.

V homepage `/page.tsx` `generateMetadata` vola `applyDBOverride()` bez try/catch na radku 51 — muze crashnout.

**D) Race condition pri runtime migracich**

`lib/db.ts` radek 98-99:
```ts
runMigrations(db).catch(() => {});
```

Migrace bezi fire-and-forget. Pokud prvni request prijde driv nez migrace dobehnou, a query pouziva nove sloupce (napr. `ethnicity`, `is_secondary`, `style_wardrobe`), query selze → 500.

#### Doporuceni opravy pro 5xx

| # | Akce | Priorita | Dopad |
|---|------|----------|-------|
| 1 | Zabalit `applyDBOverride()` do try/catch ve VSECH `generateMetadata` funkcich | P0 | Eliminuje 500 z SEO override selhani |
| 2 | Pridat `app/[locale]/not-found.tsx` s minimalnim SSR HTML | P0 | Ciste 404 misto potencialnich 500 |
| 3 | Snizit pocet DB queries na profil page — sjednotit do 2-3 queries | P1 | Snizi latency, mene timeoutu |
| 4 | `unstable_cache` pro `getSEOMetadata` ma `revalidate: 3600` — OK, ale pri cold start na novem Vercel invocation neni cache → vzdy DB hit. Zvazit fallback bez DB | P2 | Mensi zatez |
| 5 | `runMigrations` by mel byt await pred prvnim DB query, ne fire-and-forget | P1 | Eliminuje race condition |

---

### 2. 662 stranek "Crawled, Not Indexed"

#### Analyza rozsahu sitemapy

Aktualni sitemap generuje URL v tomto rozsahu:

| Typ | Pocet slugu | × 4 locale | = Celkem URL |
|-----|------------|------------|-------------|
| Homepage | 1 | 4 | 4 |
| /divky | 1 | 4 | 4 |
| Static (cenik, slevy, rozvrh, faq, recenze, o-nas, kontakt, blog) | 8 | 4 | 32 |
| /profil/[slug] | ~13 aktivnich divek | 4 | ~52 |
| /pobocka/[slug] | 3 lokace | 4 | 12 |
| /sluzba/[slug] | ~20 sluzeb | 4 | ~80 |
| /hashtag/[slug] | 32 hashtagu | 4 | 128 |
| /blog/[slug] | ~10 clanku | 4 | ~40 |
| **CELKEM** | | | **~352** |

Ale GSC hlasi 662 crawled-not-indexed. To je VIC nez cela sitemap. Priciny:

#### A) 4× locale multiplikator — vetsi problem nez se zda

S `localePrefix: 'as-needed'` (routing.ts radek 6-8), `en` locale NEMA prefix:
- EN: `https://www.lovelygirls.cz/profile/anetta`
- CS: `https://www.lovelygirls.cz/cs/profil/anetta`
- DE: `https://www.lovelygirls.cz/de/profil/anetta`
- UK: `https://www.lovelygirls.cz/uk/profil/anetta`

Google vidi 4 ROZNE URL s PODOBNYM obsahem. I kdyz mame hreflang, Google casto:
1. Indexuje jen 1 verzi (obvykle cs — hlavni trh)
2. Ostatni 3 oznaci jako "crawled, not indexed" (duplicitni obsah)

Pro 352 URL v sitemap = 352 - (352/4 indexovanych) = **264 stranky "crawled not indexed"** jen kvuli locale variantam.

#### B) Hashtag stranky — thin content

32 hashtag slugu × 4 locale = **128 URL** v sitemap.

Problem: Mnoho hashtag stranek ma IDENTICKY obsah — zobrazuji STEJNE divky (vsech 13). Napr. `/cs/hashtag/blondynky-praha` a `/cs/hashtag/krasne-holky` mohou zobrazovat uplne stejny grid, protoze divky maji oba hashtagy.

Google tyto stranky vidi jako:
- **Thin content** (malo unikatniho textu, hlavne grid karticek)
- **Duplicitni obsah** (stejna girl cards, jen jiny title)

Z 128 hashtag URL Google pravdepodobne indexuje jen 5-10 nejrelevantnějších.

#### C) Sluzba stranky — potencialne thin

~20 sluzeb × 4 locale = ~80 URL. Pokud sluzby nemaji dostatek unikatniho popisu, Google je oznaci jako thin content.

#### D) Blog clanky — neexistujici obsah

Sitemap generuje blog URL dynamicky z DB. Pokud je v DB 10 published clanku × 4 locale = 40 URL. ALE: pokud clanek existuje jen v CS a ne v EN/DE/UK, locale varianta zobrazi fallback obsah → duplicitni/thin.

#### E) Stare URL z predchozich sitemap

Google si pamatuje URL ze starych sitemap (WordPress era, Secretstory era). Tyto URL:
- Uz NEJSOU v aktualni sitemap
- Nektere maji 301 redirect (dobre)
- Nektere vraci 404 (spatne — proto jsou v "not indexed")
- Google je stale crawluje a hlasi jako "crawled, not indexed"

**Odhad:** 247 starych 404 URL + ~200 z locale variant + ~100 thin hashtag/sluzba + ~100 stare URL = ~650 → odpovida 662.

#### Doporuceni opravy pro crawled-not-indexed

| # | Akce | Priorita | Dopad |
|---|------|----------|-------|
| 1 | **Zredukovat hashtag stranky v sitemap** — misto 32 hashtagy dat jen 10-15 nejrelevantnějších s unikatnim obsahem | P0 | -70 URL ze sitemap, lepsi crawl budget |
| 2 | **Pridat unikatni SEO text na hashtag stranky** — HASHTAG_CONTENT v landing-content.ts uz existuje pro nektere, rozserit | P1 | Diferenciace obsahu |
| 3 | **Noindex thin locale varianty** — pokud DE a UK verze nemaji preklad a zobrazuji EN/CS fallback, pridat `robots: noindex` | P1 | Eliminuje duplicitni content signaly |
| 4 | **Blog: nezarazovat locale varianty bez prekladu** — v sitemap.ts radek 216-232, blog generuje 4 locale varianty pro KAZDY clanek i kdyz preklad neexistuje | P1 | -20-30 ghost URL |
| 5 | **Overit ze vsechny sluzba stranky maji obsah** — pokud sluzba nema description, nepridavat do sitemap | P2 | Cistejsi sitemap |
| 6 | **GSC: submitnout aktualni sitemap** — zkontrolovat ze sitemap.xml je submitnuty v GSC | P0 | Google bude crawlovat spravne URL |
| 7 | **Pridat `<meta name="robots" content="noindex">` na /stories/[id]** — uz ma `robots: { index: false }` v metadata, ale overit ze to funguje | P2 | Minor |

---

### 3. 70 stranek s redirecty (potencialni redirect chains)

#### Analyza redirect chain scenaru

**Scenar A: non-www → www → locale redirect (3-hop chain)**

```
lovelygirls.cz/profil/anetta
  → 301 → www.lovelygirls.cz/profil/anetta     (next.config.ts non-www redirect)
  → 307 → www.lovelygirls.cz/en/profil/anetta    (next-intl locale redirect? MOZNE)
```

S `localePrefix: 'as-needed'` a `defaultLocale: 'en'`, URL bez prefixu (`/profil/anetta`) by melo byt EN. Ale middleware na radku 7-11 vola `createMiddleware(routing)` na KAZDY request. next-intl middleware muze:
1. Detekovat locale z Accept-Language headeru
2. Redirect na `/cs/profil/anetta` pokud browser posila `Accept-Language: cs`
3. To vytvori chain: non-www redirect → locale redirect

**Scenar B: /cz/* wildcard → /cs/* → dalsi redirect**

```
www.lovelygirls.cz/cz/pricing
  → 301 → www.lovelygirls.cz/cs/pricing    (next.config.ts /cz/:path* catch)
  → 301 → www.lovelygirls.cz/cs/cenik      (next.config.ts /cs/pricing redirect)
```

Toto je 2-hop chain. V `next.config.ts` wildcard `/cz/:path*` → `/cs/:path*` je POSLEDNI (radek 94). Ale specificke redirecty `/cs/pricing` → `/cs/cenik` (radek 75) funguji na VYSLEDNE URL po wildcard redirectu.

Next.js vyhodnocuje redirecty sekvcencne — prvni match vyhrava. Takze:
1. `/cz/pricing` matchne `/cz/:path*` → redirect na `/cs/pricing`
2. Novy request na `/cs/pricing` matchne `/cs/pricing` → redirect na `/cs/cenik`
3. = 2-hop chain

**Scenar C: stara URL s non-www + locale**

```
lovelygirls.cz/cz/main
  → 301 → www.lovelygirls.cz/cz/main   (non-www redirect)
  → 301 → www.lovelygirls.cz/cs/main    (/cz/:path* wildcard)
  → 301 → www.lovelygirls.cz/cs/        (/cs/main redirect)
```

3-hop chain! Spatne pro SEO.

**Scenar D: escx23.vercel.app stare URL**

```
escx23.vercel.app/cs/girls/anetta
  → 301 → www.lovelygirls.cz/cs/girls/anetta    (vercel.app redirect)
  → 301 → www.lovelygirls.cz/cs/profil/anetta     (/cs/girls/:slug redirect)
```

2-hop chain. Akceptovatelne, ale ne idealni.

#### Odhad 70 redirect stranek

- ~19 starych profil jmen × 2 (girls + profily) × nektere pres non-www = ~20 chains
- ~10 landing pages pres non-www = ~10 chains
- ~6 strukturalnich (/cz/pricing atd.) × nektere pres non-www = ~10 chains
- ~23 blog URL pres non-www = ~20 chains
- WordPress URL (bdsm, author) = ~5 chains
- Sitemap redirect ×4 = ~5 chains

Celkem: **~70** — odpovida GSC reportu.

#### Doporuceni opravy pro redirect chains

| # | Akce | Priorita | Dopad |
|---|------|----------|-------|
| 1 | **Pridat specificke redirecty pro /cz/pricing, /cz/schedule PRED wildcard** — eliminuje 2-hop `/cz/pricing → /cs/pricing → /cs/cenik` | P0 | Zkrati na 1-hop |
| 2 | **V redirectech pouzivat FINALNI cilovou URL** — napr. `/cz/main` → `/cs/` (ne `/cs/main`) | P0 | Eliminuje chains |
| 3 | **Overit ze `localeDetection: false`** (routing.ts radek 9) skutecne vypina Accept-Language redirect | P1 | Eliminuje nechtenou locale redirect |
| 4 | **Zvazit Vercel Edge Config pro redirecty** misto next.config.ts — Edge redirecty se vyhodnocuji PRED Vercel serverless, takze non-www + path redirect se da sjednotit do 1 hopu | P2 | Optimalizace |

#### Konkretni oprava redirect chains v next.config.ts

Pridat pred wildcard `/cz/:path*`:

```ts
// Specificke /cz/ redirecty na FINALNI cilovou URL (eliminuje chains)
{ source: '/cz/main', destination: '/cs/', permanent: true },
{ source: '/cz/pricing', destination: '/cs/cenik', permanent: true },
{ source: '/cz/schedule', destination: '/cs/rozvrh', permanent: true },
// (ostatni /cz/ URL nemaji dalsi redirect, takze wildcard je OK)
```

Overit ze uz existujici specificke redirecty na `/cz/main`, `/cz/pricing`, `/cz/schedule` jsou PRED wildcard — ANO, v aktualnim next.config.ts (radky 72-81) jsou pred wildcard (radek 94). Takze tento problem je JIZ VYRESEN v implementaci!

Zbyva: `/cz/blog` → `/cs/blog` (radek 80) — neni chain (blog nema dalsi redirect). OK.

**Hlavni zbyvy chain:** URL ktere prijdou pres non-www redirect a PAK matchnou dalsi redirect. To nelze eliminovat na urovni next.config.ts — non-www redirect je prvni (Vercel edge level), pak se vyhodnocuji dalsi redirecty na druhem requestu. Jedine reseni: Vercel Edge Config nebo Vercel firewall rules.

---

### Shrnuti celkoveho SEO zdravi

| Problem | Rozsah | Root Cause | Fix |
|---------|--------|-----------|-----|
| 5xx (32) | Kriticke | DB timeout + chybejici error handling v generateMetadata | Wrap applyDBOverride v try/catch, pridat not-found.tsx |
| Crawled not indexed (662) | Ocekavany | 4× locale multiplier + thin hashtag pages + stare URL | Zredukovat sitemap, pridat content, noindex thin pages |
| Redirect chains (70) | Mirny | Non-www → path redirect = 2-hop | Specificke redirecty uz implementovany, non-www chain nelze eliminovat |
| 404 (247) | Vyresen | Stare URL bez redirectu | Redirecty implementovany v TASK-020 |
| Indexovano 295 stranek | GSC funguje | GSC je nastaveny a sitemap submitnuty | Udrzovat |

**Top 3 akce (podle dopadu):**
1. Opravit error handling v generateMetadata — zabalit `applyDBOverride()` do try/catch (eliminuje 5xx)
2. Zredukovat sitemap o thin pages (hashtag stranky bez unikatniho obsahu, blog locale varianty bez prekladu)
3. Pridat `app/[locale]/not-found.tsx` — ciste 404 misto potencialnich 500

POZN: GSC je uz nastaveny a funkcni (295 indexovanych stranek, sitemap submitnuty).
