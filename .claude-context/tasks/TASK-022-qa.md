# TASK-022 QA — GSC Fixes (5 Categories, 21 Files)

**Datum:** 2026-07-08  
**QA agent:** kontrolor  
**Výsledek: PASS — všechny 5 kategorií OK, bez blokerů**

---

## 1. TypeScript — `npx tsc --noEmit`

**Status: PASS**

Výstup: 3 pre-existující chyby pouze v `e2e/` adresáři (Playwright testy).  
Žádné chyby v produkčním kódu (`app/`, `components/`, `lib/`).

---

## 2. Badge Overlap Fix — `globals.css`

**Status: PASS**

Kontrolované CSS třídy:
- `.girl-tag-pill` → `position: absolute; top: 12px; left: 12px` (TOP REVIEWS — levý horní roh)
- `.girl-media-pills` → `position: absolute; top: 12px; right: 12px` (VIDEO badge — pravý horní roh)

Badgy jsou na **opačných stranách karty** — overlap nemůže nastat.

Mobile breakpoint (`@media (max-width: 480px)`):
- `.girl-tag-pill`: `top: 8px; left: 8px; max-width: calc(100% - 80px)` — text se nerozpíná do oblasti pravého badgu
- `.girl-media-pills`: `top: 8px; right: 8px; gap: 3px`

`max-width: calc(100% - 80px)` na mobilní `.girl-tag-pill` zajišťuje, že ani dlouhý text TOP REVIEWS se nepřesune přes středovou osu. Fix je správný.

---

## 3. Sitemap Cleanup — `app/sitemap.ts`

**Status: PASS**

Ověřeno, že `/join`, `/podminky`, `/soukromi` **nejsou** v `STATIC_KEYS`.

Aktuální `STATIC_KEYS` obsahuje:
```
/cenik, /slevy, /rozvrh, /faq, /recenze, /o-nas, /kontakt, /novinky, /blog
```

Noindex stránky `/join`, `/podminky`, `/soukromi` z STATIC_KEYS odstraněny — Google nedostane confliktní signály (noindex v meta + URL v sitemap). ✅

`HASHTAG_SLUGS`: pouze 8 slugů s obsahem (tenké stránky odstraněny). ✅

---

## 4. Blog Hreflang — `app/[locale]/blog/[slug]/page.tsx` + `app/[locale]/blog/page.tsx`

**Status: PASS**

Obě stránky mají v `alternates.languages` pouze:
- `en` → EN URL
- `cs` → CS URL  
- `x-default` → EN URL

`de` a `uk` alternates **odstraněny** — DE/UK obsah je nepřeložený duplikát CS, nepatří do hreflang. ✅

Poznámka (non-blocker): DE/UK blog stránky mají stále `robots: { index: true }` — mohou být indexovány, ale bez hreflang signálů. Samostatný task pokud bude potřeba.

---

## 5. BreadcrumbList JSON-LD — 9 stránek

**Status: PASS**

Všechny stránky s vizuálními breadcrumbs mají `<script type="application/ld+json">` s `breadcrumbListJsonLd()`:

| Stránka | Soubor | JSON-LD |
|---------|--------|---------|
| /slevy | `app/[locale]/slevy/page.tsx` | ✅ |
| /kontakt | `app/[locale]/kontakt/page.tsx` | ✅ |
| /novinky | `app/[locale]/novinky/page.tsx` | ✅ |
| /o-nas | `app/[locale]/o-nas/page.tsx` | ✅ |
| /recenze | `app/[locale]/recenze/page.tsx` | ✅ |
| /podminky | `app/[locale]/podminky/page.tsx` | ✅ |
| /soukromi | `app/[locale]/soukromi/page.tsx` | ✅ |
| /join | `app/[locale]/join/page.tsx` | ✅ |
| /clenstvi/zadost | `app/[locale]/clenstvi/zadost/page.tsx` | ✅ |

Všechny používají `breadcrumbListJsonLd()` z `lib/seo/jsonld` a `getCanonicalUrl()` pro absolutní URL. ✅

---

## 6. Service Links — ProfilHero + ProfilDetails + profil page

**Status: PASS**

### ProfilHero.tsx
- Import: `import { Link } from '@/i18n/navigation'` ✅
- Service chips: `href={{ pathname: '/sluzba/[slug]', params: { slug: s.slug || '' } }}` ✅
- Používá DB slug (ne statický string) ✅

### ProfilDetails.tsx
- Stejný pattern: `href={{ pathname: '/sluzba/[slug]', params: { slug: svc.slug ?? '' } }}` ✅

### next.config.ts — Legacy Service Redirects

8 mapování × 4 locale paths = 32 redirect pravidel:

| Starý slug | Nový DB slug |
|-----------|-------------|
| classic | klasicky-sex |
| massage | eroticka-masaz |
| deepthroat | hluboky-oral |
| cim | strikani-do-ust |
| light_sm | bdsm-lehke |
| cuddling | klasicky-sex |
| licking | oral-bez-ochrany |
| shared_shower | klasicky-sex |

Locale paths: `/cs/sluzba/`, `/service/`, `/de/leistung/`, `/uk/posluha/` ✅

Všechna 32 pravidla přítomna a správně nakonfigurována. ✅

---

## Souhrn

| Kategorie | Soubory | Status |
|-----------|---------|--------|
| TypeScript | celý projekt | PASS |
| Badge overlap | globals.css | PASS |
| Sitemap cleanup | app/sitemap.ts | PASS |
| Blog hreflang | blog/[slug]/page.tsx, blog/page.tsx | PASS |
| BreadcrumbList JSON-LD | 9 stránek | PASS |
| Service links i18n | ProfilHero.tsx, ProfilDetails.tsx | PASS |
| Legacy service redirects | next.config.ts | PASS |

**Celkový výsledek: PASS — ready to commit.**

Žádné blokery. Žádné regrese. Všech 5 kategorií GSC fixů implementováno správně.
