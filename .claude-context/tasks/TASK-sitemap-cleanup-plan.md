# Sitemap Cleanup Plan — Reduce 662 Crawled-Not-Indexed

## Problem

GSC Coverage: 662 stranek "crawled but not indexed". Celkem 295 indexovanych, 1079 neindexovanych.

## Aktualni stav sitemap

`app/sitemap.ts` generuje URL takto:

| Typ | Slugy | × 4 locale | = URL |
|-----|-------|------------|-------|
| Homepage | 1 | 4 | 4 |
| /divky | 1 | 4 | 4 |
| Static (cenik, slevy, rozvrh, faq, recenze, o-nas, kontakt, blog) | 8 | 4 | 32 |
| /profil/[slug] | ~13 | 4 | ~52 |
| /pobocka/[slug] | 3 | 4 | 12 |
| /sluzba/[slug] | ~20 | 4 | ~80 |
| /hashtag/[slug] | **32** | 4 | **128** |
| /blog/[slug] | ~10 | 4 | ~40 |
| **CELKEM** | | | **~352** |

## Analyza: proc 662 crawled-not-indexed

### A) 4× locale multiplikator (~264 stranek)

Kazda URL existuje ve 4 locale verzich (en, cs, de, uk). Google obvykle indexuje jen 1 verzi (hlavni trh = cs) a ostatni oznaci jako crawled-not-indexed nebo duplicitni.

Z 352 URL v sitemap: ~352 × 0.75 = **264 neindexovanych** jen kvuli locale variantam.

### B) 24 thin hashtag stranek × 4 locale (~96 stranek)

32 hashtagu v sitemap (`HASHTAG_SLUGS` v app/sitemap.ts radky 90-98), ale jen **8 ma unikatni SEO obsah** v `HASHTAG_CONTENT`:

**S obsahem (zachovat v sitemap):**
1. `blondynky-praha` — metaDesc, intro, FAQ ve 4 jazycich ✅
2. `brunetky-praha` — metaDesc, intro, FAQ ✅
3. `cernovlasky-praha` — metaDesc, intro, FAQ ✅
4. `gfe-praha` — metaDesc, intro, FAQ ✅
5. `studentky-praha` — metaDesc, intro, FAQ ✅
6. `spolecnice-praha` — metaDesc, intro, FAQ ✅
7. `prirodni-poprsi` — metaDesc, intro, FAQ ✅
8. `tetovani` — metaDesc, intro, FAQ ✅

**BEZ obsahu (thin — odebrat ze sitemap):**
9-32: `girlfriend-experience`, `mlade-holky`, `holky-praha`, `ceske-holky`, `ruske-holky`, `ukrajinske-holky`, `piercing-holky`, `plne-rty`, `dlouhe-nohy`, `fit-holky`, `stihla-postava`, `krivky`, `velka-prsa`, `kratke-vlasy`, `dlouhe-vlasy`, `milf-praha`, `modre-oci`, `exoticke-krasky`, `luxusni-sluzby`, `elegantni-holky`, `sexy-holky`, `krasne-holky`, `hot-holky-praha`, `dokonale-telo`

Thin stranky maji jen: H1 title + girl card grid (stejne divky jako ostatni hashtagy) + related links. Zadny intro text, zadne FAQ, zadny unikatni obsah.

24 thin × 4 locale = **96 zbytecnych URL** v sitemap.

### C) Blog locale varianty bez prekladu (~20 stranek)

`getBlogPostBySlug()` (lib/queries.ts:1728) nacita sloupce `title_cs, title_en, content_cs, content_en` — **jen CS a EN**. Pro DE a UK vracce fallback na CS.

Blog v sitemap (radky 216-232) generuje 4 locale URL pro KAZDY clanek:
```
/blog/{slug}         (EN)
/cs/blog/{slug}      (CS)
/de/blog/{slug}      (DE — fallback na CS obsah!)
/uk/blog/{slug}      (UK — fallback na CS obsah!)
```

DE a UK verze jsou DUPLIKATY CS obsahu → Google je neindexuje.

~10 clanku × 2 duplicitni locale = **~20 zbytecnych URL**.

### D) Stare URL z predchozich er (~200+ stranek)

Google si pamatuje URL z WordPress a Secretstory er. Ty uz nejsou v sitemap ale Google je stale crawluje. 247 z nich vraci 404 (pokryto redirecty v TASK-020). Dalsich ~100 mohlo byt crawled-not-indexed.

### E) Sluzba stranky s nedostatecnym obsahem (~40 stranek)

~20 sluzeb × 4 locale = 80 URL. Pokud sluzba nema `description` a `content` v DB, stranka je thin — jen nazev + grid divek.

### Celkovy odhad

| Pricina | Odhad | Poznamka |
|---------|-------|---------|
| Locale varianty (de/uk duplicaty) | ~264 | Nevyhnutelne s 4 locale, ale lze zmenit prioritu |
| Thin hashtag stranky | ~96 | 24 × 4 locale, lze odebrat ze sitemap |
| Blog DE/UK bez prekladu | ~20 | Lze odebrat ze sitemap |
| Stare URL (cache Google) | ~200+ | Postupne zmizi po redirectech |
| Thin sluzba stranky | ~40 | Overit obsah v DB |
| Ostatni | ~42 | novinky, clenstvi, stories (nejsou v sitemap ale Google je naslo pres linky) |
| **Celkem** | **~662** | Odpovida GSC |

---

## Plan oprav

### ZMENA 1 (P0): Zredukovat hashtag stranky v sitemap

**Soubor:** `app/sitemap.ts` (radky 90-98, 234-246)

**PRED:**
```ts
const HASHTAG_SLUGS = [
  'blondynky-praha', 'brunetky-praha', 'cernovlasky-praha', 'gfe-praha',
  'girlfriend-experience', 'prirodni-poprsi', 'mlade-holky', 'studentky-praha',
  'holky-praha', 'spolecnice-praha', 'ceske-holky', 'ruske-holky',
  'ukrajinske-holky', 'tetovani', 'piercing-holky', 'plne-rty', 'dlouhe-nohy',
  'fit-holky', 'stihla-postava', 'krivky', 'velka-prsa', 'kratke-vlasy',
  'dlouhe-vlasy', 'milf-praha', 'modre-oci', 'exoticke-krasky',
  'luxusni-sluzby', 'elegantni-holky', 'sexy-holky', 'krasne-holky',
  'hot-holky-praha', 'dokonale-telo',
];
```

**PO:**
```ts
// Only include hashtags with unique SEO content (HASHTAG_CONTENT in landing-content.ts)
const HASHTAG_SLUGS_SITEMAP = [
  'blondynky-praha',    // has metaDesc + intro + FAQ
  'brunetky-praha',     // has metaDesc + intro + FAQ
  'cernovlasky-praha',  // has metaDesc + intro + FAQ
  'gfe-praha',          // has metaDesc + intro + FAQ
  'studentky-praha',    // has metaDesc + intro + FAQ
  'spolecnice-praha',   // has metaDesc + intro + FAQ
  'prirodni-poprsi',    // has metaDesc + intro + FAQ
  'tetovani',           // has metaDesc + intro + FAQ
];
```

A na radku 235 zmenit `HASHTAG_SLUGS` na `HASHTAG_SLUGS_SITEMAP`.

**Dopad:** -96 URL ze sitemap (24 thin × 4 locale).

**POZOR:** Thin hashtag stranky zustanou PRISTUPNE (nemazeme je), jen je nebudeme aktivne posilat Googlu. Google je muze najit pres interni linky — to je OK, hreflang je zachovany.

### ZMENA 2 (P1): Blog — jen existujici jazykove verze v sitemap

**Soubor:** `app/sitemap.ts` (radky 216-232)

**PRED:**
```ts
for (const bp of blogSlugs) {
  // ... generates 4 locale variants for every post
  for (const l of LOCALES) {
    pages.push({ ... });
  }
}
```

**PO:**
```ts
for (const bp of blogSlugs) {
  // Blog posts only have CS and EN translations
  // DE and UK would show CS fallback = duplicate content
  const BLOG_LOCALES: Locale[] = ['en', 'cs'];
  const lastmod = bp.updatedAt ? new Date(bp.updatedAt) : now;
  const alternates: Record<string, string> = {};
  for (const l of BLOG_LOCALES) {
    alternates[l] = l === 'en' ? `${BASE}/blog/${bp.slug}` : `${BASE}/${l}/blog/${bp.slug}`;
  }
  alternates['x-default'] = `${BASE}/blog/${bp.slug}`;
  for (const l of BLOG_LOCALES) {
    pages.push({
      url: l === 'en' ? `${BASE}/blog/${bp.slug}` : `${BASE}/${l}/blog/${bp.slug}`,
      lastModified: lastmod,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: alternates },
    });
  }
}
```

**Dopad:** -20 URL ze sitemap (~10 clanku × 2 odebranych locale).

**Alternativa:** Pokud se v budoucnu pridaji DE/UK preklady (TASK-017 zminuje copywriter agenty), lze BLOG_LOCALES zmenit zpet na LOCALES. Nebo dynamicky: nacist z DB ktere sloupce content_X jsou neprazdne.

### ZMENA 3 (P1): Noindex thin hashtag stranky

**Soubor:** `app/[locale]/hashtag/[slug]/page.tsx` (generateMetadata, radek 71-105)

Pridat logiku: pokud hashtag NEMA HASHTAG_CONTENT, pridat `robots: { index: false, follow: true }`.

**PRED (radek 103):**
```ts
robots: { index: true, follow: true },
```

**PO:**
```ts
robots: content
  ? { index: true, follow: true }
  : { index: false, follow: true },  // thin page — noindex, allow crawling links
```

Variable `content` uz existuje na radku 75: `const content = getHashtagContent(slug);`

**Dopad:** 24 thin hashtag stranek dostanou noindex → Google je prestane hlasit jako crawled-not-indexed. Follow zustane true aby Google mohl sledovat interni linky na profily.

### ZMENA 4 (P1): Blog DE/UK — noindex pokud neni preklad

**Soubor:** `app/[locale]/blog/[slug]/page.tsx` (generateMetadata, radek 24-81)

Pridat logiku: pokud locale je DE nebo UK a clanek nema `content_de`/`content_uk`, pridat noindex.

**Implementace:**
V generateMetadata po nacteni postu z DB, zkontrolovat jestli existuje obsah pro dany jazyk:

```ts
// Po radku 26 (const post = await getBlogPostBySlug(slug, locale)):
const postRaw = await db.execute({
  sql: 'SELECT content_cs, content_en FROM blog_posts WHERE slug = ? LIMIT 1',
  args: [slug],
});
// Pokud locale je de/uk a neni vlastni preklad, noindex
const hasNativeContent = locale === 'cs' || locale === 'en';
const robotsMeta = hasNativeContent
  ? { index: true, follow: true }
  : { index: false, follow: true };
```

**Jednodussi alternativa:** Protoze DB schema ma jen `content_cs` a `content_en`, staci hardkodovat:

```ts
const robotsMeta = (locale === 'cs' || locale === 'en')
  ? { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' as const, 'max-video-preview': -1 }
  : { index: false, follow: true };  // DE/UK = CS fallback = duplicate
```

**Dopad:** ~20 blog URL dostanou noindex (DE/UK verze bez prekladu).

### ZMENA 5 (P2): Snizit prioritu DE/UK locale variant v sitemap

**Soubor:** `app/sitemap.ts`

Pro stranky kde DE/UK verze jsou tenke (male locale trhy, malo obsahu):

```ts
// V staticke, profil, hashtag sekcich:
priority: (l === 'cs' || l === 'en') ? originalPriority : originalPriority * 0.5,
```

**Dopad:** Google bude preferovat CS/EN verze pri crawlu. Mirny efekt.

### ZMENA 6 (P2): Odebrat podminky a soukromi ze sitemap

Tyto stranky uz maji `robots: { index: false }` — NEMAJI byt v sitemap. Ale v `STATIC_KEYS` (radek 101-110) chybi `/podminky` a `/soukromi` — takze uz v sitemap NEJSOU. OK, zadna zmena nutna.

Overit: `/novinky` a `/clenstvi/zadost` taky NEJSOU v sitemap — potvrzeno. ✅

---

## Souhrn zmen

| # | Zmena | Soubor | Radky | Dopad na sitemap |
|---|-------|--------|-------|-----------------|
| 1 | Zredukovat HASHTAG_SLUGS na 8 (jen s HASHTAG_CONTENT) | `app/sitemap.ts` | 90-98, 235 | -96 URL |
| 2 | Blog: jen CS + EN locale v sitemap | `app/sitemap.ts` | 216-232 | -20 URL |
| 3 | Noindex thin hashtag stranky | `app/[locale]/hashtag/[slug]/page.tsx` | 103 | noindex 24 stranek |
| 4 | Noindex blog DE/UK bez prekladu | `app/[locale]/blog/[slug]/page.tsx` | robots v metadata | noindex ~20 stranek |
| 5 | Snizit prioritu DE/UK v sitemap | `app/sitemap.ts` | vsude | Crawl budget optimalizace |

### Ocekavany vysledek

| Metrika | Pred | Po |
|---------|------|-----|
| URL v sitemap | ~352 | ~236 (-116) |
| Thin hashtag URL v sitemap | 96 | 0 |
| Blog duplicate URL v sitemap | ~20 | 0 |
| Noindex signaly | jen podminky/soukromi/stories | + 24 thin hashtagy + ~20 blog DE/UK |
| Ocekavany pokles crawled-not-indexed | 662 | ~400-450 (castecne, locale duplikaty zustanou) |

**Poznamka:** Locale duplikaty (264 stranek) nelze zcela eliminovat bez redukovani locale count. To NECHCEME — 4 locale je byznys pozadavek. Google se s tim postupne vyporoda pres hreflang. Klicove je neplytrat crawl budgetem na thin pages.

---

## Rizika

1. **Thin hashtag stranky zustanou pristupne** — to je zamerne. Nemazeme URL, jen je neposilame v sitemap. Google je muze najit pres interni linky (HashtagCloud na homepage, related links na hashtag strankach). S noindex je to OK.

2. **Blog DE/UK stranky zustanou pristupne** — uzivatele ktere prijdou pres interni link (/de/blog/...) uvidí CS fallback. Noindex jen rika Googlu at je neindexuje.

3. **Zmena HASHTAG_SLUGS v sitemap vs v hashtag page** — sitemap pouziva svoji konstantu, hashtag page pouziva TAG_NAMES. Jsou nezavisle — zmena v sitemap neovlivni dostupnost stranek.

4. **Future-proofing** — kdyz se prida obsah pro dalsi hashtagy (napr. HASHTAG_CONTENT pro `milf-praha`), musi se rucne pridat do HASHTAG_SLUGS_SITEMAP. Alternativa: automaticky generovat sitemap hashtagy z klicu HASHTAG_CONTENT.
